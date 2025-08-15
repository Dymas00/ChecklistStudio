const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware básico
app.use(express.json());

// Log de todas as requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Servir arquivos estáticos
const publicPath = path.join(__dirname, 'dist', 'public');
console.log(`Servindo arquivos de: ${publicPath}`);
app.use(express.static(publicPath));

// Rota de teste
app.get('/test', (req, res) => {
  res.json({ status: 'ok', message: 'Servidor funcionando!' });
});

// Fallback para SPA
app.get('*', (req, res) => {
  console.log(`Servindo index.html para: ${req.path}`);
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor simples rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
});