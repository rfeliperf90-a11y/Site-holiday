import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.FRONTEND_PORT || process.env.PORT || 5000);

const blockedPatterns = [
    /^\/backend(?:\/|$)/i,
    /^\/database(?:\/|$)/i,
    /^\/node_modules(?:\/|$)/i,
    /^\/ssl(?:\/|$)/i,
    /^\/(?:debug|test)[^/]*\.(?:html|js|py)$/i,
    /^\/(?:check|fix|create|verify|reset|manual|login-token|clear-and-test)[^/]*\.(?:html|js|py)$/i,
    /\.md$/i,
    /\.py$/i
];

app.use((req, res, next) => {
    const requestPath = String(req.path || '');
    if (blockedPatterns.some((pattern) => pattern.test(requestPath))) {
        return res.status(404).send('Not Found');
    }
    next();
});

// Evita cache local para refletir mudanças de frontend imediatamente.
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
});

app.use(express.static(__dirname, { index: false }));

app.get('*.html', (req, res) => {
    res.sendFile(path.join(__dirname, req.path));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.listen(PORT, () => {
    console.log(`
+----------------------------------------+
|  HOLIDAY Guild Frontend                |
|  Servidor rodando na porta ${PORT}        |
|  http://localhost:${PORT}                 |
+----------------------------------------+
    `);
});
