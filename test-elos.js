import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'database', 'holiday.db'));

// Procurar conquista Fundador e Initiate
db.all(`SELECT uc.*, cr.* FROM user_custom_ranks uc 
        JOIN custom_ranks cr ON uc.customRankId = cr.id 
        ORDER BY cr.name`, (err, rows) => {
    if (err) {
        console.error('Erro ao consultar:', err);
    } else {
        console.log('\n=== CONQUISTAS CUSTOMIZADOS NO BANCO ===');
        console.log(JSON.stringify(rows, null, 2));
    }
    
    // Procurar usuário Fael
    db.get(`SELECT id, nickname, selectedRanks FROM users WHERE nickname LIKE '%ael%' OR firstname LIKE '%fael%'`, (err, user) => {
        if (err) {
            console.error('Erro:', err);
        } else {
            console.log('\n=== USUÁRIO ENCONTRADO ===');
            console.log('User:', user);
            
            if (user) {
                db.all(`SELECT uc.*, cr.name, cr.color, cr.icon FROM user_custom_ranks uc 
                        JOIN custom_ranks cr ON uc.customRankId = cr.id 
                        WHERE uc.userId = ?`, [user.id], (err, ranks) => {
                    console.log('\n=== CONQUISTAS DO USUÁRIO ' + user.nickname.toUpperCase() + ' ===');
                    if (err) {
                        console.error('Erro:', err);
                    } else {
                        console.log('Ranks from junction table:', JSON.stringify(ranks, null, 2));
                        console.log('selectedRanks column:', user.selectedRanks);
                        
                        // Procurar todos os conquistas customizados disponíveis
                        db.all(`SELECT * FROM custom_ranks WHERE isDefault = 0`, (err, allRanks) => {
                            console.log('\n=== TODOS OS CONQUISTAS CUSTOMIZADOS ===');
                            console.log(JSON.stringify(allRanks, null, 2));
                            db.close();
                        });
                    }
                });
            } else {
                db.close();
            }
        }
    });
});


