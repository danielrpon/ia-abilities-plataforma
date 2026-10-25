-- ============================================================
-- MIGRACIÓN 005 · Grupos automáticos con roles
-- Correr UNA vez en el SQL Editor del proyecto (después de la 004, que trae iaab_nombre_corto).
-- Es idempotente: se puede volver a correr sin daño.
--
-- Qué agrega (todo por RPC; las tablas siguen cerradas al navegador):
--   iaab_grupos                                   → una fila por persona agrupada: grupo, rol, mesa y orden
--   iaab_grupos_admin(sesion, clave, minutos)     → panel: participantes con área, escalón inicial, si está activo y su grupo
--   iaab_grupos_guardar(sesion, clave, filas)     → panel: reemplaza todos los grupos de la sesión ('[]' = borrar)
--   iaab_mi_grupo(sesion, participante)           → celular: su grupo, su rol, su mesa y los nombres cortos de sus compañeros
--
-- El algoritmo (por área o mezclados) y la rotación de roles corren en el panel; la base solo guarda el resultado.
-- «Reiniciar» borra los grupos en cascada (se borran los participantes).
-- ============================================================

create table if not exists iaab_grupos (
  participante_id uuid primary key references iaab_participantes(id) on delete cascade,
  sesion_id       text not null references iaab_sesiones(id) on delete cascade,
  grupo           int  not null check (grupo between 1 and 99),
  rol             text not null check (rol in ('coordinador','piloto','revisor','relator','apoyo','coordinador-relator')),
  mesa            text check (char_length(mesa) <= 60),
  orden           int  not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists iaab_grupos_sesion_idx on iaab_grupos(sesion_id);
alter table iaab_grupos enable row level security;
revoke all on iaab_grupos from anon, authenticated;

-- Panel: todos los participantes de la sesión, con su escalón inicial (encuesta escalon-inicio) y su grupo si lo tiene.
create or replace function iaab_grupos_admin(p_sesion text, p_clave text, p_minutos int default 3) returns jsonb
language plpgsql stable security definer set search_path = public as $$
begin
  if not exists (select 1 from iaab_sesiones where id = p_sesion) then raise exception 'SESION_NO_EXISTE'; end if;
  if p_clave is distinct from (select clave_admin from iaab_sesiones where id = p_sesion) then raise exception 'CLAVE_INVALIDA'; end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id, 'corto', iaab_nombre_corto(p.nombre), 'area', p.area,
      'activo', p.last_seen > now() - make_interval(mins => greatest(1, least(coalesce(p_minutos, 3), 60))),
      'escalon', (select (r.valor->>'escalon')::int from iaab_respuestas r
                   where r.sesion_id = p_sesion and r.encuesta_id = 'escalon-inicio' and r.participante_id = p.id
                     and (r.valor->>'escalon') ~ '^[0-9]+$'),
      'grupo', g.grupo, 'rol', g.rol, 'mesa', g.mesa, 'orden', g.orden)
      order by lower(p.nombre), p.created_at)
    from iaab_participantes p left join iaab_grupos g on g.participante_id = p.id
    where p.sesion_id = p_sesion), '[]'::jsonb);
end $$;

-- Panel: reemplaza los grupos. p_filas = [{"pid": uuid, "grupo": 1, "rol": "piloto", "mesa": "…", "orden": 0}, …]
create or replace function iaab_grupos_guardar(p_sesion text, p_clave text, p_filas jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from iaab_sesiones where id = p_sesion) then raise exception 'SESION_NO_EXISTE'; end if;
  if p_clave is distinct from (select clave_admin from iaab_sesiones where id = p_sesion) then raise exception 'CLAVE_INVALIDA'; end if;
  if jsonb_typeof(coalesce(p_filas, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_filas, '[]'::jsonb)) > 300 then raise exception 'GRUPOS_INVALIDOS'; end if;
  delete from iaab_grupos where sesion_id = p_sesion;
  insert into iaab_grupos (participante_id, sesion_id, grupo, rol, mesa, orden)
    select (f->>'pid')::uuid, p_sesion, (f->>'grupo')::int, f->>'rol', left(nullif(f->>'mesa', ''), 60), coalesce((f->>'orden')::int, 0)
    from jsonb_array_elements(coalesce(p_filas, '[]'::jsonb)) f
    join iaab_participantes p on p.id = (f->>'pid')::uuid and p.sesion_id = p_sesion;  -- solo personas de esta sesión
  return jsonb_build_object('ok', true, 'n', (select count(*) from iaab_grupos where sesion_id = p_sesion));
end $$;

-- Celular: su grupo (null si no tiene). Compañeros solo con nombre corto y rol.
create or replace function iaab_mi_grupo(p_sesion text, p_part uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object('grupo', g.grupo, 'rol', g.rol, 'mesa', g.mesa,
    'companeros', coalesce((select jsonb_agg(jsonb_build_object('corto', iaab_nombre_corto(p.nombre), 'rol', o.rol) order by o.orden)
                            from iaab_grupos o join iaab_participantes p on p.id = o.participante_id
                            where o.sesion_id = p_sesion and o.grupo = g.grupo and o.participante_id <> p_part), '[]'::jsonb))
  from iaab_grupos g where g.sesion_id = p_sesion and g.participante_id = p_part;
$$;

revoke all on function iaab_grupos_admin(text, text, int), iaab_grupos_guardar(text, text, jsonb), iaab_mi_grupo(text, uuid) from public;
grant execute on function iaab_grupos_admin(text, text, int), iaab_grupos_guardar(text, text, jsonb), iaab_mi_grupo(text, uuid) to anon, authenticated;
