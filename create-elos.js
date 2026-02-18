import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'database', 'holiday.db'));

// Criar conquistas customizados se nÃ£o existirem
const ranks = [
    {
        name: 'Fundador',
        color: '#FFD700',
        icon: 'ðŸ‘‘',
        description: 'Fundador da Guilda Holiday'
    },
    {
        name: 'Initiate',
        color: '#FF6B9D',
        icon: 'ðŸŒŸ',
        description: 'Membro iniciante da Guilda'
    }
];

let createdRankIds = [];

ranks.forEach((rank, idx) => {
    db.get(`SELECT id FROM custom_ranks WHERE name = ?`, [rank.name], (err, row) => {
        if (!row) {
            console.log(`Criando conquista: ${rank.name}`);
            db.run(
                `INSERT INTO custom_ranks (name, color, icon, description, isDefault, isVisible) 
                 VALUES (?, ?, ?, ?, 0, 1)`,
                [rank.name, rank.color, rank.icon, rank.description],
                function(err) {
                    if (err) {
                        console.error(`Erro ao criar ${rank.name}:`, err);
                    } else {
                        console.log(`âœ“ ${rank.name} criado com ID: ${this.lastID}`);
                        createdRankIds.push({ name: rank.name, id: this.lastID });
                        
                        // Se for o Ãºltimo conquista, atribuir ao usuÃ¡rio
                        if (createdRankIds.length === ranks.length) {
                            assignRanksToUser();
                        }
                    }
                }
            );
        } else {
            console.log(`${rank.name} jÃ¡ existe (ID: ${row.id})`);
            createdRankIds.push({ name: rank.name, id: row.id });
            
            if (createdRankIds.length === ranks.length) {
                assignRanksToUser();
            }
        }
    });
});

function assignRanksToUser() {
    const userId = 1; // ID do Fael
    
    createdRankIds.forEach(rank => {
        db.run(
            `INSERT OR IGNORE INTO user_custom_ranks (userId, customRankId) VALUES (?, ?)`,
            [userId, rank.id],
            (err) => {
                if (err) {
                    console.error(`Erro ao atribuir ${rank.name}:`, err);
                } else {
                    console.log(`âœ“ ${rank.name} atribuÃ­do ao usuÃ¡rio Fael`);
                }
            }
        );
    });
    
    // Verificar atribuiÃ§Ã£o apÃ³s 1 segundo
    setTimeout(() => {
        db.all(
            `SELECT cr.name, cr.color, cr.icon FROM user_custom_ranks uc
             JOIN custom_ranks cr ON uc.customRankId = cr.id
             WHERE uc.userId = ?`,
            [userId],
            (err, rows) => {
                console.log('\nâœ“ CONQUISTAS DO USUÃRIO FAEL APÃ“S ATRIBUIÃ‡ÃƒO:');
                console.log(JSON.stringify(rows, null, 2));
                db.close();
            }
        );
    }, 500);
}


