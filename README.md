# Sistema de Checklists - Claro Empresas

Sistema completo de gerenciamento de checklists para operações técnicas da Claro Empresas.

## 🚀 Execução Local - RÁPIDA

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar o sistema
npm run dev

# 3. Acessar no navegador
http://localhost:5000
```

### 👤 Usuários para Teste

| Usuário | Email | Senha | Perfil |
|---------|--------|-------|--------|
| Administrador | admin@checklistpro.com | admin123 | Acesso completo |
| Técnico | tecnico@checklistpro.com | tech123 | Criar checklists |
| Analista | analista@checklistpro.com | analyst123 | Aprovar checklists |

## ✨ Funcionalidades

- ✅ **Sistema Persistente** - Dados salvos em SQLite automaticamente
- ✅ **4 Tipos de Checklist** - Upgrade, Ativação, Migração, Manutenção  
- ✅ **Upload de Fotos** - Evidências fotográficas obrigatórias
- ✅ **Assinatura Digital** - Captura de assinatura do técnico
- ✅ **Exportação PDF** - Relatórios completos com todas as imagens
- ✅ **Sistema de Avaliação** - Rating e feedback dos técnicos
- ✅ **Dashboard Analítico** - Métricas em tempo real
- ✅ **Mobile Responsivo** - Funciona em tablets e smartphones

## 🏗️ Tecnologias

- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Express + Node.js + TypeScript
- **Banco:** SQLite (local) / PostgreSQL (produção)
- **UI:** shadcn/ui + Radix UI

## 📁 Estrutura

```
├── client/          # Interface React
├── server/          # API Express
├── shared/          # Tipos TypeScript
├── uploads/         # Arquivos dos usuários
├── database.db      # Banco SQLite
└── SETUP_LOCAL.md   # Guia detalhado
```

## 🔧 Desenvolvimento

O projeto já está configurado para rodar localmente:

- Banco SQLite criado automaticamente
- Usuários padrão inseridos na primeira execução
- Templates pré-configurados para todos os tipos
- Sistema de uploads funcionando
- Variáveis de ambiente configuradas

## 📋 Documentação Completa

Para instruções detalhadas, consulte [SETUP_LOCAL.md](./SETUP_LOCAL.md)

---

**Desenvolvido por:** Dymas Gomes  
**Versão:** 1.6.0  
**Data:** Agosto 2025