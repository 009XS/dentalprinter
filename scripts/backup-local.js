import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Definir rutas relativas al directorio del proyecto
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const backupParentDir = path.join(projectRoot, 'backups-auto');
const dbPath = path.join(projectRoot, 'prisma', 'dev.db');
const uploadsPath = path.join(projectRoot, 'uploads');

try {
  // Generar timestamp con formato YYYY-MM-DD_HH-MM-SS
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/T/, '_')
    .replace(/\..+/, '')
    .replace(/:/g, '-');
  
  const targetBackupDir = path.join(backupParentDir, `backup_${timestamp}`);

  console.log(`[Backup] Iniciando respaldo local en: ${targetBackupDir}`);

  // Crear carpeta principal de respaldos si no existe
  if (!fs.existsSync(backupParentDir)) {
    fs.mkdirSync(backupParentDir, { recursive: true });
    console.log(`[Backup] Creado directorio principal de respaldos: ${backupParentDir}`);
  }

  // Crear la subcarpeta específica para este respaldo
  fs.mkdirSync(targetBackupDir, { recursive: true });

  // Copiar base de datos
  if (fs.existsSync(dbPath)) {
    const targetDbPath = path.join(targetBackupDir, 'dev.db');
    fs.copyFileSync(dbPath, targetDbPath);
    console.log(`[Backup] Base de datos SQLite copiada correctamente en: dev.db`);
  } else {
    console.log(`[Backup] Advertencia: No se encontró archivo de base de datos en: ${dbPath}`);
  }

  // Copiar adjuntos clínicos (carpeta uploads/)
  if (fs.existsSync(uploadsPath)) {
    const targetUploadsPath = path.join(targetBackupDir, 'uploads');
    
    // Usar fs.cpSync (Node.js 16.7+) para copiado recursivo
    if (typeof fs.cpSync === 'function') {
      fs.cpSync(uploadsPath, targetUploadsPath, { recursive: true });
    } else {
      // Fallback si la versión de Node.js no soporta cpSync
      const copyRecursive = (src, dest) => {
        const stats = fs.statSync(src);
        if (stats.isDirectory()) {
          fs.mkdirSync(dest, { recursive: true });
          fs.readdirSync(src).forEach(child => {
            copyRecursive(path.join(src, child), path.join(dest, child));
          });
        } else {
          fs.copyFileSync(src, dest);
        }
      };
      copyRecursive(uploadsPath, targetUploadsPath);
    }
    console.log(`[Backup] Carpeta de adjuntos (uploads/) copiada recursivamente.`);
  } else {
    console.log(`[Backup] Nota: No se encontró la carpeta 'uploads/'. Nada que respaldar para este concepto.`);
  }

  console.log(`[Backup] ¡Respaldo finalizado con éxito!`);
} catch (error) {
  console.error(`[Backup] ERROR crítico al ejecutar respaldo:`, error);
  process.exit(1);
}
