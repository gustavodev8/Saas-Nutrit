-- Preserve nutritional values per 100 g when saving and reusing meal presets.
ALTER TABLE meal_preset_foods
  ADD COLUMN IF NOT EXISTS kcal_per_100g NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS protein_per_100g NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS carbs_per_100g NUMERIC(8, 3),
  ADD COLUMN IF NOT EXISTS fat_per_100g NUMERIC(8, 3);
