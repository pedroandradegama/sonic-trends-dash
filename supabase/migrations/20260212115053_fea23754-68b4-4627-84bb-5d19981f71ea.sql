
-- Table for CIMT normative data
CREATE TABLE public.cimt_norms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL,
  segment text NOT NULL,
  sex text NOT NULL,
  ethnicity text NOT NULL,
  age_type text NOT NULL,
  age_point numeric NULL,
  age_band_min numeric NULL,
  age_band_max numeric NULL,
  p25 numeric NOT NULL,
  p50 numeric NOT NULL,
  p75 numeric NOT NULL,
  p90 numeric NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_cimt_norms_lookup ON public.cimt_norms (source, segment, sex, ethnicity);
CREATE INDEX idx_cimt_norms_age_point ON public.cimt_norms (age_point);
CREATE INDEX idx_cimt_norms_age_band ON public.cimt_norms (age_band_min, age_band_max);

-- RLS
ALTER TABLE public.cimt_norms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cimt norms"
ON public.cimt_norms FOR SELECT
USING (auth.role() = 'authenticated'::text);

-- SEED: ELSA-Brasil Male White CCE
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75, p90) VALUES
('ELSA','CCE','M','BRANCO','POINT',40,0.47,0.53,0.60,0.70),
('ELSA','CCE','M','BRANCO','POINT',45,0.49,0.57,0.65,0.75),
('ELSA','CCE','M','BRANCO','POINT',50,0.52,0.60,0.69,0.80),
('ELSA','CCE','M','BRANCO','POINT',55,0.54,0.64,0.73,0.85),
('ELSA','CCE','M','BRANCO','POINT',60,0.57,0.67,0.77,0.90),
('ELSA','CCE','M','BRANCO','POINT',65,0.60,0.71,0.81,0.95);

-- ELSA Male White CCD
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75, p90) VALUES
('ELSA','CCD','M','BRANCO','POINT',40,0.45,0.51,0.59,0.66),
('ELSA','CCD','M','BRANCO','POINT',45,0.48,0.54,0.63,0.71),
('ELSA','CCD','M','BRANCO','POINT',50,0.51,0.58,0.67,0.76),
('ELSA','CCD','M','BRANCO','POINT',55,0.53,0.61,0.71,0.81),
('ELSA','CCD','M','BRANCO','POINT',60,0.56,0.65,0.75,0.85),
('ELSA','CCD','M','BRANCO','POINT',65,0.59,0.69,0.79,0.90);

-- ELSA Male Pardo CCE
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75, p90) VALUES
('ELSA','CCE','M','PARDO','POINT',40,0.48,0.53,0.60,0.69),
('ELSA','CCE','M','PARDO','POINT',45,0.50,0.57,0.65,0.75),
('ELSA','CCE','M','PARDO','POINT',50,0.53,0.61,0.70,0.80),
('ELSA','CCE','M','PARDO','POINT',55,0.56,0.65,0.75,0.86),
('ELSA','CCE','M','PARDO','POINT',60,0.58,0.69,0.80,0.92),
('ELSA','CCE','M','PARDO','POINT',65,0.61,0.73,0.85,0.97);

-- ELSA Male Pardo CCD
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75, p90) VALUES
('ELSA','CCD','M','PARDO','POINT',40,0.44,0.50,0.58,0.69),
('ELSA','CCD','M','PARDO','POINT',45,0.47,0.54,0.63,0.74),
('ELSA','CCD','M','PARDO','POINT',50,0.50,0.58,0.68,0.79),
('ELSA','CCD','M','PARDO','POINT',55,0.53,0.62,0.73,0.84),
('ELSA','CCD','M','PARDO','POINT',60,0.56,0.66,0.77,0.89),
('ELSA','CCD','M','PARDO','POINT',65,0.60,0.69,0.82,0.94);

-- ELSA Male Negro CCE
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75, p90) VALUES
('ELSA','CCE','M','NEGRO','POINT',40,0.49,0.56,0.64,0.71),
('ELSA','CCE','M','NEGRO','POINT',45,0.52,0.59,0.68,0.78),
('ELSA','CCE','M','NEGRO','POINT',50,0.55,0.63,0.72,0.84),
('ELSA','CCE','M','NEGRO','POINT',55,0.58,0.67,0.77,0.91),
('ELSA','CCE','M','NEGRO','POINT',60,0.62,0.71,0.81,0.97),
('ELSA','CCE','M','NEGRO','POINT',65,0.65,0.75,0.86,1.03);

-- ELSA Male Negro CCD
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75, p90) VALUES
('ELSA','CCD','M','NEGRO','POINT',40,0.46,0.54,0.61,0.70),
('ELSA','CCD','M','NEGRO','POINT',45,0.50,0.58,0.67,0.77),
('ELSA','CCD','M','NEGRO','POINT',50,0.53,0.62,0.73,0.83),
('ELSA','CCD','M','NEGRO','POINT',55,0.57,0.66,0.78,0.89),
('ELSA','CCD','M','NEGRO','POINT',60,0.60,0.70,0.84,0.95),
('ELSA','CCD','M','NEGRO','POINT',65,0.64,0.74,0.90,1.02);

-- ELSA Female White CCE
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75, p90) VALUES
('ELSA','CCE','F','BRANCO','POINT',40,0.44,0.49,0.54,0.61),
('ELSA','CCE','F','BRANCO','POINT',45,0.47,0.52,0.58,0.66),
('ELSA','CCE','F','BRANCO','POINT',50,0.50,0.56,0.63,0.71),
('ELSA','CCE','F','BRANCO','POINT',55,0.53,0.59,0.67,0.76),
('ELSA','CCE','F','BRANCO','POINT',60,0.56,0.63,0.71,0.81),
('ELSA','CCE','F','BRANCO','POINT',65,0.59,0.66,0.75,0.86);

-- ELSA Female White CCD
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75, p90) VALUES
('ELSA','CCD','F','BRANCO','POINT',40,0.44,0.48,0.53,0.59),
('ELSA','CCD','F','BRANCO','POINT',45,0.47,0.52,0.58,0.64),
('ELSA','CCD','F','BRANCO','POINT',50,0.50,0.56,0.62,0.69),
('ELSA','CCD','F','BRANCO','POINT',55,0.53,0.59,0.66,0.74),
('ELSA','CCD','F','BRANCO','POINT',60,0.55,0.63,0.70,0.79),
('ELSA','CCD','F','BRANCO','POINT',65,0.58,0.66,0.75,0.84);

-- ELSA Female Pardo CCE
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75, p90) VALUES
('ELSA','CCE','F','PARDO','POINT',40,0.45,0.50,0.56,0.63),
('ELSA','CCE','F','PARDO','POINT',45,0.48,0.53,0.60,0.68),
('ELSA','CCE','F','PARDO','POINT',50,0.51,0.57,0.64,0.73),
('ELSA','CCE','F','PARDO','POINT',55,0.54,0.60,0.68,0.78),
('ELSA','CCE','F','PARDO','POINT',60,0.57,0.64,0.72,0.83),
('ELSA','CCE','F','PARDO','POINT',65,0.60,0.67,0.77,0.88);

-- ELSA Female Pardo CCD
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75, p90) VALUES
('ELSA','CCD','F','PARDO','POINT',40,0.44,0.49,0.55,0.62),
('ELSA','CCD','F','PARDO','POINT',45,0.47,0.52,0.59,0.67),
('ELSA','CCD','F','PARDO','POINT',50,0.50,0.56,0.63,0.72),
('ELSA','CCD','F','PARDO','POINT',55,0.53,0.60,0.68,0.77),
('ELSA','CCD','F','PARDO','POINT',60,0.56,0.64,0.72,0.82),
('ELSA','CCD','F','PARDO','POINT',65,0.59,0.68,0.76,0.87);

-- ELSA Female Negro CCE
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75, p90) VALUES
('ELSA','CCE','F','NEGRO','POINT',40,0.46,0.51,0.57,0.64),
('ELSA','CCE','F','NEGRO','POINT',45,0.49,0.55,0.62,0.70),
('ELSA','CCE','F','NEGRO','POINT',50,0.52,0.59,0.66,0.76),
('ELSA','CCE','F','NEGRO','POINT',55,0.55,0.63,0.70,0.82),
('ELSA','CCE','F','NEGRO','POINT',60,0.58,0.67,0.75,0.88),
('ELSA','CCE','F','NEGRO','POINT',65,0.61,0.70,0.79,0.94);

-- ELSA Female Negro CCD
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75, p90) VALUES
('ELSA','CCD','F','NEGRO','POINT',40,0.46,0.51,0.58,0.64),
('ELSA','CCD','F','NEGRO','POINT',45,0.49,0.55,0.62,0.71),
('ELSA','CCD','F','NEGRO','POINT',50,0.53,0.59,0.67,0.77),
('ELSA','CCD','F','NEGRO','POINT',55,0.56,0.63,0.71,0.83),
('ELSA','CCD','F','NEGRO','POINT',60,0.59,0.67,0.76,0.90),
('ELSA','CCD','F','NEGRO','POINT',65,0.63,0.71,0.80,0.96);

-- CAPS Male (segment NA, ethnicity NA)
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75) VALUES
('CAPS','NA','M','NA','POINT',25,0.515,0.567,0.633),
('CAPS','NA','M','NA','POINT',35,0.585,0.633,0.682),
('CAPS','NA','M','NA','POINT',45,0.634,0.686,0.756),
('CAPS','NA','M','NA','POINT',55,0.680,0.746,0.837),
('CAPS','NA','M','NA','POINT',65,0.745,0.830,0.921),
('CAPS','NA','M','NA','POINT',75,0.814,0.914,1.028),
('CAPS','NA','M','NA','POINT',85,0.830,0.937,1.208);

-- CAPS Female
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_point, p25, p50, p75) VALUES
('CAPS','NA','F','NA','POINT',25,0.524,0.567,0.612),
('CAPS','NA','F','NA','POINT',35,0.575,0.615,0.660),
('CAPS','NA','F','NA','POINT',45,0.619,0.665,0.713),
('CAPS','NA','F','NA','POINT',55,0.665,0.719,0.776),
('CAPS','NA','F','NA','POINT',65,0.718,0.778,0.852),
('CAPS','NA','F','NA','POINT',75,0.771,0.837,0.921),
('CAPS','NA','F','NA','POINT',85,0.807,0.880,0.935);

-- MESA CCD White Male
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCD','M','BRANCO','BAND',45,54,0.52,0.62,0.71),
('MESA','CCD','M','BRANCO','BAND',55,64,0.57,0.68,0.81),
('MESA','CCD','M','BRANCO','BAND',65,74,0.65,0.77,0.92),
('MESA','CCD','M','BRANCO','BAND',75,84,0.72,0.83,0.97);

-- MESA CCD White Female
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCD','F','BRANCO','BAND',45,54,0.51,0.58,0.67),
('MESA','CCD','F','BRANCO','BAND',55,64,0.55,0.65,0.76),
('MESA','CCD','F','BRANCO','BAND',65,74,0.65,0.75,0.87),
('MESA','CCD','F','BRANCO','BAND',75,84,0.72,0.83,0.93);

-- MESA CCD Negro Male
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCD','M','NEGRO','BAND',45,54,0.58,0.67,0.80),
('MESA','CCD','M','NEGRO','BAND',55,64,0.61,0.74,0.92),
('MESA','CCD','M','NEGRO','BAND',65,74,0.71,0.85,0.99),
('MESA','CCD','M','NEGRO','BAND',75,84,0.74,0.85,1.02);

-- MESA CCD Negro Female
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCD','F','NEGRO','BAND',45,54,0.55,0.64,0.74),
('MESA','CCD','F','NEGRO','BAND',55,64,0.60,0.71,0.81),
('MESA','CCD','F','NEGRO','BAND',65,74,0.65,0.76,0.92),
('MESA','CCD','F','NEGRO','BAND',75,84,0.71,0.83,0.96);

-- MESA CCD Chinês Male
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCD','M','CHINES','BAND',45,54,0.54,0.64,0.73),
('MESA','CCD','M','CHINES','BAND',55,64,0.56,0.70,0.83),
('MESA','CCD','M','CHINES','BAND',65,74,0.62,0.73,0.92),
('MESA','CCD','M','CHINES','BAND',75,84,0.66,0.79,0.98);

-- MESA CCD Chinês Female
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCD','F','CHINES','BAND',45,54,0.55,0.60,0.70),
('MESA','CCD','F','CHINES','BAND',55,64,0.54,0.63,0.77),
('MESA','CCD','F','CHINES','BAND',65,74,0.59,0.71,0.84),
('MESA','CCD','F','CHINES','BAND',75,84,0.67,0.77,0.96);

-- MESA CCD Hispânico Male
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCD','M','HISPANICO','BAND',45,54,0.53,0.62,0.73),
('MESA','CCD','M','HISPANICO','BAND',55,64,0.60,0.67,0.82),
('MESA','CCD','M','HISPANICO','BAND',65,74,0.65,0.78,0.90),
('MESA','CCD','M','HISPANICO','BAND',75,84,0.71,0.81,0.92);

-- MESA CCD Hispânico Female
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCD','F','HISPANICO','BAND',45,54,0.51,0.58,0.67),
('MESA','CCD','F','HISPANICO','BAND',55,64,0.57,0.69,0.77),
('MESA','CCD','F','HISPANICO','BAND',65,74,0.65,0.76,0.87),
('MESA','CCD','F','HISPANICO','BAND',75,84,0.63,0.78,0.92);

-- MESA CCE White Male
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCE','M','BRANCO','BAND',45,54,0.54,0.63,0.78),
('MESA','CCE','M','BRANCO','BAND',55,64,0.57,0.69,0.82),
('MESA','CCE','M','BRANCO','BAND',65,74,0.67,0.81,0.95),
('MESA','CCE','M','BRANCO','BAND',75,84,0.71,0.85,1.00);

-- MESA CCE White Female
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCE','F','BRANCO','BAND',45,54,0.50,0.58,0.67),
('MESA','CCE','F','BRANCO','BAND',55,64,0.55,0.64,0.75),
('MESA','CCE','F','BRANCO','BAND',65,74,0.63,0.73,0.85),
('MESA','CCE','F','BRANCO','BAND',75,84,0.70,0.80,0.94);

-- MESA CCE Negro Male
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCE','M','NEGRO','BAND',45,54,0.56,0.69,0.81),
('MESA','CCE','M','NEGRO','BAND',55,64,0.63,0.75,0.92),
('MESA','CCE','M','NEGRO','BAND',65,74,0.69,0.82,0.99),
('MESA','CCE','M','NEGRO','BAND',75,84,0.72,0.85,1.02);

-- MESA CCE Negro Female
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCE','F','NEGRO','BAND',45,54,0.54,0.63,0.73),
('MESA','CCE','F','NEGRO','BAND',55,64,0.59,0.67,0.80),
('MESA','CCE','F','NEGRO','BAND',65,74,0.63,0.76,0.90),
('MESA','CCE','F','NEGRO','BAND',75,84,0.68,0.78,0.91);

-- MESA CCE Chinês Male
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCE','M','CHINES','BAND',45,54,0.55,0.63,0.73),
('MESA','CCE','M','CHINES','BAND',55,64,0.57,0.70,0.84),
('MESA','CCE','M','CHINES','BAND',65,74,0.62,0.72,0.86),
('MESA','CCE','M','CHINES','BAND',75,84,0.69,0.84,0.97);

-- MESA CCE Chinês Female
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCE','F','CHINES','BAND',45,54,0.49,0.58,0.67),
('MESA','CCE','F','CHINES','BAND',55,64,0.52,0.63,0.72),
('MESA','CCE','F','CHINES','BAND',65,74,0.58,0.71,0.87),
('MESA','CCE','F','CHINES','BAND',75,84,0.64,0.76,0.94);

-- MESA CCE Hispânico Male
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCE','M','HISPANICO','BAND',45,54,0.55,0.64,0.75),
('MESA','CCE','M','HISPANICO','BAND',55,64,0.61,0.72,0.85),
('MESA','CCE','M','HISPANICO','BAND',65,74,0.68,0.80,0.98),
('MESA','CCE','M','HISPANICO','BAND',75,84,0.72,0.86,0.97);

-- MESA CCE Hispânico Female
INSERT INTO public.cimt_norms (source, segment, sex, ethnicity, age_type, age_band_min, age_band_max, p25, p50, p75) VALUES
('MESA','CCE','F','HISPANICO','BAND',45,54,0.51,0.58,0.68),
('MESA','CCE','F','HISPANICO','BAND',55,64,0.58,0.68,0.79),
('MESA','CCE','F','HISPANICO','BAND',65,74,0.62,0.72,0.86),
('MESA','CCE','F','HISPANICO','BAND',75,84,0.68,0.77,0.91);
