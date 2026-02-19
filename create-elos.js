import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'database', 'holiday.db'));

// Criar conquistas customizados se n�o existirem
const ranks = [
    {
        name: 'Fundador',
        color: '#FFD700',
        icon: '?Y''',
        description: 'Fundador da Guilda Holiday'
    },
    {
        name: 'Initiate',
        color: '#FF6B9D',
        icon: '?YOY',
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
                        console.log(`?o" ${rank.name} criado com ID: ${this.lastID}`);
                        createdRankIds.push({ name: rank.name, id: this.lastID });
                        
                        // Se for o �ltimo conquista, atribuir ao usu�rio
                        if (createdRankIds.length === ranks.length) {
                            assignRanksToUser();
                        }
                    }
                }
            );
        } else {
            console.log(`${rank.name} j� existe (ID: ${row.id})`);
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
                    console.log(`?o" ${rank.name} atribu�do ao usu�rio Fael`);
                }
            }
        );
    });
    
    // Verificar atribui��o ap�s 1 segundo
    setTimeout(() => {
        db.all(
            `SELECT cr.name, cr.color, cr.icon FROM user_custom_ranks uc
             JOIN custom_ranks cr ON uc.customRankId = cr.id
             WHERE uc.userId = ?`,
            [userId],
            (err, rows) => {
                console.log('\n?o" CONQUISTAS DO USU�RIO FAEL AP?"S ATRIBUI???fO:');
                console.log(JSON.stringify(rows, null, 2));
                db.close();
            }
        );
    }, 500);
}


