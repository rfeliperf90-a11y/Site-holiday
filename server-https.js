import https from 'https';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT_HTTPS = 3001;

// Servir arquivos est�ticos
app.use(express.static(__dirname));

// Rota para qualquer arquivo HTML
app.get('*.html', (req, res) => {
    res.sendFile(path.join(__dirname, req.path));
});

// Rota padr�o
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'signup.html'));
});

// Verificar certificados
const certPath = path.join(__dirname, 'ssl/cert.pem');
const keyPath = path.join(__dirname, 'ssl/key.pem');

if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    console.log('? Certificados SSL n�o encontrados!');
    console.log('Execute: npm run setup-ssl');
    process.exit(1);
}

// Criar servidor HTTPS
const httpsOptions = {
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath)
};

https.createServer(httpsOptions, app).listen(PORT_HTTPS, () => {
    console.log(`
??????????????????????????????????????????
?  ?? HTTPS Server (Frontend)            ?
?  ? Rodando em https://localhost:${PORT_HTTPS}  ?
?  ??  Certificado auto-assinado         ?
?  (Aceite o aviso de seguran�a)         ?
??????????????????????????????????????????

?? API Backend est� em: http://localhost:5000
    `);
});
