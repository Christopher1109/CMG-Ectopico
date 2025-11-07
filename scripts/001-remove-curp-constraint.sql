-- Script para eliminar el constraint de formato de CURP que causa errores
-- Este constraint fue agregado manualmente y está impidiendo guardar consultas

-- Eliminar el constraint si existe
ALTER TABLE public.consultas 
DROP CONSTRAINT IF EXISTS consultas_curp_formato_chk;

-- El CURP ahora puede ser cualquier valor varchar(18) o NULL
-- La validación de formato (si se necesita) se hará en el frontend
