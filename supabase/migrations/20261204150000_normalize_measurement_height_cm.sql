-- ============================================================
-- Data fix (pré-piloto): normalizar measurements.height para CENTÍMETROS
-- ============================================================
-- Bug encontrado na QA: a coluna measurements.height tinha unidade MISTURADA.
-- De 177 registros, 93 estavam em metros (ex.: 1.80) e 84 em cm (ex.: 180).
-- Como a fórmula de IMC assume cm (height/100), as alturas em metros faziam o IMC
-- sair ~10000× errado (ex.: 225308 kg/m²) no relatório antropométrico.
--
-- O código já foi corrigido (helper normalizeHeightCm normaliza na leitura e na
-- gravação — commit e27905c1). Esta migration normaliza os DADOS já existentes:
-- como ninguém tem 3 cm nem 3 m de altura, valores < 3 são metros → multiplica por 100.
--
-- Idempotente: após rodar, nenhuma linha tem height < 3, então reexecutar é no-op.
-- Já aplicada em prod via SQL Editor em 2026-11-25 (93 linhas normalizadas; verificado:
-- metros_restantes = 0, faixa final 120–192 cm).
-- ============================================================

update measurements
set height = round((height * 100)::numeric, 1)
where height is not null
  and height > 0
  and height < 3;
