import { readFileSync, writeFileSync } from "fs"

const filePath = "./app/page.tsx"
let content = readFileSync(filePath, "utf8")

// Eliminar líneas que contengan console.log("[v0]
const lines = content.split("\n")
const cleaned = lines.filter((line) => !line.includes('console.log("[v0]'))
content = cleaned.join("\n")

writeFileSync(filePath, content, "utf8")
console.log(`Done. Removed ${lines.length - cleaned.length} debug log lines.`)
