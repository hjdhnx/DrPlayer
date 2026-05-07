import { execSync } from 'child_process'
import { resolve, dirname } from 'path'
import { existsSync, renameSync, unlinkSync, rmSync } from 'fs'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

const target = process.argv[2]
if (!target) {
  console.error('Usage: node scripts/build-zip.js <target-dir>')
  process.exit(1)
}

const srcDir = resolve(root, target, 'drplayer')
const zipFile = resolve(root, target, 'drplayer.zip')
const finalFile = resolve(root, target, 'drplayer')

if (!existsSync(srcDir)) {
  console.error(`Source directory not found: ${srcDir}`)
  process.exit(1)
}

// Remove leftover zip if exists
if (existsSync(zipFile)) unlinkSync(zipFile)

// Compress contents of srcDir (no nesting — files go directly into zip root)
execSync(
  `powershell -Command "Compress-Archive -Path '${srcDir}\\*' -DestinationPath '${zipFile}'"`,
  { stdio: 'inherit' }
)

// Remove the source directory, then rename zip to final name
rmSync(srcDir, { recursive: true, force: true })
renameSync(zipFile, finalFile)

console.log(`Done: ${finalFile}`)
