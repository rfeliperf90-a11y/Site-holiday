import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'database', 'holiday.db'));

const userId = 2; // coringa

console.log('=== VERIFICANDO CONQUISTAS DO USUÁRIO ID:' + userId + ' ===\n');

db.all(`SELECT uc.*, cr.name, cr.color, cr.icon FROM user_custom_ranks uc 
        JOIN custom_ranks cr ON uc.customRankId = cr.id 
        WHERE uc.userId = ?`, [userId], (err, ranks) => {
    if (err) {
        console.error('Erro:', err);
    } else {
        console.log('conquistas encontrados:', ranks.length);
        console.log(JSON.stringify(ranks, null, 2));
    }
    
    // Também mostrar todos os conquistas do usuário
    db.get(`SELECT * FROM users WHERE id = ?`, [userId], (err, user) => {
        console.log('\nDados do usuário:', user);
        
        // Procurar downloads deste usuário
        db.all(`SELECT id, name, authorPostageRank FROM downloads WHERE userId = ?`, [userId], (err, downloads) => {
            console.log('\nDownloads do usuário:', downloads ? downloads.length : 0);
            console.log(JSON.stringify(downloads, null, 2));
            db.close();
        });
    });
});


