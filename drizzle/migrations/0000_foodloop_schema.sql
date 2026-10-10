create type public.app_role as enum ('donor','ngo','volunteer','admin');
create type public.donation_status as enum ('available','accepted','picked_up','delivered','cancelled');
create type public.task_status as enum ('assigned','collected','delivered','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  org_name text,
  address text,
  lat double precision,
  lng double precision,
  capacity_kg numeric default 0,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role app_role not null,
  unique (user_id, role)
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  donor_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'Cooked Meals',
  quantity_kg numeric not null default 1,
  servings int not null default 1,
  dietary_type text not null default 'Vegetarian',
  allergens text,
  storage_conditions text,
  prepared_at timestamptz,
  image_url text,
  address text not null default '',
  lat double precision,
  lng double precision,
  pickup_deadline timestamptz not null,
  status donation_status not null default 'available',
  accepted_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.pickup_tasks (
  id uuid primary key default gen_random_uuid(),
  donation_id uuid not null references public.donations(id) on delete cascade,
  ngo_id uuid not null references public.profiles(id),
  volunteer_id uuid references public.profiles(id),
  status task_status not null default 'assigned',
  notes text,
  collected_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, org_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''), new.raw_user_meta_data->>'org_name');
  insert into public.user_roles (user_id, role)
  values (new.id, coalesce((new.raw_user_meta_data->>'role')::app_role, 'donor'));
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
grant select, insert, update, delete on public.donations to authenticated;
grant all on public.donations to service_role;
grant select, insert, update, delete on public.pickup_tasks to authenticated;
grant all on public.pickup_tasks to service_role;
grant select, insert, update on public.notifications to authenticated;
grant all on public.notifications to service_role;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.donations enable row level security;
alter table public.pickup_tasks enable row level security;
alter table public.notifications enable row level security;

create policy profiles_select on public.profiles for select to authenticated using (true);
create policy profiles_update_own on public.profiles for update to authenticated using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy roles_select_own on public.user_roles for select to authenticated using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy donations_select on public.donations for select to authenticated using (true);
create policy donations_insert_donor on public.donations for insert to authenticated with check (donor_id = auth.uid() and public.has_role(auth.uid(),'donor'));
create policy donations_update on public.donations for update to authenticated using (
  donor_id = auth.uid() or accepted_by = auth.uid() or public.has_role(auth.uid(),'ngo') or public.has_role(auth.uid(),'admin')
);
create policy donations_delete_own on public.donations for delete to authenticated using (donor_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy tasks_select on public.pickup_tasks for select to authenticated using (
  volunteer_id = auth.uid() or ngo_id = auth.uid() or public.has_role(auth.uid(),'admin')
  or exists (select 1 from public.donations d where d.id = donation_id and d.donor_id = auth.uid())
);
create policy tasks_insert_ngo on public.pickup_tasks for insert to authenticated with check (ngo_id = auth.uid() and public.has_role(auth.uid(),'ngo'));
create policy tasks_update on public.pickup_tasks for update to authenticated using (volunteer_id = auth.uid() or ngo_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy notifications_own on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_insert on public.notifications for insert to authenticated with check (true);
create policy notifications_update_own on public.notifications for update to authenticated using (user_id = auth.uid());

-- demo accounts (password: foodloop123 for all four)
insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-1111-1111-111111111111','00000000-0000-0000-0000-000000000000','authenticated','authenticated','donor@foodloop.demo',crypt('foodloop123', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Demo Donor","org_name":"Spice Garden Restaurant","role":"donor"}',now(),now()),
  ('22222222-2222-2222-2222-222222222222','00000000-0000-0000-0000-000000000000','authenticated','authenticated','ngo@foodloop.demo',crypt('foodloop123', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Demo NGO","org_name":"Hope Foundation","role":"ngo"}',now(),now()),
  ('33333333-3333-3333-3333-333333333333','00000000-0000-0000-0000-000000000000','authenticated','authenticated','volunteer@foodloop.demo',crypt('foodloop123', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Demo Volunteer","role":"volunteer"}',now(),now()),
  ('44444444-4444-4444-4444-444444444444','00000000-0000-0000-0000-000000000000','authenticated','authenticated','admin@foodloop.demo',crypt('foodloop123', gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{"full_name":"Demo Admin","org_name":"FoodLoop","role":"admin"}',now(),now())
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select id, id, id::text, jsonb_build_object('sub', id::text, 'email', email), 'email', now(), now(), now()
from auth.users where email like '%@foodloop.demo'
on conflict do nothing;

update public.profiles set address='MG Road, Bengaluru', lat=12.9758, lng=77.6010, verified=true where id='11111111-1111-1111-1111-111111111111';
update public.profiles set address='Koramangala, Bengaluru', lat=12.9352, lng=77.6245, capacity_kg=120, verified=true where id='22222222-2222-2222-2222-222222222222';
update public.profiles set address='Indiranagar, Bengaluru', lat=12.9784, lng=77.6408, verified=true where id='33333333-3333-3333-3333-333333333333';
update public.profiles set verified=true where id='44444444-4444-4444-4444-444444444444';

insert into public.donations (donor_id,title,description,category,quantity_kg,servings,dietary_type,allergens,storage_conditions,prepared_at,address,lat,lng,pickup_deadline,status) values
  ('11111111-1111-1111-1111-111111111111','Veg Biryani Trays','Freshly prepared vegetable biryani, 8 trays from lunch service.','Cooked Meals',12,40,'Vegetarian','Dairy','Keep cool, consume within 6 hours',now() - interval '1 hour','Spice Garden, MG Road',12.9758,77.6010,now() + interval '5 hours','available'),
  ('11111111-1111-1111-1111-111111111111','Assorted Bread & Pastries','Day-old bread, croissants and muffins from bakery counter.','Bakery',6,30,'Vegetarian','Gluten, Eggs','Room temperature, sealed bags',now() - interval '3 hours','Spice Garden, MG Road',12.9758,77.6010,now() + interval '9 hours','available'),
  ('11111111-1111-1111-1111-111111111111','Fresh Fruit Crates','Surplus bananas, apples and oranges, good condition.','Produce',15,50,'Vegan','None','Cool dry place',now() - interval '2 hours','Spice Garden, MG Road',12.9758,77.6010,now() + interval '1 day','available'),
  ('11111111-1111-1111-1111-111111111111','Paneer Butter Masala + Rice','Catering surplus from corporate event, unopened containers.','Cooked Meals',10,35,'Vegetarian','Dairy, Nuts','Refrigerated',now() - interval '4 hours','Spice Garden, MG Road',12.9758,77.6010,now() + interval '4 hours','accepted');

update public.donations set accepted_by = '22222222-2222-2222-2222-222222222222' where status = 'accepted';

insert into public.pickup_tasks (donation_id, ngo_id, volunteer_id, status, notes)
select d.id, '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333', 'assigned', 'Handle with care, refrigerated containers.'
from public.donations d where d.status = 'accepted';