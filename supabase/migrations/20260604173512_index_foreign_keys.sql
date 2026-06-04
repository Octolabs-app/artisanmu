begin;

create index if not exists job_notifications_artisan_status_created_idx
  on public.job_notifications (artisan_id, status, created_at desc);

create index if not exists job_events_artisan_time_idx
  on public.job_events (artisan_id, "timestamp" desc)
  where artisan_id is not null;

create index if not exists audit_logs_artisan_time_idx
  on public.audit_logs (artisan_id, "timestamp" desc)
  where artisan_id is not null;

create index if not exists invoice_items_invoice_id_idx
  on public.invoice_items (invoice_id);

create index if not exists invoices_job_request_id_idx
  on public.invoices (job_request_id);

create index if not exists products_artisan_id_idx
  on public.products (artisan_id);

commit;
