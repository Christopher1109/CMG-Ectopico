const express = require("express")
const cors = require("cors")
const { Pool } = require("pg")
require("dotenv").config()

const app = express()
const port = process.env.PORT || 3001

// Configuración de la base de datos PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
})

// Middleware
app.use(cors())
app.use(express.json())

// Rutas para pacientes
app.get("/api/paciente/:id", async (req, res) => {
  try {
    const { id } = req.params
    const result = await pool.query("SELECT * FROM consultas WHERE id = $1", [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Paciente no encontrado" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error al obtener paciente:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

app.post("/api/paciente", async (req, res) => {
  try {
    const consulta = req.body
    const query = `
      INSERT INTO consultas (
        id, fecha_creacion, fecha_ultima_actualizacion, usuario_creador,
        nombre_paciente, edad_paciente, frecuencia_cardiaca, presion_sistolica,
        presion_diastolica, estado_conciencia, prueba_embarazo_realizada,
        resultado_prueba_embarazo, hallazgos_exploracion, tiene_eco_transabdominal,
        resultado_eco_transabdominal, sintomas_seleccionados, factores_seleccionados,
        tvus, hcg_valor, variacion_hcg, hcg_anterior, resultado
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `

    const values = [
      consulta.id,
      consulta.fechaCreacion,
      consulta.fechaUltimaActualizacion,
      consulta.usuarioCreador,
      consulta.nombrePaciente,
      consulta.edadPaciente,
      consulta.frecuenciaCardiaca,
      consulta.presionSistolica,
      consulta.presionDiastolica,
      consulta.estadoConciencia,
      consulta.pruebaEmbarazoRealizada,
      consulta.resultadoPruebaEmbarazo,
      consulta.hallazgosExploracion,
      consulta.tieneEcoTransabdominal,
      consulta.resultadoEcoTransabdominal,
      JSON.stringify(consulta.sintomasSeleccionados),
      JSON.stringify(consulta.factoresSeleccionados),
      consulta.tvus,
      consulta.hcgValor,
      consulta.variacionHcg,
      consulta.hcgAnterior,
      consulta.resultado,
    ]

    const result = await pool.query(query, values)
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error("Error al crear consulta:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

app.put("/api/paciente/:id", async (req, res) => {
  try {
    const { id } = req.params
    const consulta = req.body

    const query = `
      UPDATE consultas SET
        fecha_ultima_actualizacion = $2, nombre_paciente = $3, edad_paciente = $4,
        frecuencia_cardiaca = $5, presion_sistolica = $6, presion_diastolica = $7,
        estado_conciencia = $8, prueba_embarazo_realizada = $9, resultado_prueba_embarazo = $10,
        hallazgos_exploracion = $11, tiene_eco_transabdominal = $12, resultado_eco_transabdominal = $13,
        sintomas_seleccionados = $14, factores_seleccionados = $15, tvus = $16,
        hcg_valor = $17, variacion_hcg = $18, hcg_anterior = $19, resultado = $20
      WHERE id = $1
      RETURNING *
    `

    const values = [
      id,
      consulta.fechaUltimaActualizacion,
      consulta.nombrePaciente,
      consulta.edadPaciente,
      consulta.frecuenciaCardiaca,
      consulta.presionSistolica,
      consulta.presionDiastolica,
      consulta.estadoConciencia,
      consulta.pruebaEmbarazoRealizada,
      consulta.resultadoPruebaEmbarazo,
      consulta.hallazgosExploracion,
      consulta.tieneEcoTransabdominal,
      consulta.resultadoEcoTransabdominal,
      JSON.stringify(consulta.sintomasSeleccionados),
      JSON.stringify(consulta.factoresSeleccionados),
      consulta.tvus,
      consulta.hcgValor,
      consulta.variacionHcg,
      consulta.hcgAnterior,
      consulta.resultado,
    ]

    const result = await pool.query(query, values)

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Consulta no encontrada" })
    }

    res.json(result.rows[0])
  } catch (error) {
    console.error("Error al actualizar consulta:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

// Ruta para obtener todas las consultas (para dashboard)
app.get("/api/consultas", async (req, res) => {
  try {
    const { usuario, limite = 50, offset = 0 } = req.query

    let query = "SELECT * FROM consultas"
    const values = []

    if (usuario) {
      query += " WHERE usuario_creador = $1"
      values.push(usuario)
    }

    query += " ORDER BY fecha_creacion DESC LIMIT $" + (values.length + 1) + " OFFSET $" + (values.length + 2)
    values.push(limite, offset)

    const result = await pool.query(query, values)
    res.json(result.rows)
  } catch (error) {
    console.error("Error al obtener consultas:", error)
    res.status(500).json({ error: "Error interno del servidor" })
  }
})

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`)
})
