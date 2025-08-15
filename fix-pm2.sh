#!/bin/bash

# Script para diagnosticar e corrigir problemas do PM2
echo "=== Diagnóstico ChecklistStudio ==="

echo "1. Status atual PM2:"
pm2 status

echo -e "\n2. Logs da aplicação:"
pm2 logs ChecklistStudio --lines 10

echo -e "\n3. Deletando processo existente:"
pm2 delete ChecklistStudio 2>/dev/null || echo "Nenhum processo para deletar"

echo -e "\n4. Limpando PM2:"
pm2 kill
pm2 flush

echo -e "\n5. Verificando porta 3000:"
sudo netstat -tlnp | grep :3000 || echo "Porta 3000 livre"

echo -e "\n6. Iniciando aplicação:"
cd /opt/ChecklistStudio
pm2 start ecosystem.config.cjs

echo -e "\n7. Verificando novo status:"
sleep 5
pm2 status
pm2 logs ChecklistStudio --lines 5

echo -e "\n8. Testando conectividade:"
curl -I http://localhost:3000 2>/dev/null || echo "Aplicação não responde na porta 3000"

echo -e "\n9. Status nginx:"
sudo systemctl status nginx --no-pager -l

echo -e "\n=== Diagnóstico completo ==="