#!/bin/bash

echo "=== Atualizando ChecklistStudio para Produção ==="

# Parar aplicação
echo "1. Parando aplicação..."
pm2 delete ChecklistStudio 2>/dev/null || true

# Fazer pull das últimas mudanças
echo "2. Atualizando código..."
git pull origin main

# Executar build do frontend
echo "3. Executando build do frontend..."
npm run build

# Atualizar configuração do PM2
echo "4. Atualizando configuração PM2..."
cp ecosystem.low-resource.cjs ecosystem.config.cjs

# Iniciar aplicação
echo "5. Iniciando aplicação..."
pm2 start ecosystem.config.cjs
pm2 save

# Verificar status
echo "6. Verificando status..."
sleep 3
pm2 status
pm2 logs ChecklistStudio --lines 5

# Teste de conectividade
echo "7. Testando conectividade..."
curl -I http://localhost:3000 2>/dev/null && echo "✓ Aplicação respondendo!" || echo "✗ Problemas de conectividade"

echo "=== Atualização completa ==="