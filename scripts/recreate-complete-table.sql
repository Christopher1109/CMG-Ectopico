-- ============================================
-- RECREAR TABLA COMPLETA CON TODAS LAS COLUMNAS
-- ============================================

-- 1. ELIMINAR TABLA EXISTENTE
DROP TABLE IF EXISTS consultas CASCADE;

-- 2. CREAR TABLA COMPLETA CON TODAS LAS COLUMNAS
CREATE TABLE consultas (
    -- Identificación
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
    
    -- Pruebas y evaluaciones
    prueba_embarazo_realizada VARCHAR(10),
    resultado_prueba_embarazo VARCHAR(20),
    hallazgos_exploracion TEXT,
    tiene_eco_transabdominal VARCHAR(10),
    resultado_eco_transabdominal VARCHAR(100),
    
    -- CONSULTA INICIAL (Primera visita)
    sintomas_seleccionados JSONB DEFAULT '[]'::jsonb,
    factores_seleccionados JSONB DEFAULT '[]'::jsonb,
    tvus VARCHAR(50),
    hcg_valor DECIMAL(10,2),
    variacion_hcg VARCHAR(50),
    hcg_anterior DECIMAL(10,2),
    resultado DECIMAL(6,4),
    
    -- CONSULTA DE SEGUIMIENTO 2 (Segunda visita)
    sintomas_seleccionados_2 JSONB DEFAULT '[]'::jsonb,
    factores_seleccionados_2 JSONB DEFAULT '[]'::jsonb,
    tvus_2 VARCHAR(50),
    hcg_valor_2 DECIMAL(10,2),
    hcg_anterior_2 DECIMAL(10,2),
    variacion_hcg_2 VARCHAR(50),
    resultado_2 DECIMAL(6,4),
    usuario_visita_2 VARCHAR(100),
    fecha_visita_2 TIMESTAMP WITH TIME ZONE,
    
    -- CONSULTA DE SEGUIMIENTO 3 (Tercera visita)
    sintomas_seleccionados_3 JSONB DEFAULT '[]'::jsonb,
    factores_seleccionados_3 JSONB DEFAULT '[]'::jsonb,
    tvus_3 VARCHAR(50),
    hcg_valor_3 DECIMAL(10,2),
    hcg_anterior_3 DECIMAL(10,2),
    variacion_hcg_3 VARCHAR(50),
    resultado_3 DECIMAL(6,4),
    usuario_visita_3 VARCHAR(100),
    fecha_visita_3 TIMESTAMP WITH TIME ZONE,
    
    -- Timestamps del sistema
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CREAR ÍNDICES PARA MEJORAR RENDIMIENTO
CREATE INDEX idx_consultas_id ON consultas(id);
CREATE INDEX idx_consultas_usuario ON consultas(usuario_creador);
CREATE INDEX idx_consultas_fecha ON consultas(fecha_creacion);
CREATE INDEX idx_consultas_paciente ON consultas(nombre_paciente);
CREATE INDEX idx_consultas_resultado ON consultas(resultado);
CREATE INDEX idx_consultas_resultado_2 ON consultas(resultado_2);
CREATE INDEX idx_consultas_resultado_3 ON consultas(resultado_3);
CREATE INDEX idx_consultas_tvus ON consultas(tvus);
CREATE INDEX idx_consultas_tvus_2 ON consultas(tvus_2);
CREATE INDEX idx_consultas_tvus_3 ON consultas(tvus_3);

-- 4. CREAR FUNCIÓN PARA ACTUALIZAR TIMESTAMPS
CREATE OR REPLACE FUNCTION update_consultas_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.fecha_ultima_actualizacion = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. CREAR TRIGGER PARA TIMESTAMPS
CREATE TRIGGER trg_update_consultas_timestamps
BEFORE UPDATE ON consultas
FOR EACH ROW
EXECUTE FUNCTION update_consultas_timestamps();

-- 6. HABILITAR RLS (Row Level Security)
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;

-- 7. CREAR POLÍTICAS RLS
-- Política para SELECT (lectura)
CREATE POLICY "Permitir lectura a usuarios autenticados" ON consultas
FOR SELECT
USING (true);

-- Política para INSERT (crear)
CREATE POLICY "Permitir inserción a usuarios autenticados" ON consultas
FOR INSERT
WITH CHECK (true);

-- Política para UPDATE (actualizar)
CREATE POLICY "Permitir actualización a usuarios autenticados" ON consultas
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Política para DELETE (eliminar)
CREATE POLICY "Permitir eliminación a usuarios autenticados" ON consultas
FOR DELETE
USING (true);

-- 8. INSERTAR DATOS DE PRUEBA (OPCIONAL)
INSERT INTO consultas (
    id, 
    usuario_creador, 
    nombre_paciente, 
    edad_paciente,
    frecuencia_cardiaca,
    presion_sistolica,
    presion_diastolica,
    estado_conciencia,
    prueba_embarazo_realizada,
    resultado_prueba_embarazo,
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
    75,
    120,
    80,
    'alerta',
    'si',
    'positiva',
    '["dolor"]'::jsonb,
    '["infertilidad"]'::jsonb,
    'normal',
    1500.00,
    0.1234
);

-- 9. VERIFICAR QUE TODO SE CREÓ CORRECTAMENTE
SELECT 
    'Tabla creada correctamente' as status,
    COUNT(*) as total_columnas
FROM information_schema.columns 
WHERE table_name = 'consultas';

-- 10. MOSTRAR TODAS LAS COLUMNAS CREADAS
SELECT 
    column_name, 
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'consultas' 
ORDER BY ordinal_position;

-- 11. VERIFICAR POLÍTICAS RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'consultas';

-- 12. VERIFICAR ÍNDICES
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'consultas'
ORDER BY indexname;

-- ============================================
-- SCRIPT COMPLETADO
-- ============================================
