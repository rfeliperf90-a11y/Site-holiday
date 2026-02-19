import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'database', 'holiday.db'));

// Procurar usu�rio coringa
db.get(`SELECT id, nickname FROM users WHERE nickname LIKE '%coringa%' OR nickname LIKE '%coringa%'`, (err, user) => {
    if (err) {
        console.error('Erro:', err);
    } else {
        console.log('\n=== USU�RIOS COM "CORINGA" ===');
        console.log('User:', user);
        
        // Procurar por @coringa
        db.all(`SELECT id, nickname FROM users WHERE nickname LIKE '%ora%' OR nickname LIKE '%Rafael%'`, (err, users) => {
            console.log('\nTodos os usu�rios:');
            console.log(JSON.stringify(users, null, 2));
            
            if (users && users.length > 0) {
                // Tomar o primeiro usu�rio (ou o rafael)
                const testUser = users.find(u => u.nickname.toLowerCase().includes('rafael')) || users[0];
                console.log('\n=== TESTANDO USER: ' + testUser.nickname + ' (ID: ' + testUser.id + ') ===');
                
                db.all(`SELECT uc.*, cr.name, cr.color, cr.icon FROM user_custom_ranks uc 
                        JOIN custom_ranks cr ON uc.customRankId = cr.id 
                        WHERE uc.userId = ?`, [testUser.id], (err, ranks) => {
                    console.log('conquistas na user_custom_ranks table:');
                    console.log(JSON.stringify(ranks, null, 2));
                    
                    // Procurar por usu�rio chamado coringa
                    db.get(`SELECT id, nickname FROM users WHERE nickname = 'coringa'`, (err, coringaUser) => {
                        if (coringaUser) {
                            console.log('\n=== USU�RIO CORINGA ENCONTRADO (ID: ' + coringaUser.id + ') ===');
                            db.all(`SELECT uc.*, cr.name, cr.color, cr.icon FROM user_custom_ranks uc 
                                    JOIN custom_ranks cr ON uc.customRankId = cr.id 
                                    WHERE uc.userId = ?`, [coringaUser.id], (err, coringaRanks) => {
                                console.log('conquistas do CORINGA:');
                                console.log(JSON.stringify(coringaRanks, null, 2));
                                db.close();
                            });
                        } else {
                            console.log('\nUsu�rio "coringa" n�o encontrado. Listando todos os usu�rios...');
                            db.all(`SELECT id, nickname FROM users LIMIT 10`, (err, allUsers) => {
                                console.log(JSON.stringify(allUsers, null, 2));
                                
                                // Testar o segundo usu�rio (presumivelmente o rafael ou outro)
                                if (allUsers && allUsers.length > 1) {
                                    const user2 = allUsers[1];
                                    console.log('\n=== TESTANDO SEGUNDO USU�RIO: ' + user2.nickname + ' ===');
                                    db.all(`SELECT uc.*, cr.name, cr.color, cr.icon FROM user_custom_ranks uc 
                                            JOIN custom_ranks cr ON uc.customRankId = cr.id 
                                            WHERE uc.userId = ?`, [user2.id], (err, user2Ranks) => {
                                        console.log('conquistas:');
                                        console.log(JSON.stringify(user2Ranks, null, 2));
                                        db.close();
                                    });
                                } else {
                                    db.close();
                                }
                            });
                        }
                    });
                });
            } else {
                db.close();
            }
        });
    }
});


