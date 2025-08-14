# Checklist Virtual - Sistema de Gerenciamento de Checklists

## 📋 Visão Geral

Sistema web completo para gerenciamento de checklists operacionais com controle de acesso baseado em funções, projetado para otimizar fluxos de trabalho empresariais e melhorar a eficiência operacional.

### 🎯 Principais Funcionalidades

- **Gestão de Templates**: Criação e edição de templates de checklist com interface drag-and-drop
- **Fluxo de Aprovação**: Sistema de submissão e aprovação com status em tempo real
- **Controle de Acesso**: 4 níveis de usuário com permissões específicas
- **Responsividade**: Interface otimizada para desktop, tablet e mobile
- **Relatórios**: Analytics e relatórios detalhados de performance
- **Upload de Arquivos**: Suporte a fotos e anexos com validação
- **Assinatura Digital**: Captura de assinaturas eletrônicas

## 🏗️ Arquitetura Técnica

### Stack Principal
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Banco de Dados**: SQLite (desenvolvimento) / PostgreSQL (produção)
- **UI Framework**: shadcn/ui + Radix UI + Tailwind CSS
- **Estado**: TanStack Query (React Query)
- **Roteamento**: Wouter
- **Validação**: Zod + React Hook Form

### Estrutura do Projeto
```
checklist-virtual/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── components/     # Componentes reutilizáveis
│   │   │   ├── ui/         # Componentes base (shadcn/ui)
│   │   │   └── layout/     # Layout components
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── lib/            # Utilitários e configurações
│   │   └── hooks/          # Custom hooks
├── server/                 # Backend Express
│   ├── routes.ts           # Rotas da API
│   ├── storage.ts          # Interface de armazenamento
│   └── index.ts            # Servidor principal
├── shared/                 # Código compartilhado
│   └── schema.ts           # Esquemas Drizzle + Zod
├── uploads/                # Arquivos enviados
└── migrations/             # Migrações do banco
```

## 🔧 Requisitos do Sistema

### Requisitos Mínimos
- **Node.js**: 18.0.0+ (Recomendado: 20 LTS)
- **RAM**: 2GB mínimo (4GB recomendado)
- **Armazenamento**: 1GB livre
- **Navegadores**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### Requisitos de Produção
- **CPU**: 2 cores mínimo (4 cores recomendado)
- **RAM**: 4GB mínimo (8GB recomendado)
- **Armazenamento**: 10GB+ (depende do volume de uploads)
- **Banda**: 100Mbps+ para múltiplos usuários simultâneos
- **SSL**: Certificado válido (obrigatório para produção)

## 🚀 Instalação e Configuração

### Setup Local Rápido (SQLite)
```bash
# 1. Clonar/baixar projeto
git clone <repository-url>
cd checklist-virtual

# 2. Instalar dependências
npm install

# 3. Configurar ambiente
cp .env.example .env
# Editar .env conforme necessário

# 4. Criar banco e dados iniciais
npm run db:push

# 5. Iniciar desenvolvimento
npm run dev
```

### Setup com PostgreSQL
```bash
# 1. Instalar PostgreSQL
# Windows: https://www.postgresql.org/download/
# macOS: brew install postgresql
# Linux: sudo apt install postgresql

# 2. Criar banco
createdb checklist_virtual

# 3. Configurar .env
DATABASE_URL=postgresql://user:password@localhost:5432/checklist_virtual

# 4. Aplicar migrações
npm run db:push

# 5. Iniciar
npm run dev
```

## 🔐 Sistema de Usuários

### Roles e Permissões

| Role | Permissões | Descrição |
|------|------------|-----------|
| **Técnico** | Criar/editar checklists, visualizar próprios checklists | Usuário operacional básico |
| **Analista** | Aprovar/rejeitar checklists, visualizar todos os checklists | Revisor de checklists |
| **Coordenador** | Relatórios, gestão de equipe, analytics | Gestor intermediário |
| **Administrador** | Acesso total, gestão de usuários e templates | Administrador do sistema |

### Usuários Padrão
```
Administrador: admin@checklistpro.com / admin123
Técnico: tecnico@checklistpro.com / tech123
Analista: analista@checklistpro.com / analyst123
Coordenador: coordenador@checklistpro.com / coord123
```

## 📡 API Endpoints

### Autenticação
```
POST /api/auth/login      # Login do usuário
GET  /api/auth/me         # Dados do usuário autenticado
POST /api/auth/logout     # Logout
```

### Usuários
```
GET    /api/users         # Listar usuários
POST   /api/users         # Criar usuário
PUT    /api/users/:id     # Atualizar usuário
DELETE /api/users/:id     # Deletar usuário
```

### Templates
```
GET    /api/templates     # Listar templates
POST   /api/templates     # Criar template
PUT    /api/templates/:id # Atualizar template
DELETE /api/templates/:id # Deletar template
```

### Checklists
```
GET    /api/checklists         # Listar checklists
POST   /api/checklists         # Criar checklist
GET    /api/checklists/:id     # Obter checklist específico
PUT    /api/checklists/:id     # Atualizar checklist
PUT    /api/checklists/:id/approve   # Aprovar checklist
PUT    /api/checklists/:id/reject    # Rejeitar checklist
```

### Upload de Arquivos
```
POST /api/upload          # Upload de arquivo/imagem
```

## 🛠️ Scripts de Desenvolvimento

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento
npm run build           # Build de produção
npm run start           # Executar versão de produção

# Banco de dados
npm run db:push         # Aplicar mudanças no schema
npm run db:studio       # Interface visual do banco
npm run db:generate     # Gerar migrações

# Qualidade de código
npm run check           # Verificar tipos TypeScript
npm run lint            # Linting (se configurado)
```

## 🌐 Configuração de Rede

### Acesso Local
```env
HOST=localhost
PORT=5000
```

### Acesso de Múltiplas Máquinas
```env
HOST=0.0.0.0
PORT=5000
DOMAIN=192.168.1.100:5000  # Seu IP local
```

### Descobrir IP Local
```bash
# Windows
ipconfig

# Linux/macOS
ifconfig
ip addr show
```

## 🚢 Deploy em Produção

### VPS com SSL (Recomendado)
Ver arquivo `DEPLOYMENT_VPS.md` para guia completo de deploy com:
- Nginx como reverse proxy
- PM2 para gerenciamento de processos
- SSL automático com Certbot
- Configurações de firewall

### Deploy na Replit
1. Conectar repositório Git
2. Configurar variáveis de ambiente
3. Usar botão Deploy da Replit

## 🔧 Customização

### Temas e Cores
Editar `client/src/index.css`:
```css
:root {
  --primary: 210 40% 50%;      /* Cor principal */
  --secondary: 210 40% 90%;    /* Cor secundária */
  --accent: 210 40% 30%;       /* Cor de destaque */
}
```

### Adicionar Novos Campos
1. Modificar `shared/schema.ts`
2. Executar `npm run db:push`
3. Atualizar componentes frontend

### Adicionar Novos Roles
1. Atualizar enum `UserRole` em `shared/schema.ts`
2. Modificar lógica de permissões em `client/src/lib/auth.tsx`
3. Atualizar componentes de UI conforme necessário

## 📊 Monitoramento e Logs

### Logs do Sistema
```bash
# Logs de desenvolvimento
npm run dev  # Logs aparecem no console

# Logs de produção (PM2)
pm2 logs checklist-virtual
pm2 monit
```

### Métricas de Performance
- Tempo de carregamento de páginas
- Latência de API endpoints
- Uso de memória e CPU
- Volume de uploads

## 🐛 Troubleshooting

### Problemas Comuns

#### Erro "EADDRINUSE" (Porta em uso)
```bash
# Encontrar processo
lsof -i :5000          # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Mudar porta
PORT=3000 npm run dev
```

#### Erro "No matching export" (Windows)
```bash
# Renomear arquivo
cd client/src/lib
ren auth.ts auth.tsx   # Windows
mv auth.ts auth.tsx    # Linux/macOS
```

#### Banco de dados não cria
```bash
# Verificar permissões
chmod 755 .
chmod 666 database.db  # Se usando SQLite

# Recriar banco
rm database.db
npm run db:push
```

#### Upload de arquivos falha
- Verificar se pasta `uploads/` existe
- Verificar permissões da pasta
- Verificar limite de tamanho (MAX_FILE_SIZE)

## 🔒 Segurança

### Configurações de Produção
```env
NODE_ENV=production
JWT_SECRET=sua_chave_super_secreta_min_32_chars
SESSION_SECRET=outra_chave_super_secreta_min_32_chars
```

### Recomendações
- Sempre usar HTTPS em produção
- Configurar CORS adequadamente
- Implementar rate limiting
- Backup regular do banco de dados
- Monitorar logs de acesso

## 📈 Performance

### Otimizações Frontend
- Lazy loading de componentes
- Cache de queries com React Query
- Compressão de imagens
- Bundle splitting com Vite

### Otimizações Backend
- Índices no banco de dados
- Paginação em listagens
- Compressão gzip
- Cache de respostas API

## 🤝 Contribuição

### Setup de Desenvolvimento
1. Fork do repositório
2. Criar branch para feature: `git checkout -b feature/nova-funcionalidade`
3. Seguir padrões de código existentes
4. Testar thoroughly
5. Commit com mensagens descritivas
6. Pull request com descrição detalhada

### Padrões de Código
- TypeScript em todos os arquivos
- ESLint + Prettier para formatação
- Componentes funcionais React
- Props tipadas com interfaces
- Nomenclatura em português para domínio do negócio

## 📞 Suporte

### Recursos de Ajuda
- **Documentação**: Arquivos README e SETUP_*.md
- **Logs**: Console do navegador e logs do servidor
- **Database Studio**: `npm run db:studio` para visualizar dados

### Informações do Sistema
- **Versão Node.js**: `node --version`
- **Versão npm**: `npm --version`
- **Status do banco**: Verificar se arquivo `.db` existe ou conexão PostgreSQL
- **Portas em uso**: `lsof -i :5000` ou `netstat -ano`

---

**Desenvolvido por Dymas Gomes**

*Sistema completo de gerenciamento de checklists com foco em usabilidade e eficiência operacional.*