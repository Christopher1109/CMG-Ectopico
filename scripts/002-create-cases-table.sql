-- =====================================================
-- Tabla: cases (casos de pacientes en seguimiento)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id TEXT NOT NULL DEFAULT 'CMG',
  folio TEXT UNIQUE NOT NULL,
  patient_name TEXT NOT NULL,
  patient_age INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_consult_started_at TIMESTAMPTZ,
  last_consult_finished_at TIMESTAMPTZ,
  last_risk_probability NUMERIC(5,4),
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (status IN ('ACTIVE', 'CLOSED_NO_ECTOPIC', 'CLOSED_ECTOPIC', 'LOST_FOLLOWUP')),
  closure_reason TEXT,
  closed_at TIMESTAMPTZ,
  doctor_name TEXT,
  consulta_id BIGINT REFERENCES public.consultas(id) ON DELETE SET NULL
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_cases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cases_updated_at ON public.cases;
CREATE TRIGGER trg_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW EXECUTE FUNCTION update_cases_updated_at();

-- RLS
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

-- Índices
CREATE INDEX IF NOT EXISTS idx_cases_hospital_id ON public.cases (hospital_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases (status);
CREATE INDEX IF NOT EXISTS idx_cases_folio ON public.cases (folio);
