module.exports = {
  apps: [{
    name: 'ChecklistStudio',
    script: 'dist/index.js',
    interpreter: 'node',
    
    // Configurações otimizadas para recursos limitados
    instances: 1, // Apenas 1 instância para economizar RAM
    autorestart: true,
    watch: false,
    max_memory_restart: '400M', // Reiniciar se usar mais que 400MB
    
    // Otimizações de ambiente
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=1024',
      UV_THREADPOOL_SIZE: 2
    },
    
    // Configurações de log para economizar espaço em disco
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    max_size: '10M',
    max_files: 3,
    
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
      NODE_OPTIONS: '--max-old-space-size=1024',
      UV_THREADPOOL_SIZE: 2
    }
  }]
};