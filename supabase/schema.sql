-- ============================================================
-- PLATAFORMA IA-ABILITIES · esquema Supabase (Postgres)
-- Tablas con prefijo iaab_ para poder convivir con otros proyectos.
-- Correr completo en el SQL Editor (una sola vez). Luego crear cada
-- sesión con el bloque del final (cambiar la clave).
-- ============================================================
create extension if not exists pgcrypto;

create table if not exists iaab_sesiones (
  id          text primary key check (id ~ '^(mp|pco)-[a-z0-9-]{1,40}$'),  -- 'mp-s1', 'pco-n1'…
  cliente     text not null check (cliente in ('mp','pco')),
  nombre      text not null,
  habilitadas jsonb not null default '[]'::jsonb,   -- ids de tarjeta abiertas: ["N1-00",…]
  actual      text,                                  -- capítulo «Ahora en la sala» (n1-c3…)
  encuesta    text,                                  -- encuesta abierta (id) o null
  clave_admin text not null,
  created_at  timestamptz not null default now()
);

create table if not exists iaab_participantes (
  id         uuid primary key default gen_random_uuid(),
  sesion_id  text not null references iaab_sesiones(id) on delete cascade,
  nombre     text not null check (char_length(nombre) between 1 and 40),
  area       text check (char_length(area) <= 60),
  created_at timestamptz not null default now(),
  last_seen  timestamptz not null default now()
);

create table if not exists iaab_publicaciones (
  id              bigserial primary key,
  sesion_id       text not null references iaab_sesiones(id) on delete cascade,
  participante_id uuid not null references iaab_participantes(id) on delete cascade,
  nombre          text not null check (char_length(nombre) between 1 and 40),
  act_id          text not null check (act_id ~ '^N[1-4]-[0-9]{2}$'),
  tipo            text not null default 'prompt' check (tipo in ('hallazgo','par','prompt','loop','ficha','prueba','escalon')),
  texto           text not null check (char_length(texto) between 1 and 4000),
  estado          text not null default 'visible' check (estado in ('visible','destacada','oculta')),
  created_at      timestamptz not null default now()
);
create index if not exists iaab_pub_sesion_idx on iaab_publicaciones(sesion_id);

create table if not exists iaab_votos (
  id              bigserial primary key,
  sesion_id       text not null references iaab_sesiones(id) on delete cascade,
  publicacion_id  bigint not null references iaab_publicaciones(id) on delete cascade,
  participante_id uuid not null references iaab_participantes(id) on delete cascade,
  created_at      timestamptz not null default now(),
  unique (publicacion_id, participante_id)
);

create table if not exists iaab_respuestas (
  id              bigserial primary key,
  sesion_id       text not null references iaab_sesiones(id) on delete cascade,
  encuesta_id     text not null check (char_length(encuesta_id) <= 40),
  participante_id uuid not null references iaab_participantes(id) on delete cascade,
  valor           jsonb not null,
  created_at      timestamptz not null default now(),
  unique (sesion_id, encuesta_id, participante_id)
);

alter table iaab_sesiones add column if not exists muestra text;  -- encuesta en el muro (migración 002)

-- ---------- Vistas públicas (sin claves; sin ocultas) ----------
create or replace view iaab_v_sesiones with (security_invoker = true) as
  select id, cliente, nombre, habilitadas, actual, encuesta, created_at, muestra from iaab_sesiones;

-- Sin participante_id: el id de cada persona solo lo conoce su propio dispositivo.
-- Vista con permisos del dueño (no security_invoker) para poder contar votos sin exponer la tabla.
create or replace view iaab_v_publicaciones as
  select p.id, p.sesion_id, p.nombre, p.act_id, p.tipo, p.texto, p.estado, p.created_at,
         coalesce(v.n, 0)::int as votos
  from iaab_publicaciones p
  left join (select publicacion_id, count(*) n from iaab_votos group by publicacion_id) v on v.publicacion_id = p.id
  where p.estado <> 'oculta';

-- ---------- RLS ----------
alter table iaab_sesiones      enable row level security;
alter table iaab_participantes enable row level security;
alter table iaab_publicaciones enable row level security;
alter table iaab_votos         enable row level security;
alter table iaab_respuestas    enable row level security;

-- Sesiones: lectura pública solo de columnas sin clave
drop policy if exists iaab_ses_sel on iaab_sesiones;
create policy iaab_ses_sel on iaab_sesiones for select using (true);
revoke all on iaab_sesiones from anon, authenticated;
grant select (id, cliente, nombre, habilitadas, actual, encuesta, created_at, muestra) on iaab_sesiones to anon, authenticated;

-- Participantes: nada directo desde el navegador; el registro pasa por iaab_registrar y el admin los ve por RPC
revoke all on iaab_participantes from anon, authenticated;

-- Publicaciones y votos: el navegador lee el muro por la vista y escribe por RPC
revoke all on iaab_publicaciones from anon, authenticated;
revoke all on iaab_votos from anon, authenticated;
grant select on iaab_v_publicaciones to anon, authenticated;
grant select on iaab_v_sesiones to anon, authenticated;

-- Respuestas: nada directo desde el navegador (todo por RPC)
revoke all on iaab_respuestas from anon, authenticated;

-- ---------- RPC del participante ----------
create or replace function iaab_registrar(p_sesion text, p_nombre text, p_area text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v iaab_participantes%rowtype;
begin
  if not exists (select 1 from iaab_sesiones where id = p_sesion) then raise exception 'SESION_NO_EXISTE'; end if;
  insert into iaab_participantes (sesion_id, nombre, area) values (p_sesion, left(trim(p_nombre), 40), left(p_area, 60)) returning * into v;
  return jsonb_build_object('id', v.id, 'nombre', v.nombre, 'area', v.area);
end $$;

create or replace function iaab_publicar(p_sesion text, p_part uuid, p_act text, p_texto text, p_tipo text default 'prompt') returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_nombre text; v_id bigint;
begin
  select nombre into v_nombre from iaab_participantes where id = p_part and sesion_id = p_sesion;
  if v_nombre is null then raise exception 'PARTICIPANTE_INVALIDO'; end if;
  if not exists (select 1 from iaab_sesiones where id = p_sesion and habilitadas ? p_act) then raise exception 'ACTIVIDAD_CERRADA'; end if;
  if p_texto is null or char_length(trim(p_texto)) = 0 or char_length(p_texto) > 4000 then raise exception 'TEXTO_INVALIDO'; end if;
  insert into iaab_publicaciones (sesion_id, participante_id, nombre, act_id, tipo, texto) values (p_sesion, p_part, v_nombre, p_act, coalesce(p_tipo, 'prompt'), p_texto) returning id into v_id;
  return jsonb_build_object('id', v_id);
end $$;

create or replace function iaab_votar(p_pub bigint, p_part uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from iaab_publicaciones p join iaab_participantes x on x.sesion_id = p.sesion_id
                 where p.id = p_pub and x.id = p_part) then raise exception 'VOTO_INVALIDO'; end if;
  insert into iaab_votos (sesion_id, publicacion_id, participante_id)
    select sesion_id, p_pub, p_part from iaab_publicaciones where id = p_pub
  on conflict (publicacion_id, participante_id) do nothing;
end $$;

create or replace function iaab_mis_votos(p_part uuid) returns setof bigint
language sql security definer set search_path = public as $$
  select publicacion_id from iaab_votos where participante_id = p_part;
$$;

create or replace function iaab_ping(p_id uuid) returns void
language sql security definer set search_path = public as $$
  update iaab_participantes set last_seen = now() where id = p_id;
$$;

create or replace function iaab_quitar_voto(p_pub bigint, p_part uuid) returns void
language sql security definer set search_path = public as $$
  delete from iaab_votos where publicacion_id = p_pub and participante_id = p_part;
$$;

create or replace function iaab_responder(p_sesion text, p_encuesta text, p_part uuid, p_valor jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from iaab_sesiones where id = p_sesion and encuesta = p_encuesta) then raise exception 'ENCUESTA_CERRADA'; end if;
  if not exists (select 1 from iaab_participantes where id = p_part and sesion_id = p_sesion) then raise exception 'PARTICIPANTE_INVALIDO'; end if;
  if octet_length(p_valor::text) > 2000 then raise exception 'TEXTO_INVALIDO'; end if;
  insert into iaab_respuestas (sesion_id, encuesta_id, participante_id, valor) values (p_sesion, p_encuesta, p_part, p_valor)
  on conflict (sesion_id, encuesta_id, participante_id) do update set valor = excluded.valor, created_at = now();
end $$;

-- ---------- RPC del facilitador (clave de la sesión) ----------
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

revoke all on function iaab_admin_op(text, text, text, jsonb) from public;
grant execute on function iaab_admin_op(text, text, text, jsonb) to anon, authenticated;
grant execute on function iaab_registrar(text, text, text), iaab_publicar(text, uuid, text, text, text), iaab_votar(bigint, uuid), iaab_mis_votos(uuid),
  iaab_ping(uuid), iaab_quitar_voto(bigint, uuid), iaab_responder(text, text, uuid, jsonb) to anon, authenticated;

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

-- ============================================================
-- Crear una sesión (cambie la clave; no la escriba en ningún documento):
-- insert into iaab_sesiones (id, cliente, nombre, clave_admin)
-- values ('mp-s1', 'mp', 'IA-abilities · Equipo de mercadeo · Sesión 1', '<<CLAVE>>');
-- ============================================================
