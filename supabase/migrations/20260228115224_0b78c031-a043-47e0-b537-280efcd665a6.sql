-- Remove items without valid summaries and reset the valid one
DELETE FROM public.digest_dispatch_queue 
WHERE doctor_id = 'a2c10ae4-0324-4b15-ae01-8e770f567440' 
AND article_id IN ('b5451197-fe24-4260-bfdf-ad16bd2f277b', '5f3bf308-27e7-42d5-a699-af29d8764b40', 'adb9a02c-73d7-4c82-9c80-656be3595665');

UPDATE public.digest_dispatch_queue 
SET status = 'pending', sent_at = NULL 
WHERE doctor_id = 'a2c10ae4-0324-4b15-ae01-8e770f567440' 
AND article_id = '481dc3f1-cf0d-49e6-970e-41d1e2026272';