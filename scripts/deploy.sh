#!/bin/bash
# Script de implantação para Checklist Virtual

set -e  # Parar em qualquer erro

echo "🚀 Iniciando implantação do Checklist Virtual..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale o Node.js 18+ primeiro."
    exit 1
fi

# Verificar se o PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 não encontrado. Instalando..."
    sudo npm install -g pm2
fi

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Fazer build do projeto
echo "🔨 Fazendo build do projeto..."
npm run build

# Criar diretório de logs
mkdir -p logs

# Verificar se já existe uma instância rodando
if pm2 list | grep -q "checklist-virtual"; then
    echo "🔄 Reiniciando aplicação existente..."
    pm2 restart checklist-virtual
else
    echo "🆕 Iniciando nova instância..."
    pm2 start ecosystem.config.js
fi

# Salvar configuração do PM2
pm2 save
pm2 startup

echo "✅ Implantação concluída!"
echo ""
echo "📊 Status da aplicação:"
pm2 status

echo ""
echo "🌐 A aplicação está rodando em: http://localhost:3000"
echo "📝 Para ver os logs: pm2 logs checklist-virtual"
echo "🔍 Para monitorar: pm2 monit"
echo ""
echo "👤 Usuários padrão:"
echo "   Admin: admin@checklistpro.com / admin123"
echo "   Técnico: tecnico@checklistpro.com / tech123"
echo "   Analista: analista@checklistpro.com / analyst123"