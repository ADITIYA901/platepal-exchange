drop policy donations_update_volunteer on public.donations;
create policy donations_update_volunteer on public.donations for update to authenticated
  using (exists (select 1 from public.pickup_tasks t where t.donation_id = donations.id and t.volunteer_id = auth.uid()));
create policy roles_select_public_roles on public.user_roles for select to authenticated
  using (role in ('ngo','volunteer','donor'));