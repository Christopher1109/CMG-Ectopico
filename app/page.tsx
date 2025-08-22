"use client"

import type React from "react"

import { useState } from "react"
import { calcularRiesgo, guardarDatosIncompletos, validarPruebaEmbarazo } from "./utils"

export default function Page() {
  const [pruebaEmbarazoRealizada, setPruebaEmbarazoRealizada] = useState("")
  const [resultadoPruebaEmbarazo, setResultadoPruebaEmbarazo] = useState("")
  const [mostrarAlerta, setMostrarAlerta] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState("")
  const [mensajeFinal, setMensajeFinal] = useState<React.ReactNode>(null)
  const [protocoloFinalizado, setProtocoloFinalizado] = useState(false)
  const [cargando, setCargando] = useState(false)

  const manejarContinuar = async () => {
    if (pruebaEmbarazoRealizada === "no") {
      // Mostrar alerta amarilla inmediatamente
      setMostrarAlerta(true)
      setMensajeAlerta(
        "Se recomienda realizar una prueba de embarazo cualitativa antes de continuar con la evaluación.",
      )

      // Después de 2 segundos, proceder con validación backend
      setTimeout(async () => {
        setCargando(true)
        try {
          const respuesta = await calcularRiesgo({
            pruebaEmbarazoRealizada: "no",
            resultadoPruebaEmbarazo: "",
            tvus: "normal", // dummy para validación
            hcgValor: "1000", // dummy para validación
          })

          if (respuesta.bloqueado && respuesta.motivo === "prueba_embarazo_no_realizada") {
            await guardarDatosIncompletos("prueba_embarazo_no_realizada", 3)
            setMensajeFinal(
              <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">Evaluación Completada</h3>
                <p className="text-red-700">{respuesta.mensaje}</p>
              </div>,
            )
            setProtocoloFinalizado(true)
          }
        } catch (error) {
          console.warn("Error en validación:", error)
          await guardarDatosIncompletos("prueba_embarazo_no_realizada", 3)
          setMensajeFinal(
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Evaluación Completada</h3>
              <p className="text-red-700">
                Se recomienda realizar una prueba de embarazo cualitativa antes de continuar con la evaluación de riesgo
                de embarazo ectópico.
              </p>
            </div>,
          )
          setProtocoloFinalizado(true)
        } finally {
          setCargando(false)
        }
      }, 2000)
    } else if (pruebaEmbarazoRealizada === "si" && resultadoPruebaEmbarazo === "negativa") {
      // Mostrar alerta amarilla inmediatamente
      setMostrarAlerta(true)
      setMensajeAlerta(
        "Con prueba de embarazo negativa, es poco probable un embarazo ectópico. Se recomienda valoración médica para descartar otras causas.",
      )

      // Después de 2 segundos, proceder con validación backend
      setTimeout(async () => {
        setCargando(true)
        try {
          const respuesta = await calcularRiesgo({
            pruebaEmbarazoRealizada: "si",
            resultadoPruebaEmbarazo: "negativa",
            tvus: "normal", // dummy para validación
            hcgValor: "1000", // dummy para validación
          })

          if (respuesta.bloqueado && respuesta.motivo === "prueba_embarazo_negativa") {
            await guardarDatosIncompletos("prueba_embarazo_negativa", 3)
            setMensajeFinal(
              <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-semibold text-red-800 mb-2">Evaluación Completada</h3>
                <p className="text-red-700">{respuesta.mensaje}</p>
              </div>,
            )
            setProtocoloFinalizado(true)
          }
        } catch (error) {
          console.warn("Error en validación:", error)
          await guardarDatosIncompletos("prueba_embarazo_negativa", 3)
          setMensajeFinal(
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
              <h3 className="font-semibold text-red-800 mb-2">Evaluación Completada</h3>
              <p className="text-red-700">
                Con prueba de embarazo negativa, es poco probable un embarazo ectópico. Se recomienda valoración médica
                para descartar otras causas.
              </p>
            </div>,
          )
          setProtocoloFinalizado(true)
        } finally {
          setCargando(false)
        }
      }, 2000)
    } else {
      // Validación normal para casos positivos
      const esValido = await validarPruebaEmbarazo()
      if (esValido) {
        console.log("Continuando con la siguiente sección...")
      }
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Calculadora de Riesgo de Embarazo Ectópico</h1>

          {!protocoloFinalizado ? (
            <>
              {/* Sección de prueba de embarazo */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-4">¿Se realizó prueba de embarazo?</h2>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="si"
                      checked={pruebaEmbarazoRealizada === "si"}
                      onChange={(e) => {
                        setPruebaEmbarazoRealizada(e.target.value)
                        setMostrarAlerta(false)
                        setMensajeAlerta("")
                      }}
                      className="text-blue-600"
                    />
                    <span>Sí</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      value="no"
                      checked={pruebaEmbarazoRealizada === "no"}
                      onChange={(e) => {
                        setPruebaEmbarazoRealizada(e.target.value)
                        setResultadoPruebaEmbarazo("")
                        setMostrarAlerta(false)
                        setMensajeAlerta("")
                      }}
                      className="text-blue-600"
                    />
                    <span>No</span>
                  </label>
                </div>
              </div>

              {/* Resultado de la prueba si se realizó */}
              {pruebaEmbarazoRealizada === "si" && (
                <div className="mb-6">
                  <h2 className="text-lg font-semibold mb-4">Resultado de la prueba:</h2>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="positiva"
                        checked={resultadoPruebaEmbarazo === "positiva"}
                        onChange={(e) => {
                          setResultadoPruebaEmbarazo(e.target.value)
                          setMostrarAlerta(false)
                          setMensajeAlerta("")
                        }}
                        className="text-blue-600"
                      />
                      <span>Positiva</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        value="negativa"
                        checked={resultadoPruebaEmbarazo === "negativa"}
                        onChange={(e) => {
                          setResultadoPruebaEmbarazo(e.target.value)
                          setMostrarAlerta(false)
                          setMensajeAlerta("")
                        }}
                        className="text-blue-600"
                      />
                      <span>Negativa</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Alerta */}
              {mostrarAlerta && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="text-yellow-800">
                      <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {mensajeAlerta}
                    </div>
                  </div>
                </div>
              )}

              {/* Botón Continuar */}
              <button
                onClick={manejarContinuar}
                disabled={
                  !pruebaEmbarazoRealizada || (pruebaEmbarazoRealizada === "si" && !resultadoPruebaEmbarazo) || cargando
                }
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {cargando ? "Procesando..." : "Continuar"}
              </button>
            </>
          ) : (
            /* Mensaje Final */
            <div className="text-center">
              {mensajeFinal}
              <div className="mt-4 text-sm text-gray-500">Protocolo finalizado.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
