-- ============================================================
-- IA-abilities · Migración 002: resultados de encuestas en el muro.
-- Correr UNA vez en el SQL Editor del proyecto (solo toca objetos iaab_).
-- ============================================================
-- Resultados en el muro: la encuesta que el facilitador proyecta («Al muro»).
alter table iaab_sesiones add column if not exists muestra text;
create or replace view iaab_v_sesiones with (security_invoker = true) as
  select id, cliente, nombre, habilitadas, actual, encuesta, created_at, muestra from iaab_sesiones;
grant select (muestra) on iaab_sesiones to anon, authenticated;
grant select on iaab_v_sesiones to anon, authenticated;

create or replace function iaab_admin_op(p_sesion text, p_clave text, p_op text, p_payload jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare s iaab_sesiones%rowtype; v_ids jsonb; r jsonb := '{"ok":true}'::jsonb;
begin
  select * into s from iaab_sesiones where id = p_sesion;
  if s.id is null then raise exception 'SESION_NO_EXISTE'; end if;
  if p_clave is distinct from s.clave_admin then raise exception 'CLAVE_INVALIDA'; end if;

  if p_op = 'login' then return r;
  elsif p_op = 'habilitar' then
    if coalesce((p_payload->>'on')::boolean, false) then
      select coalesce(jsonb_agg(distinct x), '[]'::jsonb) into v_ids
        from (select jsonb_array_elements_text(s.habilitadas) x union select jsonb_array_elements_text(p_payload->'ids')) t;
    else
      select coalesce(jsonb_agg(x), '[]'::jsonb) into v_ids
        from jsonb_array_elements_text(s.habilitadas) x where not ((p_payload->'ids') ? x);
    end if;
    update iaab_sesiones set habilitadas = v_ids where id = p_sesion;
  elsif p_op = 'actual' then
    update iaab_sesiones set actual = nullif(p_payload->>'id', '') where id = p_sesion;
  elsif p_op = 'encuesta' then
    update iaab_sesiones set encuesta = nullif(p_payload->>'id', '') where id = p_sesion;
  elsif p_op = 'muestra' then
    update iaab_sesiones set muestra = nullif(p_payload->>'id', '') where id = p_sesion;
  elsif p_op = 'estado_pub' then
    update iaab_publicaciones set estado = p_payload->>'estado' where id = (p_payload->>'id')::bigint and sesion_id = p_sesion;
  elsif p_op = 'publicaciones' then
    select jsonb_build_object('rows', coalesce(jsonb_agg(to_jsonb(t)), '[]'::jsonb)) into r from (
      select p.*, (select count(*) from iaab_votos v where v.publicacion_id = p.id)::int as votos
      from iaab_publicaciones p where p.sesion_id = p_sesion) t;
  elsif p_op = 'participantes' then
    select jsonb_build_object('rows', coalesce(jsonb_agg(jsonb_build_object('id', id, 'nombre', nombre, 'area', area, 'created_at', created_at, 'last_seen', last_seen)), '[]'::jsonb)) into r
      from iaab_participantes where sesion_id = p_sesion;
  elsif p_op = 'respuestas' then
    select jsonb_build_object('rows', coalesce(jsonb_agg(jsonb_build_object('encuesta_id', encuesta_id, 'valor', valor, 'created_at', created_at)), '[]'::jsonb)) into r
      from iaab_respuestas where sesion_id = p_sesion and encuesta_id = p_payload->>'encuesta_id';
  elsif p_op = 'borrar_todo' then
    delete from iaab_participantes where sesion_id = p_sesion;  -- en cascada: publicaciones, votos, respuestas
    update iaab_sesiones set habilitadas = '[]'::jsonb, actual = null, encuesta = null, muestra = null where id = p_sesion;
  else raise exception 'OP_DESCONOCIDA'; end if;
  return r;
end $$;


-- Resultados en agregado de la encuesta que está en el muro (sin ids de personas). Si no hay ninguna, devuelve null.
create or replace function iaab_resultados(p_sesion text) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare m text;
begin
  select muestra into m from iaab_sesiones where id = p_sesion;
  if m is null then return null; end if;
  return jsonb_build_object('encuesta_id', m, 'rows', coalesce(
    (select jsonb_agg(jsonb_build_object('valor', valor)) from iaab_respuestas where sesion_id = p_sesion and encuesta_id = m), '[]'::jsonb));
end $$;
revoke all on function iaab_resultados(text) from public;
grant execute on function iaab_resultados(text) to anon, authenticated;
