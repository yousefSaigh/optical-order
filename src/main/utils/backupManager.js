/**
 * Database Backup Manager
 * Provides automatic and manual backup functionality for the SQLite database
 */

const fs = require('fs');
const path = require('path');
const { app } = require('electron');

/**
 * Get the backup directory path
 */
function getBackupDir() {
  const userDataPath = app.getPath('userData');
  const backupDir = path.join(userDataPath, 'backups');
  
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  
  return backupDir;
}

/**
 * Get the database file path
 */
function getDatabasePath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'database', 'optical_orders.db');
}

/**
 * Create a backup of the database
 * @param {string} reason - Reason for backup (e.g., 'scheduled', 'manual', 'pre-update')
 * @returns {Object} - { success, backupPath, error }
 */
function createBackup(reason = 'manual') {
  try {
    const dbPath = getDatabasePath();
    
    // Check if database exists
    if (!fs.existsSync(dbPath)) {
      return {
        success: false,
        backupPath: null,
        error: 'Database file not found'
      };
    }
    
    const backupDir = getBackupDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFilename = `backup_${reason}_${timestamp}.db`;
    const backupPath = path.join(backupDir, backupFilename);
    
    // Copy database file
    fs.copyFileSync(dbPath, backupPath);
    
    // Also copy WAL and SHM files if they exist (SQLite WAL mode)
    const walPath = dbPath + '-wal';
    const shmPath = dbPath + '-shm';
    
    if (fs.existsSync(walPath)) {
      fs.copyFileSync(walPath, backupPath + '-wal');
    }
    if (fs.existsSync(shmPath)) {
      fs.copyFileSync(shmPath, backupPath + '-shm');
    }
    
    console.log(`✅ Backup created: ${backupFilename}`);
    
    // Clean up old backups
    cleanOldBackups(backupDir, 30); // Keep last 30 backups
    
    return {
      success: true,
      backupPath,
      error: null
    };
  } catch (error) {
    console.error('Backup failed:', error);
    return {
      success: false,
      backupPath: null,
      error: error.message
    };
  }
}

/**
 * Get list of available backups
 * @returns {Array} - Array of backup info objects
 */
function listBackups() {
  try {
    const backupDir = getBackupDir();
    
    if (!fs.existsSync(backupDir)) {
      return [];
    }
    
    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.db') && f.startsWith('backup_'))
      .map(filename => {
        const filePath = path.join(backupDir, filename);
        const stats = fs.statSync(filePath);
        
        // Parse backup info from filename
        const match = filename.match(/backup_(.+)_(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2})/);
        
        return {
          filename,
          path: filePath,
          reason: match ? match[1] : 'unknown',
          timestamp: match ? match[2].replace(/-/g, ':').replace('T', ' ').substring(0, 19) : 'unknown',
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          created: stats.birthtime
        };
      })
      .sort((a, b) => b.created - a.created);
    
    return files;
  } catch (error) {
    console.error('Error listing backups:', error);
    return [];
  }
}

/**
 * Restore database from a backup
 * @param {string} backupPath - Path to the backup file
 * @returns {Object} - { success, error }
 */
function restoreFromBackup(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      return { success: false, error: 'Backup file not found' };
    }
    
    const dbPath = getDatabasePath();
    
    // Create a backup of current database before restoring
    const preRestoreBackup = createBackup('pre-restore');
    if (!preRestoreBackup.success) {
      console.warn('Could not create pre-restore backup:', preRestoreBackup.error);
    }
    
    // Copy backup over current database
    fs.copyFileSync(backupPath, dbPath);
    
    // Copy WAL and SHM files if they exist in backup
    const walBackup = backupPath + '-wal';
    const shmBackup = backupPath + '-shm';
    
    if (fs.existsSync(walBackup)) {
      fs.copyFileSync(walBackup, dbPath + '-wal');
    } else if (fs.existsSync(dbPath + '-wal')) {
      // Remove existing WAL if backup doesn't have one
      fs.unlinkSync(dbPath + '-wal');
    }
    
    if (fs.existsSync(shmBackup)) {
      fs.copyFileSync(shmBackup, dbPath + '-shm');
    } else if (fs.existsSync(dbPath + '-shm')) {
      fs.unlinkSync(dbPath + '-shm');
    }
    
    console.log('✅ Database restored from backup');
    return { success: true, error: null };
  } catch (error) {
    console.error('Restore failed:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete a specific backup
 * @param {string} backupPath - Path to backup to delete
 * @returns {Object} - { success, error }
 */
function deleteBackup(backupPath) {
  try {
    if (!fs.existsSync(backupPath)) {
      return { success: false, error: 'Backup file not found' };
    }

    fs.unlinkSync(backupPath);

    // Also delete WAL and SHM if they exist
    if (fs.existsSync(backupPath + '-wal')) {
      fs.unlinkSync(backupPath + '-wal');
    }
    if (fs.existsSync(backupPath + '-shm')) {
      fs.unlinkSync(backupPath + '-shm');
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Clean up old backups, keeping only the most recent ones
 * @param {string} backupDir - Backup directory path
 * @param {number} keepCount - Number of backups to keep
 */
function cleanOldBackups(backupDir, keepCount = 30) {
  try {
    const backups = listBackups();

    if (backups.length <= keepCount) {
      return;
    }

    // Delete oldest backups beyond keepCount
    const toDelete = backups.slice(keepCount);

    for (const backup of toDelete) {
      deleteBackup(backup.path);
      console.log(`🗑️ Deleted old backup: ${backup.filename}`);
    }
  } catch (error) {
    console.error('Error cleaning old backups:', error);
  }
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Get backup statistics
 */
function getBackupStats() {
  const backups = listBackups();
  const backupDir = getBackupDir();

  let totalSize = 0;
  for (const backup of backups) {
    totalSize += backup.size;
  }

  return {
    count: backups.length,
    totalSize,
    totalSizeFormatted: formatBytes(totalSize),
    backupDir,
    latestBackup: backups.length > 0 ? backups[0] : null
  };
}

module.exports = {
  createBackup,
  listBackups,
  restoreFromBackup,
  deleteBackup,
  cleanOldBackups,
  getBackupStats,
  getBackupDir
};

