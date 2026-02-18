import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, 'backend', '.env');
dotenv.config({ path: envPath });

console.log('=== TESTE DE CONFIGURAÇÃO DE EMAIL ===\n');

const emailUser = process.env.EMAIL_USER;
const emailPass = process.env.EMAIL_PASS;
const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
const emailPort = process.env.EMAIL_PORT || 465;

console.log('Configurações carregadas:');
console.log('EMAIL_USER:', emailUser ? `${emailUser.substring(0, 5)}***` : 'NÃO CONFIGURADO');
console.log('EMAIL_PASS:', emailPass ? '***[SENHA OCULTA]***' : 'NÃO CONFIGURADO');
console.log('EMAIL_HOST:', emailHost);
console.log('EMAIL_PORT:', emailPort);
console.log('');

if (!emailUser || !emailPass) {
    console.error('❌ ERRO: EMAIL_USER e EMAIL_PASS não estão configurados no .env');
    console.log('\nConfigure as seguintes variáveis no arquivo .env:');
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

// Testar conexão
console.log('Testando conexão SMTP...\n');

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ ERRO DE CONEXÃO:');
        console.error(error.message);
        console.log('\nDicas de solução:');
        console.log('1. Verifique se EMAIL_USER está correto (deve ser um email Gmail)');
        console.log('2. Se usar Gmail, use uma "App Password" ao invés da senha normal');
        console.log('3. Para criar App Password:');
        console.log('   - Acesse: https://myaccount.google.com/apppasswords');
        console.log('   - Selecione "Mail" e "Windows Computer"');
        console.log('   - A senha gerada deve ser usada em EMAIL_PASS');
        process.exit(1);
    } else {
        console.log('✅ Conexão SMTP bem-sucedida!');
        console.log('\nTentando enviar email de teste...\n');
        
        transporter.sendMail({
            from: emailUser,
            to: emailUser, // Enviar para o mesmo email
            subject: '[TESTE] Configuração de Email - HOLIDAY Guild',
            html: `
                <h2>Email de Teste</h2>
                <p>Se você recebeu este email, a configuração de SMTP está funcionando corretamente!</p>
                <p><strong>Timestamp:</strong> ${new Date().toLocaleString('pt-BR')}</p>
            `
        }, (err, info) => {
            if (err) {
                console.error('❌ ERRO AO ENVIAR EMAIL:');
                console.error(err.message);
                process.exit(1);
            } else {
                console.log('✅ EMAIL ENVIADO COM SUCESSO!');
                console.log('Response:', info.response);
                console.log('\n🎉 Sistema de email está funcionando corretamente!');
                process.exit(0);
            }
        });
    }
});
