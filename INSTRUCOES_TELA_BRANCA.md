# 🔧 Instruções para Corrigir Tela Branca

## Problema Identificado
A aplicação está rodando na porta 3000, mas o frontend não foi corretamente compilado para produção.

## Solução Rápida

Execute no servidor:

```bash
cd /opt/ChecklistStudio
./fix-white-screen.sh
```

## Solução Manual

Se o script automático não funcionar:

```bash
# 1. Parar aplicação
pm2 delete ChecklistStudio

# 2. Fazer build do frontend
npm run build

# 3. Verificar se build foi criado
ls -la dist/public/

# 4. Iniciar aplicação
pm2 start ecosystem.config.cjs

# 5. Verificar status
pm2 status
pm2 logs ChecklistStudio --lines 10
```

## Verificação

Teste se está funcionando:

```bash
# Teste da API
curl http://localhost:3000/api/auth/me

# Teste do frontend
curl http://localhost:3000
```

## Acesso

- **URL**: http://IP_DO_SERVIDOR
- **Login**: admin@empresa.com
- **Senha**: admin123

## Troubleshooting

Se ainda não funcionar:

1. Verifique se o nginx está redirecionando corretamente
2. Confirme se a porta 3000 está aberta
3. Execute `./fix-pm2.sh` para diagnóstico completo