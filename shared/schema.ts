import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, blob } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'tecnico', 'analista', 'coordenador', 'administrador'
  phone: text("phone"),
  cpf: text("cpf"),
  contractor: text("contractor"),
  active: integer("active", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const templates = sqliteTable("templates", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'upgrade', 'ativacao', 'manutencao', 'migracao'
  description: text("description"),
  icon: text("icon").notNull(),
  sections: text("sections", { mode: 'json' }).notNull(), // Array of section objects
  active: integer("active", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const checklists = sqliteTable("checklists", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  checklistNumber: text("checklist_number").notNull().unique(), // Número sequencial único do checklist
  templateId: text("template_id").notNull().references(() => templates.id),
  technicianId: text("technician_id").notNull().references(() => users.id),
  analystId: text("analyst_id").references(() => users.id),
  storeCode: text("store_code").notNull(),
  storeManager: text("store_manager").notNull(),
  storePhone: text("store_phone").notNull(),
  status: text("status").notNull().default('pendente'), // 'pendente', 'aprovado', 'reprovado', 'em_analise'
  responses: text("responses", { mode: 'json' }).notNull(), // Form responses
  photos: text("photos", { mode: 'json' }), // Array of photo URLs
  signature: text("signature"), // Base64 signature
  validationCode: text("validation_code"),
  rating: integer("rating"), // 1-5 stars para avaliação do técnico
  feedback: text("feedback"), // comentário sobre o atendimento/técnico
  approvalComment: text("approval_comment"), // comentário do analista na aprovação/reprovação
  approvedBy: text("approved_by").references(() => users.id), // quem aprovou/reprovou
  approvedAt: integer("approved_at", { mode: 'timestamp' }), // quando foi aprovado/reprovado
  // Campos para auditoria e rastreamento
  clientIp: text("client_ip"), // IP do cliente que criou o checklist
  userAgent: text("user_agent"), // User agent do navegador
  geoLocation: text("geo_location"), // Localização GPS se disponível
  deviceInfo: text("device_info", { mode: 'json' }), // Informações do dispositivo
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: integer("expires_at", { mode: 'timestamp' }).notNull(),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Tabela para controle de sequência de números de checklist
export const checklistSequence = sqliteTable("checklist_sequence", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  lastNumber: integer("last_number").notNull().default(0),
  year: integer("year").notNull(),
  updatedAt: integer("updated_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChecklistSchema = createInsertSchema(checklists).omit({ 
  id: true, 
  checklistNumber: true, 
  createdAt: true, 
  updatedAt: true 
});
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true });
export const insertChecklistSequenceSchema = createInsertSchema(checklistSequence).omit({ 
  id: true, 
  updatedAt: true 
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Checklist = typeof checklists.$inferSelect;
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type ChecklistSequence = typeof checklistSequence.$inferSelect;
export type InsertChecklistSequence = z.infer<typeof insertChecklistSequenceSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginData = z.infer<typeof loginSchema>;

// User roles enum
export const UserRole = {
  TECNICO: 'tecnico',
  ANALISTA: 'analista', 
  ANALISTA_MIGRACAO: 'analista_migracao',
  COORDENADOR: 'coordenador',
  ADMINISTRADOR: 'administrador'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];
