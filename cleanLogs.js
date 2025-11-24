// cleanLogs.js
const fs = require('fs').promises;
const path = require('path');

/**
 * Clase para manejar la limpieza de logs.
 * Single Responsibility: Solo se encarga de limpiar archivos antiguos.
 */
class LogCleaner {
  /**
   * @param {string} logDir - Directorio de logs.
   * @param {number} maxAgeDays - Edad máxima en días antes de eliminar.
   * @param {object} fsModule - Módulo fs para inyección de dependencias.
   */
  constructor(logDir, maxAgeDays, fsModule = fs) {
    this.logDir = logDir;
    this.maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
    this.fs = fsModule;
  }

  /**
   * Limpia logs antiguos de manera asíncrona.
   */
  async clean() {
    try {
      const files = await this.fs.readdir(this.logDir);
      const now = Date.now();

      for (const file of files) {
        if (!file.endsWith('.log')) continue; // Filtrar solo logs

        const filePath = path.join(this.logDir, file);
        const stats = await this.fs.stat(filePath);

        if (now - stats.mtimeMs > this.maxAgeMs) {
          await this.fs.unlink(filePath);
          console.log(`Eliminado: ${filePath}`);
        }
      }
      console.log('Limpieza completada.');
    } catch (error) {
      console.error('Error en limpieza:', error.message);
      throw error; // Propagar error para manejo superior
    }
  }
}

// Uso: node cleanLogs.js
const cleaner = new LogCleaner('./logs', 7);
cleaner.clean();