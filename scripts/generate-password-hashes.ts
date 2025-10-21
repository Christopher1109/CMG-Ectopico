import bcrypt from "bcryptjs"

const usuarios = [
  { usuario: "dr.martinez", contraseña: "CMG2024Med!" },
  { usuario: "dra.rodriguez", contraseña: "Ectopico2024#" },
  { usuario: "dr.garcia", contraseña: "MedCMG2024$" },
  { usuario: "Dra.Alma", contraseña: "Nuevoleon" },
  { usuario: "Dr.Francisco", contraseña: "Francisco" },
  { usuario: "Christopher", contraseña: "Matutito22" },
]

async function generateHashes() {
  console.log("Generando hashes de contraseñas...\n")

  for (const user of usuarios) {
    const hash = await bcrypt.hash(user.contraseña, 10)
    console.log(`{`)
    console.log(`  usuario: "${user.usuario}",`)
    console.log(`  hash: "${hash}", // ${user.contraseña}`)
    console.log(`},\n`)
  }
}

generateHashes()
