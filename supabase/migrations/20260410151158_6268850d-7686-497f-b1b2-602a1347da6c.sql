-- Add logo_url column to fn_preset_clinics
ALTER TABLE fn_preset_clinics ADD COLUMN IF NOT EXISTS logo_url text;

-- Create storage bucket for clinic logos
INSERT INTO storage.buckets (id, name, public) VALUES ('clinic-logos', 'clinic-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos
CREATE POLICY "Allow authenticated upload clinic logos" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'clinic-logos');

-- Allow public read access
CREATE POLICY "Allow public read clinic logos" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'clinic-logos');

-- Allow authenticated to update/delete their uploads
CREATE POLICY "Allow authenticated update clinic logos" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'clinic-logos');

CREATE POLICY "Allow authenticated delete clinic logos" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'clinic-logos');