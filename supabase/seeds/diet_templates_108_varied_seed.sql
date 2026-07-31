-- Seed gerado automaticamente para modelos variados de dieta.
-- Baseado exclusivamente em alimentos presentes em master_foods.
-- Total de templates: 108

BEGIN;

DELETE FROM diet_templates WHERE name LIKE 'Biblioteca Dieta - %';

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1307 kcal - M001',
  'Emagrecimento com distribuicao diaria proxima de 1300 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 91g de proteina, 113.2g de carboidratos e 55.1g de gorduras.',
  'emagrecimento',
  1307, 91, 113.2, 55.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1307 kcal - M001' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1307 kcal - M001' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 90, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1307 kcal - M001' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 80, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1307 kcal - M001' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 80, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 100, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 50, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 60, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 70, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1307 kcal - M001' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Melão', 100, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1307 kcal - M001' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 90, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Inhame cozido', 50, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1350 kcal - M002',
  'Emagrecimento com distribuicao diaria proxima de 1318 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 107.7g de proteina, 141g de carboidratos e 41.4g de gorduras.',
  'emagrecimento',
  1349.8, 107.7, 141, 41.4, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1350 kcal - M002' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1350 kcal - M002' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 25, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 100, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1350 kcal - M002' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 180, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Pera', 80, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1350 kcal - M002' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 90, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 110, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 60, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 70, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1350 kcal - M002' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Abacaxi', 120, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 160, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1350 kcal - M002' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 100, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 60, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1364 kcal - M003',
  'Emagrecimento com distribuicao diaria proxima de 1336 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 105.7g de proteina, 134.3g de carboidratos e 46.3g de gorduras.',
  'emagrecimento',
  1363.9, 105.7, 134.3, 46.3, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1364 kcal - M003' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1364 kcal - M003' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 45, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Morango', 120, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1364 kcal - M003' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 80, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1364 kcal - M003' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 100, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 120, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 70, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 60, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 70, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1364 kcal - M003' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pera', 130, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 25, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1364 kcal - M003' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 120, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 70, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1373 kcal - M004',
  'Emagrecimento com distribuicao diaria proxima de 1354 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 114.3g de proteina, 121.4g de carboidratos e 48.7g de gorduras.',
  'emagrecimento',
  1372.9, 114.3, 121.4, 48.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1373 kcal - M004' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1373 kcal - M004' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 65, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Clara de ovo cozida', 120, 'g', NULL, NULL, 51, 10.8, 0.8, 0.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 130, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1373 kcal - M004' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 80, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1373 kcal - M004' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 80, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 130, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 50, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 60, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 70, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1373 kcal - M004' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mamão', 100, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1373 kcal - M004' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 130, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 65, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1401 kcal - M005',
  'Emagrecimento com distribuicao diaria proxima de 1372 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 78g de proteina, 150.1g de carboidratos e 56.2g de gorduras.',
  'emagrecimento',
  1401.4, 78, 150.1, 56.2, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1401 kcal - M005' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1401 kcal - M005' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 90, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1401 kcal - M005' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 180, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Morango', 80, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1401 kcal - M005' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 120, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 100, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 60, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 70, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1401 kcal - M005' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Maçã', 120, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 160, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1401 kcal - M005' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 90, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 50, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1421 kcal - M006',
  'Emagrecimento com distribuicao diaria proxima de 1390 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 150.9g de proteina, 132.2g de carboidratos e 31.9g de gorduras.',
  'emagrecimento',
  1421.1, 150.9, 132.2, 31.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1421 kcal - M006' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1421 kcal - M006' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 55, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Pera', 100, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1421 kcal - M006' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 80, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1421 kcal - M006' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 65, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 110, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 70, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 60, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 70, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1421 kcal - M006' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Morango', 130, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 25, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1421 kcal - M006' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 100, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Inhame cozido', 60, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1434 kcal - M007',
  'Emagrecimento com distribuicao diaria proxima de 1408 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 101.1g de proteina, 111.6g de carboidratos e 65.2g de gorduras.',
  'emagrecimento',
  1434, 101.1, 111.6, 65.2, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1434 kcal - M007' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1434 kcal - M007' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 45, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 120, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1434 kcal - M007' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 80, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1434 kcal - M007' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 60, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 120, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 50, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 60, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 70, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1434 kcal - M007' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Melão', 100, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1434 kcal - M007' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 120, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 55, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1397 kcal - M008',
  'Emagrecimento com distribuicao diaria proxima de 1426 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 74.3g de proteina, 165.7g de carboidratos e 52.2g de gorduras.',
  'emagrecimento',
  1396.6, 74.3, 165.7, 52.2, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1397 kcal - M008' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1397 kcal - M008' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 80, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Clara de ovo cozida', 135, 'g', NULL, NULL, 51, 10.8, 0.8, 0.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 130, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1397 kcal - M008' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 180, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Pera', 80, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1397 kcal - M008' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 100, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 130, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 60, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 70, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1397 kcal - M008' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Abacaxi', 120, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 160, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1397 kcal - M008' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 145, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 80, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1433 kcal - M009',
  'Emagrecimento com distribuicao diaria proxima de 1444 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 130g de proteina, 138.2g de carboidratos e 38.9g de gorduras.',
  'emagrecimento',
  1432.7, 130, 138.2, 38.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1433 kcal - M009' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1433 kcal - M009' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Morango', 90, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1433 kcal - M009' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 80, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1433 kcal - M009' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 110, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 115, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 70, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 60, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 70, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1433 kcal - M009' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pera', 130, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1433 kcal - M009' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 90, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 50, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1476 kcal - M010',
  'Emagrecimento com distribuicao diaria proxima de 1462 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 128.6g de proteina, 136.5g de carboidratos e 46.9g de gorduras.',
  'emagrecimento',
  1475.9, 128.6, 136.5, 46.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1476 kcal - M010' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1476 kcal - M010' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 40, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 100, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1476 kcal - M010' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 80, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1476 kcal - M010' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 120, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 110, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 50, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 60, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 70, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1476 kcal - M010' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mamão', 100, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1476 kcal - M010' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 100, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 30, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1495 kcal - M011',
  'Emagrecimento com distribuicao diaria proxima de 1480 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 105.5g de proteina, 137g de carboidratos e 61g de gorduras.',
  'emagrecimento',
  1495.4, 105.5, 137, 61, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1495 kcal - M011' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1495 kcal - M011' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 120, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1495 kcal - M011' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 180, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Morango', 80, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1495 kcal - M011' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 80, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 120, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 60, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 70, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1495 kcal - M011' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Maçã', 120, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 160, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1495 kcal - M011' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 120, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Inhame cozido', 55, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1488 kcal - M012',
  'Emagrecimento com distribuicao diaria proxima de 1498 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 131.9g de proteina, 126.9g de carboidratos e 49g de gorduras.',
  'emagrecimento',
  1487.5, 131.9, 126.9, 49, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1488 kcal - M012' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1488 kcal - M012' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 80, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Clara de ovo cozida', 120, 'g', NULL, NULL, 51, 10.8, 0.8, 0.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Pera', 130, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1488 kcal - M012' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 80, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1488 kcal - M012' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 90, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 145, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 70, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 60, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 70, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1488 kcal - M012' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Morango', 130, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1488 kcal - M012' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 130, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 80, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1484 kcal - M013',
  'Emagrecimento com distribuicao diaria proxima de 1516 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 86.3g de proteina, 142g de carboidratos e 65.7g de gorduras.',
  'emagrecimento',
  1484.3, 86.3, 142, 65.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1484 kcal - M013' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1484 kcal - M013' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 90, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1484 kcal - M013' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 145, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 80, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1484 kcal - M013' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 100, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 145, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 50, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 60, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 70, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1484 kcal - M013' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Melão', 100, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 135, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1484 kcal - M013' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 135, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 50, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1540 kcal - M014',
  'Emagrecimento com distribuicao diaria proxima de 1534 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 124.3g de proteina, 177.6g de carboidratos e 39.2g de gorduras.',
  'emagrecimento',
  1539.8, 124.3, 177.6, 39.2, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1540 kcal - M014' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1540 kcal - M014' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 55, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 100, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1540 kcal - M014' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 180, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Pera', 80, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1540 kcal - M014' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 110, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 110, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 60, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 70, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1540 kcal - M014' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Abacaxi', 120, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 160, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1540 kcal - M014' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 100, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 60, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1562 kcal - M015',
  'Emagrecimento com distribuicao diaria proxima de 1552 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 131.6g de proteina, 133.6g de carboidratos e 55.9g de gorduras.',
  'emagrecimento',
  1561.9, 131.6, 133.6, 55.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1562 kcal - M015' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1562 kcal - M015' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 45, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Morango', 120, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1562 kcal - M015' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 80, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1562 kcal - M015' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 120, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 120, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 70, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 60, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 70, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1562 kcal - M015' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pera', 130, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 25, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1562 kcal - M015' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 120, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 70, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1536 kcal - M016',
  'Emagrecimento com distribuicao diaria proxima de 1570 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 115.7g de proteina, 131.2g de carboidratos e 62.1g de gorduras.',
  'emagrecimento',
  1536.4, 115.7, 131.2, 62.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1536 kcal - M016' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1536 kcal - M016' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 80, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Clara de ovo cozida', 120, 'g', NULL, NULL, 51, 10.8, 0.8, 0.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 130, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1536 kcal - M016' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 80, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1536 kcal - M016' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 80, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 130, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 50, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 60, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 70, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1536 kcal - M016' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mamão', 100, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1536 kcal - M016' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 130, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Inhame cozido', 80, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1574 kcal - M017',
  'Emagrecimento com distribuicao diaria proxima de 1588 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 97g de proteina, 143.6g de carboidratos e 69.8g de gorduras.',
  'emagrecimento',
  1574.3, 97, 143.6, 69.8, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1574 kcal - M017' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1574 kcal - M017' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 90, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1574 kcal - M017' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 180, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Morango', 80, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1574 kcal - M017' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 90, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 205, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 60, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 70, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1574 kcal - M017' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Maçã', 120, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 160, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1574 kcal - M017' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 195, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 50, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1619 kcal - M018',
  'Emagrecimento com distribuicao diaria proxima de 1606 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 176.9g de proteina, 153.6g de carboidratos e 32.1g de gorduras.',
  'emagrecimento',
  1618.7, 176.9, 153.6, 32.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1619 kcal - M018' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1619 kcal - M018' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 55, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 50, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Pera', 100, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1619 kcal - M018' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Whey', 45, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 80, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1619 kcal - M018' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 100, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 125, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 70, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 60, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 70, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1619 kcal - M018' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Morango', 130, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 55, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1619 kcal - M018' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 115, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 60, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1598 kcal - M019',
  'Emagrecimento com distribuicao diaria proxima de 1624 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 121.2g de proteina, 138.4g de carboidratos e 63.2g de gorduras.',
  'emagrecimento',
  1597.9, 121.2, 138.4, 63.2, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1598 kcal - M019' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1598 kcal - M019' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 120, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1598 kcal - M019' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 80, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1598 kcal - M019' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 110, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 120, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 50, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 60, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 70, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1598 kcal - M019' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Melão', 100, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1598 kcal - M019' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 120, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 70, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1622 kcal - M020',
  'Emagrecimento com distribuicao diaria proxima de 1642 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 107.3g de proteina, 162.3g de carboidratos e 62.6g de gorduras.',
  'emagrecimento',
  1622.2, 107.3, 162.3, 62.6, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1622 kcal - M020' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1622 kcal - M020' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 80, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Clara de ovo cozida', 135, 'g', NULL, NULL, 51, 10.8, 0.8, 0.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 130, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1622 kcal - M020' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 180, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Pera', 80, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1622 kcal - M020' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 120, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 145, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 60, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 70, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1622 kcal - M020' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Abacaxi', 120, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 160, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1622 kcal - M020' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 160, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 80, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1659 kcal - M021',
  'Emagrecimento com distribuicao diaria proxima de 1660 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 169.3g de proteina, 129.6g de carboidratos e 49.3g de gorduras.',
  'emagrecimento',
  1658.7, 169.3, 129.6, 49.3, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1659 kcal - M021' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1659 kcal - M021' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Morango', 90, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1659 kcal - M021' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Whey', 60, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 80, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1659 kcal - M021' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 80, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 130, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 70, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 60, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 70, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1659 kcal - M021' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pera', 130, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 55, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1659 kcal - M021' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 120, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Inhame cozido', 50, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1671 kcal - M022',
  'Emagrecimento com distribuicao diaria proxima de 1678 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 143.1g de proteina, 151.8g de carboidratos e 54.6g de gorduras.',
  'emagrecimento',
  1670.9, 143.1, 151.8, 54.6, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1671 kcal - M022' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1671 kcal - M022' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 55, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 50, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 100, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1671 kcal - M022' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 80, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1671 kcal - M022' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 90, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 125, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 50, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 60, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 70, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1671 kcal - M022' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mamão', 100, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 105, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1671 kcal - M022' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 115, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 60, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1667 kcal - M023',
  'Emagrecimento com distribuicao diaria proxima de 1696 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 100.7g de proteina, 160.4g de carboidratos e 73.1g de gorduras.',
  'emagrecimento',
  1666.5, 100.7, 160.4, 73.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1667 kcal - M023' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1667 kcal - M023' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 160, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 120, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1667 kcal - M023' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 180, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Morango', 80, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1667 kcal - M023' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 100, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 180, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 60, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 70, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1667 kcal - M023' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Maçã', 120, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 160, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1667 kcal - M023' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 180, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 70, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1689 kcal - M024',
  'Emagrecimento com distribuicao diaria proxima de 1714 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 186.2g de proteina, 134.6g de carboidratos e 43.1g de gorduras.',
  'emagrecimento',
  1688.7, 186.2, 134.6, 43.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1689 kcal - M024' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1689 kcal - M024' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 80, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Clara de ovo cozida', 150, 'g', NULL, NULL, 51, 10.8, 0.8, 0.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Pera', 130, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1689 kcal - M024' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Whey', 60, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 80, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1689 kcal - M024' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 110, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 160, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 70, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 60, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 70, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1689 kcal - M024' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Morango', 130, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1689 kcal - M024' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 160, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 80, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1718 kcal - M025',
  'Emagrecimento com distribuicao diaria proxima de 1732 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 120.5g de proteina, 139.8g de carboidratos e 75.7g de gorduras.',
  'emagrecimento',
  1717.7, 120.5, 139.8, 75.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1718 kcal - M025' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1718 kcal - M025' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 90, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1718 kcal - M025' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 145, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 80, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1718 kcal - M025' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 120, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 160, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 50, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 60, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 70, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1718 kcal - M025' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Melão', 100, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 135, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1718 kcal - M025' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 135, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 50, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1740 kcal - M026',
  'Emagrecimento com distribuicao diaria proxima de 1750 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 160g de proteina, 168.5g de carboidratos e 48.9g de gorduras.',
  'emagrecimento',
  1740.4, 160, 168.5, 48.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1740 kcal - M026' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1740 kcal - M026' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 55, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 65, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 100, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1740 kcal - M026' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 180, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Pera', 80, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1740 kcal - M026' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 80, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 125, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 60, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 70, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1740 kcal - M026' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Abacaxi', 120, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 160, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1740 kcal - M026' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 130, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Inhame cozido', 60, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1735 kcal - M027',
  'Emagrecimento com distribuicao diaria proxima de 1768 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 156.7g de proteina, 134.7g de carboidratos e 61.8g de gorduras.',
  'emagrecimento',
  1735.3, 156.7, 134.7, 61.8, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1735 kcal - M027' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1735 kcal - M027' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 115, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Morango', 120, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1735 kcal - M027' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Whey', 45, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 80, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1735 kcal - M027' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 90, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 150, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 70, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 60, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 70, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1735 kcal - M027' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pera', 130, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1735 kcal - M027' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 135, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 70, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1756 kcal - M028',
  'Emagrecimento com distribuicao diaria proxima de 1786 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 120.7g de proteina, 151.3g de carboidratos e 76.1g de gorduras.',
  'emagrecimento',
  1756, 120.7, 151.3, 76.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1756 kcal - M028' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1756 kcal - M028' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 80, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Clara de ovo cozida', 180, 'g', NULL, NULL, 51, 10.8, 0.8, 0.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 130, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1756 kcal - M028' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 160, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 80, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1756 kcal - M028' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 100, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 190, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 50, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 60, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 70, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1756 kcal - M028' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mamão', 100, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 165, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1756 kcal - M028' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 205, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 80, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1791 kcal - M029',
  'Emagrecimento com distribuicao diaria proxima de 1804 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 160.2g de proteina, 154g de carboidratos e 62.9g de gorduras.',
  'emagrecimento',
  1791.3, 160.2, 154, 62.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1791 kcal - M029' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1791 kcal - M029' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 90, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1791 kcal - M029' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 180, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Morango', 80, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1791 kcal - M029' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 110, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 295, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 60, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 70, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1791 kcal - M029' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Maçã', 120, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 160, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1791 kcal - M029' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 285, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 50, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1794 kcal - M030',
  'Emagrecimento com distribuicao diaria proxima de 1822 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 203.1g de proteina, 151.3g de carboidratos e 39.5g de gorduras.',
  'emagrecimento',
  1793.6, 203.1, 151.3, 39.5, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1794 kcal - M030' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1794 kcal - M030' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 55, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 65, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Pera', 100, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1794 kcal - M030' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Whey', 45, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 80, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1794 kcal - M030' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 120, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 125, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 70, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 60, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 70, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1794 kcal - M030' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Morango', 130, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1794 kcal - M030' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 115, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 60, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1815 kcal - M031',
  'Emagrecimento com distribuicao diaria proxima de 1840 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 141.6g de proteina, 131.6g de carboidratos e 81.2g de gorduras.',
  'emagrecimento',
  1815.1, 141.6, 131.6, 81.2, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1815 kcal - M031' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1815 kcal - M031' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 115, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 120, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1815 kcal - M031' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 130, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 80, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1815 kcal - M031' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 80, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 150, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 50, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 60, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 70, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1815 kcal - M031' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Melão', 100, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1815 kcal - M031' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 135, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Inhame cozido', 70, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1825 kcal - M032',
  'Emagrecimento com distribuicao diaria proxima de 1858 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 128.4g de proteina, 156.9g de carboidratos e 76.4g de gorduras.',
  'emagrecimento',
  1825.2, 128.4, 156.9, 76.4, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1825 kcal - M032' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1825 kcal - M032' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 80, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Clara de ovo cozida', 210, 'g', NULL, NULL, 51, 10.8, 0.8, 0.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 130, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1825 kcal - M032' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 180, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Pera', 80, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1825 kcal - M032' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 90, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 220, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 60, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 70, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1825 kcal - M032' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Abacaxi', 120, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 160, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1825 kcal - M032' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 235, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 80, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1890 kcal - M033',
  'Emagrecimento com distribuicao diaria proxima de 1876 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 211g de proteina, 148.3g de carboidratos e 47g de gorduras.',
  'emagrecimento',
  1890, 211, 148.3, 47, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1890 kcal - M033' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1890 kcal - M033' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Morango', 90, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1890 kcal - M033' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Whey', 105, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 80, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1890 kcal - M033' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 100, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 175, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 70, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 60, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 70, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1890 kcal - M033' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pera', 130, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 100, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1890 kcal - M033' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Soja, queijo (tofu)', 165, 'g', NULL, NULL, 64, 6.6, 2.1, 4, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 50, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1880 kcal - M034',
  'Emagrecimento com distribuicao diaria proxima de 1894 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 191.8g de proteina, 161.9g de carboidratos e 51.6g de gorduras.',
  'emagrecimento',
  1880.3, 191.8, 161.9, 51.6, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1880 kcal - M034' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1880 kcal - M034' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 55, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 65, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 100, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1880 kcal - M034' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 130, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 80, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1880 kcal - M034' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 110, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 140, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 50, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 60, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 70, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1880 kcal - M034' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mamão', 100, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1880 kcal - M034' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 145, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 60, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1880 kcal - M035',
  'Emagrecimento com distribuicao diaria proxima de 1912 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 133.8g de proteina, 156.3g de carboidratos e 82.1g de gorduras.',
  'emagrecimento',
  1880.4, 133.8, 156.3, 82.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1880 kcal - M035' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1880 kcal - M035' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 160, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 120, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1880 kcal - M035' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 180, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Morango', 80, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1880 kcal - M035' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 120, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 165, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 60, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 70, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1880 kcal - M035' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Maçã', 120, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte integral natural', 160, 'g', NULL, NULL, 61, 3.5, 4.7, 3.3, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1880 kcal - M035' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 180, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 70, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Emagrecimento 1932 kcal - M036',
  'Emagrecimento com distribuicao diaria proxima de 1930 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 223.5g de proteina, 127.5g de carboidratos e 55.2g de gorduras.',
  'emagrecimento',
  1931.6, 223.5, 127.5, 55.2, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Emagrecimento 1932 kcal - M036' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1932 kcal - M036' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 80, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Clara de ovo cozida', 150, 'g', NULL, NULL, 51, 10.8, 0.8, 0.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Pera', 130, 'g', NULL, NULL, 53, 0.4, 14, 0.2, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1932 kcal - M036' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Whey', 75, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 80, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1932 kcal - M036' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 80, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 175, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 70, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 60, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 70, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 6, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1932 kcal - M036' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Morango', 130, 'g', NULL, NULL, 30, 0.8, 7.1, 0.3, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 70, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Emagrecimento 1932 kcal - M036' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 160, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Inhame cozido', 80, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 4)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2229 kcal - M037',
  'Hipertrofia com distribuicao diaria proxima de 2200 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 188.3g de proteina, 223.8g de carboidratos e 65.6g de gorduras.',
  'hipertrofia',
  2228.8, 188.3, 223.8, 65.6, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2229 kcal - M037' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2229 kcal - M037' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 110, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2229 kcal - M037' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 20, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 50, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2229 kcal - M037' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 75, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 130, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 70, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2229 kcal - M037' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2229 kcal - M037' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 90, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 130, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2229 kcal - M037' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Melancia', 65, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2255 kcal - M038',
  'Hipertrofia com distribuicao diaria proxima de 2225 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 170.8g de proteina, 231.5g de carboidratos e 69g de gorduras.',
  'hipertrofia',
  2254.9, 170.8, 231.5, 69, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2255 kcal - M038' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2255 kcal - M038' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 25, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 130, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2255 kcal - M038' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 30, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 100, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 50, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2255 kcal - M038' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 95, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 150, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2255 kcal - M038' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2255 kcal - M038' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 95, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 150, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 60, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2255 kcal - M038' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Banana prata', 40, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2277 kcal - M039',
  'Hipertrofia com distribuicao diaria proxima de 2250 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 206.7g de proteina, 224.1g de carboidratos e 62.9g de gorduras.',
  'hipertrofia',
  2277.1, 206.7, 224.1, 62.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2277 kcal - M039' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2277 kcal - M039' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 35, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 140, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2277 kcal - M039' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 25, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2277 kcal - M039' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 85, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 160, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 90, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2277 kcal - M039' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2277 kcal - M039' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 90, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 170, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 60, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2277 kcal - M039' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mamão', 20, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2296 kcal - M040',
  'Hipertrofia com distribuicao diaria proxima de 2275 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 194.9g de proteina, 223.7g de carboidratos e 66.4g de gorduras.',
  'hipertrofia',
  2296.1, 194.9, 223.7, 66.4, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M040' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M040' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 45, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 150, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M040' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 20, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 170, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melancia', 20, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M040' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 120, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 180, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 70, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M040' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M040' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 95, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 130, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M040' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 20, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2296 kcal - M041',
  'Hipertrofia com distribuicao diaria proxima de 2300 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 184.2g de proteina, 249.6g de carboidratos e 62.1g de gorduras.',
  'hipertrofia',
  2295.6, 184.2, 249.6, 62.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M041' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M041' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 110, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M041' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 20, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 50, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M041' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 170, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 130, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M041' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M041' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 75, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 150, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 60, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2296 kcal - M041' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 65, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2327 kcal - M042',
  'Hipertrofia com distribuicao diaria proxima de 2325 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 190.2g de proteina, 206.2g de carboidratos e 80.3g de gorduras.',
  'hipertrofia',
  2326.6, 190.2, 206.2, 80.3, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2327 kcal - M042' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2327 kcal - M042' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melancia', 130, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2327 kcal - M042' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 20, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 100, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 25, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2327 kcal - M042' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 105, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 150, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 90, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2327 kcal - M042' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2327 kcal - M042' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 95, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 170, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 60, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2327 kcal - M042' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Maçã', 40, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2383 kcal - M043',
  'Hipertrofia com distribuicao diaria proxima de 2350 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 180.9g de proteina, 277.4g de carboidratos e 62.1g de gorduras.',
  'hipertrofia',
  2383.3, 180.9, 277.4, 62.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2383 kcal - M043' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2383 kcal - M043' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 40, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 140, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2383 kcal - M043' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 25, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 75, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2383 kcal - M043' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 75, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 160, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 70, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2383 kcal - M043' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2383 kcal - M043' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 120, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 130, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2383 kcal - M043' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Melancia', 65, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2358 kcal - M044',
  'Hipertrofia com distribuicao diaria proxima de 2375 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 193.9g de proteina, 233.2g de carboidratos e 71.8g de gorduras.',
  'hipertrofia',
  2358.5, 193.9, 233.2, 71.8, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2358 kcal - M044' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2358 kcal - M044' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 35, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 150, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2358 kcal - M044' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 170, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 50, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2358 kcal - M044' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 95, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 180, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2358 kcal - M044' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2358 kcal - M044' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 125, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 150, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 60, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2358 kcal - M044' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Banana prata', 65, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2435 kcal - M045',
  'Hipertrofia com distribuicao diaria proxima de 2400 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 206.6g de proteina, 267.6g de carboidratos e 59.1g de gorduras.',
  'hipertrofia',
  2434.6, 206.6, 267.6, 59.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2435 kcal - M045' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2435 kcal - M045' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 75, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 110, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2435 kcal - M045' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 35, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 75, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2435 kcal - M045' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 130, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 130, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 90, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2435 kcal - M045' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2435 kcal - M045' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 90, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 170, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 60, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2435 kcal - M045' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mamão', 90, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2416 kcal - M046',
  'Hipertrofia com distribuicao diaria proxima de 2425 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 177.6g de proteina, 263.3g de carboidratos e 72.6g de gorduras.',
  'hipertrofia',
  2415.8, 177.6, 263.3, 72.6, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2416 kcal - M046' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2416 kcal - M046' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 130, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2416 kcal - M046' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 45, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 100, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melancia', 75, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2416 kcal - M046' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 165, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 150, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 70, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2416 kcal - M046' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2416 kcal - M046' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 110, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 130, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2416 kcal - M046' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 90, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2478 kcal - M047',
  'Hipertrofia com distribuicao diaria proxima de 2450 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 201.8g de proteina, 260.4g de carboidratos e 70.2g de gorduras.',
  'hipertrofia',
  2478, 201.8, 260.4, 70.2, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2478 kcal - M047' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2478 kcal - M047' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 140, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2478 kcal - M047' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 25, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 75, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2478 kcal - M047' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 170, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 160, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2478 kcal - M047' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2478 kcal - M047' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 105, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 150, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 60, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2478 kcal - M047' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 65, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2468 kcal - M048',
  'Hipertrofia com distribuicao diaria proxima de 2475 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 185.8g de proteina, 254.5g de carboidratos e 75.3g de gorduras.',
  'hipertrofia',
  2468.3, 185.8, 254.5, 75.3, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2468 kcal - M048' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2468 kcal - M048' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 25, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melancia', 150, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2468 kcal - M048' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 170, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 75, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2468 kcal - M048' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 120, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 180, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 90, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2468 kcal - M048' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2468 kcal - M048' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 140, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 170, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 60, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2468 kcal - M048' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Maçã', 65, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2509 kcal - M049',
  'Hipertrofia com distribuicao diaria proxima de 2500 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 199.8g de proteina, 291.1g de carboidratos e 63.1g de gorduras.',
  'hipertrofia',
  2508.5, 199.8, 291.1, 63.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2509 kcal - M049' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2509 kcal - M049' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 65, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 110, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2509 kcal - M049' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 100, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2509 kcal - M049' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 105, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 130, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 70, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2509 kcal - M049' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2509 kcal - M049' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 120, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 130, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2509 kcal - M049' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Melancia', 90, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2538 kcal - M050',
  'Hipertrofia com distribuicao diaria proxima de 2525 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 193.5g de proteina, 289.5g de carboidratos e 65.7g de gorduras.',
  'hipertrofia',
  2537.9, 193.5, 289.5, 65.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2538 kcal - M050' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2538 kcal - M050' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 90, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 130, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2538 kcal - M050' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 45, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 100, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2538 kcal - M050' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 125, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 150, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2538 kcal - M050' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2538 kcal - M050' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 140, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 150, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 60, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2538 kcal - M050' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Banana prata', 90, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2580 kcal - M051',
  'Hipertrofia com distribuicao diaria proxima de 2550 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 199.5g de proteina, 292.9g de carboidratos e 69.5g de gorduras.',
  'hipertrofia',
  2580.2, 199.5, 292.9, 69.5, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2580 kcal - M051' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2580 kcal - M051' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 50, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 140, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2580 kcal - M051' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 55, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 100, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2580 kcal - M051' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 130, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 160, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 90, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2580 kcal - M051' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2580 kcal - M051' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 135, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 170, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 60, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2580 kcal - M051' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mamão', 65, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2599 kcal - M052',
  'Hipertrofia com distribuicao diaria proxima de 2575 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 195.6g de proteina, 268.8g de carboidratos e 81.7g de gorduras.',
  'hipertrofia',
  2598.8, 195.6, 268.8, 81.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2599 kcal - M052' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2599 kcal - M052' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 150, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2599 kcal - M052' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 65, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 170, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melancia', 75, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2599 kcal - M052' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 165, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 180, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 70, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2599 kcal - M052' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2599 kcal - M052' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 155, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 130, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2599 kcal - M052' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 65, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2592 kcal - M053',
  'Hipertrofia com distribuicao diaria proxima de 2600 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 187.8g de proteina, 322.7g de carboidratos e 60.1g de gorduras.',
  'hipertrofia',
  2592.1, 187.8, 322.7, 60.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2592 kcal - M053' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2592 kcal - M053' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 55, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 110, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2592 kcal - M053' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 100, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2592 kcal - M053' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 185, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 130, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2592 kcal - M053' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2592 kcal - M053' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 120, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 150, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 60, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2592 kcal - M053' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 90, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2649 kcal - M054',
  'Hipertrofia com distribuicao diaria proxima de 2625 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 203.6g de proteina, 284.3g de carboidratos e 77g de gorduras.',
  'hipertrofia',
  2649.4, 203.6, 284.3, 77, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2649 kcal - M054' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2649 kcal - M054' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 65, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melancia', 130, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2649 kcal - M054' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 45, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 100, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 100, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2649 kcal - M054' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 135, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 150, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 90, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2649 kcal - M054' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2649 kcal - M054' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 125, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 170, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 60, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2649 kcal - M054' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Maçã', 90, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2684 kcal - M055',
  'Hipertrofia com distribuicao diaria proxima de 2650 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 206.9g de proteina, 331.5g de carboidratos e 60.3g de gorduras.',
  'hipertrofia',
  2683.5, 206.9, 331.5, 60.3, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2684 kcal - M055' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2684 kcal - M055' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 75, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 140, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2684 kcal - M055' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 55, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 100, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2684 kcal - M055' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 105, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 160, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 70, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2684 kcal - M055' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2684 kcal - M055' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 135, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 130, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2684 kcal - M055' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Melancia', 90, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2667 kcal - M056',
  'Hipertrofia com distribuicao diaria proxima de 2675 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 192.4g de proteina, 300.2g de carboidratos e 78.1g de gorduras.',
  'hipertrofia',
  2666.9, 192.4, 300.2, 78.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2667 kcal - M056' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2667 kcal - M056' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 50, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 150, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2667 kcal - M056' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 65, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 170, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2667 kcal - M056' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 125, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 180, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2667 kcal - M056' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2667 kcal - M056' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 155, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 150, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 60, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2667 kcal - M056' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Banana prata', 90, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2713 kcal - M057',
  'Hipertrofia com distribuicao diaria proxima de 2700 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 208.1g de proteina, 302.9g de carboidratos e 75.3g de gorduras.',
  'hipertrofia',
  2713.1, 208.1, 302.9, 75.3, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2713 kcal - M057' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2713 kcal - M057' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 60, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 110, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2713 kcal - M057' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 50, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 100, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2713 kcal - M057' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 145, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 130, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 90, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2713 kcal - M057' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2713 kcal - M057' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 120, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 170, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 60, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2713 kcal - M057' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mamão', 90, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2754 kcal - M058',
  'Hipertrofia com distribuicao diaria proxima de 2725 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 174.7g de proteina, 339.1g de carboidratos e 76.7g de gorduras.',
  'hipertrofia',
  2753.6, 174.7, 339.1, 76.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2754 kcal - M058' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2754 kcal - M058' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 70, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 130, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2754 kcal - M058' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 60, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 100, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melancia', 100, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2754 kcal - M058' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 180, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 150, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 70, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2754 kcal - M058' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2754 kcal - M058' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 125, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 130, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2754 kcal - M058' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 90, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2776 kcal - M059',
  'Hipertrofia com distribuicao diaria proxima de 2750 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 214.3g de proteina, 332.4g de carboidratos e 67.1g de gorduras.',
  'hipertrofia',
  2776.2, 214.3, 332.4, 67.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2776 kcal - M059' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2776 kcal - M059' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 65, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 140, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2776 kcal - M059' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 55, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 100, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2776 kcal - M059' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 200, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 160, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2776 kcal - M059' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2776 kcal - M059' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 135, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 150, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 60, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2776 kcal - M059' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 90, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2798 kcal - M060',
  'Hipertrofia com distribuicao diaria proxima de 2775 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 211.8g de proteina, 317.5g de carboidratos e 72.7g de gorduras.',
  'hipertrofia',
  2798.4, 211.8, 317.5, 72.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2798 kcal - M060' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2798 kcal - M060' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 75, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melancia', 150, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2798 kcal - M060' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 65, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 170, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 100, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2798 kcal - M060' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 150, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 180, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 90, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2798 kcal - M060' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2798 kcal - M060' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 170, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 170, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 60, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2798 kcal - M060' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Maçã', 90, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2790 kcal - M061',
  'Hipertrofia com distribuicao diaria proxima de 2800 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 194.9g de proteina, 323g de carboidratos e 83g de gorduras.',
  'hipertrofia',
  2790.4, 194.9, 323, 83, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2790 kcal - M061' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2790 kcal - M061' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 65, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 110, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2790 kcal - M061' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 50, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 100, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2790 kcal - M061' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 120, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 130, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 70, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2790 kcal - M061' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2790 kcal - M061' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 120, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 130, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2790 kcal - M061' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 8, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Melancia', 90, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2858 kcal - M062',
  'Hipertrofia com distribuicao diaria proxima de 2825 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 198.2g de proteina, 306.6g de carboidratos e 93.5g de gorduras.',
  'hipertrofia',
  2858.1, 198.2, 306.6, 93.5, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2858 kcal - M062' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2858 kcal - M062' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 60, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 130, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2858 kcal - M062' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 60, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 100, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2858 kcal - M062' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 140, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 150, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2858 kcal - M062' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2858 kcal - M062' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 140, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 150, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 60, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2858 kcal - M062' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 8, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Banana prata', 90, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2877 kcal - M063',
  'Hipertrofia com distribuicao diaria proxima de 2850 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 199.2g de proteina, 364.1g de carboidratos e 69.4g de gorduras.',
  'hipertrofia',
  2876.7, 199.2, 364.1, 69.4, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2877 kcal - M063' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2877 kcal - M063' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 70, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 140, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2877 kcal - M063' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 70, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 100, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2877 kcal - M063' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 160, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 160, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 90, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2877 kcal - M063' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2877 kcal - M063' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 150, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 170, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 60, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2877 kcal - M063' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mamão', 90, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2890 kcal - M064',
  'Hipertrofia com distribuicao diaria proxima de 2875 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 206.6g de proteina, 328.7g de carboidratos e 83.9g de gorduras.',
  'hipertrofia',
  2889.8, 206.6, 328.7, 83.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2890 kcal - M064' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2890 kcal - M064' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 80, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 150, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2890 kcal - M064' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 80, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 170, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melancia', 100, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2890 kcal - M064' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 180, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 180, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 70, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2890 kcal - M064' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2890 kcal - M064' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 155, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 130, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2890 kcal - M064' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 90, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2898 kcal - M065',
  'Hipertrofia com distribuicao diaria proxima de 2900 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 210.9g de proteina, 347.1g de carboidratos e 73.5g de gorduras.',
  'hipertrofia',
  2897.8, 210.9, 347.1, 73.5, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2898 kcal - M065' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2898 kcal - M065' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 90, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 110, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2898 kcal - M065' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 50, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 100, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2898 kcal - M065' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 200, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 130, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2898 kcal - M065' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2898 kcal - M065' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 120, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 150, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 60, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2898 kcal - M065' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 8, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 90, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2903 kcal - M066',
  'Hipertrofia com distribuicao diaria proxima de 2925 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 194g de proteina, 313.2g de carboidratos e 96.9g de gorduras.',
  'hipertrofia',
  2903.4, 194, 313.2, 96.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2903 kcal - M066' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2903 kcal - M066' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 65, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melancia', 130, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2903 kcal - M066' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 100, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 100, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2903 kcal - M066' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 150, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 150, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 90, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2903 kcal - M066' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2903 kcal - M066' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 140, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 170, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 60, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2903 kcal - M066' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 8, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Maçã', 90, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2968 kcal - M067',
  'Hipertrofia com distribuicao diaria proxima de 2950 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 211.7g de proteina, 336.4g de carboidratos e 89.3g de gorduras.',
  'hipertrofia',
  2967.5, 211.7, 336.4, 89.3, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2968 kcal - M067' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2968 kcal - M067' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 60, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 140, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2968 kcal - M067' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 70, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 100, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2968 kcal - M067' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 120, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 160, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 70, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2968 kcal - M067' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2968 kcal - M067' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 150, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 130, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2968 kcal - M067' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 8, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Melancia', 90, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2998 kcal - M068',
  'Hipertrofia com distribuicao diaria proxima de 2975 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 187.2g de proteina, 365.5g de carboidratos e 86.8g de gorduras.',
  'hipertrofia',
  2998.3, 187.2, 365.5, 86.8, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2998 kcal - M068' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2998 kcal - M068' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 70, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 150, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2998 kcal - M068' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 80, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 170, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2998 kcal - M068' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 140, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 180, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2998 kcal - M068' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2998 kcal - M068' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 170, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 150, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 60, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2998 kcal - M068' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 5, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Banana prata', 90, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 2965 kcal - M069',
  'Hipertrofia com distribuicao diaria proxima de 3000 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 220.2g de proteina, 340.2g de carboidratos e 82.7g de gorduras.',
  'hipertrofia',
  2965, 220.2, 340.2, 82.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 2965 kcal - M069' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2965 kcal - M069' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 80, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 110, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2965 kcal - M069' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 50, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 90, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 100, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2965 kcal - M069' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 160, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 130, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 90, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2965 kcal - M069' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 50, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2965 kcal - M069' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 135, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 170, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 60, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 2965 kcal - M069' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 8, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mamão', 90, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 3021 kcal - M070',
  'Hipertrofia com distribuicao diaria proxima de 3025 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 199.7g de proteina, 363.9g de carboidratos e 84.1g de gorduras.',
  'hipertrofia',
  3021.3, 199.7, 363.9, 84.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 3021 kcal - M070' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3021 kcal - M070' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 105, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 130, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3021 kcal - M070' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 75, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 100, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melancia', 100, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3021 kcal - M070' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 180, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 150, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 70, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3021 kcal - M070' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3021 kcal - M070' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 155, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 130, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 60, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3021 kcal - M070' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 45, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 8, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 90, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 3061 kcal - M071',
  'Hipertrofia com distribuicao diaria proxima de 3050 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 209g de proteina, 366.4g de carboidratos e 86.5g de gorduras.',
  'hipertrofia',
  3061, 209, 366.4, 86.5, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M071' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M071' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 65, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Maçã', 140, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M071' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 70, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 30, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 100, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M071' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 200, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 160, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M071' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M071' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 150, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 150, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 60, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M071' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 8, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 90, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Hipertrofia 3061 kcal - M072',
  'Hipertrofia com distribuicao diaria proxima de 3075 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 214.9g de proteina, 314.6g de carboidratos e 103.7g de gorduras.',
  'hipertrofia',
  3060.5, 214.9, 314.6, 103.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M072' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M072' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 60, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melancia', 150, 'g', NULL, NULL, 33, 0.6, 8.1, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 10, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M072' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 80, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 170, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 100, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M072' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 150, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 180, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 90, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Pepino', 80, 'g', NULL, NULL, 15, 0.7, 2.5, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M072' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Granola', 35, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M072' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 170, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 170, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 60, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 8, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Hipertrofia 3061 kcal - M072' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 30, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Chia em grãos', 8, 'g', NULL, NULL, 484, 16.5, 42.1, 30.7, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Maçã', 90, 'g', NULL, NULL, 56, 0.3, 14.9, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2634 kcal - M073',
  'Ganho de peso com distribuicao diaria proxima de 2600 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 202.2g de proteina, 273g de carboidratos e 84.5g de gorduras.',
  'ganho_peso',
  2634.5, 202.2, 273, 84.5, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2634 kcal - M073' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2634 kcal - M073' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 25, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 120, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2634 kcal - M073' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 80, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2634 kcal - M073' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 130, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 150, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 90, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2634 kcal - M073' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2634 kcal - M073' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 110, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 140, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2634 kcal - M073' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 20, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2662 kcal - M074',
  'Ganho de peso com distribuicao diaria proxima de 2630 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 200.4g de proteina, 245.2g de carboidratos e 95.4g de gorduras.',
  'ganho_peso',
  2661.6, 200.4, 245.2, 95.4, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2662 kcal - M074' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2662 kcal - M074' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 80, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacate', 110, 'g', NULL, NULL, 96, 1.2, 6, 8.4, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha do Pará sem sal', 5, 'g', NULL, NULL, 643, 14.3, 12.3, 61.4, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2662 kcal - M074' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 55, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2662 kcal - M074' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 90, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 170, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 100, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2662 kcal - M074' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 70, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2662 kcal - M074' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 70, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 160, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 80, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2662 kcal - M074' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 20, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2694 kcal - M075',
  'Ganho de peso com distribuicao diaria proxima de 2660 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 218.8g de proteina, 241.6g de carboidratos e 96g de gorduras.',
  'ganho_peso',
  2694, 218.8, 241.6, 96, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2694 kcal - M075' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2694 kcal - M075' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 20, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 160, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha de caju torrada sem sal', 5, 'g', NULL, NULL, 570, 18.5, 29.1, 46.3, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2694 kcal - M075' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 20, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2694 kcal - M075' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 125, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 190, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 110, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2694 kcal - M075' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2694 kcal - M075' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 105, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 180, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 80, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2694 kcal - M075' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 20, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 20, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2679 kcal - M076',
  'Ganho de peso com distribuicao diaria proxima de 2690 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 244.6g de proteina, 271.3g de carboidratos e 66.9g de gorduras.',
  'ganho_peso',
  2678.8, 244.6, 271.3, 66.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2679 kcal - M076' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2679 kcal - M076' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 40, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 120, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2679 kcal - M076' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 55, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2679 kcal - M076' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 175, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 210, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 90, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2679 kcal - M076' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2679 kcal - M076' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 140, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 140, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2679 kcal - M076' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 20, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 25, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2730 kcal - M077',
  'Ganho de peso com distribuicao diaria proxima de 2720 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 193.9g de proteina, 277.3g de carboidratos e 92.3g de gorduras.',
  'ganho_peso',
  2730.1, 193.9, 277.3, 92.3, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2730 kcal - M077' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2730 kcal - M077' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 80, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 140, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2730 kcal - M077' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 105, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2730 kcal - M077' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 210, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 150, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 100, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2730 kcal - M077' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2730 kcal - M077' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 95, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 160, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 80, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2730 kcal - M077' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 20, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 75, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2783 kcal - M078',
  'Ganho de peso com distribuicao diaria proxima de 2750 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 222.1g de proteina, 289.1g de carboidratos e 83.2g de gorduras.',
  'ganho_peso',
  2783.3, 222.1, 289.1, 83.2, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2783 kcal - M078' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2783 kcal - M078' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 50, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 160, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2783 kcal - M078' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2783 kcal - M078' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 160, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 170, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 110, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2783 kcal - M078' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2783 kcal - M078' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 115, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 180, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 80, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2783 kcal - M078' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 20, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 75, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2757 kcal - M079',
  'Ganho de peso com distribuicao diaria proxima de 2780 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 196.2g de proteina, 300.3g de carboidratos e 87.7g de gorduras.',
  'ganho_peso',
  2757.3, 196.2, 300.3, 87.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2757 kcal - M079' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2757 kcal - M079' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 25, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 120, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha do Pará sem sal', 5, 'g', NULL, NULL, 643, 14.3, 12.3, 61.4, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2757 kcal - M079' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2757 kcal - M079' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 130, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 190, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 90, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2757 kcal - M079' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2757 kcal - M079' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 135, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 140, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2757 kcal - M079' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 30, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 75, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2842 kcal - M080',
  'Ganho de peso com distribuicao diaria proxima de 2810 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 241.5g de proteina, 242.2g de carboidratos e 101.1g de gorduras.',
  'ganho_peso',
  2842.4, 241.5, 242.2, 101.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2842 kcal - M080' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2842 kcal - M080' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 80, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacate', 105, 'g', NULL, NULL, 96, 1.2, 6, 8.4, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha de caju torrada sem sal', 5, 'g', NULL, NULL, 570, 18.5, 29.1, 46.3, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2842 kcal - M080' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 55, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2842 kcal - M080' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 90, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 210, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 100, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2842 kcal - M080' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 70, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2842 kcal - M080' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 110, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 160, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 80, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2842 kcal - M080' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 20, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 75, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2858 kcal - M081',
  'Ganho de peso com distribuicao diaria proxima de 2840 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 227.6g de proteina, 311.1g de carboidratos e 80.4g de gorduras.',
  'ganho_peso',
  2858.4, 227.6, 311.1, 80.4, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2858 kcal - M081' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2858 kcal - M081' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 160, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2858 kcal - M081' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 30, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2858 kcal - M081' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 170, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 150, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 110, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2858 kcal - M081' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2858 kcal - M081' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 110, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 180, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 80, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2858 kcal - M081' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 30, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 75, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2882 kcal - M082',
  'Ganho de peso com distribuicao diaria proxima de 2870 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 196.3g de proteina, 318.5g de carboidratos e 90.7g de gorduras.',
  'ganho_peso',
  2882.1, 196.3, 318.5, 90.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2882 kcal - M082' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2882 kcal - M082' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 70, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 120, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2882 kcal - M082' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 105, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2882 kcal - M082' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 175, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 170, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 90, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2882 kcal - M082' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2882 kcal - M082' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 115, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 140, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2882 kcal - M082' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 20, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 75, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2914 kcal - M083',
  'Ganho de peso com distribuicao diaria proxima de 2900 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 221.7g de proteina, 321.7g de carboidratos e 82.9g de gorduras.',
  'ganho_peso',
  2913.9, 221.7, 321.7, 82.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2914 kcal - M083' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2914 kcal - M083' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 95, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 140, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2914 kcal - M083' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 30, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2914 kcal - M083' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 225, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 190, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 100, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2914 kcal - M083' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2914 kcal - M083' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 150, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 160, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 80, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2914 kcal - M083' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 30, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 75, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2929 kcal - M084',
  'Ganho de peso com distribuicao diaria proxima de 2930 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 236.9g de proteina, 311.5g de carboidratos e 81g de gorduras.',
  'ganho_peso',
  2928.7, 236.9, 311.5, 81, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2929 kcal - M084' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2929 kcal - M084' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 65, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 160, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha do Pará sem sal', 5, 'g', NULL, NULL, 643, 14.3, 12.3, 61.4, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2929 kcal - M084' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2929 kcal - M084' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 175, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 210, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 110, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2929 kcal - M084' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2929 kcal - M084' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 185, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 180, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 80, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2929 kcal - M084' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 30, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 75, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2991 kcal - M085',
  'Ganho de peso com distribuicao diaria proxima de 2960 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 206.6g de proteina, 325.4g de carboidratos e 99.8g de gorduras.',
  'ganho_peso',
  2990.8, 206.6, 325.4, 99.8, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2991 kcal - M085' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2991 kcal - M085' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 55, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 120, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha de caju torrada sem sal', 5, 'g', NULL, NULL, 570, 18.5, 29.1, 46.3, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2991 kcal - M085' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 30, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2991 kcal - M085' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 145, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 150, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 90, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2991 kcal - M085' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2991 kcal - M085' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 125, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 140, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2991 kcal - M085' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 30, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 2996 kcal - M086',
  'Ganho de peso com distribuicao diaria proxima de 2990 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 230.6g de proteina, 315.2g de carboidratos e 91.2g de gorduras.',
  'ganho_peso',
  2995.9, 230.6, 315.2, 91.2, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 2996 kcal - M086' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2996 kcal - M086' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 80, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacate', 125, 'g', NULL, NULL, 96, 1.2, 6, 8.4, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2996 kcal - M086' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 30, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2996 kcal - M086' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 135, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 170, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 100, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2996 kcal - M086' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2996 kcal - M086' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 130, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 160, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 80, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 2996 kcal - M086' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3049 kcal - M087',
  'Ganho de peso com distribuicao diaria proxima de 3020 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 215.3g de proteina, 326.1g de carboidratos e 100.2g de gorduras.',
  'ganho_peso',
  3049.4, 215.3, 326.1, 100.2, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3049 kcal - M087' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3049 kcal - M087' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 75, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 160, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3049 kcal - M087' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 105, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 20, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3049 kcal - M087' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 170, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 190, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 110, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3049 kcal - M087' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3049 kcal - M087' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 150, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 180, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 80, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3049 kcal - M087' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 30, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3072 kcal - M088',
  'Ganho de peso com distribuicao diaria proxima de 3050 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 243.1g de proteina, 358.2g de carboidratos e 75.6g de gorduras.',
  'ganho_peso',
  3072, 243.1, 358.2, 75.6, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3072 kcal - M088' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3072 kcal - M088' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 85, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 120, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3072 kcal - M088' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 105, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 30, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3072 kcal - M088' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 190, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 210, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 90, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3072 kcal - M088' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3072 kcal - M088' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 170, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 140, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3072 kcal - M088' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 30, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3098 kcal - M089',
  'Ganho de peso com distribuicao diaria proxima de 3080 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 206.9g de proteina, 355.7g de carboidratos e 92.3g de gorduras.',
  'ganho_peso',
  3097.7, 206.9, 355.7, 92.3, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M089' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M089' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 110, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 140, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha do Pará sem sal', 5, 'g', NULL, NULL, 643, 14.3, 12.3, 61.4, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M089' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 45, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M089' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 240, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 150, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 100, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M089' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M089' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 140, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 160, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 80, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M089' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 45, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 8, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3098 kcal - M090',
  'Ganho de peso com distribuicao diaria proxima de 3110 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 227.8g de proteina, 330.8g de carboidratos e 97.2g de gorduras.',
  'ganho_peso',
  3098.3, 227.8, 330.8, 97.2, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M090' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M090' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 80, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 160, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha de caju torrada sem sal', 5, 'g', NULL, NULL, 570, 18.5, 29.1, 46.3, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M090' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 30, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M090' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 175, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 170, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 110, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M090' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M090' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 145, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 180, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 80, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3098 kcal - M090' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 45, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3126 kcal - M091',
  'Ganho de peso com distribuicao diaria proxima de 3140 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 231.3g de proteina, 361.4g de carboidratos e 87.6g de gorduras.',
  'ganho_peso',
  3125.9, 231.3, 361.4, 87.6, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3126 kcal - M091' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3126 kcal - M091' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 55, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 120, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3126 kcal - M091' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 30, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3126 kcal - M091' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 145, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 190, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 90, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3126 kcal - M091' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3126 kcal - M091' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 165, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 140, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3126 kcal - M091' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3186 kcal - M092',
  'Ganho de peso com distribuicao diaria proxima de 3170 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 240.4g de proteina, 318.8g de carboidratos e 107.1g de gorduras.',
  'ganho_peso',
  3186.2, 240.4, 318.8, 107.1, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3186 kcal - M092' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3186 kcal - M092' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 80, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacate', 125, 'g', NULL, NULL, 96, 1.2, 6, 8.4, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3186 kcal - M092' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 30, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3186 kcal - M092' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 135, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 210, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 100, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3186 kcal - M092' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3186 kcal - M092' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 170, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 160, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 80, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3186 kcal - M092' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3208 kcal - M093',
  'Ganho de peso com distribuicao diaria proxima de 3200 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 228.3g de proteina, 362.7g de carboidratos e 97.3g de gorduras.',
  'ganho_peso',
  3207.5, 228.3, 362.7, 97.3, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3208 kcal - M093' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3208 kcal - M093' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 90, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 160, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3208 kcal - M093' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 30, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3208 kcal - M093' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 185, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 150, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 110, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3208 kcal - M093' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3208 kcal - M093' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 125, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 180, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 80, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3208 kcal - M093' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 8, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3248 kcal - M094',
  'Ganho de peso com distribuicao diaria proxima de 3230 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 203g de proteina, 408.7g de carboidratos e 88.3g de gorduras.',
  'ganho_peso',
  3248.3, 203, 408.7, 88.3, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3248 kcal - M094' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3248 kcal - M094' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 100, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 120, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha do Pará sem sal', 5, 'g', NULL, NULL, 643, 14.3, 12.3, 61.4, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3248 kcal - M094' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 30, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3248 kcal - M094' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 220, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 170, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 90, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3248 kcal - M094' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3248 kcal - M094' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 145, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 140, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3248 kcal - M094' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 8, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3273 kcal - M095',
  'Ganho de peso com distribuicao diaria proxima de 3260 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 226.9g de proteina, 362.9g de carboidratos e 102g de gorduras.',
  'ganho_peso',
  3272.6, 226.9, 362.9, 102, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3273 kcal - M095' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3273 kcal - M095' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 110, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 140, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha de caju torrada sem sal', 5, 'g', NULL, NULL, 570, 18.5, 29.1, 46.3, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3273 kcal - M095' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 30, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3273 kcal - M095' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 240, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 190, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 100, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3273 kcal - M095' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3273 kcal - M095' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 165, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 160, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 80, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3273 kcal - M095' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 8, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3310 kcal - M096',
  'Ganho de peso com distribuicao diaria proxima de 3290 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 276.6g de proteina, 369.2g de carboidratos e 81.9g de gorduras.',
  'ganho_peso',
  3309.8, 276.6, 369.2, 81.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3310 kcal - M096' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3310 kcal - M096' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 95, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 160, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3310 kcal - M096' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 45, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3310 kcal - M096' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 190, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 210, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 110, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3310 kcal - M096' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3310 kcal - M096' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 200, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 180, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 80, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3310 kcal - M096' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 8, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3353 kcal - M097',
  'Ganho de peso com distribuicao diaria proxima de 3320 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 208.3g de proteina, 378.5g de carboidratos e 115.5g de gorduras.',
  'ganho_peso',
  3352.7, 208.3, 378.5, 115.5, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3353 kcal - M097' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3353 kcal - M097' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 70, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 120, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 5, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3353 kcal - M097' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 45, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3353 kcal - M097' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 160, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 150, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 90, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3353 kcal - M097' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3353 kcal - M097' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 140, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 140, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3353 kcal - M097' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 13, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3357 kcal - M098',
  'Ganho de peso com distribuicao diaria proxima de 3350 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 232.5g de proteina, 357.7g de carboidratos e 113.5g de gorduras.',
  'ganho_peso',
  3356.9, 232.5, 357.7, 113.5, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3357 kcal - M098' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3357 kcal - M098' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 80, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacate', 135, 'g', NULL, NULL, 96, 1.2, 6, 8.4, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 10, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3357 kcal - M098' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 45, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3357 kcal - M098' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 180, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 170, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 100, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3357 kcal - M098' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3357 kcal - M098' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 160, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 160, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 80, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3357 kcal - M098' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 13, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3376 kcal - M099',
  'Ganho de peso com distribuicao diaria proxima de 3380 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 225.6g de proteina, 389.9g de carboidratos e 103.3g de gorduras.',
  'ganho_peso',
  3375.6, 225.6, 389.9, 103.3, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3376 kcal - M099' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3376 kcal - M099' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 90, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 160, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha do Pará sem sal', 10, 'g', NULL, NULL, 643, 14.3, 12.3, 61.4, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3376 kcal - M099' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 45, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3376 kcal - M099' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 200, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 190, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 110, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3376 kcal - M099' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3376 kcal - M099' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 180, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 180, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 80, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3376 kcal - M099' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 13, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3430 kcal - M100',
  'Ganho de peso com distribuicao diaria proxima de 3410 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 245g de proteina, 402g de carboidratos e 95.2g de gorduras.',
  'ganho_peso',
  3429.8, 245, 402, 95.2, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3430 kcal - M100' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3430 kcal - M100' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 85, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 120, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha de caju torrada sem sal', 5, 'g', NULL, NULL, 570, 18.5, 29.1, 46.3, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3430 kcal - M100' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 45, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3430 kcal - M100' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 205, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 210, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 90, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3430 kcal - M100' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 20, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3430 kcal - M100' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 200, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 140, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3430 kcal - M100' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 5, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3410 kcal - M101',
  'Ganho de peso com distribuicao diaria proxima de 3440 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 232.3g de proteina, 362g de carboidratos e 114.7g de gorduras.',
  'ganho_peso',
  3410.4, 232.3, 362, 114.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3410 kcal - M101' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3410 kcal - M101' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 110, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 140, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 15, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3410 kcal - M101' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 45, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3410 kcal - M101' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 240, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 150, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 100, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 10, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3410 kcal - M101' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 20, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3410 kcal - M101' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 140, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 160, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 80, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 10, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3410 kcal - M101' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 18, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3503 kcal - M102',
  'Ganho de peso com distribuicao diaria proxima de 3470 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 226.7g de proteina, 374.7g de carboidratos e 122.7g de gorduras.',
  'ganho_peso',
  3502.8, 226.7, 374.7, 122.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3503 kcal - M102' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3503 kcal - M102' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 95, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 160, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 10, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3503 kcal - M102' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 45, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3503 kcal - M102' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 190, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 170, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 110, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3503 kcal - M102' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 20, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3503 kcal - M102' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 160, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 180, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 80, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 10, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3503 kcal - M102' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 18, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3511 kcal - M103',
  'Ganho de peso com distribuicao diaria proxima de 3500 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 234.8g de proteina, 396.9g de carboidratos e 115.4g de gorduras.',
  'ganho_peso',
  3511.1, 234.8, 396.9, 115.4, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3511 kcal - M103' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3511 kcal - M103' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Granola', 70, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 120, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 15, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3511 kcal - M103' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 45, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3511 kcal - M103' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 160, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 190, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 90, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3511 kcal - M103' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3511 kcal - M103' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 180, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 140, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 10, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3511 kcal - M103' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 18, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3556 kcal - M104',
  'Ganho de peso com distribuicao diaria proxima de 3530 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 246g de proteina, 362.8g de carboidratos e 125.9g de gorduras.',
  'ganho_peso',
  3555.7, 246, 362.8, 125.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3556 kcal - M104' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3556 kcal - M104' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 80, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacate', 140, 'g', NULL, NULL, 96, 1.2, 6, 8.4, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha do Pará sem sal', 15, 'g', NULL, NULL, 643, 14.3, 12.3, 61.4, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3556 kcal - M104' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 45, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3556 kcal - M104' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 180, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 210, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 100, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3556 kcal - M104' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 20, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3556 kcal - M104' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 200, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 160, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 80, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 10, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3556 kcal - M104' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 18, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3590 kcal - M105',
  'Ganho de peso com distribuicao diaria proxima de 3560 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 235.9g de proteina, 387.6g de carboidratos e 125.7g de gorduras.',
  'ganho_peso',
  3590.2, 235.9, 387.6, 125.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3590 kcal - M105' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3590 kcal - M105' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 90, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Ovo inteiro cozido', 110, 'g', NULL, NULL, 146, 13.3, 0.6, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 160, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Castanha de caju torrada sem sal', 15, 'g', NULL, NULL, 570, 18.5, 29.1, 46.3, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3590 kcal - M105' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 45, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3590 kcal - M105' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Inhame cozido', 200, 'g', NULL, NULL, 116, 1.8, 27.5, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 150, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 110, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 10, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3590 kcal - M105' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 20, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3590 kcal - M105' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 140, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 180, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 80, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 5, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3590 kcal - M105' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 13, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3606 kcal - M106',
  'Ganho de peso com distribuicao diaria proxima de 3590 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 231g de proteina, 422.7g de carboidratos e 110.9g de gorduras.',
  'ganho_peso',
  3606.1, 231, 422.7, 110.9, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3606 kcal - M106' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3606 kcal - M106' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Tapioca', 100, 'g', NULL, NULL, 350, 0.3, 86.4, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mamão', 120, 'g', NULL, NULL, 44, 0.5, 10.4, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 15, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3606 kcal - M106' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 45, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3606 kcal - M106' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Mandioquinha cozida', 220, 'g', NULL, NULL, 90, 2.3, 20.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Sardinha, assada', 170, 'g', NULL, NULL, 164, 32.2, 0, 3, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 90, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Couve crua', 70, 'g', NULL, NULL, 32, 3.1, 3.7, 0.7, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 10, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3606 kcal - M106' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 20, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3606 kcal - M106' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 160, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 140, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 80, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Vagem cozida', 80, 'g', NULL, NULL, 28, 1.8, 5.4, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 10, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3606 kcal - M106' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 13, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3620 kcal - M107',
  'Ganho de peso com distribuicao diaria proxima de 3620 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 225.3g de proteina, 387.8g de carboidratos e 129.7g de gorduras.',
  'ganho_peso',
  3619.8, 225.3, 387.8, 129.7, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3620 kcal - M107' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3620 kcal - M107' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Cuscuz milho cozido', 110, 'g', NULL, NULL, 131, 3.3, 28.5, 0.3, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 100, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Melão', 140, 'g', NULL, NULL, 30, 0.5, 7.3, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 15, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3620 kcal - M107' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 45, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3620 kcal - M107' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, tipo 1, cozido', 240, 'g', NULL, NULL, 128, 2.5, 28.1, 0.2, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Carne bovina patinho grelhado', 190, 'g', NULL, NULL, 219, 32.5, 0, 9.6, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Lentilha, cozida', 100, 'g', NULL, NULL, 93, 6.3, 16.3, 0.5, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Espinafre, Nova Zelândia, cru', 70, 'g', NULL, NULL, 16, 2, 2.6, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Cenoura, cozida', 80, 'g', NULL, NULL, 30, 0.8, 6.7, 0.2, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 10, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3620 kcal - M107' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 20, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3620 kcal - M107' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Arroz, integral, cozido', 180, 'g', NULL, NULL, 124, 2.6, 25.8, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Salmão, sem pele, fresco, cru', 160, 'g', NULL, NULL, 170, 19.3, 0, 9.7, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 80, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Tomate', 80, 'g', NULL, NULL, 15, 1, 3.1, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 10, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3620 kcal - M107' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 75, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 18, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

INSERT INTO diet_templates (name, description, strategy, total_kcal, protein_g, carbs_g, fat_g, is_active)
VALUES (
  'Biblioteca Dieta - Ganho de peso 3663 kcal - M108',
  'Ganho de peso com distribuicao diaria proxima de 3650 kcal. Modelo automatico baseado nos alimentos cadastrados no sistema, com variedade de fontes proteicas, carboidratos, frutas e vegetais. Macros estimados: 275.8g de proteina, 391g de carboidratos e 114g de gorduras.',
  'ganho_peso',
  3663, 275.8, 391, 114, TRUE
);

WITH tmpl AS (
  SELECT id FROM diet_templates WHERE name = 'Biblioteca Dieta - Ganho de peso 3663 kcal - M108' ORDER BY id DESC LIMIT 1
)
INSERT INTO diet_template_meals (template_id, meal_name, time_suggestion, order_index, notes)
SELECT tmpl.id, meal_name, time_suggestion, order_index, notes
FROM tmpl, (VALUES
  ('Café da manhã', '07:00 - 08:00', 0, NULL),
  ('Lanche da manhã', '10:00 - 10:30', 1, NULL),
  ('Almoço', '12:00 - 13:00', 2, NULL),
  ('Lanche da tarde', '15:30 - 16:30', 3, NULL),
  ('Jantar', '19:00 - 20:00', 4, NULL),
  ('Ceia', '22:00 - 23:00', 5, NULL)
) AS m(meal_name, time_suggestion, order_index, notes);

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3663 kcal - M108' AND dtm.order_index = 0
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 110, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 40, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Abacaxi', 160, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 15, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3663 kcal - M108' AND dtm.order_index = 1
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Leite integral', 250, 'ml', NULL, NULL, 61, 3.2, 4.7, 3.3, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Whey', 35, 'g', NULL, NULL, 360, 76, 4, 1, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Banana prata', 130, 'g', NULL, NULL, 98, 1.3, 26, 0.1, 'Fruta', NULL, 2),
  ((SELECT id FROM meal_ref), 'Granola', 60, 'g', NULL, NULL, 394, 8.9, 65, 12.2, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3663 kcal - M108' AND dtm.order_index = 2
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Macarrão cozido', 190, 'g', NULL, NULL, 153, 5, 31, 1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Frango peito grelhado', 210, 'g', NULL, NULL, 159, 32.8, 0, 3.2, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Ervilha congelada', 110, 'g', NULL, NULL, 80, 5.8, 14.2, 0.4, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Repolho roxo', 70, 'g', NULL, NULL, 22, 1.3, 4.6, 0.1, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Beterraba, cozida', 80, 'g', NULL, NULL, 32, 1.3, 7.2, 0.1, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 10, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3663 kcal - M108' AND dtm.order_index = 3
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Iogurte grego', 180, 'g', NULL, NULL, 92, 6.5, 4.8, 4, 'Laticinio', NULL, 0),
  ((SELECT id FROM meal_ref), 'Manga, Haden, crua', 120, 'g', NULL, NULL, 64, 0.4, 16.7, 0.3, 'Fruta', NULL, 1),
  ((SELECT id FROM meal_ref), 'Mix de castanhas', 20, 'g', NULL, NULL, 590, 16, 18, 50, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Aveia em flocos', 35, 'g', NULL, NULL, 394, 13.9, 66.6, 8.5, 'Carboidrato', NULL, 3)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3663 kcal - M108' AND dtm.order_index = 4
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Batata doce cozida sem sal', 200, 'g', NULL, NULL, 86, 1.4, 20.2, 0.1, 'Carboidrato', NULL, 0),
  ((SELECT id FROM meal_ref), 'Atum em lata óleo', 180, 'g', NULL, NULL, 194, 26.6, 0, 9.5, 'Proteina', NULL, 1),
  ((SELECT id FROM meal_ref), 'Feijão carioca', 80, 'g', NULL, NULL, 131.6, 9.5, 21.2, 2.1, 'Leguminosa', NULL, 2),
  ((SELECT id FROM meal_ref), 'Alface crespa', 70, 'g', NULL, NULL, 11, 1.3, 1.5, 0.2, 'Vegetal', NULL, 3),
  ((SELECT id FROM meal_ref), 'Abobrinha assada', 80, 'g', NULL, NULL, 14, 1, 2.3, 0.3, 'Vegetal', NULL, 4),
  ((SELECT id FROM meal_ref), 'Azeite de oliva', 10, 'g', NULL, NULL, 884, 0, 0, 100, 'Gordura', NULL, 5)
;

WITH meal_ref AS (
  SELECT dtm.id
  FROM diet_template_meals dtm
  JOIN diet_templates dt ON dt.id = dtm.template_id
  WHERE dt.name = 'Biblioteca Dieta - Ganho de peso 3663 kcal - M108' AND dtm.order_index = 5
  ORDER BY dtm.id DESC
  LIMIT 1
)
INSERT INTO diet_template_foods (
  template_meal_id, food_name, quantity, unit, household_measure, measure_amount,
  kcal_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, food_group, notes, order_index
)
VALUES
  ((SELECT id FROM meal_ref), 'Queijo, ricota', 120, 'g', NULL, NULL, 140, 12.6, 3.8, 8.1, 'Proteina', NULL, 0),
  ((SELECT id FROM meal_ref), 'Pão de forma integral', 60, 'g', NULL, NULL, 253, 9.1, 43.7, 4.9, 'Carboidrato', NULL, 1),
  ((SELECT id FROM meal_ref), 'Amendoim torrado', 18, 'g', NULL, NULL, 567, 26.2, 20.3, 43.9, 'Gordura', NULL, 2),
  ((SELECT id FROM meal_ref), 'Abacaxi', 100, 'g', NULL, NULL, 49, 0.8, 12.5, 0.1, 'Fruta', NULL, 3)
;

COMMIT;

