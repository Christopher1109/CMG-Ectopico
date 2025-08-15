-- AGREGAR TODAS LAS COLUMNAS FALTANTES PARA SEGUIMIENTO

-- Columnas básicas que faltan
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS fecha_ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Columnas para consulta de seguimiento 2
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS sintomas_seleccionados_2 JSONB;
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS factores_seleccionados_2 JSONB;
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS tvus_2 VARCHAR(50);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS hcg_valor_2 DECIMAL(10,2);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS hcg_anterior_2 DECIMAL(10,2);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS variacion_hcg_2 VARCHAR(50);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS resultado_2 DECIMAL(6,4);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS usuario_visita_2 VARCHAR(100);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS fecha_visita_2 TIMESTAMP WITH TIME ZONE;

-- Columnas para consulta de seguimiento 3
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS sintomas_seleccionados_3 JSONB;
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS factores_seleccionados_3 JSONB;
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS tvus_3 VARCHAR(50);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS hcg_valor_3 DECIMAL(10,2);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS hcg_anterior_3 DECIMAL(10,2);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS variacion_hcg_3 VARCHAR(50);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS resultado_3 DECIMAL(6,4);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS usuario_visita_3 VARCHAR(100);
ALTER TABLE consultas ADD COLUMN IF NOT EXISTS fecha_visita_3 TIMESTAMP WITH TIME ZONE;

-- Crear función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.fecha_ultima_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger
DROP TRIGGER IF EXISTS trg_set_updated_at ON consultas;
CREATE TRIGGER trg_set_updated_at
BEFORE UPDATE ON consultas
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

-- Verificar que todas las columnas se crearon
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consultas' 
AND column_name LIKE '%_2'
ORDER BY column_name;

-- Mostrar también las columnas básicas
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consultas' 
AND column_name IN ('fecha_creacion', 'fecha_ultima_actualizacion', 'hcg_anterior_2', 'tvus_2')
ORDER BY column_name;
