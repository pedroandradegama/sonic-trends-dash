INSERT INTO public.digest_dispatch_queue (doctor_id, article_id, scheduled_for, status) 
VALUES ('a2c10ae4-0324-4b15-ae01-8e770f567440', '481dc3f1-cf0d-49e6-970e-41d1e2026272', CURRENT_DATE, 'pending')
ON CONFLICT (doctor_id, article_id) DO UPDATE SET status = 'pending', sent_at = NULL;