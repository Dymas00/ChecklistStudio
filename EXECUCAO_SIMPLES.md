# Execução Local Simples

## Para rodar o sistema localmente:

### 1. Primeiro acesso
```bash
npm install
npm run dev
```

### 2. Acessos seguintes  
```bash
npm run dev
```

### 3. Acesse no navegador
```
http://localhost:5000
```

### 4. Faça login com:
- **Email:** admin@checklistpro.com
- **Senha:** admin123

## Pronto! 🎉

O sistema está configurado para:
- Salvar dados automaticamente (SQLite)
- Funcionar sem configuração adicional
- Ter usuários e templates já criados
- Aceitar uploads de imagens
- Exportar PDFs completos

## Outros usuários disponíveis:
- **Técnico:** tecnico@checklistpro.com / tech123
- **Analista:** analista@checklistpro.com / analyst123

## Problemas?
- Porta ocupada? Mude PORT=3000 no arquivo .env
- Pasta sem permissão? Execute: mkdir uploads
- Banco corrompido? Delete database.db e reinicie