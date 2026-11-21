-- Allow authenticated workspace users to browse the food database (read-only)
-- master_foods contains 7,236 items (TACO + custom); no PII
GRANT SELECT ON master_foods TO authenticated;
