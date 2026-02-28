INSERT INTO public.digest_dispatch_queue (doctor_id, article_id, scheduled_for, status, sent_at)
VALUES (
  'a2c10ae4-0324-4b15-ae01-8e770f567440',
  'c91cd6cb-8108-47bd-8de5-6d82e873b410',
  CURRENT_DATE,
  'pending',
  NULL
)
ON CONFLICT (doctor_id, article_id)
DO UPDATE SET
  scheduled_for = CURRENT_DATE,
  status = 'pending',
  sent_at = NULL;