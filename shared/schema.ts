import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(), // 'tecnico', 'analista', 'coordenador', 'administrador'
  phone: text("phone"),
  cpf: text("cpf"),
  contractor: text("contractor"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'upgrade', 'ativacao', 'manutencao', 'migracao'
  description: text("description"),
  icon: text("icon").notNull(),
  sections: jsonb("sections").notNull(), // Array of section objects
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const checklists = pgTable("checklists", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  templateId: varchar("template_id").notNull().references(() => templates.id),
  technicianId: varchar("technician_id").notNull().references(() => users.id),
  analystId: varchar("analyst_id").references(() => users.id),
  storeCode: text("store_code").notNull(),
  storeManager: text("store_manager").notNull(),
  storePhone: text("store_phone").notNull(),
  status: text("status").notNull().default('pendente'), // 'pendente', 'aprovado', 'reprovado', 'em_analise'
  responses: jsonb("responses").notNull(), // Form responses
  photos: jsonb("photos"), // Array of photo URLs
  signature: text("signature"), // Base64 signature
  validationCode: text("validation_code"),
  rating: integer("rating"), // 1-5 stars
  feedback: text("feedback"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChecklistSchema = createInsertSchema(checklists).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSessionSchema = createInsertSchema(sessions).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Checklist = typeof checklists.$inferSelect;
export type InsertChecklist = z.infer<typeof insertChecklistSchema>;
export type Session = typeof sessions.$inferSelect;
export type InsertSession = z.infer<typeof insertSessionSchema>;

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
  COORDENADOR: 'coordenador',
  ADMINISTRADOR: 'administrador'
} as const;

export type UserRoleType = typeof UserRole[keyof typeof UserRole];
