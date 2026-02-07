
-- ============================================================
-- TI-RADS RULES TABLE
-- ============================================================
CREATE TABLE public.tirads_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_group text NOT NULL,
  option_key text NOT NULL,
  option_label text NOT NULL,
  points integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (category_group, option_key)
);

ALTER TABLE public.tirads_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tirads rules"
  ON public.tirads_rules FOR SELECT
  USING (auth.role() = 'authenticated'::text);

-- ============================================================
-- TI-RADS THRESHOLDS TABLE
-- ============================================================
CREATE TABLE public.tirads_thresholds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tr_level text NOT NULL,
  follow_up_min_cm numeric NULL,
  fna_min_cm numeric NULL,
  follow_up_schedule text NULL,
  note text NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (tr_level)
);

ALTER TABLE public.tirads_thresholds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tirads thresholds"
  ON public.tirads_thresholds FOR SELECT
  USING (auth.role() = 'authenticated'::text);

-- ============================================================
-- SEED tirads_rules
-- ============================================================
INSERT INTO public.tirads_rules (category_group, option_key, option_label, points) VALUES
  ('composition', 'cystic', 'Cístico ou quase totalmente cístico', 0),
  ('composition', 'spongiform', 'Esponjiforme', 0),
  ('composition', 'mixed', 'Misto cístico-sólido', 1),
  ('composition', 'solid', 'Sólido ou quase totalmente sólido', 2),
  ('echogenicity', 'anechoic', 'Anecoico', 0),
  ('echogenicity', 'hyper_or_iso', 'Hiperecogênico ou isoecogênico', 1),
  ('echogenicity', 'hypoechoic', 'Hipoecogênico', 2),
  ('echogenicity', 'very_hypoechoic', 'Muito hipoecogênico', 3),
  ('shape', 'wider_than_tall', 'Mais largo que alto', 0),
  ('shape', 'taller_than_wide', 'Mais alto que largo', 3),
  ('margin', 'smooth', 'Regular (liso)', 0),
  ('margin', 'ill_defined', 'Mal definido', 0),
  ('margin', 'lobulated_irregular', 'Lobulado ou irregular', 2),
  ('margin', 'extra_thyroidal_extension', 'Extensão extratireoidiana', 3),
  ('echogenic_foci', 'none_or_comet', 'Ausente ou cauda de cometa', 0),
  ('echogenic_foci', 'macrocalc', 'Macrocalcificações', 1),
  ('echogenic_foci', 'peripheral_rim', 'Calcificação periférica (rim)', 2),
  ('echogenic_foci', 'punctate', 'Focos puntiformes (microcalcificações)', 3)
ON CONFLICT (category_group, option_key) DO NOTHING;

-- ============================================================
-- SEED tirads_thresholds
-- ============================================================
INSERT INTO public.tirads_thresholds (tr_level, follow_up_min_cm, fna_min_cm, follow_up_schedule, note) VALUES
  ('TR1', NULL, NULL, '', 'Benigno: sem PAAF e sem follow-up de rotina.'),
  ('TR2', NULL, NULL, '', 'Não suspeito: sem PAAF e sem follow-up de rotina.'),
  ('TR3', 1.5, 2.5, 'US em 1, 3 e 5 anos', 'Levemente suspeito.'),
  ('TR4', 1.0, 1.5, 'US em 1, 2, 3 e 5 anos', 'Moderadamente suspeito.'),
  ('TR5', 0.5, 1.0, 'US anual até 5 anos', 'Altamente suspeito.')
ON CONFLICT (tr_level) DO NOTHING;
