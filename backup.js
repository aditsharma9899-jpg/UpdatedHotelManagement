const fs = require('fs').promises;
const path = require('path');

const DATA_FILE = path.join(__dirname, 'hotel_data.json');
const BACKUP_DIR = path.join(__dirname, 'backups');

// Create backup directory if it doesn't exist
async function ensureBackupDir() {
    try {
        await fs.access(BACKUP_DIR);
    } catch {
        await fs.mkdir(BACKUP_DIR, { recursive: true });
        console.log('📁 Backup directory created');
    }
}

// Create daily backup
async function createBackup() {
    try {
        await ensureBackupDir();
        
        const fileExists = await fs.access(DATA_FILE).then(() => true).catch(() => false);
        if (!fileExists) {
            console.log('⚠️ No data file to backup');
            return;
        }
        
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
        const backupFile = path.join(BACKUP_DIR, `backup_${timestamp}.json`);
        
        await fs.writeFile(backupFile, data, 'utf8');
        console.log(`✅ Backup created: ${backupFile}`);
        
        // Clean old backups (keep only last 30 days)
        await cleanOldBackups();
    } catch (error) {
        console.error('❌ Backup error:', error);
    }
}

// Clean backups older than 30 days
async function cleanOldBackups() {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const now = Date.now();
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        
        for (const file of files) {
            const filePath = path.join(BACKUP_DIR, file);
            const stats = await fs.stat(filePath);
            
            if (now - stats.mtime.getTime() > thirtyDays) {
                await fs.unlink(filePath);
                console.log(`🗑️ Deleted old backup: ${file}`);
            }
        }
    } catch (error) {
        console.error('❌ Error cleaning backups:', error);
    }
}

// Restore from latest backup
async function restoreFromBackup() {
    try {
        const files = await fs.readdir(BACKUP_DIR);
        const backupFiles = files.filter(f => f.startsWith('backup_')).sort().reverse();
        
        if (backupFiles.length === 0) {
            console.log('⚠️ No backups found');
            return false;
        }
        
        const latestBackup = path.join(BACKUP_DIR, backupFiles[0]);
        const data = await fs.readFile(latestBackup, 'utf8');
        await fs.writeFile(DATA_FILE, data, 'utf8');
        
        console.log(`✅ Restored from backup: ${backupFiles[0]}`);
        return true;
    } catch (error) {
        console.error('❌ Restore error:', error);
        return false;
    }
}

// Schedule daily backup at 2 AM
function scheduleBackups() {
    // Backup every 6 hours
    setInterval(createBackup, 6 * 60 * 60 * 1000);
    
    // Initial backup
    createBackup();
}

module.exports = {
    createBackup,
    restoreFromBackup,
    scheduleBackups
};