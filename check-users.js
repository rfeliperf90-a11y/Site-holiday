import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'database/holiday.db'));

db.all(`SELECT id, firstName, lastName, nickname, email, emailVerified FROM users`, (err, rows) => {
    if (err) {
        console.error('Erro:', err);
    } else {
        console.log('\n=== USU�RIOS NO BANCO ===\n');
        if (rows && rows.length > 0) {
            rows.forEach(row => {
                console.log(`ID: ${row.id}`);
                console.log(`Nome: ${row.firstName} ${row.lastName}`);
                console.log(`Nickname: ${row.nickname}`);
                console.log(`Email: ${row.email}`);
                console.log(`Email Verificado: ${row.emailVerified ? 'SIM' : 'N�O'}`);
                console.log('---');
            });
        } else {
            console.log('Nenhum usu�rio no banco de dados');
        }
    }
    db.close();
});
