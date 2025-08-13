import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { loginSchema, UserRole } from "@shared/schema";
import bcrypt from "bcrypt";
import multer from "multer";
import path from "path";
import fs from "fs";

// Configure multer for file uploads
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Middleware to check authentication
async function requireAuth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: "Token necessário" });
  }

  const session = await storage.getSession(token);
  if (!session) {
    return res.status(401).json({ message: "Token inválido" });
  }

  const user = await storage.getUser(session.userId);
  if (!user) {
    return res.status(401).json({ message: "Usuário não encontrado" });
  }

  req.user = user;
  next();
}

// Middleware to check admin role
function requireAdmin(req: any, res: any, next: any) {
  if (req.user.role !== UserRole.ADMINISTRADOR) {
    return res.status(403).json({ message: "Acesso negado - apenas administradores" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      const session = await storage.createSession(user.id);
      
      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json({
        user: userWithoutPassword,
        token: session.token
      });
    } catch (error) {
      res.status(400).json({ message: "Dados inválidos" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: any, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      await storage.deleteSession(token);
    }
    res.json({ message: "Logout realizado com sucesso" });
  });

  app.get("/api/auth/me", requireAuth, (req: any, res) => {
    const { password: _, ...userWithoutPassword } = req.user;
    res.json({ user: userWithoutPassword });
  });

  // User management routes
  app.get("/api/users", requireAuth, requireAdmin, async (req, res) => {
    const users = await storage.getUsers();
    const usersWithoutPasswords = users.map(({ password: _, ...user }) => user);
    res.json(usersWithoutPasswords);
  });

  app.post("/api/users", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = await storage.createUser(req.body);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Erro ao criar usuário" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const user = await storage.updateUser(req.params.id, req.body);
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Erro ao atualizar usuário" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireAdmin, async (req, res) => {
    const deleted = await storage.deleteUser(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.json({ message: "Usuário removido com sucesso" });
  });

  // Template routes
  app.get("/api/templates", requireAuth, async (req, res) => {
    const templates = await storage.getTemplates();
    res.json(templates);
  });

  app.get("/api/templates/:id", requireAuth, async (req, res) => {
    const template = await storage.getTemplate(req.params.id);
    if (!template) {
      return res.status(404).json({ message: "Template não encontrado" });
    }
    res.json(template);
  });

  app.post("/api/templates", requireAuth, requireAdmin, async (req, res) => {
    try {
      const template = await storage.createTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ message: "Erro ao criar template" });
    }
  });

  app.put("/api/templates/:id", requireAuth, requireAdmin, async (req, res) => {
    try {
      const template = await storage.updateTemplate(req.params.id, req.body);
      if (!template) {
        return res.status(404).json({ message: "Template não encontrado" });
      }
      res.json(template);
    } catch (error) {
      res.status(400).json({ message: "Erro ao atualizar template" });
    }
  });

  app.delete("/api/templates/:id", requireAuth, requireAdmin, async (req, res) => {
    const deleted = await storage.deleteTemplate(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Template não encontrado" });
    }
    res.json({ message: "Template removido com sucesso" });
  });

  // Checklist routes
  app.get("/api/checklists", requireAuth, async (req: any, res) => {
    let checklists;
    if (req.user.role === UserRole.TECNICO) {
      checklists = await storage.getChecklistsByTechnician(req.user.id);
    } else {
      checklists = await storage.getChecklists();
    }
    res.json(checklists);
  });

  app.get("/api/checklists/:id", requireAuth, async (req, res) => {
    const checklist = await storage.getChecklist(req.params.id);
    if (!checklist) {
      return res.status(404).json({ message: "Checklist não encontrado" });
    }
    res.json(checklist);
  });

  app.post("/api/checklists", requireAuth, upload.array('photos'), async (req: any, res) => {
    try {
      const checklistData = JSON.parse(req.body.data);
      
      // Process uploaded files
      const photos = req.files?.map((file: any) => ({
        fieldId: file.fieldname,
        filename: file.filename,
        originalName: file.originalname,
        path: file.path
      })) || [];

      const checklist = await storage.createChecklist({
        ...checklistData,
        technicianId: req.user.id,
        photos: photos
      });

      res.status(201).json(checklist);
    } catch (error) {
      res.status(400).json({ message: "Erro ao criar checklist" });
    }
  });

  app.put("/api/checklists/:id", requireAuth, async (req: any, res) => {
    try {
      const checklist = await storage.updateChecklist(req.params.id, req.body);
      if (!checklist) {
        return res.status(404).json({ message: "Checklist não encontrado" });
      }
      res.json(checklist);
    } catch (error) {
      res.status(400).json({ message: "Erro ao atualizar checklist" });
    }
  });

  app.delete("/api/checklists/:id", requireAuth, async (req, res) => {
    const deleted = await storage.deleteChecklist(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Checklist não encontrado" });
    }
    res.json({ message: "Checklist removido com sucesso" });
  });

  // Dashboard metrics route
  app.get("/api/dashboard/metrics", requireAuth, async (req: any, res) => {
    const checklists = await storage.getChecklists();
    
    const total = checklists.length;
    const pending = checklists.filter(c => c.status === 'pendente').length;
    const approved = checklists.filter(c => c.status === 'aprovado').length;
    const approvalRate = total > 0 ? ((approved / total) * 100).toFixed(1) : "0.0";

    const recentChecklists = checklists
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);

    // Get technician rankings
    const users = await storage.getUsers();
    const technicians = users.filter(u => u.role === UserRole.TECNICO);
    
    const technicianRankings = await Promise.all(
      technicians.map(async (tech) => {
        const techChecklists = await storage.getChecklistsByTechnician(tech.id);
        const approvedChecklists = techChecklists.filter(c => c.status === 'aprovado');
        const avgRating = approvedChecklists.length > 0 
          ? (approvedChecklists.reduce((sum, c) => sum + (c.rating || 0), 0) / approvedChecklists.length) 
          : 0;
        
        return {
          id: tech.id,
          name: tech.name,
          completedChecklists: approvedChecklists.length,
          rating: avgRating.toFixed(1)
        };
      })
    );

    technicianRankings.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));

    res.json({
      total,
      pending,
      approved,
      approvalRate,
      recentChecklists,
      technicianRankings: technicianRankings.slice(0, 5)
    });
  });

  // File upload route
  app.post("/api/upload", requireAuth, upload.single('file'), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }

    res.json({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
      url: `/api/uploads/${req.file.filename}`
    });
  });

  // Serve uploaded files
  app.get("/api/uploads/:filename", (req, res) => {
    const filename = req.params.filename;
    const filepath = path.join(uploadDir, filename);
    
    if (fs.existsSync(filepath)) {
      res.sendFile(path.resolve(filepath));
    } else {
      res.status(404).json({ message: "Arquivo não encontrado" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
