-- ============================================================
-- IA-abilities · Migración 003: autorización de grabación (Ley 1581 de 2012).
-- Correr UNA vez en el SQL Editor del proyecto (solo toca objetos iaab_).
-- Es aditiva: el tablero actual sigue funcionando mientras se publica el nuevo.
-- ============================================================
-- Decisión vigente de cada participante: null = no ha respondido
alter table iaab_participantes add column if not exists graba boolean;
alter table iaab_participantes add column if not exists graba_at timestamptz;
alter table iaab_participantes add column if not exists graba_ver text;

-- Prueba de la autorización: un registro por cada decisión (otorgar o revocar).
-- Sin llave foránea a propósito: «Reiniciar» borra participantes, pero la prueba se conserva.
create table if not exists iaab_consentimientos (
  id              bigserial primary key,
  sesion_id       text not null,
  participante_id uuid not null,
  nombre          text not null,
  area            text,
  graba           boolean not null,
  texto_ver       text not null,
  created_at      timestamptz not null default now()
);
alter table iaab_consentimientos enable row level security;
revoke all on iaab_consentimientos from anon, authenticated;

-- Registro con la decisión sobre la grabación (obligatorio responder, no aceptar)
create or replace function iaab_registrar_v2(p_sesion text, p_nombre text, p_area text, p_graba boolean, p_ver text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v iaab_participantes%rowtype;
begin
  if not exists (select 1 from iaab_sesiones where id = p_sesion) then raise exception 'SESION_NO_EXISTE'; end if;
  if p_graba is null then raise exception 'FALTA_GRABACION'; end if;
  insert into iaab_participantes (sesion_id, nombre, area, graba, graba_at, graba_ver)
    values (p_sesion, left(trim(p_nombre), 40), left(p_area, 60), p_graba, now(), left(p_ver, 40)) returning * into v;
  insert into iaab_consentimientos (sesion_id, participante_id, nombre, area, graba, texto_ver)
    values (v.sesion_id, v.id, v.nombre, v.area, p_graba, coalesce(v.graba_ver, ''));
  return jsonb_build_object('id', v.id, 'nombre', v.nombre, 'area', v.area, 'graba', v.graba);
end $$;

-- Cambiar la decisión (otorgar más tarde o revocar)
create or replace function iaab_consentir(p_part uuid, p_graba boolean, p_ver text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v iaab_participantes%rowtype;
begin
  if p_graba is null then raise exception 'FALTA_GRABACION'; end if;
  update iaab_participantes set graba = p_graba, graba_at = now(), graba_ver = left(p_ver, 40) where id = p_part returning * into v;
  if v.id is null then raise exception 'PARTICIPANTE_INVALIDO'; end if;
  insert into iaab_consentimientos (sesion_id, participante_id, nombre, area, graba, texto_ver)
    values (v.sesion_id, v.id, v.nombre, v.area, p_graba, coalesce(v.graba_ver, ''));
  return jsonb_build_object('graba', v.graba);
end $$;

-- Panel: conteo vigente (sin nombres) + historial completo para descargar
create or replace function iaab_grabacion(p_sesion text, p_clave text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare s iaab_sesiones%rowtype; r jsonb;
begin
  select * into s from iaab_sesiones where id = p_sesion;
  if s.id is null then raise exception 'SESION_NO_EXISTE'; end if;
  if p_clave is distinct from s.clave_admin then raise exception 'CLAVE_INVALIDA'; end if;
  select jsonb_build_object(
    'si',  count(*) filter (where graba is true),
    'no',  count(*) filter (where graba is false),
    'sin', count(*) filter (where graba is null)) into r
    from iaab_participantes where sesion_id = p_sesion;
  return r || jsonb_build_object('rows', coalesce((select jsonb_agg(to_jsonb(c) order by c.created_at)
    from (select created_at, nombre, area, graba, texto_ver from iaab_consentimientos where sesion_id = p_sesion) c), '[]'::jsonb));
end $$;

revoke all on function iaab_registrar_v2(text, text, text, boolean, text), iaab_consentir(uuid, boolean, text), iaab_grabacion(text, text) from public;
grant execute on function iaab_registrar_v2(text, text, text, boolean, text), iaab_consentir(uuid, boolean, text), iaab_grabacion(text, text) to anon, authenticated;
