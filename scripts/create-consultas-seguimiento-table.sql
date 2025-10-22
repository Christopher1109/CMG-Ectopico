-- Crear tabla para almacenar múltiples consultas de seguimiento
-- Cada consulta es una fila independiente vinculada al paciente por folio

CREATE TABLE IF NOT EXISTS public.consultas_seguimiento (
  id BIGSERIAL PRIMARY KEY,
  
  -- Relación con la consulta principal
  folio_paciente INTEGER NOT NULL,
  numero_consulta INTEGER NOT NULL,
  
  -- Datos de la consulta
  sintomas TEXT,
  factores_riesgo TEXT,
  tvus VARCHAR(50),
  hcg_valor NUMERIC(10,2),
  variacion_hcg VARCHAR(50),
  pronostico VARCHAR(100),
  
  -- Metadatos
  fecha_consulta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Índices para búsqueda rápida
  CONSTRAINT unique_folio_numero UNIQUE (folio_paciente, numero_consulta)
);

-- Índice para búsquedas por folio
CREATE INDEX IF NOT EXISTS idx_consultas_seguimiento_folio 
ON public.consultas_seguimiento(folio_paciente);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_consultas_seguimiento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_consultas_seguimiento_updated_at_trigger 
ON public.consultas_seguimiento;

CREATE TRIGGER update_consultas_seguimiento_updated_at_trigger
BEFORE UPDATE ON public.consultas_seguimiento
FOR EACH ROW
EXECUTE FUNCTION update_consultas_seguimiento_updated_at();

-- Activar Row Level Security
ALTER TABLE public.consultas_seguimiento ENABLE ROW LEVEL SECURITY;

-- Política para permitir todas las operaciones (ajustar según necesidades de seguridad)
CREATE POLICY "Enable all operations for consultas_seguimiento" 
ON public.consultas_seguimiento
FOR ALL
USING (true)
WITH CHECK (true);
