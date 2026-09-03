-- Rastreabilidade do modelo antropométrico de quatro componentes.
-- Resultados são derivados na aplicação e não devem ser persistidos como diagnóstico.
ALTER TABLE public.measurements
  ADD COLUMN IF NOT EXISTS biestyloid_diameter_mm numeric,
  ADD COLUMN IF NOT EXISTS biepicondylar_femur_diameter_mm numeric,
  ADD COLUMN IF NOT EXISTS four_component_reference text;

ALTER TABLE public.measurements
  DROP CONSTRAINT IF EXISTS measurements_four_component_reference_check;

ALTER TABLE public.measurements
  DROP CONSTRAINT IF EXISTS measurements_biestyloid_diameter_mm_check,
  DROP CONSTRAINT IF EXISTS measurements_biepicondylar_femur_diameter_mm_check;

ALTER TABLE public.measurements
  ADD CONSTRAINT measurements_four_component_reference_check
  CHECK (four_component_reference IS NULL OR four_component_reference IN ('M', 'F'));

ALTER TABLE public.measurements
  ADD CONSTRAINT measurements_biestyloid_diameter_mm_check
  CHECK (biestyloid_diameter_mm IS NULL OR biestyloid_diameter_mm BETWEEN 30 AND 100),
  ADD CONSTRAINT measurements_biepicondylar_femur_diameter_mm_check
  CHECK (biepicondylar_femur_diameter_mm IS NULL OR biepicondylar_femur_diameter_mm BETWEEN 50 AND 150);

COMMENT ON COLUMN public.measurements.biestyloid_diameter_mm IS
  'Diâmetro biestiloide em mm, aferido com paquímetro para estimativa antropométrica de quatro componentes.';
COMMENT ON COLUMN public.measurements.biepicondylar_femur_diameter_mm IS
  'Diâmetro biepicondiliano do fêmur em mm, aferido com paquímetro para estimativa antropométrica de quatro componentes.';
COMMENT ON COLUMN public.measurements.four_component_reference IS
  'Referência M/F selecionada explicitamente para a massa residual de Würch (1974).';
