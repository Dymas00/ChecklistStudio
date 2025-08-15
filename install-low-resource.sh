#!/bin/bash

echo "======================================"
echo "INSTALAÇÃO OTIMIZADA PARA RECURSOS LIMITADOS"
echo "1 CPU | 2GB RAM | 8GB HD"
echo "======================================"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para logs
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Verificar se é root
if [ "$EUID" -eq 0 ]; then
    error "Não execute como root. Use sudo apenas quando necessário."
fi

log "Iniciando instalação otimizada..."

# 1. CONFIGURAR SWAP
log "Configurando swap de 1GB..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 1G /swapfile || error "Falha ao criar arquivo swap"
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
    sudo sysctl vm.swappiness=10
    log "Swap configurado com sucesso"
else
    warn "Swap já existe, pulando..."
fi

# 2. ATUALIZAR SISTEMA
log "Atualizando sistema..."
sudo apt update -qq
sudo apt upgrade -y -qq

# 3. INSTALAR DEPENDÊNCIAS BÁSICAS
log "Instalando dependências básicas..."
sudo apt install -y curl wget gnupg2 software-properties-common sqlite3 htop

# 4. INSTALAR NODE.JS LTS
log "Instalando Node.js LTS..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
    sudo apt-get install -y nodejs
    log "Node.js instalado: $(node --version)"
else
    warn "Node.js já instalado: $(node --version)"
fi

# 5. INSTALAR PM2
log "Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    log "PM2 instalado"
else
    warn "PM2 já instalado"
fi

# 6. CRIAR DIRETÓRIOS
log "Configurando diretórios..."
sudo mkdir -p /opt/checklist-system/{data,logs}
sudo chown -R $USER:$USER /opt/checklist-system

# 7. CLONAR PROJETO (assumindo que já existe)
if [ -d "/opt/checklist-system/.git" ]; then
    log "Projeto já existe, fazendo pull..."
    cd /opt/checklist-system
    git pull origin main || warn "Falha no git pull"
else
    log "Por favor, copie os arquivos do projeto para /opt/checklist-system/"
    log "Ou clone manualmente: git clone [seu-repo] /opt/checklist-system"
fi

cd /opt/checklist-system || error "Falha ao entrar no diretório do projeto"

# 8. INSTALAR DEPENDÊNCIAS
log "Instalando dependências do Node.js..."
npm ci --only=production || error "Falha ao instalar dependências"

# 9. CONFIGURAR AMBIENTE
log "Configurando ambiente..."
if [ ! -f .env ]; then
    cp .env.low-resource .env 2>/dev/null || {
        log "Criando arquivo .env..."
        cat > .env << EOF
DATABASE_URL=file:./data/database.db
PORT=3000
NODE_ENV=production
HOST=0.0.0.0
SESSION_SECRET=$(openssl rand -base64 32)
NODE_OPTIONS=--max-old-space-size=1024
UV_THREADPOOL_SIZE=2
MAX_UPLOAD_SIZE=5MB
CACHE_SIZE=50
LOG_LEVEL=warn
EOF
    }
    log "Arquivo .env configurado"
fi

# 10. EXECUTAR MIGRAÇÃO DO BANCO
log "Configurando banco de dados..."
npm run db:push || warn "Falha na migração do banco (pode ser normal na primeira execução)"

# 11. BUILD DO PROJETO
log "Construindo projeto..."
npm run build || warn "Build falhou - verificar se o comando existe"

# 12. LIMPAR DEPENDÊNCIAS DESNECESSÁRIAS
log "Limpando dependências de desenvolvimento..."
npm prune --production

# 13. CONFIGURAR PM2
log "Configurando PM2..."
cp ecosystem.low-resource.js ecosystem.config.js 2>/dev/null || {
    log "Criando configuração do PM2..."
    cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'checklist-system',
    script: 'server/index.ts',
    interpreter: 'npx',
    interpreter_args: 'tsx',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '400M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=1024',
      UV_THREADPOOL_SIZE: 2
    },
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    max_size: '10M',
    max_files: 3
  }]
};
EOF
}

# 14. INSTALAR NGINX
log "Instalando e configurando Nginx..."
sudo apt install -y nginx

# Configuração otimizada do Nginx
sudo tee /etc/nginx/sites-available/checklist-system > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    client_max_body_size 20M;
    
    # Compressão
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Cache para arquivos estáticos
    location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 30s;
    }
}
EOF

# Ativar site
sudo ln -sf /etc/nginx/sites-available/checklist-system /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx
sudo systemctl enable nginx

# 15. CONFIGURAR FIREWALL
log "Configurando firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80

# 16. CRIAR SCRIPT DE LIMPEZA
log "Criando script de limpeza automática..."
sudo tee /opt/cleanup-system.sh > /dev/null << 'EOF'
#!/bin/bash
find /opt/checklist-system/logs -name "*.log" -mtime +7 -delete 2>/dev/null
sudo apt autoremove -y >/dev/null 2>&1
sudo apt autoclean >/dev/null 2>&1
npm cache clean --force >/dev/null 2>&1
sudo rm -rf /tmp/* >/dev/null 2>&1
sudo rm -rf /var/tmp/* >/dev/null 2>&1
echo "Limpeza concluída - $(date)"
EOF

sudo chmod +x /opt/cleanup-system.sh

# Agendar limpeza semanal
(sudo crontab -l 2>/dev/null; echo "0 2 * * 0 /opt/cleanup-system.sh") | sudo crontab -

# 17. CRIAR SCRIPT DE MONITORAMENTO
log "Criando script de monitoramento..."
tee /opt/checklist-system/monitor.sh > /dev/null << 'EOF'
#!/bin/bash
echo "=== Status do Sistema - $(date) ==="
echo "RAM: $(free -m | awk 'NR==2{printf "Usado: %sMB (%.1f%%)", $3, $3*100/$2 }')"
echo "Disco: $(df -h / | awk 'NR==2{print "Usado: " $3 " (" $5 ")"}')"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print "Uso: " $1 "%"}')"
echo "Aplicação: $(pm2 list | grep checklist-system | awk '{print $2 ": " $10}')"
echo "Uptime: $(uptime -p)"
echo "=================================="
EOF

chmod +x /opt/checklist-system/monitor.sh

# 18. CRIAR USUÁRIO ADMINISTRADOR
log "Criando usuário administrador..."
node -e "
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

try {
  const db = new Database('./data/database.db');
  const hashedPassword = bcrypt.hashSync('admin123', 10);

  db.exec(\`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  \`);

  const stmt = db.prepare(\`
    INSERT OR REPLACE INTO users (id, email, name, password_hash, role)
    VALUES (?, ?, ?, ?, ?)
  \`);

  stmt.run('admin-' + Date.now(), 'admin@empresa.com', 'Administrador', hashedPassword, 'Administrador');
  console.log('✓ Usuário administrador criado!');
  console.log('  Email: admin@empresa.com');
  console.log('  Senha: admin123');
  console.log('  ⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!');
  db.close();
} catch (error) {
  console.warn('⚠️ Falha ao criar usuário admin:', error.message);
  console.log('Crie manualmente após a instalação.');
}
" 2>/dev/null || warn "Falha ao criar usuário admin - crie manualmente"

# 19. INICIAR APLICAÇÃO
log "Iniciando aplicação com PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | bash || warn "Configure manualmente: pm2 startup"

# 20. STATUS FINAL
log "Verificando status da instalação..."
sleep 5

echo ""
echo "======================================"
echo -e "${GREEN}INSTALAÇÃO CONCLUÍDA!${NC}"
echo "======================================"
echo "📊 Status do Sistema:"
echo "  - Aplicação: http://localhost ou http://$(hostname -I | awk '{print $1}')"
echo "  - Porta: 3000 (interna) / 80 (externa)"
echo "  - Banco: SQLite em ./data/database.db"
echo ""
echo "🔐 Login Inicial:"
echo "  - Email: admin@empresa.com"
echo "  - Senha: admin123"
echo "  - ⚠️  ALTERE A SENHA APÓS O PRIMEIRO LOGIN!"
echo ""
echo "📋 Comandos Úteis:"
echo "  - Status: pm2 status"
echo "  - Logs: pm2 logs checklist-system"
echo "  - Monitor: ./monitor.sh"
echo "  - Reiniciar: pm2 restart checklist-system"
echo "  - Parar: pm2 stop checklist-system"
echo ""
echo "🧹 Manutenção:"
echo "  - Limpeza automática: Domingos às 2h"
echo "  - Limpeza manual: /opt/cleanup-system.sh"
echo ""

# Verificar se a aplicação está rodando
if pm2 list | grep -q "checklist-system.*online"; then
    echo -e "${GREEN}✓ Aplicação está rodando!${NC}"
else
    echo -e "${RED}✗ Aplicação não está rodando. Verifique os logs:${NC}"
    echo "  pm2 logs checklist-system"
fi

echo ""
echo "💾 Uso de Recursos Atual:"
/opt/checklist-system/monitor.sh

log "Instalação concluída! Acesse o sistema pelo navegador."