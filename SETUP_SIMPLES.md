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

### ⚠️ Erro "No matching export" - AuthProvider/useAuth
```
X [ERROR] No matching export in "client/src/lib/auth.ts" for import "AuthProvider"
```

**Causa:** Arquivo baixado como `auth.ts` em vez de `auth.tsx`

**Solução:**
```bash
# 1. Renomear o arquivo (Windows)
cd client/src/lib
ren auth.ts auth.tsx

# 2. Ou Linux/macOS
cd client/src/lib  
mv auth.ts auth.tsx

# 3. Reiniciar o servidor
npm run dev
```

### ⚠️ Erro "ENOTSUP" no Windows
```
Error: listen ENOTSUP: operation not supported on socket 0.0.0.0:5000
```

**Soluções:**
```bash
# 1. Mudar porta no .env
PORT=3000

# 2. Ou executar como administrador
# Botão direito no terminal → "Executar como administrador"

# 3. Verificar se Windows Defender está bloqueando
# Configurações → Vírus e proteção → Exclusões
```

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

**Checklist final:**
- ✅ Node.js instalado (v18+ ou v20+)
- ✅ `npm install` executado
- ✅ Arquivo `.env` criado e configurado
- ✅ `npm run db:push` executado
- ✅ Arquivo `client/src/lib/auth.tsx` (com extensão .tsx)
- ✅ `npm run dev` funcionando
- ✅ Sistema acessível em `http://localhost:5000`

**Se der erro de "No matching export":**
1. Verifique se existe `client/src/lib/auth.tsx` (não .ts)
2. Se estiver como .ts, renomeie para .tsx
3. Reinicie o servidor com `npm run dev`

## 🌐 Acessar de Outras Máquinas

Para permitir acesso de outros computadores/celulares na mesma rede:

### 1. Configurar o arquivo .env
```env
# Permitir acesso externo
HOST=0.0.0.0
PORT=5000

# Seu IP local (descobrir com ipconfig/ifconfig)
DOMAIN=192.168.1.100:5000  # Substitua pelo seu IP
```

### 2. Descobrir seu IP local
```bash
# Windows
ipconfig

# Linux/macOS  
ifconfig

# Procure por algo como: 192.168.1.100 ou 192.168.0.100
```

### 3. Liberar no Firewall (Windows)
```
1. Painel de Controle → Sistema e Segurança → Firewall do Windows
2. Configurações Avançadas → Regras de Entrada → Nova Regra
3. Porta → TCP → 5000 → Permitir conexão
4. Nome: "ChecklistVirtual"
```

### 4. Acessar de outros dispositivos
```
# No navegador dos outros dispositivos:
http://192.168.1.100:5000  # Use seu IP real

# Exemplo de IPs comuns:
http://192.168.1.100:5000
http://192.168.0.100:5000
http://10.0.0.100:5000
```