# 🔧 Instruções para Corrigir Tela Branca

## Problema Identificado
A aplicação está rodando na porta 3000, mas há problemas com o servidor de arquivos estáticos em produção. O frontend foi compilado mas não está sendo servido corretamente.

## Solução Rápida

Execute no servidor para diagnóstico e correção:

```bash
cd /opt/ChecklistStudio
./diagnose-server.sh    # Para diagnóstico
./fix-white-screen.sh   # Para correção automática
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
curl http://18.228.156.152:3000/api/auth/me

# Teste do frontend
curl http://18.228.156.152:3000
```

## Acesso

- **URL**: http://18.228.156.152
- **Login**: admin@empresa.com
- **Senha**: admin123

## Troubleshooting

Se ainda não funcionar:

1. **Teste servidor simples**: `node simple-server.js` (deve servir na porta 3000)
2. **Verifique nginx**: Se configurado, confirme proxy para porta 3000
3. **Diagnóstico completo**: Execute `./diagnose-server.sh`
4. **Logs detalhados**: `pm2 logs ChecklistStudio --lines 20`
5. **Reset completo**: Execute `./fix-pm2.sh`

## Arquivos de Teste Criados

- `simple-server.js`: Servidor Express básico para teste
- `diagnose-server.sh`: Script de diagnóstico completo
- `fix-white-screen.sh`: Correção automatizada