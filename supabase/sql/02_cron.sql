-- NEXO Pulso: recordatorio del cierre. pg_cron llama a pulso-notify cada hora en punto; la función mira la hora local de cada usuario.
-- Requiere antes (una vez, sin guardar en git): select vault.create_secret('<PULSO_NOTIFY_SECRET>', 'pulso_notify_secret');
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
select cron.unschedule('pulso-cierre') where exists (select 1 from cron.job where jobname = 'pulso-cierre');
select cron.schedule('pulso-cierre', '0 * * * *', $$
  select net.http_post(
    url := 'https://lunaktorykgmhejojiai.supabase.co/functions/v1/pulso-notify',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-pulso-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pulso_notify_secret')),
    body := '{"tipo":"cierre"}'::jsonb)
$$);
