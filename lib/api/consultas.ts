// Funciones helper para interactuar con las APIs de consultas

export async function crearConsulta(datos: any) {
  try {
    console.log("Enviando datos a API:", datos)

    const response = await fetch("/api/consultas", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(datos),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Error response from API:", errorData)
      return { error: errorData.error || "Error al crear consulta" }
    }

    const result = await response.json()
    console.log("Respuesta exitosa de API:", result)
    return { data: result.data }
  } catch (error) {
    console.error("Error en crearConsulta:", error)
    return { error: "Error de conexión" }
  }
}

export async function obtenerConsulta(id: string) {
  try {
    const response = await fetch(`/api/consultas/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { error: errorData.error || "Error al obtener consulta" }
    }

    const result = await response.json()
    return { data: result.data }
  } catch (error) {
    console.error("Error en obtenerConsulta:", error)
    return { error: "Error de conexión" }
  }
}

export async function actualizarConsulta(id: string, visitaNo: 2 | 3, datos: any) {
  try {
    const response = await fetch(`/api/consultas/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ visitaNo, ...datos }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { error: errorData.error || "Error al actualizar consulta" }
    }

    const result = await response.json()
    return { data: result.data }
  } catch (error) {
    console.error("Error en actualizarConsulta:", error)
    return { error: "Error de conexión" }
  }
}

export async function eliminarConsulta(id: string) {
  try {
    const response = await fetch(`/api/consultas/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { error: errorData.error || "Error al eliminar consulta" }
    }

    const result = await response.json()
    return { data: result.message }
  } catch (error) {
    console.error("Error en eliminarConsulta:", error)
    return { error: "Error de conexión" }
  }
}

export async function listarConsultas() {
  try {
    const response = await fetch("/api/consultas", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return { error: errorData.error || "Error al listar consultas" }
    }

    const result = await response.json()
    return { data: result.data }
  } catch (error) {
    console.error("Error en listarConsultas:", error)
    return { error: "Error de conexión" }
  }
}
