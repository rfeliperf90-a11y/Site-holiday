#!/usr/bin/env node

/**
 * Script de teste de atualização de senha
 * Usa bcryptjs igual o backend usa
 */

import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';

const DB_PATH = new URL('../database/holiday.db', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1');

console.log(`\n${'='.repeat(60)}`);
console.log(`  🧪 TESTE DE ATUALIZAÇÃO DE SENHA`);
console.log(`${'='.repeat(60)}\n`);

const db = new Database(DB_PATH);

// 1. Ver senha atual
console.log('1️⃣  Verificando senha atual no banco...\n');
const currentUser = db.prepare('SELECT password FROM users WHERE nickname=?').get('Fael');

if (currentUser) {
    console.log(`   Hash atual: ${currentUser.password.substring(0, 60)}...`);
} else {
    console.log('   ❌ Usuário não encontrado');
    process.exit(1);
}

// 2. Atualizar manualmente
console.log('\n2️⃣  Atualizando para nova senha...\n');

const newPassword = 'testesenha2024';

const newHash = bcrypt.hashSync(newPassword, 10);
console.log(`   Nova senha: ${newPassword}`);
console.log(`   Hash novo: ${newHash.substring(0, 60)}...`);

const stmt = db.prepare('UPDATE users SET password = ? WHERE nickname = ?');
stmt.run(newHash, 'Fael');

console.log('   ✅ Senha atualizada no banco');

// 3. Verificar
console.log('\n3️⃣  Verificando se foi atualizada...\n');
const updatedUser = db.prepare('SELECT password FROM users WHERE nickname=?').get('Fael');

if (updatedUser) {
    if (updatedUser.password !== currentUser.password) {
        console.log(`   ✅ Hash foi alterado!`);
        console.log(`   Novo hash: ${updatedUser.password.substring(0, 60)}...`);
    } else {
        console.log(`   ❌ Hash não foi alterado!`);
    }
} else {
    console.log('   ❌ Usuário não encontrado');
}

// 4. Testar se está correto
console.log('\n4️⃣  Testando se a nova senha bate com o hash...\n');

const testResult = bcrypt.compareSync(newPassword, updatedUser.password);
console.log(`   Senha "${newPassword}" + hash: ${testResult ? '✅ CORRESPONDENTE' : '❌ FALHA'}`);

db.close();

console.log(`\n${'='.repeat(60)}`);
console.log(`  PRÓXIMAS ETAPAS`);
console.log(`${'='.repeat(60)}`);
console.log(`
✅ Se tudo passou:
   1. Teste login com: Fael / ${newPassword}
   2. Se funcionar em http://localhost:3000/login.html, está tudo certo!
   
❌ Se falhou:
   1. Verifique se o Node.js e bcryptjs estão instalados
   2. Execute: npm install
`);
