
-- Table for pediatric organ norms
CREATE TABLE public.peds_us_organ_norms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organ_key TEXT NOT NULL,
  age_min_mo INT NOT NULL,
  age_max_mo INT NOT NULL,
  mean_mm NUMERIC,
  sd_mm NUMERIC,
  min_mm NUMERIC,
  max_mm NUMERIC,
  p5_mm NUMERIC NOT NULL,
  p95_mm NUMERIC NOT NULL,
  low_suggested_mm NUMERIC NOT NULL,
  up_suggested_mm NUMERIC NOT NULL,
  source TEXT NOT NULL,
  table_ref TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organ_key, age_min_mo, age_max_mo)
);

-- Enable RLS
ALTER TABLE public.peds_us_organ_norms ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read norms (reference data)
CREATE POLICY "Authenticated users can view organ norms"
ON public.peds_us_organ_norms
FOR SELECT
USING (auth.role() = 'authenticated'::text);

-- Table for tool usage logging
CREATE TABLE public.tool_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tool_key TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tool_usage_log ENABLE ROW LEVEL SECURITY;

-- Users can insert their own logs
CREATE POLICY "Users can insert their own usage logs"
ON public.tool_usage_log
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own logs
CREATE POLICY "Users can view their own usage logs"
ON public.tool_usage_log
FOR SELECT
USING (auth.uid() = user_id);

-- Seed data for peds_us_organ_norms
INSERT INTO public.peds_us_organ_norms (organ_key, age_min_mo, age_max_mo, mean_mm, sd_mm, min_mm, max_mm, p5_mm, p95_mm, low_suggested_mm, up_suggested_mm, source, table_ref) VALUES
('liver_right_lobe',1,3,64,10.4,45,90,48,82,40,90,'Konus AJR 1998','Table4'),
('liver_right_lobe',4,6,73,10.8,44,92,53,86,45,95,'Konus AJR 1998','Table4'),
('liver_right_lobe',7,9,79,8.0,68,100,70,90,60,100,'Konus AJR 1998','Table4'),
('liver_right_lobe',12,30,85,10.0,67,104,68,98,65,105,'Konus AJR 1998','Table4'),
('liver_right_lobe',36,59,86,11.8,69,109,63,105,65,115,'Konus AJR 1998','Table4'),
('liver_right_lobe',60,83,100,13.6,73,125,77,124,70,125,'Konus AJR 1998','Table4'),
('liver_right_lobe',84,107,105,10.6,81,128,90,123,75,130,'Konus AJR 1998','Table4'),
('liver_right_lobe',108,131,105,12.5,76,135,83,128,75,135,'Konus AJR 1998','Table4'),
('liver_right_lobe',132,155,115,14.0,93,137,95,136,85,140,'Konus AJR 1998','Table4'),
('liver_right_lobe',156,179,118,14.6,87,137,94,136,85,140,'Konus AJR 1998','Table4'),
('liver_right_lobe',180,200,121,11.7,100,141,104,139,95,145,'Konus AJR 1998','Table4'),
('spleen',1,3,53,7.8,33,71,40,65,30,70,'Konus AJR 1998','Table5'),
('spleen',4,6,59,6.3,45,71,47,67,40,75,'Konus AJR 1998','Table5'),
('spleen',7,9,63,7.6,50,77,53,74,45,80,'Konus AJR 1998','Table5'),
('spleen',12,30,70,9.6,54,86,55,82,50,85,'Konus AJR 1998','Table5'),
('spleen',36,59,75,8.4,60,91,61,88,55,95,'Konus AJR 1998','Table5'),
('spleen',60,83,84,9.0,61,100,70,100,60,105,'Konus AJR 1998','Table5'),
('spleen',84,107,85,10.5,65,102,69,100,65,105,'Konus AJR 1998','Table5'),
('spleen',108,131,86,10.7,64,114,70,100,65,110,'Konus AJR 1998','Table5'),
('spleen',132,155,97,9.7,72,100,81,108,75,115,'Konus AJR 1998','Table5'),
('spleen',156,179,101,11.7,84,120,85,118,80,120,'Konus AJR 1998','Table5'),
('spleen',180,200,101,10.3,88,120,88,115,85,120,'Konus AJR 1998','Table5'),
('kidney_right',1,3,50,5.8,38,66,40,58,35,65,'Konus AJR 1998','Table6'),
('kidney_right',4,6,53,5.3,41,66,50,64,40,70,'Konus AJR 1998','Table6'),
('kidney_right',7,9,59,5.2,50,70,52,66,45,70,'Konus AJR 1998','Table6'),
('kidney_right',12,30,61,3.4,55,66,55,65,50,75,'Konus AJR 1998','Table6'),
('kidney_right',36,59,67,5.1,57,77,59,75,55,80,'Konus AJR 1998','Table6'),
('kidney_right',60,83,74,5.5,62,83,65,83,60,85,'Konus AJR 1998','Table6'),
('kidney_right',84,107,80,6.6,68,93,70,91,65,95,'Konus AJR 1998','Table6'),
('kidney_right',108,131,80,7.0,69,96,69,89,65,100,'Konus AJR 1998','Table6'),
('kidney_right',132,155,89,6.2,81,102,82,100,70,105,'Konus AJR 1998','Table6'),
('kidney_right',156,179,94,5.9,83,105,85,102,75,110,'Konus AJR 1998','Table6'),
('kidney_right',180,200,92,7.0,80,107,83,102,75,110,'Konus AJR 1998','Table6'),
('kidney_left',1,3,50,5.5,39,61,42,59,35,65,'Konus AJR 1998','Table7'),
('kidney_left',4,6,56,5.5,44,68,47,64,40,70,'Konus AJR 1998','Table7'),
('kidney_left',7,9,61,4.6,54,68,54,68,45,75,'Konus AJR 1998','Table7'),
('kidney_left',12,30,66,5.3,54,75,57,72,50,80,'Konus AJR 1998','Table7'),
('kidney_left',36,59,71,4.5,61,77,61,76,55,85,'Konus AJR 1998','Table7'),
('kidney_left',60,83,79,5.9,66,90,70,87,60,95,'Konus AJR 1998','Table7'),
('kidney_left',84,107,84,6.6,71,95,73,93,65,100,'Konus AJR 1998','Table7'),
('kidney_left',108,131,84,7.4,71,99,75,97,65,105,'Konus AJR 1998','Table7'),
('kidney_left',132,155,91,8.4,71,104,77,102,70,110,'Konus AJR 1998','Table7'),
('kidney_left',156,179,96,8.9,83,113,84,110,75,115,'Konus AJR 1998','Table7'),
('kidney_left',180,200,99,7.5,87,116,90,110,80,120,'Konus AJR 1998','Table7')
ON CONFLICT (organ_key, age_min_mo, age_max_mo) DO NOTHING;
