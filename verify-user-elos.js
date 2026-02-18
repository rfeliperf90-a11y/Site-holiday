import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'database', 'holiday.db'));

// Verificar usuário Fael (ID: 1)
const userId = 1;

console.log('=== VERIFICANDO DADOS DO USUÁRIO ' + userId + ' (FAEL) ===\n');

db.get(`SELECT id, nickname, selectedRanks FROM users WHERE id = ?`, [userId], (err, user) => {
    console.log('USER DATA:');
    console.log('  ID:', user?.id);
    console.log('  Nickname:', user?.nickname);
    console.log('  selectedRanks (JSON):', user?.selectedRanks);
    
    if (user?.selectedRanks) {
        try {
            const parsed = JSON.parse(user.selectedRanks);
            console.log('  selectedRanks (parsed array):', parsed);
        } catch (e) {
            console.log('  selectedRanks ERROR parsing:', e.message);
        }
    }
    
    console.log('\nUSER_CUSTOM_RANKS TABLE:');
    db.all(`SELECT uc.id, uc.userId, uc.customRankId, cr.name, cr.color 
            FROM user_custom_ranks uc 
            JOIN custom_ranks cr ON uc.customRankId = cr.id 
            WHERE uc.userId = ?
            ORDER BY uc.assignedAt DESC`, [userId], (err, ranks) => {
        if (err) {
            console.log('  ERROR:', err.message);
        } else {
            console.log('  Found', ranks?.length || 0, 'ranks:');
            ranks?.forEach(r => {
                console.log(`    - ${r.name} (ID: ${r.customRankId}, Color: ${r.color})`);
            });
        }
        
        // Tentar fazer a query que o backend faz
        console.log('\n=== BACKEND QUERY TEST ===');
        db.all(
            `SELECT cr.id, cr.name, cr.color, cr.icon, cr.description 
             FROM user_custom_ranks ucr
             JOIN custom_ranks cr ON ucr.customRankId = cr.id
             WHERE ucr.userId = ? 
             ORDER BY ucr.assignedAt DESC`,
            [userId],
            (err, rows) => {
                if (err) {
                    console.log('ERROR:', err.message);
                } else {
                    console.log('Query resultado:', rows?.length || 0, 'rows');
                    console.log(JSON.stringify(rows, null, 2));
                }
                db.close();
            }
        );
    });
});
