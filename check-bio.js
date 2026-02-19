import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'database/holiday.db'));

db.get(`SELECT id, nickname, bio FROM users WHERE nickname = 'fael'`, (err, row) => {
    if (err) {
        console.error('Erro:', err);
    } else if (row) {
        console.log('\nBio do usu�rio fael:');
        console.log('Valor:', row.bio);
        console.log('Tipo:', typeof row.bio);
        console.log('Tamanho:', row.bio ? row.bio.length : 0);
        
        if (row.bio && row.bio.includes('[object Object]')) {
            console.log('\n?? PROBLEMA ENCONTRADO: Bio cont�m "[object Object]"');
            console.log('Isso causa erro no JSON.parse ou na renderiza��o da p�gina');
        }
    }
    db.close();
});
