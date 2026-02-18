import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'database/holiday.db'));

// Corrigir a bio do usuário fael
db.run(`UPDATE users SET bio = '' WHERE nickname = 'fael'`, function(err) {
    if (err) {
        console.error('❌ Erro ao atualizar bio:', err);
    } else {
        console.log('✅ Bio do usuário "fael" corrigida para uma string vazia');
    }
    
    // Verificar outros campos que possam ter [object Object]
    db.all(`SELECT id, nickname, bio FROM users WHERE bio LIKE '%[object Object]%'`, (err, rows) => {
        if (rows && rows.length > 0) {
            console.log(`\n⚠️ Encontrados ${rows.length} usuários com bio inválida`);
            rows.forEach(row => {
                console.log(`   - ${row.nickname}: "${row.bio}"`);
            });
            
            // Corrigir todos
            db.run(`UPDATE users SET bio = '' WHERE bio LIKE '%[object Object]%'`, function(err) {
                if (!err) {
                    console.log(`✅ Corrigidos ${rows.length} campos de bio`);
                }
                db.close();
            });
        } else {
            console.log('\n✅ Nenhum outro campo com [object Object] encontrado');
            db.close();
        }
    });
});
