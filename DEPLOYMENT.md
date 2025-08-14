# Guia de Implantação - Checklist Virtual

## Pré-requisitos na VPS

1. **Node.js 18 ou superior**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **PM2 (Gerenciador de Processos)**
```bash
sudo npm install -g pm2
```

3. **Nginx (Proxy Reverso)**
```bash
sudo apt update
sudo apt install nginx
```

## Configuração do Projeto

### 1. Clone/Upload do Projeto
```bash
# Se usando Git
git clone <seu-repositorio>
cd checklist-virtual

# Ou faça upload dos arquivos para sua VPS
```

### 2. Instalação de Dependências
```bash
npm install
```

### 3. Build do Projeto
```bash
npm run build
```

### 4. Configuração do PM2
Crie um arquivo `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'checklist-virtual',
    script: './server/index.ts',
    interpreter: 'node',
    interpreter_args: '--loader tsx',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
  }]
};
```

### 5. Configuração do Nginx
Crie `/etc/nginx/sites-available/checklist-virtual`:
```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;

    # Servir arquivos estáticos
    location /assets/ {
        alias /caminho/para/seu/projeto/dist/assets/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy para a aplicação Node.js
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
    }
}
```

Ative o site:
```bash
sudo ln -s /etc/nginx/sites-available/checklist-virtual /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Comandos de Implantação

### 1. Iniciar a aplicação
```bash
pm2 start ecosystem.config.js
```

### 2. Salvar configuração do PM2
```bash
pm2 save
pm2 startup
```

### 3. Verificar status
```bash
pm2 status
pm2 logs checklist-virtual
```

## Configuração SSL (Opcional mas Recomendado)

### Usando Certbot (Let's Encrypt)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

## Estrutura de Arquivos na VPS
```
/var/www/checklist-virtual/
├── server/
├── client/
├── shared/
├── uploads/
├── package.json
├── ecosystem.config.js
└── ...
```

## Monitoramento e Manutenção

### Logs da aplicação
```bash
pm2 logs checklist-virtual
```

### Reiniciar aplicação
```bash
pm2 restart checklist-virtual
```

### Atualizar aplicação
```bash
git pull origin main  # se usando Git
npm install
npm run build
pm2 restart checklist-virtual
```

## Variáveis de Ambiente (se necessário)

Se você precisar configurar variáveis de ambiente específicas, crie um arquivo `.env` no diretório raiz:
```bash
NODE_ENV=production
PORT=3000
# Adicione outras variáveis conforme necessário
```

## Segurança Adicional

### Firewall
```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### Backup dos dados
Como o projeto usa SQLite em memória, considere implementar backup dos dados se necessário.

## Usuários Padrão

Após a implantação, você pode fazer login com:
- **Admin**: admin@checklistpro.com / admin123
- **Técnico**: tecnico@checklistpro.com / tech123
- **Analista**: analista@checklistpro.com / analyst123

## Resolução de Problemas

### Verificar se a aplicação está rodando
```bash
pm2 status
curl http://localhost:3000
```

### Verificar logs do Nginx
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Verificar portas em uso
```bash
sudo netstat -tlnp | grep :3000
```

## Notas Importantes

1. O projeto está configurado para funcionar em produção
2. Os uploads são salvos na pasta `uploads/`
3. O banco de dados é em memória (SQLite), então os dados são perdidos ao reiniciar
4. Se precisar de persistência de dados, considere migrar para PostgreSQL
5. Certifique-se de que a pasta `uploads/` tenha permissões adequadas

## Comandos Úteis

```bash
# Parar aplicação
pm2 stop checklist-virtual

# Remover aplicação do PM2
pm2 delete checklist-virtual

# Monitorar em tempo real
pm2 monit

# Recarregar configuração
pm2 reload ecosystem.config.js
```