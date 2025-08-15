#!/bin/bash

echo "=== Diagnóstico Completo do Servidor ==="

echo "1. Verificando portas ativas..."
netstat -tulpn | grep :3000 || echo "Porta 3000 não está sendo usada"

echo ""
echo "2. Verificando status PM2..."
pm2 status

echo ""
echo "3. Verificando logs de erro..."
pm2 logs ChecklistStudio --lines 10 --nostream

echo ""
echo "4. Verificando estrutura de arquivos..."
echo "dist/public/:"
ls -la dist/public/ | head -5

echo ""
echo "5. Testando conectividade..."
curl -v http://18.228.156.152:3000 2>&1 | head -10

echo ""
echo "6. Verificando conteúdo do index.html..."
curl -s http://18.228.156.152:3000 | head -15

echo ""
echo "7. Testando asset específico..."
curl -I http://18.228.156.152:3000/assets/index-Cv3lstv-.js

echo ""
echo "=== Fim do Diagnóstico ==="