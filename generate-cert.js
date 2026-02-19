import forge from 'node-forge';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const certPath = path.join(__dirname, 'ssl/cert.pem');
const keyPath = path.join(__dirname, 'ssl/key.pem');

// Verificar se certificado j� existe
if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
    console.log('? Certificado SSL j� existe');
    process.exit(0);
}

console.log('Gerando certificado SSL autoassinado...');

// Criar diret�rio se n�o existir
if (!fs.existsSync(path.join(__dirname, 'ssl'))) {
    fs.mkdirSync(path.join(__dirname, 'ssl'), { recursive: true });
}

try {
    // Gerar par de chaves
    const keys = forge.pki.rsa.generateKeyPair(2048);

    // Gerar certificado
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

    const attrs = [
        { name: 'commonName', value: 'localhost' },
        { name: 'organizationName', value: 'HOLIDAY Guild' }
    ];
    cert.setSubject(attrs);
    cert.setIssuer(attrs);
    cert.setExtensions([
        {
            name: 'basicConstraints',
            cA: true
        },
        {
            name: 'keyUsage',
            keyCertSign: true,
            digitalSignature: true,
            nonRepudiation: true,
            keyEncipherment: true,
            dataEncipherment: true
        }
    ]);

    // Auto-assinar o certificado
    cert.sign(keys.privateKey, forge.md.sha256.create());

    // Converter para PEM
    const certPem = forge.pki.certificateToPem(cert);
    const keyPem = forge.pki.privateKeyToPem(keys.privateKey);

    // Salvar arquivos
    fs.writeFileSync(certPath, certPem);
    fs.writeFileSync(keyPath, keyPem);

    console.log('? Certificado SSL gerado com sucesso!');
    console.log('?? Arquivos: ssl/cert.pem, ssl/key.pem');
    process.exit(0);
} catch (err) {
    console.error('? Erro ao gerar certificado:', err.message);
    process.exit(1);
}
