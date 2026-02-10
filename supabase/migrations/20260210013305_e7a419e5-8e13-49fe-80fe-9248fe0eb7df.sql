
-- Interesting cases table for doctors to bookmark cases
CREATE TABLE public.interesting_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  patient_name text NOT NULL,
  exam_date date NOT NULL,
  diagnostic_hypothesis text NULL,
  wants_followup boolean NOT NULL DEFAULT false,
  followup_days integer NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.interesting_cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own interesting cases"
  ON public.interesting_cases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interesting cases"
  ON public.interesting_cases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interesting cases"
  ON public.interesting_cases FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interesting cases"
  ON public.interesting_cases FOR DELETE
  USING (auth.uid() = user_id);

-- Adult reference measurements table
CREATE TABLE public.adult_reference_measurements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  modality text NOT NULL,
  structure text NOT NULL,
  parameter text NOT NULL,
  normal_text text NOT NULL,
  cutoff_text text NULL,
  unit text NULL,
  notes text NULL,
  source_title text NOT NULL,
  source_url text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (category, modality, structure, parameter)
);

CREATE INDEX idx_arm_category ON public.adult_reference_measurements (category);
CREATE INDEX idx_arm_modality ON public.adult_reference_measurements (modality);
CREATE INDEX idx_arm_structure ON public.adult_reference_measurements (structure);

ALTER TABLE public.adult_reference_measurements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view adult reference measurements"
  ON public.adult_reference_measurements FOR SELECT
  USING (auth.role() = 'authenticated'::text);

-- Adult reference favorites
CREATE TABLE public.adult_reference_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  measurement_id uuid NOT NULL REFERENCES public.adult_reference_measurements(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (user_id, measurement_id)
);

ALTER TABLE public.adult_reference_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON public.adult_reference_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON public.adult_reference_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.adult_reference_favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Seed adult reference measurements
INSERT INTO public.adult_reference_measurements (category, modality, structure, parameter, normal_text, cutoff_text, unit, notes, source_title, source_url) VALUES
('Abdome','US','Rins','Comprimento renal (adulto)','Usualmente ~10–13 cm (polo a polo); rim esquerdo tende a ser discretamente maior.','<9 cm sugere rim pequeno; <8 cm frequentemente associado a doença renal crônica.','cm','Interpretar com biotipo e ecogenicidade.','Radiopaedia - Normal kidney size in adults','https://radiopaedia.org/articles/normal-kidney-size-in-adults'),
('Abdome','US','Baço','Comprimento longitudinal','Limite superior geralmente ~12–14 cm; ≤13 cm em ~97% em um estudo.','Acima do limite superior sugere esplenomegalia.','cm','Baço varia com altura.','PMC - Splenic size','https://pmc.ncbi.nlm.nih.gov/articles/PMC9895976/'),
('Abdome','US','Via biliar','Diâmetro colédoco (CBD)','Geralmente <6–7 mm em adultos; pode aumentar com a idade.','Evitar cutoff rígido isolado.','mm','Correlacionar com clínica e vias intra-hepáticas.','Radiopaedia - Common bile duct','https://radiopaedia.org/articles/common-bile-duct-2'),
('Abdome','US','Vesícula biliar','Espessura da parede','Normal <3 mm.','>3 mm sugere espessamento.','mm','Jejum inadequado pode simular espessamento.','Radiopaedia - Gallbladder wall thickening','https://radiopaedia.org/articles/gallbladder-wall-thickening'),
('Abdome','US','Veia porta','Diâmetro','Usualmente ~7–13 mm.','Cutoff clássico >13 mm para suspeita de hipertensão portal.','mm','Medida isolada é inespecífica.','Radiopaedia - Portal vein','https://radiopaedia.org/articles/portal-vein'),
('Vascular','US','Aorta abdominal','Definição de AAA','Aorta abdominal geralmente até ~2,5–3,0 cm.','AAA definido como diâmetro ≥3,0 cm.','cm','Se ≥3,0 cm: mencionar como aneurisma.','PMC - AAA definition','https://pmc.ncbi.nlm.nih.gov/articles/PMC11994495/'),
('Urologia','US','Bexiga','Volume vesical por US (fórmula)','Volume (mL) = Comprimento × Largura × Altura × 0,52.','Não aplicável.','mL','Fórmula do elipsoide/prolato.','NCBI StatPearls - Bladder volume','https://www.ncbi.nlm.nih.gov/books/NBK539839/'),
('Urologia','US','Bexiga','Resíduo pós-miccional (PVR) — interpretação','Valores variam; frequentemente 50–100 mL citados como limiar baixo.','<50 mL adequado; ≥200 mL inadequado.','mL','Interpretar conforme idade e clínica.','PMC - PVR thresholds','https://pmc.ncbi.nlm.nih.gov/articles/PMC3886558/'),
('Abdome','US','Vesícula biliar','Fração de ejeção vesicular (FEVB)','FEVB = ((V0 − Vt) / V0) × 100.','<35–40% frequentemente considerado reduzido.','%','Depende de protocolo e estímulo colerético.','Radiopaedia - Gallbladder ejection fraction','https://radiopaedia.org/articles/gallbladder-ejection-fraction')
ON CONFLICT (category, modality, structure, parameter) DO NOTHING;
