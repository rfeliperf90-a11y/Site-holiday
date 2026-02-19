import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, 'backend', '.env');
dotenv.config({ path: envPath });

console.log('=== TESTE DE CONFIGURA��O DE EMAIL ===\n');

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = process.env.EMAIL_PORT || 465;

console.log('Configura��es carregadas:');
console.log('EMAIL_USER:', emailUser ? `${emailUser.substring(0, 5)}***` : 'N�O CONFIGURADO');
console.log('EMAIL_PASS:', emailPass ? '***[SENHA OCULTA]***' : 'N�O CONFIGURADO');
console.log('EMAIL_HOST:', emailHost);
console.log('EMAIL_PORT:', emailPort);
console.log('');

if (!emailUser || !emailPass) {
    console.error('? ERRO: EMAIL_USER e EMAIL_PASS n�o est�o configurados no .env');
    console.log('\nConfigure as seguintes vari�veis no arquivo .env:');
    console.log('EMAIL_USER=seu-email@gmail.com');
    console.log('EMAIL_PASS=sua-senha-ou-app-password');
    process.exit(1);
}

// Criar transporter
const transporter = nodemailer.createTransport({
    host: emailHost,
    port: emailPort,
    secure: true,
    auth: {
        user: emailUser,
        pass: emailPass
    }
});

// Testar conex�o
console.log('Testando conex�o SMTP...\n');

transporter.verify((error, success) => {
    if (error) {
        console.error('? ERRO DE CONEX�O:');
        console.error(error.message);
        console.log('\nDicas de solu��o:');
        console.log('1. Verifique se EMAIL_USER est� correto (deve ser um email Gmail)');
        console.log('2. Se usar Gmail, use uma "App Password" ao inv�s da senha normal');
        console.log('3. Para criar App Password:');
        console.log('   - Acesse: https://myaccount.google.com/apppasswords');
        console.log('   - Selecione "Mail" e "Windows Computer"');
        console.log('   - A senha gerada deve ser usada em EMAIL_PASS');
        process.exit(1);
    } else {
        console.log('? Conex�o SMTP bem-sucedida!');
        console.log('\nTentando enviar email de teste...\n');
        
        transporter.sendMail({
            from: emailUser,
            to: emailUser, // Enviar para o mesmo email
            subject: '[TESTE] Configura��o de Email - HOLIDAY Guild',
            html: `
                <h2>Email de Teste</h2>
                <p>Se voc� recebeu este email, a configura��o de SMTP est� funcionando corretamente!</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            `
        }, (err, info) => {
            if (err) {
                console.error('? ERRO AO ENVIAR EMAIL:');
                console.error(err.message);
                process.exit(1);
            } else {
                console.log('? EMAIL ENVIADO COM SUCESSO!');
                console.log('Response:', info.response);
                console.log('\n?? Sistema de email est� funcionando corretamente!');
                process.exit(0);
            }
        });
    }
});
