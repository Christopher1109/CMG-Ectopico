-- Crear la base de datos
CREATE DATABASE calculadora_ectopico;

-- Usar la base de datos
\c calculadora_ectopico;

-- Crear tabla de consultas
CREATE TABLE consultas (
    id VARCHAR(20) PRIMARY KEY,
    fecha_creacion TIMESTAMP WITH TIME ZONE NOT NULL,
    fecha_ultima_actualizacion TIMESTAMP WITH TIME ZONE NOT NULL,
    usuario_creador VARCHAR(100) NOT NULL,
    nombre_paciente VARCHAR(200) NOT NULL,
    edad_paciente INTEGER NOT NULL,
    frecuencia_cardiaca INTEGER,
    presion_sistolica INTEGER,
    presion_diastolica INTEGER,
    estado_conciencia VARCHAR(50),
    prueba_embarazo_realizada VARCHAR(10),
    resultado_prueba_embarazo VARCHAR(20),
    hallazgos_exploracion TEXT,
    tiene_eco_transabdominal VARCHAR(10),
    resultado_eco_transabdominal VARCHAR(100),
    sintomas_seleccionados JSONB,
    factores_seleccionados JSONB,
    tvus VARCHAR(50),
    hcg_valor DECIMAL(10,2),
    variacion_hcg VARCHAR(50),
    hcg_anterior DECIMAL(10,2),
    resultado DECIMAL(6,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear índices para mejorar el rendimiento
CREATE INDEX idx_consultas_id ON consultas(id);
CREATE INDEX idx_consultas_usuario ON consultas(usuario_creador);
CREATE INDEX idx_consultas_fecha ON consultas(fecha_creacion);
CREATE INDEX idx_consultas_paciente ON consultas(nombre_paciente);

-- Crear tabla de usuarios (opcional, para gestión avanzada)
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    usuario VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    especialidad VARCHAR(100),
    hospital VARCHAR(200),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar usuarios existentes
INSERT INTO usuarios (usuario, nombre, especialidad) VALUES
('dr.martinez', 'Dr. Martínez', 'Ginecología'),
('dra.rodriguez', 'Dra. Rodríguez', 'Obstetricia'),
('dr.garcia', 'Dr. García', 'Medicina de Emergencias'),
('dra.lopez', 'Dra. López', 'Ginecología'),
('admin', 'Administrador', 'Administración'),
('Christopher', 'Christopher', 'Desarrollo');
