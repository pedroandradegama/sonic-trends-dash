-- Reset failed dispatch items to pending for retest
UPDATE public.digest_dispatch_queue 
SET status = 'pending', sent_at = NULL 
WHERE doctor_id = 'a2c10ae4-0324-4b15-ae01-8e770f567440' 
AND scheduled_for = CURRENT_DATE;