# Guia Rápido - Rodar Localmente SEM PostgreSQL

Este guia mostra como rodar o Checklist Virtual na sua máquina **sem instalar PostgreSQL**, usando SQLite (banco de dados em arquivo).

## ✅ Vantagens do SQLite
- **Zero configuração** - não precisa instalar nada
- **Arquivo único** - todo o banco fica em um arquivo `.db`
- **Portátil** - funciona em qualquer sistema operacional
- **Rápido** - perfeito para desenvolvimento e testes

## 🚀 Passo a Passo Simples

### 1. Pré-requisitos (Apenas Node.js)

**Versão Recomendada: Node.js 20 LTS** (testado com v20.19.3)
**Versão Mínima: Node.js 18+**

```bash
# Verificar se tem Node.js instalado
node --version    # Deve mostrar v18.x.x ou v20.x.x
npm --version     # Deve mostrar 9.x.x ou 10.x.x

# Se não tiver ou versão antiga, baixe em: https://nodejs.org
# IMPORTANTE: Escolha a versão "LTS" (Long Term Support)
```

**Onde baixar:**
- Site oficial: https://nodejs.org
- Escolha: **LTS** (recomendado para estabilidade)
- Windows: `.msi` installer
- macOS: `.pkg` installer  
- Linux: Via package manager ou `.tar.gz`

### 2. Baixar e Extrair o Projeto
- Faça download do projeto (ZIP)
- Extraia em uma pasta de sua escolha
- Abra o terminal/prompt na pasta do projeto

### 3. Instalar Dependências
```bash
# Instalar tudo que precisa
npm install
```

### 4. Configurar Banco SQLite
```bash
# Copiar arquivo de configuração
cp .env.example .env
```

Edite o arquivo `.env` e substitua pela configuração SQLite:
```env
# Ambiente
NODE_ENV=development

# Porta da aplicação  
PORT=5000

# Banco SQLite (arquivo local)
DATABASE_URL=file:./database.db

# Chaves de segurança (pode deixar assim mesmo)
JWT_SECRET=minha_chave_jwt_super_secreta_desenvolvimento_123456
SESSION_SECRET=minha_chave_sessao_super_secreta_desenvolvimento_123456

# Domínio local
DOMAIN=localhost:5000
```

### 5. Criar Banco e Dados Iniciais
```bash
# Criar o banco SQLite e tabelas
npm run db:push

# ✅ Pronto! O arquivo database.db foi criado
```

### 6. Executar o Sistema
```bash
# Iniciar o servidor
npm run dev

# ✅ Abra http://localhost:5000 no navegador
```

## 👤 Usuários Pré-configurados

Assim que o sistema iniciar, você já pode fazer login com:

### Administrador (acesso total)
- **Email**: admin@checklistpro.com  
- **Senha**: admin123

### Técnico (criar checklists)
- **Email**: tecnico@checklistpro.com
- **Senha**: tech123

### Analista (aprovar checklists)  
- **Email**: analista@checklistpro.com
- **Senha**: analyst123

## 📁 Estrutura de Arquivos

Após rodar, você terá:
```
projeto/
├── database.db          # ← Seu banco SQLite aqui!
├── uploads/             # Fotos dos checklists
├── client/              # Interface do usuário
├── server/              # Lógica do servidor
├── .env                 # Suas configurações
└── package.json         # Dependências
```

## 🔧 Comandos Úteis

```bash
# Iniciar sistema
npm run dev

# Ver dados do banco (interface visual)
npm run db:studio

# Resetar banco (apagar tudo e recomeçar)
rm database.db
npm run db:push

# Fazer backup do banco
cp database.db backup-$(date +%Y%m%d).db

# Restaurar backup
cp backup-20250114.db database.db
```

## 📱 Testando o Sistema

### Fluxo Completo de Teste:
1. **Login como admin** → Criar um template
2. **Login como técnico** → Preencher checklist 
3. **Login como analista** → Aprovar checklist
4. **Ver relatórios** → Acompanhar status

### Teste Rápido:
1. Abra `http://localhost:5000`
2. Login: `admin@checklistpro.com` / `admin123`
3. Vá em **Templates** → já tem alguns prontos!
4. Logout e login como técnico
5. Vá em **Novo Checklist** → escolha um template
6. Preencha e envie
7. Login como analista para aprovar

## ❓ Problemas Comuns

### "Porta 5000 em uso"
```bash
# Mudar porta no .env
PORT=3000
```

### "Erro de permissão no database.db"
```bash
# Linux/Mac - dar permissão
chmod 666 database.db

# Windows - executar como administrador
```

### "npm install falhou"
```bash
# Limpar cache e tentar novamente
npm cache clean --force
rm -rf node_modules
npm install
```

### "Banco não criou"
```bash
# Forçar recriação
rm database.db
npm run db:push
```

## 🔒 Segurança para Desenvolvimento

O arquivo `.env` já vem com senhas de desenvolvimento. **Para produção**, mude:
- `JWT_SECRET` 
- `SESSION_SECRET`
- Senhas dos usuários padrão

## 📊 Verificar se Está Funcionando

1. **Sistema rodando**: `http://localhost:5000` carrega
2. **Login funciona**: Consegue entrar com os usuários
3. **Banco criado**: Existe arquivo `database.db` 
4. **Uploads funcionam**: Pasta `uploads/` é criada

## 🎯 Próximos Passos

Depois que estiver funcionando:
1. **Explore** todas as funcionalidades
2. **Crie** seus próprios templates
3. **Teste** em diferentes navegadores
4. **Personalize** conforme sua necessidade

## 💡 Dicas Extras

### Ver Conteúdo do Banco
```bash
# Interface web amigável
npm run db:studio

# Terminal (avançado)
sqlite3 database.db
.tables
SELECT * FROM users;
```

### Backup Automático
Crie um script para backup diário:
```bash
#!/bin/bash
cp database.db "backup-$(date +%Y%m%d-%H%M).db"
```

### Performance
O SQLite é rápido para desenvolvimento, mas para **produção com muitos usuários**, recomendamos PostgreSQL (use o SETUP_LOCAL.md nesse caso).

---

**🎉 Pronto! Sistema rodando sem PostgreSQL!**

Qualquer dúvida, verifique se:
- Node.js está instalado (v18+)
- Executou `npm install`
- Executou `npm run db:push`  
- Arquivo `.env` está configurado
- Sistema rodando em `http://localhost:5000`