-- Renombrar columna folio a folio_paciente para consistencia
ALTER TABLE public.consultas_seguimiento 
  RENAME COLUMN folio TO folio_paciente;

-- Actualizar el constraint de foreign key
ALTER TABLE public.consultas_seguimiento 
  DROP CONSTRAINT IF EXISTS fk_consulta_principal;

ALTER TABLE public.consultas_seguimiento
  ADD CONSTRAINT fk_consulta_principal 
    FOREIGN KEY (folio_paciente) 
    REFERENCES public.consultas(folio) 
    ON DELETE CASCADE;

-- Actualizar índice
DROP INDEX IF EXISTS public.idx_seguimiento_folio;
CREATE INDEX idx_seguimiento_folio_paciente 
  ON public.consultas_seguimiento(folio_paciente);

-- Actualizar constraint único
ALTER TABLE public.consultas_seguimiento 
  DROP CONSTRAINT IF EXISTS unique_folio_numero;

ALTER TABLE public.consultas_seguimiento
  ADD CONSTRAINT unique_folio_numero 
    UNIQUE (folio_paciente, numero_consulta);

-- Recargar esquema
NOTIFY pgrst, 'reload schema';
