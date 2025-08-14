import fs from 'fs';
import path from 'path';

console.log('🚀 Configurando projeto para execução local...\n');

// 1. Verificar se .env existe, se não, copiar do exemplo
if (!fs.existsSync('.env')) {
  if (fs.existsSync('.env.example')) {
    fs.copyFileSync('.env.example', '.env');
    console.log('✅ Arquivo .env criado a partir do .env.example');
  } else {
    // Criar .env básico se não existe exemplo
    const basicEnv = `NODE_ENV=development
PORT=5000
DATABASE_URL=file:./database.db
JWT_SECRET=sistema_checklist_claro_empresas_jwt_secret_local_${Date.now()}
SESSION_SECRET=sistema_checklist_claro_empresas_session_secret_local_${Date.now()}
DOMAIN=localhost:5000
HOST=0.0.0.0
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads`;
    
    fs.writeFileSync('.env', basicEnv);
    console.log('✅ Arquivo .env criado com configurações básicas');
  }
} else {
  console.log('✅ Arquivo .env já existe');
}

// 2. Criar pasta uploads se não existe
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads', { recursive: true });
  console.log('✅ Pasta uploads criada');
} else {
  console.log('✅ Pasta uploads já existe');
}

// 3. Verificar se database.db existe
if (fs.existsSync('database.db')) {
  console.log('✅ Banco SQLite já existe');
} else {
  console.log('ℹ️  Banco SQLite será criado automaticamente na primeira execução');
}

console.log('\n🎉 Configuração local concluída!');
console.log('\n📋 Próximos passos:');
console.log('   1. Execute: npm run dev');
console.log('   2. Acesse: http://localhost:5000');
console.log('   3. Login com: admin@checklistpro.com / admin123\n');

console.log('📁 Usuários disponíveis:');
console.log('   • admin@checklistpro.com (admin123) - Administrador');
console.log('   • tecnico@checklistpro.com (tech123) - Técnico');
console.log('   • analista@checklistpro.com (analyst123) - Analista\n');