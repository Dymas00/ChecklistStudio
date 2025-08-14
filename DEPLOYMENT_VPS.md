# Guia Completo de Deploy para VPS com SSL

Este guia mostra como fazer o deploy completo do Checklist Virtual em uma VPS com certificado SSL.

## 1. Preparação da VPS

### Requisitos Mínimos
- VPS com Ubuntu 20.04+ ou Debian 11+
- 2GB RAM (mínimo 1GB)
- 20GB de armazenamento
- Acesso root ou sudo

### Atualização do Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### Instalação das Dependências
```bash
# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Nginx
sudo apt install -y nginx

# PM2 (Gerenciador de Processos)
sudo npm install -g pm2

# Certbot para SSL
sudo apt install -y certbot python3-certbot-nginx

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Git
sudo apt install -y git
```

## 2. Configuração do PostgreSQL

### Criação do Banco de Dados
```bash
# Acesso como postgres
sudo -u postgres psql

# Criar usuário e banco
CREATE USER checklist_user WITH PASSWORD 'senha_forte_aqui';
CREATE DATABASE checklist_db OWNER checklist_user;
GRANT ALL PRIVILEGES ON DATABASE checklist_db TO checklist_user;
\q
```

### Configuração de Acesso
```bash
# Editar configuração PostgreSQL
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Adicionar linha (substituir * pela versão):
local   checklist_db    checklist_user                    md5

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

## 3. Preparação do Projeto

### Download do Código
```bash
# Criar diretório de aplicação
sudo mkdir -p /var/www/checklist-virtual
sudo chown $USER:$USER /var/www/checklist-virtual

# Clonar ou fazer upload do código
cd /var/www/checklist-virtual
# Copie todos os arquivos do projeto aqui
```

### Configuração do Ambiente
```bash
# Criar arquivo .env
cp .env.example .env
nano .env
```

Edite o arquivo `.env` com suas configurações:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://checklist_user:senha_forte_aqui@localhost:5432/checklist_db
JWT_SECRET=sua_chave_jwt_muito_segura_aqui_128_caracteres_minimo
SESSION_SECRET=sua_chave_sessao_muito_segura_aqui_128_caracteres_minimo
DOMAIN=seu-dominio.com
```

### Instalação das Dependências
```bash
npm ci --production
npm run build
```

### Configuração do Banco de Dados
```bash
# Executar migrações
npm run db:push
```

## 4. Configuração do PM2

### Arquivo ecosystem.config.js (já incluído no projeto)
```bash
# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Salvar configuração PM2
pm2 save

# Configurar PM2 para iniciar automaticamente
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME
```

## 5. Configuração do Nginx

### Criar Configuração do Site
```bash
sudo nano /etc/nginx/sites-available/checklist-virtual
```

Conteúdo do arquivo:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Servir arquivos estáticos diretamente
    location /uploads/ {
        alias /var/www/checklist-virtual/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
}
```

### Ativar o Site
```bash
# Ativar configuração
sudo ln -s /etc/nginx/sites-available/checklist-virtual /etc/nginx/sites-enabled/

# Remover site padrão
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

## 6. Configuração de SSL com Let's Encrypt

### Obter Certificado SSL
```bash
# Obter certificado SSL automático
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com

# Seguir instruções interativas do certbot
# Escolher redirecionamento automático para HTTPS
```

### Renovação Automática
```bash
# Testar renovação
sudo certbot renew --dry-run

# Configurar renovação automática (já configurado automaticamente)
sudo crontab -l
```

## 7. Configuração de Firewall

### UFW (Ubuntu Firewall)
```bash
# Ativar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP e HTTPS
sudo ufw allow 'Nginx Full'

# Verificar status
sudo ufw status
```

## 8. Configuração de Logs

### Configurar Rotação de Logs
```bash
sudo nano /etc/logrotate.d/checklist-virtual
```

Conteúdo:
```
/var/www/checklist-virtual/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reload checklist-virtual
    endscript
}
```

## 9. Monitoramento e Backup

### Configurar Backup do Banco
```bash
# Criar script de backup
sudo nano /usr/local/bin/backup-checklist.sh
```

Script de backup:
```bash
#!/bin/bash
BACKUP_DIR="/var/backups/checklist-virtual"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup do banco de dados
pg_dump -h localhost -U checklist_user checklist_db > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz /var/www/checklist-virtual/uploads/

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup realizado: $DATE"
```

```bash
# Tornar executável
sudo chmod +x /usr/local/bin/backup-checklist.sh

# Agendar backup diário
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-checklist.sh") | crontab -
```

## 10. Comandos Úteis para Manutenção

### Verificar Status
```bash
# Status da aplicação
pm2 status

# Logs da aplicação
pm2 logs checklist-virtual

# Status do Nginx
sudo systemctl status nginx

# Status do PostgreSQL
sudo systemctl status postgresql
```

### Reiniciar Serviços
```bash
# Reiniciar aplicação
pm2 restart checklist-virtual

# Reiniciar Nginx
sudo systemctl restart nginx

# Reiniciar PostgreSQL
sudo systemctl restart postgresql
```

### Atualizar Aplicação
```bash
cd /var/www/checklist-virtual

# Parar aplicação
pm2 stop checklist-virtual

# Fazer backup
/usr/local/bin/backup-checklist.sh

# Atualizar código (git pull ou upload de novos arquivos)
npm ci --production
npm run build
npm run db:push

# Reiniciar aplicação
pm2 start checklist-virtual
```

## 11. Verificação Final

### Testes de Funcionamento
1. Acesse `https://seu-dominio.com`
2. Verifique se o SSL está funcionando (cadeado verde)
3. Teste login com usuários padrão
4. Verifique criação de checklists
5. Teste upload de arquivos

### URLs de Teste
- Site principal: `https://seu-dominio.com`
- Verificação SSL: `https://www.ssllabs.com/ssltest/`
- Verificação de segurança: `https://securityheaders.com/`

## 12. Resolução de Problemas

### Logs Importantes
```bash
# Logs da aplicação
pm2 logs checklist-virtual --lines 100

# Logs do Nginx
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Problemas Comuns
1. **Erro 502 Bad Gateway**: Verificar se PM2 está rodando
2. **Erro de SSL**: Verificar configuração do Certbot
3. **Erro de banco**: Verificar STRING_DATABASE_URL e permissões
4. **Upload não funciona**: Verificar permissões da pasta uploads

## 13. Configurações de Segurança Avançadas

### Fail2Ban (Proteção contra ataques)
```bash
sudo apt install -y fail2ban

sudo nano /etc/fail2ban/jail.local
```

Configuração básica:
```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
```

### Configurar usuário específico para aplicação
```bash
# Criar usuário para aplicação
sudo adduser --system --group --home /var/www/checklist-virtual checklist

# Alterar proprietário dos arquivos
sudo chown -R checklist:checklist /var/www/checklist-virtual

# Atualizar ecosystem.config.js para usar o usuário específico
```

## Conclusão

Após seguir todos esses passos, sua aplicação Checklist Virtual estará rodando de forma segura em sua VPS com:

- ✅ SSL/TLS ativado automaticamente
- ✅ Renovação automática de certificados
- ✅ Backup automático do banco de dados
- ✅ Monitoramento via PM2
- ✅ Proxy reverso com Nginx
- ✅ Firewall configurado
- ✅ Logs organizados
- ✅ Proteção contra ataques básicos

**Usuários padrão para primeiro acesso:**
- **Administrador**: admin@checklistpro.com / admin123
- **Técnico**: tecnico@checklistpro.com / tech123
- **Analista**: analista@checklistpro.com / analyst123

**IMPORTANTE:** Altere as senhas padrão imediatamente após o primeiro acesso!