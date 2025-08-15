# Solução para Error 502 Bad Gateway

## Problema
O nginx está configurado mas não consegue se conectar ao processo PM2 do ChecklistStudio.

## Diagnóstico Rápido

Execute no servidor:

```bash
# 1. Verificar status PM2
pm2 status

# 2. Ver logs da aplicação
pm2 logs ChecklistStudio

# 3. Verificar se porta 3000 está em uso
sudo netstat -tlnp | grep :3000
```

## Solução Automática

Execute o script de correção:

```bash
cd /opt/ChecklistStudio
./fix-pm2.sh
```

## Solução Manual

Se o script automático não funcionar:

```bash
# 1. Parar tudo
pm2 delete ChecklistStudio
pm2 kill

# 2. Verificar se processo está usando porta 3000
sudo lsof -ti:3000 | xargs kill -9 2>/dev/null

# 3. Iniciar aplicação limpa
cd /opt/ChecklistStudio
pm2 start ecosystem.config.cjs

# 4. Verificar status
pm2 status
pm2 logs ChecklistStudio --lines 10

# 5. Testar conectividade
curl http://localhost:3000
```

## Verificação Final

Após corrigir, acesse:
- http://localhost (ou IP do servidor)
- Login: admin@empresa.com / admin123

## Comandos de Manutenção

```bash
# Status da aplicação
pm2 status

# Reiniciar aplicação
pm2 restart ChecklistStudio

# Ver logs em tempo real
pm2 logs ChecklistStudio --lines 50

# Monitoramento
pm2 monit

# Parar/Iniciar nginx
sudo systemctl restart nginx
sudo systemctl status nginx
```

## Problemas Comuns

1. **Processo não inicia**: Verificar se o arquivo ecosystem.config.cjs existe
2. **Porta ocupada**: Matar processo na porta 3000
3. **Permissões**: Verificar se usuário tem acesso aos arquivos
4. **Memória**: Verificar se não está sem RAM (máximo 400MB por processo)
5. **Dependências**: Executar `npm install` se algo estiver faltando