create policy tasks_select_open_volunteer on public.pickup_tasks for select to authenticated
  using (volunteer_id is null and public.has_role(auth.uid(),'volunteer'));
create policy tasks_claim_volunteer on public.pickup_tasks for update to authenticated
  using (volunteer_id is null and public.has_role(auth.uid(),'volunteer'))
  with check (volunteer_id = auth.uid());
create policy donations_update_volunteer on public.donations for update to authenticated
  using (exists (select 1 from public.pickup_tasks t where t.donation_id = id and t.volunteer_id = auth.uid()));