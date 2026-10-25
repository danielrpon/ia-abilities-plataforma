-- ============================================================
-- MIGRACIÓN 004 · Identidad entre sesiones y «Mis prompts»
-- Correr UNA vez en el SQL Editor del proyecto (después de 002 y 003).
-- Es idempotente: se puede volver a correr sin daño.
--
-- Qué agrega (todo por RPC; las tablas siguen cerradas al navegador):
--   iaab_yo(sesion, participante)        → el perfil guardado en el celular sigue existiendo? (usuario huérfano tras «Reiniciar»)
--   iaab_lista_participantes(sesion)     → «Ya me registré»: nombre corto + área de cada persona de la sesión
--   iaab_recuperar(sesion, participante) → retoma el perfil elegido (mismo id, su decisión de grabación vigente)
--   iaab_mis_publicaciones(sesion, part) → todo lo que esa persona publicó en cualquier nivel («Mis prompts»)
--
-- Riesgo aceptado (decisión de Daniel, 25-oct-2026): en la lista cualquiera podría tocar el nombre de otra
-- persona; la plataforma pregunta «¿Usted es …?» antes de entrar. No se exponen apellidos completos,
-- celulares ni correos (no se piden).
-- ============================================================

-- Nombre corto para la lista: primera palabra + inicial de la segunda («Ana M.»).
create or replace function iaab_nombre_corto(p text) returns text
language sql immutable as $$
  select case when array_length(regexp_split_to_array(trim(p), '\s+'), 1) > 1
    then split_part(regexp_replace(trim(p), '\s+', ' ', 'g'), ' ', 1) || ' ' || left(split_part(regexp_replace(trim(p), '\s+', ' ', 'g'), ' ', 2), 1) || '.'
    else trim(p) end;
$$;

create or replace function iaab_yo(p_sesion text, p_part uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('id', id, 'nombre', nombre, 'area', area, 'graba', graba)
  from iaab_participantes where id = p_part and sesion_id = p_sesion;
$$;

create or replace function iaab_lista_participantes(p_sesion text) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'corto', iaab_nombre_corto(nombre), 'area', area) order by lower(nombre), created_at), '[]'::jsonb)
  from iaab_participantes where sesion_id = p_sesion;
$$;

create or replace function iaab_recuperar(p_sesion text, p_part uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v iaab_participantes%rowtype;
begin
  update iaab_participantes set last_seen = now() where id = p_part and sesion_id = p_sesion returning * into v;
  if v.id is null then raise exception 'PARTICIPANTE_INVALIDO'; end if;
  return jsonb_build_object('id', v.id, 'nombre', v.nombre, 'area', v.area, 'graba', v.graba);
end $$;

create or replace function iaab_mis_publicaciones(p_sesion text, p_part uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select coalesce(jsonb_agg(jsonb_build_object('id', id, 'act_id', act_id, 'tipo', tipo, 'texto', texto, 'estado', estado, 'created_at', created_at) order by created_at desc), '[]'::jsonb)
  from iaab_publicaciones where sesion_id = p_sesion and participante_id = p_part;
$$;

revoke all on function iaab_yo(text, uuid), iaab_lista_participantes(text), iaab_recuperar(text, uuid), iaab_mis_publicaciones(text, uuid) from public;
grant execute on function iaab_yo(text, uuid), iaab_lista_participantes(text), iaab_recuperar(text, uuid), iaab_mis_publicaciones(text, uuid) to anon, authenticated;
