#!/usr/bin/env node
import Database from 'better-sqlite3';

const db = new Database('./database/holiday.db');

console.log('\n=== VERIFICANDO CONTA ===\n');

// Buscar o usu�rio
const user = db.prepare(`
    SELECT id, firstName, lastName, nickname, email, emailVerified, password 
    FROM users 
    WHERE nickname = ? OR email = ?
`).all('Fael', 'sustmanrft@hotmail.com');

if (user.length > 0) {
    console.log('? CONTA ENCONTRADA!\n');
    user.forEach((u, index) => {
        console.log(`Usu�rio ${index + 1}:`);
        console.log(`  ID: ${u.id}`);
        console.log(`  Nickname: ${u.nickname}`);
        console.log(`  Email: ${u.email}`);
        console.log(`  Nome Completo: ${u.firstName} ${u.lastName}`);
        console.log(`  Email Verificado: ${u.emailVerified ? 'SIM ?' : 'N�O ?'}`);
        console.log(`  Hash da Senha: ${u.password.substring(0, 30)}...`);
        console.log();
    });
} else {
    console.log('? CONTA N�O ENCONTRADA\n');
}

db.close();
