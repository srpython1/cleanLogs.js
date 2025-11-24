#!/usr/bin/env node
/**
 * Automatic Temp Files Cleanup
 * Elimina archivos temporales antiguos automáticamente
 * 
 * Uso: node cleanup-temp-files.js
 */

const fs = require('fs');
const path = require('path');

// ============ CONFIGURACIÓN ============
const CONFIG = {
  directories: ['./temp', './logs', './cache'],
  filePatterns: ['.tmp', '.log', '.cache'],
  daysOld: 7,
  dryRun: false // Cambiar a true para simular sin borrar
};

// ============ FUNCIONES ============
class FileCleanup {
  constructor(config) {
    this.config = config;
    this.stats = { scanned: 0, deleted: 0, freed: 0 };
  }

  async run() {
    console.log('🧹 Iniciando limpieza de archivos temporales...\n');
    
    for (const dir of this.config.directories) {
      if (fs.existsSync(dir)) {
        await this.cleanDirectory(dir);
      } else {
        console.log(`⚠️  Directorio no existe: ${dir}`);
      }
    }

    this.printSummary();
  }

  async cleanDirectory(dirPath) {
    console.log(`📁 Escaneando: ${dirPath}`);
    
    const files = this.getFilesRecursive(dirPath);
    
    for (const file of files) {
      this.stats.scanned++;
      
      if (this.shouldDelete(file)) {
        await this.deleteFile(file);
      }
    }
  }

  getFilesRecursive(dir) {
    let results = [];
    
    try {
      const list = fs.readdirSync(dir);
      
      list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          results = results.concat(this.getFilesRecursive(filePath));
        } else {
          results.push(filePath);
        }
      });
    } catch (error) {
      console.log(`❌ Error leyendo ${dir}: ${error.message}`);
    }
    
    return results;
  }

  shouldDelete(filePath) {
    const ext = path.extname(filePath);
    const hasPattern = this.config.filePatterns.some(p => filePath.includes(p));
    
    if (!hasPattern) return false;

    const stats = fs.statSync(filePath);
    const daysOld = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24);
    
    return daysOld > this.config.daysOld;
  }

  async deleteFile(filePath) {
    try {
      const stats = fs.statSync(filePath);
      
      if (this.config.dryRun) {
        console.log(`🔍 [DRY RUN] Borraría: ${filePath}`);
      } else {
        fs.unlinkSync(filePath);
        console.log(`✅ Eliminado: ${filePath}`);
      }
      
      this.stats.deleted++;
      this.stats.freed += stats.size;
    } catch (error) {
      console.log(`❌ Error borrando ${filePath}: ${error.message}`);
    }
  }

  printSummary() {
    const freedMB = (this.stats.freed / 1024 / 1024).toFixed(2);
    
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE LIMPIEZA');
    console.log('='.repeat(50));
    console.log(`Archivos escaneados: ${this.stats.scanned}`);
    console.log(`Archivos eliminados: ${this.stats.deleted}`);
    console.log(`Espacio liberado: ${freedMB} MB`);
    console.log('='.repeat(50));
  }
}

// ============ EJECUCIÓN ============
const cleanup = new FileCleanup(CONFIG);
cleanup.run().catch(console.error);