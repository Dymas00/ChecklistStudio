# Instalação do Sistema de Checklists - Ubuntu Server

## Pré-requisitos

### 1. Atualizar o sistema
```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Instalar Node.js (versão 18 ou superior)
```bash
# Instalar Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version
npm --version
```

### 3. Instalar PostgreSQL
```bash
# Instalar PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Iniciar e habilitar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configurar usuário postgres
sudo -u postgres psql
```

No PostgreSQL, execute:
```sql
-- Criar usuário para o sistema
CREATE USER checklist_user WITH PASSWORD 'sua_senha_segura';

-- Criar banco de dados
CREATE DATABASE checklist_system;

-- Dar permissões ao usuário
GRANT ALL PRIVILEGES ON DATABASE checklist_system TO checklist_user;

-- Sair do PostgreSQL
\q
```

### 4. Instalar PM2 para gerenciamento de processos
```bash
sudo npm install -g pm2
```

### 5. Instalar Git (se não estiver instalado)
```bash
sudo apt install git -y
```

## Instalação do Sistema

### 1. Clonar o repositório
```bash
# Navegar para o diretório onde deseja instalar
cd /opt

# Clonar o projeto (substitua pela URL do seu repositório)
sudo git clone https://github.com/seu-usuario/checklist-system.git
cd checklist-system

# Dar permissões ao usuário atual
sudo chown -R $USER:$USER /opt/checklist-system
```

### 2. Instalar dependências
```bash
# Instalar dependências do Node.js
npm install
```

### 3. Configurar variáveis de ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar arquivo de configuração
nano .env
```

Configure as seguintes variáveis no arquivo `.env`:
```env
# Database
DATABASE_URL=postgresql://checklist_user:sua_senha_segura@localhost:5432/checklist_system

# Server
PORT=5000
NODE_ENV=production

# Session
SESSION_SECRET=uma_chave_secreta_muito_segura_aqui

# Host (para acesso externo)
HOST=0.0.0.0
```

### 4. Executar migrações do banco de dados
```bash
# Executar push das migrações
npm run db:push
```

### 5. Construir o projeto para produção
```bash
# Build do frontend
npm run build
```

## Configuração de Produção

### 1. Configurar PM2
```bash
# Criar arquivo de configuração do PM2
nano ecosystem.config.js
```

Conteúdo do `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'checklist-system',
    script: 'server/index.ts',
    interpreter: 'npx',
    interpreter_args: 'tsx',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

### 2. Iniciar aplicação com PM2
```bash
# Iniciar aplicação
pm2 start ecosystem.config.js

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar automaticamente no boot
pm2 startup
# Execute o comando que aparecer na tela
```

### 3. Configurar Nginx (Proxy Reverso)
```bash
# Instalar Nginx
sudo apt install nginx -y

# Criar configuração do site
sudo nano /etc/nginx/sites-available/checklist-system
```

Configuração do Nginx:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;  # Substitua pelo seu domínio

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Ativar configuração do Nginx
```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/checklist-system /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### 5. Configurar Firewall
```bash
# Permitir SSH, HTTP e HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## SSL/HTTPS com Let's Encrypt (Opcional)

### 1. Instalar Certbot
```bash
sudo apt install snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

### 2. Obter certificado SSL
```bash
sudo certbot --nginx -d seu-dominio.com
```

## Criação do Primeiro Usuário Administrador

### 1. Conectar ao banco de dados
```bash
sudo -u postgres psql checklist_system
```

### 2. Inserir usuário administrador
```sql
INSERT INTO users (id, email, name, password_hash, role, created_at) 
VALUES (
    gen_random_uuid(),
    'admin@empresa.com',
    'Administrador',
    '$2b$10$exemplo_hash_da_senha', -- Use um hash bcrypt real
    'Administrador',
    NOW()
);
```

Para gerar o hash da senha, você pode usar:
```bash
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('sua_senha', 10));"
```

## Comandos Úteis de Manutenção

### Verificar status da aplicação
```bash
pm2 status
pm2 logs checklist-system
```

### Reiniciar aplicação
```bash
pm2 restart checklist-system
```

### Atualizar aplicação
```bash
# Parar aplicação
pm2 stop checklist-system

# Fazer pull das atualizações
git pull origin main

# Instalar novas dependências (se houver)
npm install

# Executar migrações (se houver)
npm run db:push

# Rebuild (se houver mudanças no frontend)
npm run build

# Reiniciar aplicação
pm2 start checklist-system
```

### Backup do banco de dados
```bash
# Fazer backup
sudo -u postgres pg_dump checklist_system > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
sudo -u postgres psql checklist_system < backup_arquivo.sql
```

### Logs do sistema
```bash
# Logs da aplicação
pm2 logs checklist-system

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

## Solução de Problemas

### Aplicação não inicia
```bash
# Verificar logs
pm2 logs checklist-system

# Verificar se a porta está disponível
sudo netstat -tlnp | grep :5000

# Verificar conexão com banco
sudo -u postgres psql checklist_system -c "SELECT version();"
```

### Problemas de permissão
```bash
# Corrigir permissões dos arquivos
sudo chown -R $USER:$USER /opt/checklist-system
chmod -R 755 /opt/checklist-system
```

### Performance baixa
```bash
# Monitorar recursos
htop
pm2 monit

# Verificar espaço em disco
df -h

# Verificar logs do PostgreSQL para consultas lentas
sudo nano /etc/postgresql/*/main/postgresql.conf
# Habilitar: log_min_duration_statement = 1000
```

## Segurança Adicional

### 1. Configurar fail2ban (proteção contra ataques)
```bash
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

### 2. Atualizações automáticas de segurança
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure unattended-upgrades
```

### 3. Configurar backup automático
```bash
# Criar script de backup
sudo nano /opt/backup-checklist.sh
```

Script de backup:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump checklist_system > /opt/backups/checklist_$DATE.sql
find /opt/backups -name "checklist_*.sql" -mtime +7 -delete
```

```bash
# Dar permissão de execução
sudo chmod +x /opt/backup-checklist.sh

# Criar diretório de backups
sudo mkdir -p /opt/backups

# Adicionar ao crontab (backup diário às 2h)
sudo crontab -e
# Adicionar linha: 0 2 * * * /opt/backup-checklist.sh
```

---

## Resumo dos Portos Utilizados

- **5000**: Aplicação Node.js (interno)
- **80**: HTTP (Nginx)
- **443**: HTTPS (Nginx + SSL)
- **5432**: PostgreSQL (interno)
- **22**: SSH

## Recursos Necessários

- **Mínimo**: 2GB RAM, 2 CPU cores, 20GB storage
- **Recomendado**: 4GB RAM, 4 CPU cores, 50GB storage

O sistema estará disponível em `http://seu-dominio.com` ou `https://seu-dominio.com` se SSL estiver configurado.