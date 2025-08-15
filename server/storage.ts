import { type User, type InsertUser, type Template, type InsertTemplate, type Checklist, type InsertChecklist, type Session, type InsertSession } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import Database from "better-sqlite3";

// Interface para informações de auditoria
export interface AuditInfo {
  clientIp?: string;
  userAgent?: string;
  geoLocation?: string;
  deviceInfo?: any;
}

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  deleteUser(id: string): Promise<boolean>;
  
  // Authentication
  createSession(userId: string): Promise<Session>;
  getSession(token: string): Promise<Session | undefined>;
  deleteSession(token: string): Promise<boolean>;
  
  // Templates
  getTemplates(): Promise<Template[]>;
  getTemplate(id: string): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: string, updates: Partial<Template>): Promise<Template | undefined>;
  deleteTemplate(id: string): Promise<boolean>;
  
  // Checklists
  getChecklists(): Promise<Checklist[]>;
  getChecklist(id: string): Promise<Checklist | undefined>;
  getChecklistByNumber(checklistNumber: string): Promise<Checklist | undefined>;
  getChecklistsByTechnician(technicianId: string): Promise<Checklist[]>;
  getChecklistsByStore(storeCode: string): Promise<Checklist[]>;
  getChecklistsByStatus(status: string): Promise<Checklist[]>;
  getChecklistsByDateRange(startDate: Date, endDate: Date): Promise<Checklist[]>;
  createChecklist(checklist: InsertChecklist, auditInfo?: AuditInfo): Promise<Checklist>;
  updateChecklist(id: string, updates: Partial<Checklist>): Promise<Checklist | undefined>;
  deleteChecklist(id: string): Promise<boolean>;
  
  // Audit and tracking
  generateChecklistNumber(): Promise<string>;
}

// SQLite Storage Implementation
export class SQLiteStorage implements IStorage {
  private db: Database.Database;

  constructor(dbPath: string = './database.db') {
    this.db = new Database(dbPath);
    this.initialize();
  }

  private async initialize() {
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Create tables
    this.createTables();
    
    // Seed initial data
    await this.seedInitialData();
  }

  private createTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        phone TEXT,
        cpf TEXT,
        contractor TEXT,
        active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token TEXT UNIQUE NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS templates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        icon TEXT,
        description TEXT,
        sections TEXT NOT NULL,
        active INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS checklists (
        id TEXT PRIMARY KEY,
        checklist_number TEXT UNIQUE NOT NULL,
        template_id TEXT NOT NULL,
        technician_id TEXT NOT NULL,
        analyst_id TEXT,
        store_code TEXT NOT NULL,
        store_manager TEXT NOT NULL,
        store_phone TEXT NOT NULL,
        status TEXT DEFAULT 'pendente',
        responses TEXT NOT NULL,
        photos TEXT,
        signature TEXT,
        validation_code TEXT,
        rating INTEGER,
        feedback TEXT,
        approval_comment TEXT,
        approved_by TEXT,
        approved_at TEXT,
        rejection_count INTEGER DEFAULT 0,
        client_ip TEXT,
        user_agent TEXT,
        geo_location TEXT,
        device_info TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (template_id) REFERENCES templates(id),
        FOREIGN KEY (technician_id) REFERENCES users(id),
        FOREIGN KEY (analyst_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_checklists_technician ON checklists(technician_id);
      CREATE INDEX IF NOT EXISTS idx_checklists_status ON checklists(status);
      CREATE INDEX IF NOT EXISTS idx_checklists_store ON checklists(store_code);
    `);
  }

  private async seedInitialData() {
    const existingAdmin = this.db.prepare('SELECT id FROM users WHERE email = ?').get('admin@checklistpro.com');
    
    if (!existingAdmin) {
      const users = [
        {
          id: randomUUID(),
          email: "admin@checklistpro.com",
          password: await bcrypt.hash("admin123", 10),
          name: "Administrador",
          role: "administrador",
          phone: "(11) 99999-9999",
          cpf: "000.000.000-00",
          contractor: "Sistema",
          active: 1,
          created_at: new Date().toISOString()
        },
        {
          id: randomUUID(),
          email: "tecnico@checklistpro.com",
          password: await bcrypt.hash("tech123", 10),
          name: "Técnico de Campo",
          role: "tecnico",
          phone: "(11) 88888-8888",
          cpf: "111.111.111-11",
          contractor: "TechCorp",
          active: 1,
          created_at: new Date().toISOString()
        },
        {
          id: randomUUID(),
          email: "analista@checklistpro.com",
          password: await bcrypt.hash("analyst123", 10),
          name: "Analista de Qualidade",
          role: "analista",
          phone: "(11) 77777-7777",
          cpf: "222.222.222-22",
          contractor: "QualityCorp",
          active: 1,
          created_at: new Date().toISOString()
        }
      ];

      const insertUser = this.db.prepare(`
        INSERT INTO users (id, email, password, name, role, phone, cpf, contractor, active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const user of users) {
        insertUser.run(user.id, user.email, user.password, user.name, user.role, user.phone, user.cpf, user.contractor, user.active, user.created_at);
      }

      // Create complete templates with all sections and fields
      const templates = [
        {
          id: randomUUID(),
          name: "Upgrade",
          type: "upgrade",
          icon: "fas fa-arrow-up",
          description: "Template para atualização de equipamentos de loja",
          sections: JSON.stringify([
            {
              id: 1,
              title: "Dados do Analista",
              icon: "fas fa-user-tie",
              fields: [
                { id: "analystName", label: "Nome do Analista", type: "text", required: true },
                { id: "analystEmail", label: "E-mail do Analista", type: "email", required: true },
                { id: "analystConsent", label: "Eu aceito que meus dados sensíveis serão armazenados.", type: "radio", required: true, options: ["SIM", "NÃO"] }
              ]
            },
            {
              id: 2,
              title: "Dados do Técnico",
              icon: "fas fa-hard-hat",
              fields: [
                { id: "techConsent", label: "Eu aceito que meus dados sensíveis serão armazenados.", type: "radio", required: true, options: ["SIM", "NÃO"] },
                { id: "techName", label: "Nome do Técnico", type: "text", required: true },
                { id: "techPhone", label: "Telefone", type: "tel", required: true },
                { id: "techCPF", label: "CPF", type: "text", required: true },
                { id: "techSelfie", label: "Tire uma selfie do seu rosto.", type: "photo", required: true },
                { id: "contractor", label: "Empreiteira/Operadora", type: "select", required: true, options: ["Global Hitss", "Claro/Telmex", "Delfia", "Outra"] },
                { id: "otherContractor", label: "Observações para 'Outra':", type: "textarea", conditional: { field: "contractor", value: "Outra" } }
              ]
            },
            {
              id: 3,
              title: "Dados da Loja",
              icon: "fas fa-store",
              fields: [
                { id: "storeCode", label: "Código da Loja", type: "text", required: true },
                { id: "storeManager", label: "Responsável", type: "text", required: true },
                { id: "storePhone", label: "Telefone", type: "tel", required: true }
              ]
            },
            {
              id: 4,
              title: "Produto a ser instalado",
              icon: "fas fa-network-wired",
              fields: [
                { id: "connectivityType", label: "Tipo de Conectividade", type: "select", required: true, options: ["BLC Claro 600Mbps", "BLD Claro 50Mbps"] },
                { id: "designation", label: "Designação", type: "text", required: true },
                { id: "speedTest", label: "Velocidade do Speed Test (apenas números em Mbps)", type: "number", required: true },
                { id: "speedTestPhoto", label: "Foto do Speed Test", type: "photo", required: true }
              ]
            },
            {
              id: 5,
              title: "Evidências",
              icon: "fas fa-camera",
              fields: [
                { id: "ipWan", label: "O IP WAN no Meraki está na faixa correta?", type: "evidence", required: true },
                { id: "vpn", label: "A VPN está fechada e há clientes conectados?", type: "evidence", required: true },
                { id: "aps", label: "Os APs estão conectados e os Mobshop funcionando?", type: "evidence", required: true },
                { id: "naming", label: "Todas as nomenclaturas estão corretas (network name, MX, MR, MS e MV)?", type: "evidence", required: true },
                { id: "notes", label: "O campo Notes foi atualizado com a nova designação?", type: "evidence", required: true }
              ]
            },
            {
              id: 6,
              title: "Código de Validação",
              icon: "fas fa-signature",
              fields: [
                { id: "validationCode", label: "Insira o código recebido e assine", type: "text", required: true },
                { id: "techSignature", label: "Assinatura - Técnico", type: "signature", required: true }
              ]
            }
          ]),
          active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: randomUUID(),
          name: "Upgrade (Novo)",
          type: "upgrade_novo",
          icon: "fas fa-arrow-up",
          description: "Template para atualização de equipamentos com testes e evidências específicas",
          sections: JSON.stringify([
            {
              id: 1,
              title: "Dados do Analista",
              icon: "fas fa-user-tie",
              fields: [
                { id: "analystName", label: "Nome do Analista", type: "text", required: true },
                { id: "analystEmail", label: "E-mail do Analista", type: "email", required: true },
                { id: "analystConsent", label: "Eu aceito que meus dados sensíveis serão armazenados.", type: "radio", required: true, options: ["SIM", "NÃO"] }
              ]
            },
            {
              id: 2,
              title: "Dados do Técnico",
              icon: "fas fa-hard-hat",
              fields: [
                { id: "techConsent", label: "Eu aceito que meus dados sensíveis serão armazenados.", type: "radio", required: true, options: ["SIM", "NÃO"] },
                { id: "techName", label: "Nome do Técnico", type: "text", required: true },
                { id: "techPhone", label: "Telefone", type: "tel", required: true },
                { id: "techCPF", label: "CPF", type: "text", required: true },
                { id: "techSelfie", label: "Tire uma selfie do seu rosto.", type: "photo", required: true },
                { id: "contractor", label: "Empreiteira/Operadora", type: "select", required: true, options: ["Global Hitss", "Claro/Telmex", "Delfia", "Outra"] },
                { id: "otherContractor", label: "Observações para 'Outra':", type: "textarea", conditional: { field: "contractor", value: "Outra" } }
              ]
            },
            {
              id: 3,
              title: "Dados da Loja",
              icon: "fas fa-store",
              fields: [
                { id: "storeCode", label: "Código da Loja", type: "text", required: true },
                { id: "storeManager", label: "Responsável", type: "text", required: true },
                { id: "storePhone", label: "Telefone", type: "tel", required: true }
              ]
            },
            {
              id: 4,
              title: "Teste de Conectividade",
              icon: "fas fa-wifi",
              fields: [
                { id: "connectivityTest", label: "TESTE DE CONECTIVIDADE", type: "photo", required: true },
                { id: "connectivityComment", label: "Comentário", type: "textarea", required: false }
              ]
            },
            {
              id: 5,
              title: "Teste de Speed",
              icon: "fas fa-tachometer-alt",
              fields: [
                { id: "speedTest", label: "TESTE DE SPEED", type: "photo", required: true },
                { id: "speedComment", label: "Comentário", type: "textarea", required: false }
              ]
            },
            {
              id: 6,
              title: "Ajuste Descrição do Notes no Meraki",
              icon: "fas fa-edit",
              fields: [
                { id: "merakiNotesAdjustment", label: "AJUSTE DESCRIÇÃO DO NOTES NO MERAKI", type: "photo", required: true },
                { id: "merakiComment", label: "Comentário", type: "textarea", required: false }
              ]
            },
            {
              id: 7,
              title: "Código de Validação",
              icon: "fas fa-signature",
              fields: [
                { id: "validationCode", label: "Insira o código recebido e assine", type: "text", required: true },
                { id: "techSignature", label: "Assinatura - Técnico", type: "signature", required: true }
              ]
            }
          ]),
          active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: randomUUID(),
          name: "Ativação",
          type: "ativacao",
          icon: "fas fa-power-off",
          description: "Template para ativação de novos serviços e equipamentos",
          sections: JSON.stringify([
            {
              id: 1,
              title: "Dados do Técnico",
              icon: "fas fa-user-hard-hat",
              fields: [
                { id: "techConsent", label: "Eu aceito que meu nome, fone, cpf, foto e outros dados sensíveis utilizados nesse checklist serão armazenados nos servidores da Checklist Virtual e da Claro.", type: "radio", required: true, options: ["SIM", "NÃO"] },
                { id: "techName", label: "Qual é o seu nome completo?(Técnico)", type: "text", required: true },
                { id: "techPhone", label: "Qual o seu n. de telefone celular?", type: "tel", required: true },
                { id: "techCPF", label: "Qual o seu CPF?", type: "text", required: true },
                { id: "techSelfie", label: "Tire uma selfie do seu rosto.", type: "photo", required: true }
              ]
            },
            {
              id: 2,
              title: "Dados da Loja",
              icon: "fas fa-building",
              fields: [
                { id: "storeCode", label: "Qual é o código da unidade que você está atendendo?(Exemplo: 21380, JC36)", type: "text", required: true },
                { id: "storeManager", label: "Nome do Responsável da Loja", type: "text", required: true },
                { id: "storePhone", label: "Telefone do Responsável Loja", type: "tel", required: true }
              ]
            },
            {
              id: 3,
              title: "Checkin com a Central",
              icon: "fas fa-phone",
              fields: [
                { id: "centralContact", label: "Entrou em contato com a central para liberação?", type: "evidence", required: true },
                { id: "authorizationCode", label: "Código de autorização recebido", type: "text", required: true },
                { id: "centralAgent", label: "Nome do atendente da central", type: "text", required: true }
              ]
            },
            {
              id: 4,
              title: "Avaliação do Local",
              icon: "fas fa-map-marker-alt",
              fields: [
                { id: "locationAccess", label: "Acesso ao local está liberado?", type: "evidence", required: true },
                { id: "safetyConditions", label: "Condições de segurança adequadas?", type: "evidence", required: true },
                { id: "locationPhoto", label: "Foto geral do local de instalação", type: "photo", required: true }
              ]
            },
            {
              id: 5,
              title: "Preparação para Instalação",
              icon: "fas fa-tools",
              fields: [
                { id: "toolsReady", label: "Todas as ferramentas necessárias estão disponíveis?", type: "evidence", required: true },
                { id: "equipmentReceived", label: "Todos os equipamentos foram recebidos?", type: "evidence", required: true },
                { id: "equipmentList", label: "Lista dos equipamentos a serem instalados", type: "textarea", required: true }
              ]
            },
            {
              id: 6,
              title: "Instalação Física",
              icon: "fas fa-hammer",
              fields: [
                { id: "rackInstallation", label: "Rack instalado e fixado adequadamente?", type: "evidence", required: true },
                { id: "cabling", label: "Cabeamento estruturado executado?", type: "evidence", required: true },
                { id: "rackPhoto", label: "Foto do rack com equipamentos instalados", type: "photo", required: true }
              ]
            },
            {
              id: 7,
              title: "Configuração de Rede",
              icon: "fas fa-network-wired",
              fields: [
                { id: "networkConfig", label: "Configuração de rede executada?", type: "evidence", required: true },
                { id: "ipConfiguration", label: "Configuração de IP válida?", type: "evidence", required: true },
                { id: "routingTest", label: "Teste de roteamento aprovado?", type: "evidence", required: true }
              ]
            },
            {
              id: 8,
              title: "Configuração WiFi",
              icon: "fas fa-wifi",
              fields: [
                { id: "wifiConfig", label: "WiFi configurado adequadamente?", type: "evidence", required: true },
                { id: "ssidConfig", label: "SSID configurado conforme padrão?", type: "evidence", required: true },
                { id: "wifiTest", label: "Teste de conectividade WiFi aprovado?", type: "evidence", required: true }
              ]
            },
            {
              id: 9,
              title: "Equipamentos Instalados",
              icon: "fas fa-router",
              fields: [
                { id: "equipmentPhoto", label: "Foto dos equipamentos instalados", type: "photo", required: true },
                { id: "serialNumbers", label: "Números de série dos equipamentos", type: "textarea", required: true },
                { id: "equipmentTest", label: "Todos os equipamentos funcionando?", type: "evidence", required: true }
              ]
            },
            {
              id: 10,
              title: "Teste de Velocidade",
              icon: "fas fa-tachometer-alt",
              fields: [
                { id: "speedTest", label: "Velocidade do Speed Test (Mbps)", type: "number", required: true },
                { id: "speedTestPhoto", label: "Foto do Speed Test", type: "photo", required: true },
                { id: "speedApproved", label: "Velocidade dentro do esperado?", type: "evidence", required: true }
              ]
            },
            {
              id: 11,
              title: "Teste de Conectividade",
              icon: "fas fa-plug",
              fields: [
                { id: "connectivityOk", label: "Todos os dispositivos estão conectados e funcionando?", type: "evidence", required: true },
                { id: "internetAccess", label: "Acesso à internet funcionando?", type: "evidence", required: true },
                { id: "internalNetworkTest", label: "Rede interna funcionando adequadamente?", type: "evidence", required: true }
              ]
            },
            {
              id: 12,
              title: "Configuração de Segurança",
              icon: "fas fa-shield-alt",
              fields: [
                { id: "firewallConfig", label: "Firewall configurado adequadamente?", type: "evidence", required: true },
                { id: "securityTest", label: "Teste de segurança aprovado?", type: "evidence", required: true },
                { id: "accessControl", label: "Controle de acesso configurado?", type: "evidence", required: true }
              ]
            },
            {
              id: 13,
              title: "Treinamento do Usuário",
              icon: "fas fa-chalkboard-teacher",
              fields: [
                { id: "userTraining", label: "Usuário foi treinado adequadamente?", type: "evidence", required: true },
                { id: "documentationDelivered", label: "Documentação entregue ao usuário?", type: "evidence", required: true },
                { id: "userSatisfaction", label: "Usuário demonstrou satisfação com o serviço?", type: "evidence", required: true }
              ]
            },
            {
              id: 14,
              title: "Finalização",
              icon: "fas fa-check-circle",
              fields: [
                { id: "validationCode", label: "Código de validação", type: "text", required: true },
                { id: "techSignature", label: "Assinatura do Técnico", type: "signature", required: true },
                { id: "observations", label: "Observações finais", type: "textarea" },
                { id: "clientSignature", label: "Assinatura do Cliente/Responsável", type: "signature", required: true }
              ]
            }
          ]),
          active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: randomUUID(),
          name: "Migração",
          type: "migracao",
          icon: "fas fa-exchange-alt",
          description: "Template para migração de sistemas e equipamentos conforme especificação Claro",
          sections: JSON.stringify([
            {
              id: 1,
              title: "Cadastro Técnico",
              icon: "fas fa-user-hard-hat",
              fields: [
                { id: "techConsent", label: "Eu aceito que meu nome, fone, cpf, foto e outros dados sensíveis utilizados nesse checklist serão armazenados nos servidores da Checklist Virtual e da Claro.", type: "radio", required: true, options: ["SIM", "NÃO"] },
                { id: "techName", label: "Qual é o seu nome completo?(Técnico)", type: "text", required: true },
                { id: "techPhone", label: "Qual o seu n. de telefone celular?", type: "tel", required: true },
                { id: "techCPF", label: "Qual o seu CPF?", type: "text", required: true },
                { id: "techSelfie", label: "Tire uma selfie do seu rosto.", type: "photo", required: true }
              ]
            },
            {
              id: 2,
              title: "Cadastro Unidade",
              icon: "fas fa-building",
              fields: [
                { id: "storeCode", label: "Qual é o código da unidade que você está atendendo?(Exemplo: 21380, JC36)", type: "text", required: true },
                { id: "storeManager", label: "Nome do Responsável da Loja", type: "text", required: true },
                { id: "storePhone", label: "Telefone do Responsável Loja", type: "tel", required: true }
              ]
            },
            {
              id: 3,
              title: "Checkin com a Central",
              icon: "fas fa-phone",
              fields: [
                { id: "centralContact", label: "Entrou em contato com a central?", type: "evidence", required: true },
                { id: "authorizationCode", label: "Código de autorização para migração", type: "text", required: true },
                { id: "migrationSchedule", label: "Horário agendado para migração", type: "text", required: true }
              ]
            },
            {
              id: 4,
              title: "Avaliação Pré-Migração",
              icon: "fas fa-search",
              fields: [
                { id: "currentSystemAssessment", label: "Sistema atual foi avaliado?", type: "evidence", required: true },
                { id: "backupVerification", label: "Backup dos dados verificado?", type: "evidence", required: true },
                { id: "preAssessmentPhoto", label: "Foto do estado atual do sistema", type: "photo", required: true }
              ]
            },
            {
              id: 5,
              title: "Liberação da Migração",
              icon: "fas fa-unlock",
              fields: [
                { id: "systemAccess", label: "Conseguiu baixar e acessar o sistema da migração?", type: "evidence", required: true },
                { id: "migrationReleased", label: "O check-in foi validado e a migração foi liberada?", type: "evidence", required: true },
                { id: "rackPhotoBefore", label: "Foto do rack, com a porta aberta, antes do início das atividades.", type: "photo", required: true }
              ]
            },
            {
              id: 6,
              title: "Remoção de Equipamentos Antigos",
              icon: "fas fa-trash-alt",
              fields: [
                { id: "oldEquipments", label: "Haverão equipamentos antigos sendo recolhidos?", type: "select", required: true, options: ["Apenas MX", "Apenas MR", "MX + MR", "Nenhum"] },
                { id: "oldEquipmentsPhoto", label: "Foto dos equipamentos antigos", type: "photo", conditional: { field: "oldEquipments", notValue: "Nenhum" } },
                { id: "removalConfirmation", label: "Remoção dos equipamentos antigos concluída?", type: "evidence", required: true }
              ]
            },
            {
              id: 7,
              title: "Instalação de Novos Equipamentos",
              icon: "fas fa-plus-circle",
              fields: [
                { id: "newEquipmentsPhoto", label: "Foto dos novos equipamentos instalados", type: "photo", required: true },
                { id: "equipmentConfiguration", label: "Configuração dos novos equipamentos realizada?", type: "evidence", required: true },
                { id: "serialNumbers", label: "Números de série dos novos equipamentos", type: "textarea", required: true }
              ]
            },
            {
              id: 8,
              title: "Configuração de Rede",
              icon: "fas fa-network-wired",
              fields: [
                { id: "networkMigration", label: "Migração da configuração de rede realizada?", type: "evidence", required: true },
                { id: "ipConfiguration", label: "Configuração de IPs migrada adequadamente?", type: "evidence", required: true },
                { id: "vlanConfiguration", label: "VLANs configuradas conforme especificação?", type: "evidence", required: true }
              ]
            },
            {
              id: 9,
              title: "Teste de Conectividade",
              icon: "fas fa-wifi",
              fields: [
                { id: "connectivityTest", label: "Teste de conectividade aprovado?", type: "evidence", required: true },
                { id: "internetAccess", label: "Acesso à internet funcionando?", type: "evidence", required: true },
                { id: "internalNetworkTest", label: "Rede interna funcionando adequadamente?", type: "evidence", required: true }
              ]
            },
            {
              id: 10,
              title: "Cabeamento e Organização",
              icon: "fas fa-sitemap",
              fields: [
                { id: "cablingOk", label: "Os cabos estão organizados e funcionais?", type: "evidence", required: true },
                { id: "rackOrganization", label: "Rack organizado adequadamente?", type: "evidence", required: true },
                { id: "cablingPhoto", label: "Foto do cabeamento organizado", type: "photo", required: true }
              ]
            },
            {
              id: 11,
              title: "Teste de Performance",
              icon: "fas fa-tachometer-alt",
              fields: [
                { id: "speedTest", label: "Velocidade final do Speed Test (Mbps)", type: "number", required: true },
                { id: "speedTestPhoto", label: "Foto do Speed Test final", type: "photo", required: true },
                { id: "performanceComparison", label: "Performance melhorou em relação ao sistema anterior?", type: "evidence", required: true }
              ]
            },
            {
              id: 12,
              title: "Verificação Final dos Sistemas",
              icon: "fas fa-check-double",
              fields: [
                { id: "allSystemsOk", label: "Todos os sistemas estão funcionando corretamente?", type: "evidence", required: true },
                { id: "servicesVerification", label: "Todos os serviços foram migrados e estão ativos?", type: "evidence", required: true },
                { id: "rackPhotoAfter", label: "Foto final do rack organizado", type: "photo", required: true }
              ]
            },
            {
              id: 13,
              title: "Finalização e Documentação",
              icon: "fas fa-signature",
              fields: [
                { id: "validationCode", label: "Código de validação", type: "text", required: true },
                { id: "techSignature", label: "Assinatura do Técnico", type: "signature", required: true },
                { id: "observations", label: "Observações da migração", type: "textarea" },
                { id: "clientSignature", label: "Assinatura do Cliente/Responsável", type: "signature", required: true }
              ]
            }
          ]),
          active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: randomUUID(),
          name: "Manutenção",
          type: "manutencao",
          icon: "fas fa-tools",
          description: "Template para manutenção preventiva e corretiva de equipamentos",
          sections: JSON.stringify([
            {
              id: 1,
              title: "Dados do Técnico",
              icon: "fas fa-user-cog",
              fields: [
                { id: "techConsent", label: "Eu aceito que meus dados sensíveis serão armazenados.", type: "radio", required: true, options: ["SIM", "NÃO"] },
                { id: "techName", label: "Nome do Técnico", type: "text", required: true },
                { id: "techPhone", label: "Telefone do Técnico", type: "tel", required: true },
                { id: "techCPF", label: "CPF do Técnico", type: "text", required: true },
                { id: "techSelfie", label: "Selfie do Técnico", type: "photo", required: true }
              ]
            },
            {
              id: 2,
              title: "Dados da Loja",
              icon: "fas fa-store-alt",
              fields: [
                { id: "storeCode", label: "Código da Loja", type: "text", required: true },
                { id: "storeManager", label: "Responsável da Loja", type: "text", required: true },
                { id: "storePhone", label: "Telefone da Loja", type: "tel", required: true }
              ]
            },
            {
              id: 3,
              title: "Checkin com a Central",
              icon: "fas fa-phone",
              fields: [
                { id: "centralContact", label: "Entrou em contato com a central para autorização?", type: "evidence", required: true },
                { id: "workOrderNumber", label: "Número da ordem de serviço", type: "text", required: true },
                { id: "centralAgent", label: "Nome do atendente da central", type: "text", required: true }
              ]
            },
            {
              id: 4,
              title: "Avaliação Inicial do Local",
              icon: "fas fa-search",
              fields: [
                { id: "initialAssessment", label: "Avaliação inicial do ambiente realizada?", type: "evidence", required: true },
                { id: "safetyCheck", label: "Verificação de segurança do local aprovada?", type: "evidence", required: true },
                { id: "environmentPhoto", label: "Foto do ambiente antes da manutenção", type: "photo", required: true }
              ]
            },
            {
              id: 5,
              title: "Tipo de Manutenção",
              icon: "fas fa-wrench",
              fields: [
                { id: "maintenanceType", label: "Tipo de manutenção", type: "select", required: true, options: ["Preventiva", "Corretiva", "Emergencial"] },
                { id: "problemDescription", label: "Descrição do problema/atividade", type: "textarea", required: true },
                { id: "equipmentsBefore", label: "Foto dos equipamentos antes da manutenção", type: "photo", required: true }
              ]
            },
            {
              id: 6,
              title: "Desligamento e Preparação",
              icon: "fas fa-power-off",
              fields: [
                { id: "systemShutdown", label: "Desligamento seguro dos sistemas realizado?", type: "evidence", required: true },
                { id: "toolsPreparation", label: "Ferramentas e equipamentos preparados?", type: "evidence", required: true },
                { id: "backupVerification", label: "Backup das configurações verificado?", type: "evidence", required: true }
              ]
            },
            {
              id: 7,
              title: "Execução da Manutenção",
              icon: "fas fa-cogs",
              fields: [
                { id: "maintenanceExecution", label: "Manutenção executada conforme procedimento?", type: "evidence", required: true },
                { id: "activitiesPerformed", label: "Atividades realizadas", type: "textarea", required: true },
                { id: "partsReplaced", label: "Peças substituídas (se houver)", type: "textarea" }
              ]
            },
            {
              id: 8,
              title: "Teste de Funcionamento",
              icon: "fas fa-check-circle",
              fields: [
                { id: "functionalTest", label: "Teste de funcionamento realizado?", type: "evidence", required: true },
                { id: "testPerformed", label: "Testes realizados foram bem-sucedidos?", type: "evidence", required: true },
                { id: "performanceCheck", label: "Verificação de performance aprovada?", type: "evidence", required: true }
              ]
            },
            {
              id: 9,
              title: "Teste de Conectividade",
              icon: "fas fa-wifi",
              fields: [
                { id: "connectivityTest", label: "Teste de conectividade aprovado?", type: "evidence", required: true },
                { id: "speedTest", label: "Velocidade do Speed Test pós-manutenção (Mbps)", type: "number", required: true },
                { id: "speedTestPhoto", label: "Foto do Speed Test", type: "photo", required: true }
              ]
            },
            {
              id: 10,
              title: "Organização e Limpeza",
              icon: "fas fa-broom",
              fields: [
                { id: "rackCleaned", label: "Rack foi limpo e organizado?", type: "evidence", required: true },
                { id: "cablingOk", label: "Cabeamento está organizado e funcionando?", type: "evidence", required: true },
                { id: "areaCleanup", label: "Área de trabalho foi limpa e organizada?", type: "evidence", required: true }
              ]
            },
            {
              id: 11,
              title: "Verificações Finais",
              icon: "fas fa-clipboard-check",
              fields: [
                { id: "systemsOperational", label: "Todos os sistemas estão operacionais?", type: "evidence", required: true },
                { id: "finalInspection", label: "Inspeção final aprovada?", type: "evidence", required: true },
                { id: "equipmentsAfter", label: "Foto final dos equipamentos", type: "photo", required: true }
              ]
            },
            {
              id: 12,
              title: "Documentação e Entrega",
              icon: "fas fa-file-alt",
              fields: [
                { id: "maintenanceReport", label: "Relatório de manutenção preenchido?", type: "evidence", required: true },
                { id: "clientHandover", label: "Entrega formal ao responsável da loja?", type: "evidence", required: true },
                { id: "recommendations", label: "Recomendações para futuras manutenções", type: "textarea" }
              ]
            },
            {
              id: 13,
              title: "Finalização",
              icon: "fas fa-signature",
              fields: [
                { id: "validationCode", label: "Código de validação", type: "text", required: true },
                { id: "techSignature", label: "Assinatura do Técnico", type: "signature", required: true },
                { id: "clientSignature", label: "Assinatura do Responsável da Loja", type: "signature", required: true },
                { id: "finalObservations", label: "Observações finais", type: "textarea" }
              ]
            }
          ]),
          active: 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const insertTemplate = this.db.prepare(`
        INSERT INTO templates (id, name, type, icon, description, sections, active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const template of templates) {
        insertTemplate.run(template.id, template.name, template.type, template.icon, template.description, template.sections, template.active, template.created_at, template.updated_at);
      }
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    return row ? this.mapUserFromRow(row) : undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const row = this.db.prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
    return row ? this.mapUserFromRow(row) : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user = {
      id: randomUUID(),
      email: insertUser.email,
      password: insertUser.password,
      name: insertUser.name,
      role: insertUser.role,
      phone: insertUser.phone || null,
      cpf: insertUser.cpf || null,
      contractor: insertUser.contractor || null,
      active: insertUser.active ?? true,
      created_at: new Date().toISOString()
    };

    this.db.prepare(`
      INSERT INTO users (id, email, password, name, role, phone, cpf, contractor, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user.id, user.email, user.password, user.name, user.role, user.phone, user.cpf, user.contractor, user.active ? 1 : 0, user.created_at);

    return this.mapUserFromRow(user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    
    this.db.prepare(`
      UPDATE users SET email = ?, name = ?, role = ?, phone = ?, cpf = ?, contractor = ?, active = ?
      WHERE id = ?
    `).run(updatedUser.email, updatedUser.name, updatedUser.role, updatedUser.phone, updatedUser.cpf, updatedUser.contractor, updatedUser.active ? 1 : 0, id);

    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    const rows = this.db.prepare('SELECT * FROM users').all() as any[];
    return rows.map(row => this.mapUserFromRow(row));
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM users WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Session methods
  async createSession(userId: string): Promise<Session> {
    const session = {
      id: randomUUID(),
      userId,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdAt: new Date()
    };

    this.db.prepare(`
      INSERT INTO sessions (id, user_id, token, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(session.id, session.userId, session.token, session.expiresAt.toISOString(), session.createdAt.toISOString());

    return session;
  }

  async getSession(token: string): Promise<Session | undefined> {
    const row = this.db.prepare('SELECT * FROM sessions WHERE token = ?').get(token) as any;
    if (!row) return undefined;

    const session = this.mapSessionFromRow(row);
    if (session.expiresAt < new Date()) {
      await this.deleteSession(token);
      return undefined;
    }

    return session;
  }

  async deleteSession(token: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return result.changes > 0;
  }

  // Template methods
  async getTemplates(): Promise<Template[]> {
    const rows = this.db.prepare('SELECT * FROM templates').all() as any[];
    return rows.map(row => this.mapTemplateFromRow(row));
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const row = this.db.prepare('SELECT * FROM templates WHERE id = ?').get(id) as any;
    return row ? this.mapTemplateFromRow(row) : undefined;
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const template = {
      id: randomUUID(),
      name: insertTemplate.name,
      type: insertTemplate.type,
      icon: insertTemplate.icon || null,
      description: insertTemplate.description || null,
      sections: JSON.stringify(insertTemplate.sections),
      active: insertTemplate.active ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.db.prepare(`
      INSERT INTO templates (id, name, type, icon, description, sections, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(template.id, template.name, template.type, template.icon, template.description, template.sections, template.active ? 1 : 0, template.created_at, template.updated_at);

    return this.mapTemplateFromRow(template);
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template | undefined> {
    const template = await this.getTemplate(id);
    if (!template) return undefined;

    const updatedTemplate = { 
      ...template, 
      ...updates, 
      updatedAt: new Date(),
      sections: updates.sections ? JSON.stringify(updates.sections) : JSON.stringify(template.sections)
    };

    this.db.prepare(`
      UPDATE templates SET name = ?, type = ?, icon = ?, description = ?, sections = ?, active = ?, updated_at = ?
      WHERE id = ?
    `).run(updatedTemplate.name, updatedTemplate.type, updatedTemplate.icon, updatedTemplate.description, updatedTemplate.sections, updatedTemplate.active ? 1 : 0, updatedTemplate.updatedAt.toISOString(), id);

    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM templates WHERE id = ?').run(id);
    return result.changes > 0;
  }

  // Checklist methods
  async getChecklists(): Promise<Checklist[]> {
    const rows = this.db.prepare('SELECT * FROM checklists ORDER BY created_at DESC').all() as any[];
    return rows.map(row => this.mapChecklistFromRow(row));
  }

  async getChecklist(id: string): Promise<Checklist | undefined> {
    const row = this.db.prepare('SELECT * FROM checklists WHERE id = ?').get(id) as any;
    return row ? this.mapChecklistFromRow(row) : undefined;
  }

  async getChecklistByNumber(checklistNumber: string): Promise<Checklist | undefined> {
    const row = this.db.prepare('SELECT * FROM checklists WHERE checklist_number = ?').get(checklistNumber) as any;
    return row ? this.mapChecklistFromRow(row) : undefined;
  }

  async getChecklistsByTechnician(technicianId: string): Promise<Checklist[]> {
    const rows = this.db.prepare('SELECT * FROM checklists WHERE technician_id = ? ORDER BY created_at DESC').all(technicianId) as any[];
    return rows.map(row => this.mapChecklistFromRow(row));
  }

  async getChecklistsByStore(storeCode: string): Promise<Checklist[]> {
    const rows = this.db.prepare('SELECT * FROM checklists WHERE store_code = ? ORDER BY created_at DESC').all(storeCode) as any[];
    return rows.map(row => this.mapChecklistFromRow(row));
  }

  async getChecklistsByStatus(status: string): Promise<Checklist[]> {
    const rows = this.db.prepare('SELECT * FROM checklists WHERE status = ? ORDER BY created_at DESC').all(status) as any[];
    return rows.map(row => this.mapChecklistFromRow(row));
  }

  async getChecklistsByDateRange(startDate: Date, endDate: Date): Promise<Checklist[]> {
    const rows = this.db.prepare('SELECT * FROM checklists WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC').all(startDate.toISOString(), endDate.toISOString()) as any[];
    return rows.map(row => this.mapChecklistFromRow(row));
  }

  async createChecklist(insertChecklist: InsertChecklist, auditInfo?: AuditInfo): Promise<Checklist> {
    const checklistNumber = await this.generateChecklistNumber();
    const now = new Date().toISOString();
    
    const checklist = {
      id: randomUUID(),
      checklist_number: checklistNumber,
      template_id: insertChecklist.templateId,
      technician_id: insertChecklist.technicianId,
      analyst_id: insertChecklist.analystId || null,
      store_code: insertChecklist.storeCode,
      store_manager: insertChecklist.storeManager,
      store_phone: insertChecklist.storePhone,
      status: insertChecklist.status || 'pendente',
      responses: JSON.stringify(insertChecklist.responses),
      photos: insertChecklist.photos ? JSON.stringify(insertChecklist.photos) : null,
      signature: insertChecklist.signature || null,
      validation_code: insertChecklist.validationCode || null,
      rating: insertChecklist.rating || null,
      feedback: insertChecklist.feedback || null,
      approval_comment: null,
      approved_by: null,
      approved_at: null,
      client_ip: auditInfo?.clientIp || null,
      user_agent: auditInfo?.userAgent || null,
      geo_location: auditInfo?.geoLocation || null,
      device_info: auditInfo?.deviceInfo ? JSON.stringify(auditInfo.deviceInfo) : null,
      created_at: now,
      updated_at: now
    };

    this.db.prepare(`
      INSERT INTO checklists (
        id, checklist_number, template_id, technician_id, analyst_id, store_code, 
        store_manager, store_phone, status, responses, photos, signature, 
        validation_code, rating, feedback, approval_comment, approved_by, 
        approved_at, client_ip, user_agent, geo_location, device_info, 
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      checklist.id, checklist.checklist_number, checklist.template_id, checklist.technician_id, 
      checklist.analyst_id, checklist.store_code, checklist.store_manager, checklist.store_phone, 
      checklist.status, checklist.responses, checklist.photos, checklist.signature, 
      checklist.validation_code, checklist.rating, checklist.feedback, checklist.approval_comment, 
      checklist.approved_by, checklist.approved_at, checklist.client_ip, checklist.user_agent, 
      checklist.geo_location, checklist.device_info, checklist.created_at, checklist.updated_at
    );

    return this.mapChecklistFromRow(checklist);
  }

  async updateChecklist(id: string, updates: Partial<Checklist>): Promise<Checklist | undefined> {
    const checklist = await this.getChecklist(id);
    if (!checklist) return undefined;

    const updatedChecklist = { ...checklist, ...updates, updatedAt: new Date() };
    
    this.db.prepare(`
      UPDATE checklists SET 
        status = ?, responses = ?, photos = ?, signature = ?, validation_code = ?, 
        rating = ?, feedback = ?, approval_comment = ?, approved_by = ?, approved_at = ?, 
        updated_at = ?
      WHERE id = ?
    `).run(
      updatedChecklist.status, 
      JSON.stringify(updatedChecklist.responses),
      updatedChecklist.photos ? JSON.stringify(updatedChecklist.photos) : null,
      updatedChecklist.signature,
      updatedChecklist.validationCode,
      updatedChecklist.rating,
      updatedChecklist.feedback,
      updatedChecklist.approvalComment,
      updatedChecklist.approvedBy,
      updatedChecklist.approvedAt?.toISOString(),
      updatedChecklist.updatedAt.toISOString(),
      id
    );

    return updatedChecklist;
  }

  async deleteChecklist(id: string): Promise<boolean> {
    const result = this.db.prepare('DELETE FROM checklists WHERE id = ?').run(id);
    return result.changes > 0;
  }

  async generateChecklistNumber(): Promise<string> {
    const count = this.db.prepare('SELECT COUNT(*) as total FROM checklists').get() as any;
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    return `CK${year}${month}${String(count.total + 1).padStart(4, '0')}`;
  }

  // Helper methods for mapping database rows to objects
  private mapUserFromRow(row: any): User {
    return {
      id: row.id,
      email: row.email,
      password: row.password,
      name: row.name,
      role: row.role,
      phone: row.phone,
      cpf: row.cpf,
      contractor: row.contractor,
      active: Boolean(row.active),
      createdAt: new Date(row.created_at)
    };
  }

  private mapSessionFromRow(row: any): Session {
    return {
      id: row.id,
      userId: row.user_id,
      token: row.token,
      expiresAt: new Date(row.expires_at),
      createdAt: new Date(row.created_at)
    };
  }

  private mapTemplateFromRow(row: any): Template {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      icon: row.icon,
      description: row.description,
      sections: JSON.parse(row.sections),
      active: Boolean(row.active),
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }

  private mapChecklistFromRow(row: any): Checklist {
    return {
      id: row.id,
      checklistNumber: row.checklist_number,
      templateId: row.template_id,
      technicianId: row.technician_id,
      analystId: row.analyst_id,
      storeCode: row.store_code,
      storeManager: row.store_manager,
      storePhone: row.store_phone,
      status: row.status,
      responses: JSON.parse(row.responses),
      photos: row.photos ? JSON.parse(row.photos) : null,
      signature: row.signature,
      validationCode: row.validation_code,
      rating: row.rating,
      feedback: row.feedback,
      approvalComment: row.approval_comment,
      approvedBy: row.approved_by,
      approvedAt: row.approved_at ? new Date(row.approved_at) : null,
      clientIp: row.client_ip,
      userAgent: row.user_agent,
      geoLocation: row.geo_location,
      deviceInfo: row.device_info ? JSON.parse(row.device_info) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

// Use SQLite storage only
export const storage = new SQLiteStorage();