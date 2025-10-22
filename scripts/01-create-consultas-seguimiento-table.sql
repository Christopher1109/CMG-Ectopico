-- Tabla para consultas de seguimiento (ilimitadas)
CREATE TABLE IF NOT EXISTS public.consultas_seguimiento (
  id BIGSERIAL PRIMARY KEY,
  folio BIGINT NOT NULL,
  numero_consulta INTEGER NOT NULL,
  
  -- Datos clínicos
  sintomas TEXT,
  factores_riesgo TEXT,
  tvus VARCHAR(50),
  hcg NUMERIC(10,2),
  variacion_hcg VARCHAR(50),
  pronostico VARCHAR(100),
  
  -- Metadatos
  fecha_consulta TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Relación con consulta principal
  CONSTRAINT fk_consulta_principal 
    FOREIGN KEY (folio) 
    REFERENCES public.consultas(folio) 
    ON DELETE CASCADE,
  
  -- Evitar duplicados
  CONSTRAINT unique_folio_numero 
    UNIQUE (folio, numero_consulta)
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_seguimiento_folio 
  ON public.consultas_seguimiento(folio);

CREATE INDEX IF NOT EXISTS idx_seguimiento_fecha 
  ON public.consultas_seguimiento(fecha_consulta DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_seguimiento_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_seguimiento_updated_at ON public.consultas_seguimiento;
CREATE TRIGGER update_seguimiento_updated_at
  BEFORE UPDATE ON public.consultas_seguimiento
  FOR EACH ROW
  EXECUTE FUNCTION public.update_seguimiento_updated_at();

-- RLS (Row Level Security)
ALTER TABLE public.consultas_seguimiento ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' 
      AND tablename='consultas_seguimiento' 
      AND policyname='todo_auth'
  ) THEN
    CREATE POLICY todo_auth ON public.consultas_seguimiento
      FOR ALL TO authenticated
      USING (true)
      WITH CHECK (true);
  END IF;
END$$;

-- Recargar esquema PostgREST
NOTIFY pgrst, 'reload schema';
