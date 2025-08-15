#!/bin/bash

echo "=== Corrigindo Tela Branca - ChecklistStudio ==="

# Parar aplicação
echo "1. Parando aplicação..."
pm2 delete ChecklistStudio 2>/dev/null || true

# Executar build completo
echo "2. Executando build completo..."
npm run build

# Verificar se arquivos foram criados
echo "3. Verificando arquivos de build..."
ls -la dist/public/
echo ""
echo "Conteúdo do index.html:"
head -5 dist/public/index.html

# Teste com servidor simples primeiro
echo "4. Testando com servidor simples..."
timeout 5s node simple-server.js &
SIMPLE_PID=$!
sleep 2

echo "4.1. Testando servidor simples..."
curl -s http://localhost:3000/test || echo "Servidor simples falhou"

# Parar servidor simples
kill $SIMPLE_PID 2>/dev/null

# Iniciar aplicação PM2
echo "4.2. Iniciando aplicação PM2..."
pm2 start ecosystem.config.cjs
pm2 save

# Aguardar inicialização
echo "5. Aguardando inicialização..."
sleep 5

# Verificar status
echo "6. Verificando status..."
pm2 status

# Teste de conectividade
echo "7. Testando servidor..."
curl -I http://18.228.156.152:3000 2>/dev/null && echo "✓ Servidor respondendo!" || echo "✗ Problemas de conectividade"

echo ""
echo "8. Testando se assets estão disponíveis..."
curl -I http://18.228.156.152:3000/assets/index-Cv3lstv-.js 2>/dev/null && echo "✓ JavaScript disponível!" || echo "✗ Assets não encontrados"

echo ""
echo "9. Testando se HTML está sendo servido..."
curl -s http://18.228.156.152:3000 | grep -o '<title>.*</title>' || echo "✗ HTML não está sendo servido"

echo ""
echo "=== Correção finalizada ==="
echo "Acesse: http://18.228.156.152"
echo "Login: admin@empresa.com / admin123"