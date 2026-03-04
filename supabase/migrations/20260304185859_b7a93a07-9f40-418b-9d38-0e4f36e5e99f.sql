
-- Schedule daily digest dispatch at 10:00 UTC (7:00 BRT)
SELECT cron.schedule(
  'daily-dispatch-digests',
  '0 10 * * *',
  $$
  SELECT net.http_post(
    url:='https://emxgbizhkhujyoyyfpxj.supabase.co/functions/v1/dispatch-digests',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVteGdiaXpoa2h1anlveXlmcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTQ4NTUsImV4cCI6MjA2OTQ3MDg1NX0.ursNVsuWN-T2_YsJ1yypqpKyLMZgtzyKhpLanD11SrI"}'::jsonb,
    body:='{"time": "scheduled"}'::jsonb
  ) AS request_id;
  $$
);

-- Schedule weekly journal scraping on Mondays at 09:00 UTC (6:00 BRT)
-- Scrapes each journal source sequentially via multiple cron entries
SELECT cron.schedule(
  'weekly-scrape-radiology',
  '0 9 * * 1',
  $$
  SELECT net.http_post(
    url:='https://emxgbizhkhujyoyyfpxj.supabase.co/functions/v1/scrape-journal-articles',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVteGdiaXpoa2h1anlveXlmcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTQ4NTUsImV4cCI6MjA2OTQ3MDg1NX0.ursNVsuWN-T2_YsJ1yypqpKyLMZgtzyKhpLanD11SrI"}'::jsonb,
    body:='{"sourceKey": "radiology", "maxArticles": 30}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'weekly-scrape-radiographics',
  '5 9 * * 1',
  $$
  SELECT net.http_post(
    url:='https://emxgbizhkhujyoyyfpxj.supabase.co/functions/v1/scrape-journal-articles',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVteGdiaXpoa2h1anlveXlmcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTQ4NTUsImV4cCI6MjA2OTQ3MDg1NX0.ursNVsuWN-T2_YsJ1yypqpKyLMZgtzyKhpLanD11SrI"}'::jsonb,
    body:='{"sourceKey": "radiographics", "maxArticles": 30}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'weekly-scrape-ajr',
  '10 9 * * 1',
  $$
  SELECT net.http_post(
    url:='https://emxgbizhkhujyoyyfpxj.supabase.co/functions/v1/scrape-journal-articles',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVteGdiaXpoa2h1anlveXlmcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTQ4NTUsImV4cCI6MjA2OTQ3MDg1NX0.ursNVsuWN-T2_YsJ1yypqpKyLMZgtzyKhpLanD11SrI"}'::jsonb,
    body:='{"sourceKey": "ajr", "maxArticles": 30}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'weekly-scrape-jum',
  '15 9 * * 1',
  $$
  SELECT net.http_post(
    url:='https://emxgbizhkhujyoyyfpxj.supabase.co/functions/v1/scrape-journal-articles',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVteGdiaXpoa2h1anlveXlmcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTQ4NTUsImV4cCI6MjA2OTQ3MDg1NX0.ursNVsuWN-T2_YsJ1yypqpKyLMZgtzyKhpLanD11SrI"}'::jsonb,
    body:='{"sourceKey": "jum", "maxArticles": 30}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'weekly-scrape-european-radiology',
  '20 9 * * 1',
  $$
  SELECT net.http_post(
    url:='https://emxgbizhkhujyoyyfpxj.supabase.co/functions/v1/scrape-journal-articles',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVteGdiaXpoa2h1anlveXlmcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTQ4NTUsImV4cCI6MjA2OTQ3MDg1NX0.ursNVsuWN-T2_YsJ1yypqpKyLMZgtzyKhpLanD11SrI"}'::jsonb,
    body:='{"sourceKey": "european_radiology", "maxArticles": 30}'::jsonb
  ) AS request_id;
  $$
);

SELECT cron.schedule(
  'weekly-scrape-jcu',
  '25 9 * * 1',
  $$
  SELECT net.http_post(
    url:='https://emxgbizhkhujyoyyfpxj.supabase.co/functions/v1/scrape-journal-articles',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVteGdiaXpoa2h1anlveXlmcHhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4OTQ4NTUsImV4cCI6MjA2OTQ3MDg1NX0.ursNVsuWN-T2_YsJ1yypqpKyLMZgtzyKhpLanD11SrI"}'::jsonb,
    body:='{"sourceKey": "jcu", "maxArticles": 30}'::jsonb
  ) AS request_id;
  $$
);
