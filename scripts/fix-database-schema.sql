-- ELIMINAR TABLA INCORRECTA
DROP TABLE IF EXISTS consultas CASCADE;

-- CREAR TABLA QUE COINCIDA CON TU APLICACIÓN
CREATE TABLE consultas (
    id VARCHAR(20) PRIMARY KEY,
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_ultima_actualizacion TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usuario_creador VARCHAR(100),
    
    -- Datos del paciente
    nombre_paciente VARCHAR(200),
    edad_paciente INTEGER,
    
    -- Signos vitales
    frecuencia_cardiaca INTEGER,
    presion_sistolica INTEGER,
    presion_diastolica INTEGER,
    estado_conciencia VARCHAR(50),
    
    -- Pruebas
    prueba_embarazo_realizada VARCHAR(10),
    resultado_prueba_embarazo VARCHAR(20),
    hallazgos_exploracion TEXT,
    tiene_eco_transabdominal VARCHAR(10),
    resultado_eco_transabdominal VARCHAR(100),
    
    -- CONSULTA 1 (PRIMERA VISITA)
    sintomas_seleccionados JSONB DEFAULT '[]'::jsonb,
    factores_seleccionados JSONB DEFAULT '[]'::jsonb,
    tvus VARCHAR(50),
    hcg_valor DECIMAL(10,2),
    variacion_hcg VARCHAR(50),
    hcg_anterior DECIMAL(10,2),
    resultado DECIMAL(6,4),  -- ¡IMPORTANTE! Esta columna faltaba
    
    -- CONSULTA 2 (SEGUNDA VISITA)
    sintomas_seleccionados_2 JSONB DEFAULT '[]'::jsonb,
    factores_seleccionados_2 JSONB DEFAULT '[]'::jsonb,
    tvus_2 VARCHAR(50),
    hcg_valor_2 DECIMAL(10,2),
    hcg_anterior_2 DECIMAL(10,2),
    variacion_hcg_2 VARCHAR(50),
    resultado_2 DECIMAL(6,4),
    usuario_visita_2 VARCHAR(100),
    fecha_visita_2 TIMESTAMP WITH TIME ZONE,
    
    -- CONSULTA 3 (TERCERA VISITA)
    sintomas_seleccionados_3 JSONB DEFAULT '[]'::jsonb,
    factores_seleccionados_3 JSONB DEFAULT '[]'::jsonb,
    tvus_3 VARCHAR(50),
    hcg_valor_3 DECIMAL(10,2),
    hcg_anterior_3 DECIMAL(10,2),
    variacion_hcg_3 VARCHAR(50),
    resultado_3 DECIMAL(6,4),
    usuario_visita_3 VARCHAR(100),
    fecha_visita_3 TIMESTAMP WITH TIME ZONE,
    
    -- Sistema
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ÍNDICES
CREATE INDEX idx_consultas_id ON consultas(id);
CREATE INDEX idx_consultas_usuario ON consultas(usuario_creador);
CREATE INDEX idx_consultas_fecha ON consultas(fecha_creacion);
CREATE INDEX idx_consultas_paciente ON consultas(nombre_paciente);

-- TRIGGER PARA TIMESTAMPS
CREATE OR REPLACE FUNCTION update_consultas_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.fecha_ultima_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_consultas_timestamps
BEFORE UPDATE ON consultas
FOR EACH ROW
EXECUTE FUNCTION update_consultas_timestamps();

-- RLS SIMPLE (SIN AUTENTICACIÓN)
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies 
    WHERE schemaname='public' AND tablename='consultas'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.consultas;', r.policyname);
  END LOOP;
END$$;

-- Políticas simples que permiten todo
CREATE POLICY "consultas_select_policy" ON consultas FOR SELECT USING (true);
CREATE POLICY "consultas_insert_policy" ON consultas FOR INSERT WITH CHECK (true);
CREATE POLICY "consultas_update_policy" ON consultas FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "consultas_delete_policy" ON consultas FOR DELETE USING (true);

-- Permisos
GRANT ALL ON consultas TO authenticated;
GRANT ALL ON consultas TO anon;
GRANT ALL ON consultas TO service_role;

-- INSERTAR DATO DE PRUEBA
INSERT INTO consultas (
    id, 
    usuario_creador, 
    nombre_paciente, 
    edad_paciente,
    sintomas_seleccionados,
    factores_seleccionados,
    tvus,
    hcg_valor,
    resultado
) VALUES (
    'ID-00001',
    'Christopher',
    'Paciente Prueba',
    28,
    '["dolor"]'::jsonb,
    '["infertilidad"]'::jsonb,
    'normal',
    1500.00,
    0.1234
);

-- VERIFICAR QUE TODO ESTÁ CORRECTO
SELECT 'TABLA CREADA CORRECTAMENTE' as status;

SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'consultas' 
AND column_name IN ('usuario_creador', 'edad_paciente', 'resultado', 'fecha_creacion')
ORDER BY column_name;
