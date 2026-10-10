create policy donation_images_read on storage.objects for select to authenticated using (bucket_id = 'donation-images');
create policy donation_images_insert on storage.objects for insert to authenticated with check (bucket_id = 'donation-images');
create policy donation_images_update on storage.objects for update to authenticated using (bucket_id = 'donation-images' and owner = auth.uid());
create policy donation_images_delete on storage.objects for delete to authenticated using (bucket_id = 'donation-images' and owner = auth.uid());