// Entrada dedicada para Discloud (TYPE=site).
// A plataforma exige host 0.0.0.0 e porta 8080 para proxy externo.
process.env.PORT = '8080';
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

import './backend/server.js';

