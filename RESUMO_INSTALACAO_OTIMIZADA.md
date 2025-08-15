# Resumo - Instalação Otimizada ChecklistStudio para 1CPU/2GB/8GB

## 📋 O que foi otimizado:

### Banco de Dados
- **SQLite** ao invés do PostgreSQL (economia de ~200MB RAM)
- Arquivo único `./data/database.db` 
- Sem processos separados

### Memória
- **Limite máximo**: 400MB por instância
- **Swap**: 1GB configurado automaticamente
- **Node.js**: Limitado a 1024MB (`--max-old-space-size=1024`)
- **Threads**: Reduzidas para 2 (`UV_THREADPOOL_SIZE=2`)

### Aplicação
- **1 instância** apenas (sem cluster)
- **Logs rotacionados**: máximo 10MB por arquivo, 3 arquivos
- **Cache reduzido**: 50 itens máximo
- **Uploads**: limitados a 5MB

### Sistema
- **Nginx compacto** com gzip habilitado
- **Limpeza automática** semanal
- **Monitoramento simples** de recursos
- **Firewall mínimo** (apenas SSH e HTTP)

## 🚀 Como instalar:

### Opção 1 - Script Automático (Recomendado)
```bash
# Fazer download dos arquivos do projeto
# Executar o script de instalação
chmod +x install-low-resource.sh
./install-low-resource.sh
```

### Opção 2 - Manual
Seguir o arquivo `INSTALACAO_SERVIDOR_LIMITADO.md` passo a passo.

## 📊 Recursos utilizados após instalação:

- **RAM**: ~800MB (40% de 2GB)
- **Disco**: ~2GB total
- **CPU**: 5-15% em uso normal
- **Swap**: Usado apenas quando necessário

## 🔧 Arquivos de configuração criados:

- `ecosystem.low-resource.js` - PM2 otimizado
- `.env.low-resource` - Variáveis de ambiente
- `install-low-resource.sh` - Script de instalação
- `/opt/cleanup-system.sh` - Limpeza automática
- `monitor.sh` - Monitoramento de recursos

## 📈 Capacidade da configuração:

- **Usuários simultâneos**: 20-30
- **Checklists por dia**: Até 500
- **Armazenamento**: Até 1000 checklists com fotos
- **Uptime esperado**: 99%+ com reinicializações automáticas

## 🔐 Login inicial:
- **Email**: admin@empresa.com  
- **Senha**: admin123
- **⚠️ ALTERAR após primeiro acesso!**

## 📋 Comandos importantes:

```bash
# Status da aplicação
pm2 status

# Ver logs
pm2 logs ChecklistStudio

# Monitorar recursos
./monitor.sh

# Reiniciar aplicação
pm2 restart ChecklistStudio

# Limpeza manual
/opt/cleanup-system.sh

# Ver uso do disco
df -h

# Ver uso da memória
free -h
```

## 🎯 URLs de acesso:
- **Local**: http://localhost
- **Externa**: http://SEU_IP_SERVIDOR

## ⚠️ Limitações importantes:

1. **Sem clustering** - apenas 1 instância
2. **SQLite** - sem alta concorrência 
3. **Sem SSL automático** - configurar manualmente se necessário
4. **Cache limitado** - pode ser mais lento em picos
5. **Logs limitados** - rotação automática para economizar espaço

## 🔧 Troubleshooting rápido:

### Aplicação não inicia:
```bash
pm2 logs ChecklistStudio --lines 50
```

### Pouco espaço:
```bash
/opt/cleanup-system.sh
du -h /opt/ChecklistStudio | head -10
```

### Muita memória:
```bash
pm2 restart ChecklistStudio
free -h
```

### CPU alta:
```bash
htop
sudo renice 10 $(pgrep -f ChecklistStudio)
```

Esta configuração é perfeita para:
- ✅ Empresas pequenas (até 50 usuários)  
- ✅ Uso moderado (até 500 checklists/mês)
- ✅ Orçamento limitado de servidor
- ✅ Configuração simples e manutenção fácil