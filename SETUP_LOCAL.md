# Setup Local - Sistema de Checklists Claro Empresas

## Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- Git

## Instalação e Configuração

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd checklist-virtual
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Copie o arquivo de exemplo e configure:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:
```env
NODE_ENV=development
PORT=5000

# BANCO DE DADOS - SQLite (persistente e local)
DATABASE_URL=file:./database.db

# Chaves de segurança (modifique para produção)
JWT_SECRET=sua_chave_jwt_super_secreta_local_min_32_chars
SESSION_SECRET=sua_chave_sessao_super_secreta_local_min_32_chars

# Configurações de rede
DOMAIN=localhost:5000
HOST=0.0.0.0

# Para acessar de outras máquinas na rede local:
# HOST=0.0.0.0
# DOMAIN=192.168.1.100:5000  # Substitua pelo seu IP local

# Configurações de upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### 4. Inicie o servidor de desenvolvimento
```bash
npm run dev
```

O sistema será iniciado em: http://localhost:5000

## Usuários Padrão

### Administrador
- **Email:** admin@checklistpro.com
- **Senha:** admin123
- **Acesso:** Completo ao sistema

### Técnico
- **Email:** tecnico@checklistpro.com  
- **Senha:** tech123
- **Acesso:** Criar e preencher checklists

### Analista
- **Email:** analista@checklistpro.com
- **Senha:** analyst123
- **Acesso:** Aprovar/reprovar checklists

## Funcionalidades Disponíveis

✅ **Banco de dados SQLite** - Dados persistem automaticamente
✅ **Templates pré-configurados** - Upgrade, Ativação, Migração, Manutenção
✅ **Upload de arquivos** - Evidências fotográficas e documentos
✅ **Sistema de assinaturas** - Captura digital de assinaturas
✅ **Exportação PDF** - Relatórios completos com imagens
✅ **Sistema de avaliações** - Rating e feedback dos técnicos
✅ **Dashboard analítico** - Métricas e relatórios gerenciais

## Estrutura do Projeto

```
├── client/          # Frontend React + TypeScript
├── server/          # Backend Express + TypeScript  
├── shared/          # Schemas e tipos compartilhados
├── uploads/         # Arquivos enviados pelos usuários
├── database.db      # Banco SQLite (criado automaticamente)
├── package.json     # Dependências e scripts
└── .env            # Variáveis de ambiente
```

## Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento

# Produção
npm run build        # Compila o projeto
npm start           # Inicia servidor de produção

# Banco de dados
npm run db:push     # Aplica mudanças no schema
npm run db:studio   # Interface visual do banco (se configurado)
```

## Solução de Problemas

### Erro de porta ocupada
Se a porta 5000 estiver ocupada, modifique no arquivo `.env`:
```env
PORT=3000
```

### Problemas de permissão
Certifique-se que a pasta tem permissões de escrita:
```bash
chmod 755 ./
mkdir -p uploads
chmod 755 uploads
```

### Reset do banco de dados
Para resetar completamente:
```bash
rm database.db
npm run dev  # Recria automaticamente
```

### Acesso de outras máquinas na rede
1. Descubra seu IP local:
```bash
# Linux/Mac
ip addr show | grep inet
# ou
ifconfig | grep inet

# Windows
ipconfig
```

2. Configure no `.env`:
```env
HOST=0.0.0.0
DOMAIN=192.168.1.100:5000  # Seu IP local
```

3. Acesse de outras máquinas: `http://192.168.1.100:5000`

## Backup e Restore

### Backup
```bash
# Backup do banco
cp database.db backup_$(date +%Y%m%d).db

# Backup dos uploads
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/
```

### Restore
```bash
# Restore do banco
cp backup_20250814.db database.db

# Restore dos uploads
tar -xzf uploads_backup_20250814.tar.gz
```

## Suporte

Para problemas técnicos ou dúvidas:
- Verifique os logs no terminal onde o servidor está rodando
- Consulte este guia para soluções comuns
- Entre em contato com o desenvolvedor: Dymas Gomes