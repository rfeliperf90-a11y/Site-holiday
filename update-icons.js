import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'database', 'holiday.db'));

// Atualizar conquistas para remover emojis e usar apenas texto
const updates = [
    { name: 'Fundador', icon: '�~.' },
    { name: 'Initiate', icon: '�o�' },
    { name: 'Administrador', icon: 'ADM' },
    { name: 'Membro', icon: 'M' }
];

updates.forEach(rank => {
    db.run(
        `UPDATE custom_ranks SET icon = ? WHERE name = ?`,
        [rank.icon, rank.name],
        (err) => {
            if (err) {
                console.error(`Erro ao atualizar ${rank.name}:`, err);
            } else {
                console.log(`�o" ${rank.name} atualizado para icon: ${rank.icon}`);
            }
        }
    );
});

setTimeout(() => {
    db.all(`SELECT name, icon FROM custom_ranks`, (err, rows) => {
        console.log('\n�o" CONQUISTAS ATUALIZADOS:');
        console.log(JSON.stringify(rows, null, 2));
        db.close();
    });
}, 500);


