-- Pulso · Jugador: los recordatorios pasan a las 09:30 (peso y suplementación) y 21:30 (cierre del día), hora de Madrid.
-- pg_cron llama ahora en el minuto 30 de cada hora; la función jugador-notify decide por la hora de Madrid (y por el horario de verano).
select cron.unschedule('jugador-recordatorios') where exists (select 1 from cron.job where jobname = 'jugador-recordatorios');
select cron.schedule('jugador-recordatorios', '30 * * * *', $$
  select net.http_post(
    url := 'https://lunaktorykgmhejojiai.supabase.co/functions/v1/jugador-notify',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-pulso-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'pulso_notify_secret')),
    body := '{"tipo":"recordatorios"}'::jsonb)
$$);
