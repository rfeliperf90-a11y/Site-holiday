import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'database', 'holiday.db'));

// Verificar qual conquista tem ID 5
db.get(`SELECT * FROM custom_ranks WHERE id = 5`, (err, rank) => {
    console.log('=== CONQUISTA COM ID 5 ===');
    console.log(JSON.stringify(rank, null, 2));
    
    // Verificar Ex-PRO
    db.get(`SELECT * FROM ranks WHERE rankName = 'Ex-PRO'`, (err, exproRank) => {
        console.log('\n=== RANK "Ex-PRO" ===');
        console.log(JSON.stringify(exproRank, null, 2));
        
        // Procurar todos os ranks/conquistas
        db.all(`SELECT DISTINCT rankName FROM ranks LIMIT 10`, (err, allRankNames) => {
            console.log('\n=== VERIFICAR META RANKS (tabela ranks) ===');
            console.log(JSON.stringify(allRankNames, null, 2));
            
            // Verificar custom_ranks com nome Ex-PRO
            db.get(`SELECT * FROM custom_ranks WHERE name LIKE '%Pro%'`, (err, proRank) => {
                console.log('\n=== CUSTOM RANK COM "Pro" ===');
                console.log(JSON.stringify(proRank, null, 2));
                db.close();
            });
        });
    });
});


