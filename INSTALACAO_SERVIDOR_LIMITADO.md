# Instalação Otimizada ChecklistStudio - Servidor com Recursos Limitados
## Configuração: 1 CPU, 2GB RAM, 8GB HD

## Otimizações Implementadas

### 1. Configurações de Sistema
```bash
# Otimizar swap (importante para 2GB RAM)
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Configurar swappiness (reduzir uso de swap)
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
sudo sysctl vm.swappiness=10
```

### 2. Instalação Mínima do Sistema
```bash
# Atualizar sistema
sudo apt update
sudo apt upgrade -y

# Instalar apenas pacotes essenciais
sudo apt install -y curl wget gnupg2 software-properties-common

# Node.js 18 (versão LTS otimizada)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# SQLite (ao invés do PostgreSQL para economizar recursos)
sudo apt install -y sqlite3

# PM2 com configuração otimizada
sudo npm install -g pm2
```

### 3. Configuração do Banco SQLite
```bash
# Criar diretório do banco
mkdir -p /opt/checklist-system/data

# O sistema já está configurado para usar SQLite em desenvolvimento
# Apenas precisamos configurar o arquivo .env
```

### 4. Configurações Otimizadas do Projeto
```bash
# Clonar projeto
cd /opt
sudo git clone [seu-repositorio] ChecklistStudio
cd ChecklistStudio
sudo chown -R $USER:$USER /opt/ChecklistStudio

# Instalar apenas dependências de produção
npm ci --only=production

# Configurar variáveis de ambiente otimizadas
cp .env.example .env
```

Arquivo `.env` otimizado:
```env
# Database - SQLite para economia de recursos
DATABASE_URL=file:./data/database.db

# Server - configurações otimizadas
PORT=3000
NODE_ENV=production
HOST=0.0.0.0

# Session - configuração leve
SESSION_SECRET=sua_chave_secreta_aqui

# Otimizações de memória
NODE_OPTIONS="--max-old-space-size=1024"
UV_THREADPOOL_SIZE=2
```

### 5. Build Otimizado
```bash
# Build do frontend com otimizações
npm run build

# Remover dependências de desenvolvimento para liberar espaço
npm prune --production
```

### 6. Configuração PM2 Otimizada
Arquivo `ecosystem.config.cjs`:
```javascript
module.exports = {
  apps: [{
    name: 'ChecklistStudio',
    script: 'server/index.ts',
    interpreter: 'npx',
    interpreter_args: 'tsx',
    
    // Configurações otimizadas para recursos limitados
    instances: 1, // Apenas 1 instância para economizar RAM
    autorestart: true,
    watch: false,
    max_memory_restart: '400M', // Reiniciar se usar mais que 400MB
    
    // Otimizações de ambiente
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=1024',
      UV_THREADPOOL_SIZE: 2
    },
    
    // Configurações de log para economizar espaço em disco
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: '/opt/ChecklistStudio/logs/err.log',
    out_file: '/opt/ChecklistStudio/logs/out.log',
    log_file: '/opt/ChecklistStudio/logs/combined.log',
    max_size: '10M',
    max_files: 3
  }]
};
```

### 7. Configuração Nginx Ultra-Leve
```bash
# Instalar nginx
sudo apt install nginx -y

# Configuração otimizada
sudo nano /etc/nginx/sites-available/ChecklistStudio
```

Configuração Nginx otimizada:
```nginx
# Configurações globais otimizadas
worker_processes 1;
worker_rlimit_nofile 1024;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Configurações básicas
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 30;
    types_hash_max_size 2048;
    client_max_body_size 20M;
    
    # Compressão para economizar banda
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    server {
        listen 80;
        server_name _;
        
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
            
            # Timeouts otimizados
            proxy_connect_timeout 5s;
            proxy_send_timeout 10s;
            proxy_read_timeout 30s;
        }
    }
}
```

### 8. Limpeza e Otimização de Espaço
```bash
# Criar diretório de logs
mkdir -p /opt/ChecklistStudio/logs

# Script de limpeza automática
sudo nano /opt/cleanup-system.sh
```

Script de limpeza:
```bash
#!/bin/bash

# Limpeza de logs antigos
find /opt/ChecklistStudio/logs -name "*.log" -mtime +7 -delete

# Limpeza do sistema
sudo apt autoremove -y
sudo apt autoclean

# Limpeza de cache do npm
npm cache clean --force

# Limpeza de arquivos temporários
sudo rm -rf /tmp/*
sudo rm -rf /var/tmp/*

echo "Limpeza concluída - $(date)"
```

```bash
# Tornar executável e automatizar
sudo chmod +x /opt/cleanup-system.sh

# Executar limpeza semanal
sudo crontab -e
# Adicionar: 0 2 * * 0 /opt/cleanup-system.sh
```

### 9. Monitoramento de Recursos
```bash
# Script de monitoramento simples
nano /opt/monitor.sh
```

```bash
#!/bin/bash

echo "=== Status do Sistema - $(date) ==="
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')"
echo "RAM: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2 }')"
echo "Disco: $(df -h / | awk 'NR==2{print $5}')"
echo "Aplicação: $(pm2 list | grep ChecklistStudio)"
```

### 10. Inicialização Otimizada
```bash
# Iniciar aplicação
pm2 start ecosystem.config.cjs

# Salvar configuração
pm2 save

# Configurar inicialização automática
pm2 startup
# Executar o comando mostrado

# Ativar nginx
sudo systemctl enable nginx
sudo ln -s /etc/nginx/sites-available/ChecklistStudio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# Configurar firewall mínimo
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw --force enable
```

### 11. Comandos de Manutenção Essenciais
```bash
# Verificar status
pm2 status
pm2 monit

# Ver logs
pm2 logs checklist-system --lines 50

# Reiniciar aplicação
pm2 restart checklist-system

# Verificar recursos
free -h
df -h
top -p $(pgrep -f checklist-system)

# Backup do banco SQLite
cp /opt/checklist-system/data/database.db /opt/backup_$(date +%Y%m%d).db
```

### 12. Solução de Problemas Específicos

#### Aplicação usando muita memória:
```bash
# Reiniciar aplicação
pm2 restart checklist-system

# Verificar logs de erro
pm2 logs checklist-system --err --lines 100
```

#### Pouco espaço em disco:
```bash
# Executar limpeza
/opt/cleanup-system.sh

# Verificar arquivos grandes
sudo du -h /opt/checklist-system | sort -hr | head -10

# Limpar logs manualmente se necessário
sudo truncate -s 0 /opt/checklist-system/logs/*.log
```

#### CPU em 100%:
```bash
# Verificar processos
htop

# Reduzir prioridade se necessário
sudo renice 10 $(pgrep -f checklist-system)
```

## Configuração do Primeiro Usuário

Como estamos usando SQLite, o banco será criado automaticamente. Para criar o primeiro usuário administrador:

```bash
# Entrar no diretório do projeto
cd /opt/checklist-system

# Criar usuário via script Node.js
node -e "
const bcrypt = require('bcrypt');
const Database = require('better-sqlite3');

const db = new Database('./data/database.db');
const hashedPassword = bcrypt.hashSync('admin123', 10);

// Criar tabela de usuários se não existir
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

// Inserir usuário admin
const stmt = db.prepare(\`
  INSERT OR REPLACE INTO users (id, email, name, password_hash, role)
  VALUES (?, ?, ?, ?, ?)
\`);

stmt.run('admin-id', 'admin@empresa.com', 'Administrador', hashedPassword, 'Administrador');
console.log('Usuário administrador criado!');
db.close();
"
```

## Configurações Finais de Performance

### Configurar limites do sistema:
```bash
# Editar limites
sudo nano /etc/security/limits.conf

# Adicionar:
* soft nofile 1024
* hard nofile 2048
* soft nproc 1024
* hard nproc 2048
```

### Configurar kernel para baixo uso de memória:
```bash
sudo nano /etc/sysctl.conf

# Adicionar:
vm.overcommit_memory=1
net.core.somaxconn=1024
```

## Recursos Utilizados com Esta Configuração:

- **RAM**: ~800MB em uso normal
- **CPU**: Baixo uso (5-15% em operação normal)
- **Disco**: ~2GB total após instalação
- **Porta**: 3000 (interna) / 80 (externa)

## Limitações desta Configuração:

- Máximo 20-30 usuários simultâneos
- SQLite (sem clustering)
- Cache limitado
- Logs com rotação automática
- Sem SSL automático (pode adicionar Let's Encrypt se necessário)

Esta configuração é ideal para equipes pequenas (até 50 usuários total) com uso moderado do sistema.