#!/usr/bin/env node
import Database from 'better-sqlite3';
import bcryptjs from 'bcryptjs';

const db = new Database('./database/holiday.db');

// Pegar o hash de Fael
const user = db.prepare('SELECT password FROM users WHERE nickname=?').get('Fael');

if (user) {
    const storedHash = user.password;
    const testPassword = 'test123';
    
    console.log('Hash armazenado:', storedHash.substring(0, 50) + '...');
    console.log('Testando senha: test123\n');
    
    // Testar se a senha bate
    const isMatch = bcryptjs.compareSync(testPassword, storedHash);
    
    if (isMatch) {
        console.log('? Senha est� CORRETA');
    } else {
        console.log('? Senha est� INCORRETA');
        console.log('\nTentando outras senhas comuns...');
        
        const passwords = ['senha123', 'Fael123', 'fael123', '123456', 'admin123', 'Password123'];
        for (const pwd of passwords) {
            if (bcryptjs.compareSync(pwd, storedHash)) {
                console.log(`? Senha encontrada: ${pwd}`);
                break;
            }
        }
    }
} else {
    console.log('Usu�rio n�o encontrado');
}

db.close();
