-- Agregar columnas para consultas de seguimiento (visita 2)
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS sintomas_seleccionados_2 JSONB;
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS factores_seleccionados_2 JSONB;
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS tvus_2 VARCHAR(50);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS hcg_valor_2 DECIMAL(10,2);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS hcg_anterior_2 DECIMAL(10,2);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS variacion_hcg_2 VARCHAR(50);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS resultado_2 DECIMAL(6,4);

-- Agregar columnas para consultas de seguimiento (visita 3)
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS sintomas_seleccionados_3 JSONB;
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS factores_seleccionados_3 JSONB;
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS tvus_3 VARCHAR(50);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS hcg_valor_3 DECIMAL(10,2);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS hcg_anterior_3 DECIMAL(10,2);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS variacion_hcg_3 VARCHAR(50);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS resultado_3 DECIMAL(6,4);

-- Agregar índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_consultas_tvus_2 ON consultas(tvus_2);
CREATE INDEX IF NOT EXISTS idx_consultas_tvus_3 ON consultas(tvus_3);
CREATE INDEX IF NOT EXISTS idx_consultas_resultado_2 ON consultas(resultado_2);
CREATE INDEX IF NOT EXISTS idx_consultas_resultado_3 ON consultas(resultado_3);
