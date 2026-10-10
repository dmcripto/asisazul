-- Ubicación en vivo de Asisazul. Pegar completo en Supabase -> SQL Editor -> Run.
-- Privacidad: solo se guarda la ÚLTIMA posición (sin historial) y se borra al dejar de compartir.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40)
);

create table if not exists public.locations (
  owner uuid primary key references auth.users(id) on delete cascade,
  lat double precision not null,
  lon double precision not null,
  acc double precision,
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null            -- el aviso de "hasta cuándo" que eligió la persona
);

create table if not exists public.share_codes (
  code text primary key,
  owner uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null
);

create table if not exists public.links (
  owner uuid not null references auth.users(id) on delete cascade,
  follower uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner, follower)
);

alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.share_codes enable row level security;
alter table public.links enable row level security;

-- profiles: cada persona edita solo el suyo. Lo ven ella y las personas vinculadas con ella (en cualquier sentido).
drop policy if exists prof_write on public.profiles;
create policy prof_write on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
drop policy if exists prof_read on public.profiles;
create policy prof_read on public.profiles for select using (
  id = auth.uid() or exists (select 1 from public.links l
    where (l.owner = profiles.id and l.follower = auth.uid()) or (l.follower = profiles.id and l.owner = auth.uid())));

-- locations: la persona escribe/borra la suya; la ven ella y sus familiares vinculados, y solo mientras no venza.
drop policy if exists loc_owner_write on public.locations;
create policy loc_owner_write on public.locations for all
  using (owner = auth.uid()) with check (owner = auth.uid());
drop policy if exists loc_follower_read on public.locations;
create policy loc_follower_read on public.locations for select
  using (expires_at > now() and exists (select 1 from public.links l where l.owner = locations.owner and l.follower = auth.uid()));

-- share_codes: solo el dueño ve y borra los suyos. Se crean con create_code().
drop policy if exists code_owner on public.share_codes;
create policy code_owner on public.share_codes for select using (owner = auth.uid());
drop policy if exists code_owner_del on public.share_codes;
create policy code_owner_del on public.share_codes for delete using (owner = auth.uid());

-- links: los dos lados pueden verlo y cualquiera de los dos puede cortarlo. Se crean con redeem_code().
drop policy if exists link_read on public.links;
create policy link_read on public.links for select using (owner = auth.uid() or follower = auth.uid());
drop policy if exists link_del on public.links;
create policy link_del on public.links for delete using (owner = auth.uid() or follower = auth.uid());

-- Código de 6 caracteres sin letras confusas, válido 10 minutos.
create or replace function public.create_code() returns text
language plpgsql security definer set search_path = public as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  c text;
begin
  if auth.uid() is null then raise exception 'sin sesión'; end if;
  delete from share_codes where owner = auth.uid() or expires_at < now();
  loop
    c := '';
    for i in 1..6 loop
      c := c || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from share_codes where code = c);
  end loop;
  insert into share_codes(code, owner, expires_at) values (c, auth.uid(), now() + interval '10 minutes');
  return c;
end $$;

-- El familiar escribe el código: se crea el vínculo y el código se gasta.
create or replace function public.redeem_code(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare o uuid;
begin
  if auth.uid() is null then raise exception 'sin sesión'; end if;
  select owner into o from share_codes where code = upper(trim(p_code)) and expires_at > now();
  if o is null then raise exception 'código inválido o vencido'; end if;
  if o = auth.uid() then raise exception 'no puedes vincularte contigo mismo'; end if;
  insert into links(owner, follower) values (o, auth.uid()) on conflict do nothing;
  delete from share_codes where code = upper(trim(p_code));
  return o;
end $$;

revoke all on function public.create_code() from public, anon;
revoke all on function public.redeem_code(text) from public, anon;
grant execute on function public.create_code() to authenticated;
grant execute on function public.redeem_code(text) to authenticated;

-- Borrar la cuenta y TODOS sus datos (perfil, ubicación, códigos y vínculos se borran en cascada).
create or replace function public.delete_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'sin sesión'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;

-- Tiempo real (respeta las reglas de arriba).
alter publication supabase_realtime add table public.locations;
