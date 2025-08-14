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

      // Create minimal templates
      const templates = [
        {
          id: randomUUID(),
          name: "Upgrade",
          type: "upgrade",
          icon: "⬆️",
          description: "Template para upgrades de equipamentos de rede",
          sections: JSON.stringify([
            {
              id: "dados-loja",
              title: "Dados da Loja",
              icon: "🏪",
              description: "Informações básicas da loja",
              fields: [
                { id: "storeCode", type: "text", label: "Código da Loja", required: true },
                { id: "storeManager", type: "text", label: "Gerente da Loja", required: true },
                { id: "storePhone", type: "text", label: "Telefone da Loja", required: true }
              ]
            },
            {
              id: "dados-tecnico",
              title: "Dados do Técnico",
              icon: "👨‍🔧",
              description: "Informações do técnico responsável",
              fields: [
                { id: "techName", type: "text", label: "Nome do Técnico", required: true },
                { id: "techPhone", type: "text", label: "Telefone do Técnico", required: true },
                { id: "techCPF", type: "text", label: "CPF do Técnico", required: true }
              ]
            },
            {
              id: "teste-velocidade",
              title: "Teste de Velocidade",
              icon: "⚡",
              description: "Teste de velocidade da conexão",
              fields: [
                { id: "speedTest", type: "text", label: "Velocidade Medida (Mbps)", required: true },
                { id: "speedTest_photo", type: "photo", label: "Evidência do Teste", required: true }
              ]
            },
            {
              id: "assinatura",
              title: "Assinatura",
              icon: "✍️",
              description: "Assinatura do técnico",
              fields: [
                { id: "signature", type: "signature", label: "Assinatura do Técnico", required: true },
                { id: "techSelfie", type: "photo", label: "Selfie do Técnico", required: true }
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
          icon: "🟢",
          description: "Template para ativação de novos serviços",
          sections: JSON.stringify([
            {
              id: "dados-loja",
              title: "Dados da Loja",
              icon: "🏪",
              description: "Informações básicas da loja",
              fields: [
                { id: "storeCode", type: "text", label: "Código da Loja", required: true },
                { id: "storeManager", type: "text", label: "Gerente da Loja", required: true },
                { id: "storePhone", type: "text", label: "Telefone da Loja", required: true }
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
          icon: "🔄",
          description: "Template para migração de sistemas",
          sections: JSON.stringify([
            {
              id: "dados-loja",
              title: "Dados da Loja",
              icon: "🏪",
              description: "Informações básicas da loja",
              fields: [
                { id: "storeCode", type: "text", label: "Código da Loja", required: true },
                { id: "storeManager", type: "text", label: "Gerente da Loja", required: true },
                { id: "storePhone", type: "text", label: "Telefone da Loja", required: true }
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
          icon: "🔧",
          description: "Template para manutenção preventiva e corretiva",
          sections: JSON.stringify([
            {
              id: "dados-loja",
              title: "Dados da Loja",
              icon: "🏪",
              description: "Informações básicas da loja",
              fields: [
                { id: "storeCode", type: "text", label: "Código da Loja", required: true },
                { id: "storeManager", type: "text", label: "Gerente da Loja", required: true },
                { id: "storePhone", type: "text", label: "Telefone da Loja", required: true }
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