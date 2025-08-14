# Guia de Configuração Local - Checklist Virtual

Este guia mostra como configurar e executar o Checklist Virtual localmente para desenvolvimento.

## 1. Pré-requisitos

### Software Necessário
- **Node.js 18+** (recomendado: 20 LTS)
- **npm** ou **yarn**
- **PostgreSQL 14+** ou **Docker** (opcional)
- **Git**

### Verificar Versões
```bash
node --version    # v20.x.x ou superior
npm --version     # 9.x.x ou superior
git --version     # qualquer versão recente
```

## 2. Instalação do PostgreSQL

### Opção 1: PostgreSQL Nativo

#### Windows
1. Baixe o PostgreSQL do [site oficial](https://www.postgresql.org/download/windows/)
2. Execute o instalador
3. Configure senha para o usuário `postgres`
4. Anote a porta (padrão: 5432)

#### macOS
```bash
# Usando Homebrew
brew install postgresql@14
brew services start postgresql@14

# Ou usando MacPorts
sudo port install postgresql14-server
sudo port load postgresql14-server
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Opção 2: Docker (Mais Fácil)
```bash
# Criar e executar container PostgreSQL
docker run --name checklist-postgres \
  -e POSTGRES_USER=checklist_user \
  -e POSTGRES_PASSWORD=checklist_pass \
  -e POSTGRES_DB=checklist_db \
  -p 5432:5432 \
  -d postgres:14

# Verificar se está rodando
docker ps
```

## 3. Configuração do Banco de Dados

### Se usando PostgreSQL nativo:
```bash
# Acessar PostgreSQL
sudo -u postgres psql

# Criar usuário e banco
CREATE USER checklist_user WITH PASSWORD 'checklist_pass';
CREATE DATABASE checklist_db OWNER checklist_user;
GRANT ALL PRIVILEGES ON DATABASE checklist_db TO checklist_user;

# Sair
\q
```

## 4. Configuração do Projeto

### Clone ou Download
```bash
# Se usando Git
git clone https://github.com/seu-usuario/checklist-virtual.git
cd checklist-virtual

# Ou extraia o arquivo ZIP baixado
```

### Instalação de Dependências
```bash
# Instalar todas as dependências
npm install

# Ou usando yarn
yarn install
```

### Configuração do Ambiente
```bash
# Copiar arquivo de exemplo
cp .env.example .env
```

Edite o arquivo `.env` com as configurações locais:
```env
# Ambiente
NODE_ENV=development

# Porta da aplicação
PORT=5000

# Banco de dados
DATABASE_URL=postgresql://checklist_user:checklist_pass@localhost:5432/checklist_db

# Chaves de segurança (para desenvolvimento)
JWT_SECRET=sua_chave_jwt_desenvolvimento_aqui_min_32_chars
SESSION_SECRET=sua_chave_sessao_desenvolvimento_aqui_min_32_chars

# Domínio local
DOMAIN=localhost:5000
```

### Preparar Banco de Dados
```bash
# Executar migrações e popular dados iniciais
npm run db:push

# Verificar se funcionou
npm run db:studio  # Abre interface web do banco
```

## 5. Executar o Projeto

### Modo Desenvolvimento
```bash
# Iniciar servidor de desenvolvimento
npm run dev

# Ou usando yarn
yarn dev
```

O servidor iniciará em `http://localhost:5000`

### Verificar se está funcionando
1. Abra o navegador em `http://localhost:5000`
2. Você deve ver a tela de login
3. Use um dos usuários padrão para testar

## 6. Usuários Padrão (Desenvolvimento)

Após executar `npm run db:push`, estes usuários estarão disponíveis:

### Administrador
- **Email**: admin@checklistpro.com
- **Senha**: admin123
- **Acesso**: Todas as funcionalidades

### Técnico
- **Email**: tecnico@checklistpro.com
- **Senha**: tech123
- **Acesso**: Criar e enviar checklists

### Analista
- **Email**: analista@checklistpro.com
- **Senha**: analyst123
- **Acesso**: Revisar e aprovar checklists

### Coordenador
- **Email**: coordenador@checklistpro.com
- **Senha**: coord123
- **Acesso**: Relatórios e gestão de equipe

## 7. Estrutura do Projeto

```
checklist-virtual/
├── client/              # Frontend React
│   ├── src/
│   │   ├── components/  # Componentes reutilizáveis
│   │   ├── pages/       # Páginas da aplicação
│   │   ├── lib/         # Utilitários e configurações
│   │   └── index.css    # Estilos globais
├── server/              # Backend Express
│   ├── routes.ts        # Rotas da API
│   ├── storage.ts       # Interface de armazenamento
│   └── index.ts         # Servidor principal
├── shared/              # Código compartilhado
│   └── schema.ts        # Esquemas do banco de dados
├── uploads/             # Arquivos enviados pelos usuários
├── .env                 # Variáveis de ambiente
├── package.json         # Dependências e scripts
└── vite.config.ts       # Configuração do Vite
```

## 8. Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Iniciar servidor de desenvolvimento

# Build
npm run build           # Construir para produção
npm run start           # Executar versão de produção

# Banco de dados
npm run db:push         # Aplicar mudanças no schema
npm run db:studio       # Interface visual do banco
npm run db:generate     # Gerar migrações

# Linting e formatação
npm run lint            # Verificar código
npm run format          # Formatar código
```

## 9. Desenvolvimento

### Hot Reload
O projeto usa Vite para desenvolvimento, então:
- Mudanças no frontend são aplicadas automaticamente
- Mudanças no backend reiniciam o servidor automaticamente
- Não é necessário recarregar a página manualmente

### Estrutura de Pastas para Desenvolvimento
```
client/src/
├── components/          # Componentes React
│   ├── ui/             # Componentes base (shadcn/ui)
│   └── layout/         # Componentes de layout
├── pages/              # Páginas da aplicação
├── lib/                # Utilitários
└── hooks/              # Hooks customizados
```

### Adicionando Novas Funcionalidades
1. **Backend**: Adicione rotas em `server/routes.ts`
2. **Database**: Modifique `shared/schema.ts` e execute `npm run db:push`
3. **Frontend**: Crie componentes em `client/src/components/`
4. **Páginas**: Adicione em `client/src/pages/` e registre em `App.tsx`

## 10. Troubleshooting

### Problemas Comuns

#### Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql  # Linux
brew services list | grep postgres  # macOS

# Verificar se banco existe
psql -h localhost -U checklist_user -d checklist_db
```

#### Porta já em uso
```bash
# Encontrar processo usando a porta
lsof -i :5000  # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Mudar porta no .env
PORT=3000
```

#### Dependências não encontradas
```bash
# Limpar cache e reinstalar
rm -rf node_modules package-lock.json
npm install
```

#### Problemas com TypeScript
```bash
# Verificar erros de tipo
npm run type-check

# Regenerar tipos do banco
npm run db:generate
```

### Logs de Debug
```bash
# Ver logs detalhados
DEBUG=* npm run dev

# Logs apenas do servidor
DEBUG=express:* npm run dev
```

## 11. Testando Funcionalidades

### Fluxo Básico de Teste
1. **Login** como administrador
2. **Criar template** com alguns campos
3. **Login** como técnico
4. **Preencher checklist** usando o template
5. **Login** como analista
6. **Aprovar/rejeitar** o checklist
7. **Verificar relatórios** como coordenador

### Testando Upload de Arquivos
1. Crie uma checklist com campo de foto
2. Faça upload de uma imagem (PNG, JPG)
3. Verifique se aparece na pasta `uploads/`
4. Confirme que a imagem é exibida no checklist

### Testando Responsividade
1. Abra as ferramentas de desenvolvedor (F12)
2. Teste em diferentes tamanhos de tela
3. Verifique especialmente no modo mobile (375px width)

## 12. Configurações Avançadas

### Usando Base de Dados Diferente
Para usar SQLite (mais simples para desenvolvimento):
```env
DATABASE_URL=file:./dev.db
```

### Configurando Email (Opcional)
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-app
```

### Debug do Frontend
```bash
# Executar apenas frontend
cd client
npm run dev
```

### Debug do Backend
```bash
# Executar apenas backend
cd server
npm run dev
```

## 13. Próximos Passos

Após configurar localmente:
1. Familiarize-se com a interface
2. Teste todas as funcionalidades
3. Leia o código em `client/src/` e `server/`
4. Faça modificações conforme necessário
5. Teste antes de fazer deploy

## 14. Suporte

### Problemas de Configuração
- Verifique logs no terminal
- Confirme versões do Node.js e PostgreSQL
- Verifique se todas as portas estão livres

### Recursos Úteis
- [Documentação do React](https://react.dev/)
- [Documentação do Express](https://expressjs.com/)
- [Documentação do PostgreSQL](https://www.postgresql.org/docs/)
- [Documentação do Vite](https://vitejs.dev/)

---

**Dica**: Para desenvolvimento, recomendamos usar VSCode com as extensões:
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- PostgreSQL (para gerenciar banco)