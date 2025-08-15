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

# Iniciar aplicação
echo "4. Iniciando aplicação..."
pm2 start ecosystem.config.cjs
pm2 save

# Aguardar inicialização
echo "5. Aguardando inicialização..."
sleep 5

# Verificar status
echo "6. Verificando status..."
pm2 status

# Teste de conectividade
echo "7. Testando frontend..."
curl -I http://localhost:3000 2>/dev/null && echo "✓ Servidor respondendo!" || echo "✗ Problemas de conectividade"

echo ""
echo "8. Testando se HTML está sendo servido..."
curl -s http://localhost:3000 | head -3

echo ""
echo "=== Correção finalizada ==="
echo "Acesse: http://IP_DO_SERVIDOR"
echo "Login: admin@empresa.com / admin123"