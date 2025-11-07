-- 1. Si ya existe, elimínala
DROP TABLE IF EXISTS public.consultas CASCADE;

-- 2. Crear tabla limpia
CREATE TABLE public.consultas (
  -- ID autoincremental
  id BIGSERIAL PRIMARY KEY,

  -- Doctor y paciente
  Dr varchar(200),
  Px varchar(200),
  -- Clave Única de Registro de Población (CURP) de la paciente
  CURP varchar(18),
  Edad_Px integer,

  -- Signos vitales
  FC integer,
  PS integer,
  PD integer,
  EC varchar(50),

  -- Pruebas y resultados iniciales
  Prueba_Emb varchar(50),
  Resultado_Emb varchar(50),
  Hallazgos text,
  Eco_abdominal varchar(50),
  Resultado_EcoAbd varchar(100),

  -- CONSULTA 1
  Sintomas text,
  Fac_Riesg text,
  TVUS_1 varchar(50),
  hCG_1 numeric(10,2),
  Pronostico_1 varchar(100),
  Consulta_1_Date timestamp with time zone,

  -- CONSULTA 2
  Sintomas_2 text,
  Factores_2 text,
  TVUS_2 varchar(50),
  hCG_2 numeric(10,2),
  Variacion_hCG_2 varchar(50),
  Pronostico_2 varchar(100),
  Consulta_2_Date timestamp with time zone,

  -- CONSULTA 3
  Sintomas_3 text,
  Factores_3 text,
  TVUS_3 varchar(50),
  hCG_3 numeric(10,2),
  Variacion_hCG_3 varchar(50),
  Pronostico_3 varchar(100),
  Consulta_3_Date timestamp with time zone,

  -- Control del sistema
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Trigger para actualizar "updated_at"
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_consultas_updated_at ON public.consultas;

CREATE TRIGGER update_consultas_updated_at
BEFORE UPDATE ON public.consultas
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 4. Activar Row Level Security (opcional)
ALTER TABLE public.consultas ENABLE ROW LEVEL SECURITY;

-- Index to speed up searches by CURP (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_consultas_curp ON public.consultas (CURP);
