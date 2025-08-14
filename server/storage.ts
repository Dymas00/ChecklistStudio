import { type User, type InsertUser, type Template, type InsertTemplate, type Checklist, type InsertChecklist, type Session, type InsertSession, type ChecklistSequence, UserRole } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";

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

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private templates: Map<string, Template> = new Map();
  private checklists: Map<string, Checklist> = new Map();
  private sessions: Map<string, Session> = new Map();
  private checklistSequences: Map<number, ChecklistSequence> = new Map();
  private checklistCounter: number = 0; // Contador em memória para numeração única

  constructor() {
    this.initializeData();
  }

  private async initializeData() {
    // Create default admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser: User = {
      id: randomUUID(),
      email: "admin@checklistpro.com",
      password: hashedPassword,
      name: "Administrador",
      role: UserRole.ADMINISTRADOR,
      phone: "(11) 99999-9999",
      cpf: "000.000.000-00",
      contractor: "Sistema",
      active: true,
      createdAt: new Date(),
    };
    this.users.set(adminUser.id, adminUser);

    // Create sample technician
    const techPassword = await bcrypt.hash("tech123", 10);
    const techUser: User = {
      id: randomUUID(),
      email: "tecnico@checklistpro.com",
      password: techPassword,
      name: "João Silva",
      role: UserRole.TECNICO,
      phone: "(11) 98888-8888",
      cpf: "111.111.111-11",
      contractor: "Global Hitss",
      active: true,
      createdAt: new Date(),
    };
    this.users.set(techUser.id, techUser);

    // Create analyst user
    const analystPassword = await bcrypt.hash("analyst123", 10);
    const analystUser: User = {
      id: randomUUID(),
      email: "analista@checklistpro.com",
      password: analystPassword,
      name: "Maria Santos",
      role: UserRole.ANALISTA,
      phone: "(11) 97777-7777",
      cpf: "222.222.222-22",
      contractor: "Claro/Telmex",
      active: true,
      createdAt: new Date(),
    };
    this.users.set(analystUser.id, analystUser);

    // Create default templates
    this.initializeTemplates();
  }

  private initializeTemplates() {
    // Template 1: Upgrade (based on provided HTML)
    const upgradeTemplate: Template = {
      id: randomUUID(),
      name: "Upgrade",
      type: "upgrade",
      description: "Template para atualização de equipamentos de loja",
      icon: "fas fa-arrow-up",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      sections: [
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
      ]
    };

    // Template 2: Migração (complete implementation based on detailed text file)
    const migracaoTemplate: Template = {
      id: randomUUID(),
      name: "Migração",
      type: "migracao",
      description: "Template para migração de sistemas e equipamentos conforme especificação Claro",
      icon: "fas fa-exchange-alt",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      sections: [
        {
          id: 1,
          title: "Cadastro Técnico",
          icon: "fas fa-user-hard-hat",
          fields: [
            { 
              id: "techConsent", 
              label: "Eu aceito que meu nome, fone, cpf, foto e outros dados sensíveis utilizados nesse checklist serão armazenados nos servidores da Checklist Virtual e da Claro.", 
              type: "radio", 
              required: true, 
              options: ["SIM", "NÃO"] 
            },
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
          title: "Liberação da Migração",
          icon: "fas fa-unlock",
          fields: [
            { id: "systemAccess", label: "Conseguiu baixar e acessar o sistema da migração?", type: "evidence", required: true },
            { id: "migrationReleased", label: "O check-in foi validado e a migração foi liberada?", type: "evidence", required: true },
            { id: "rackPhotoBefore", label: "Foto do rack, com a porta aberta, antes do início das atividades.", type: "photo", required: true },
            { 
              id: "oldEquipments", 
              label: "Haverão equipamentos antigos (MR33, MX64, MX65) sendo recolhidos?", 
              type: "select", 
              required: true, 
              options: ["Apenas MX", "Apenas MR", "MX", "MR", "Nenhum"] 
            },
            { id: "oldEquipmentsPhoto", label: "Foto dos equipamentos antigos", type: "photo", conditional: { field: "oldEquipments", notValue: "Nenhum" } },
            { id: "oldEquipmentsObs", label: "Observações sobre equipamentos antigos", type: "textarea", conditional: { field: "oldEquipments", value: "Nenhum" } }
          ]
        },
        {
          id: 4,
          title: "Rack",
          icon: "fas fa-server",
          fields: [
            { id: "hasRack", label: "A loja possui rack?", type: "evidence", required: true },
            { id: "equipmentLocation", label: "Em que local estão os equipamentos?", type: "text", required: true, conditional: { field: "hasRack", value: "nao" } },
            { id: "equipmentLocationPhoto", label: "Foto do local dos equipamentos", type: "photo", required: true, conditional: { field: "hasRack", value: "nao" } },
            { id: "networkVoltage", label: "A tensão da rede está correta(foto do multímetro)?", type: "evidence", required: true },
            { id: "rackClear", label: "O rack está livre de qualquer objeto em cima dele?", type: "evidence", required: true, conditional: { field: "hasRack", value: "sim" } },
            { id: "rackKey", label: "O rack tem chave?", type: "evidence", required: true, conditional: { field: "hasRack", value: "sim" } },
            { id: "acrylicGlass", label: "O acrílico/vidro estão inteiros e em bom estado?", type: "evidence", required: true, conditional: { field: "hasRack", value: "sim" } },
            { id: "rackRust", label: "O rack está livre de ferrugem?", type: "evidence", required: true, conditional: { field: "hasRack", value: "sim" } },
            { id: "coolerWorking", label: "Cooler / Ventoinha do Rack está funcionando?", type: "evidence", required: true, conditional: { field: "hasRack", value: "sim" } },
            { id: "rackDoor", label: "A porta do rack está íntegra e fechando corretamente?", type: "evidence", required: true, conditional: { field: "hasRack", value: "sim" } },
            { id: "linkModems", label: "Os modems/roteadores de LINK estão na prateleira de cima?", type: "evidence", required: true, conditional: { field: "hasRack", value: "sim" } },
            { id: "mxLocation", label: "O MX está na prateleira do meio?", type: "evidence", required: true, conditional: { field: "hasRack", value: "sim" } },
            { id: "nobreakLocation", label: "O Nobreak ou Estabilizador está na prateleira debaixo?", type: "evidence", required: true, conditional: { field: "hasRack", value: "sim" } },
            { id: "rackTemperature", label: "A temperatura do rack está adequada(foto do termômetro)?", type: "evidence", required: true, conditional: { field: "hasRack", value: "sim" } }
          ]
        },
        {
          id: 5,
          title: "Nobreaks",
          icon: "fas fa-battery-full",
          fields: [
            { 
              id: "nobreakType", 
              label: "Tem Nobreak ou Estabilizador Claro? (foto da etiqueta)", 
              type: "select", 
              required: true, 
              options: ["Nobreak", "Estabilizador", "Nenhum"] 
            },
            { id: "nobreakTypePhoto", label: "Foto da etiqueta do Nobreak/Estabilizador", type: "photo", required: true, conditional: { field: "nobreakType", notValue: "Nenhum" } },
            { id: "batteryWorking", label: "A bateria está segurando carga e o no-break funcionando?", type: "evidence", required: true, conditional: { field: "nobreakType", value: "Nobreak" } },
            { id: "storeNobreak", label: "Possui outro Nobreak no local, de propriedade da loja?", type: "evidence", required: true }
          ]
        },
        {
          id: 6,
          title: "Cabeamento",
          icon: "fas fa-ethernet",
          fields: [
            { id: "cablesOrganized", label: "Os cabos estão organizados e passando pelos dutos/tubulações corretas?", type: "evidence", required: true },
            { id: "cablesWorking", label: "Todos os cabos estão funcionais?", type: "evidence", required: true },
            { id: "ports1Gb", label: "Todas as portas estão negociando em 1Gb(exceto Vitrine)? (solicitar ao analista remoto)", type: "evidence", required: true },
            { id: "cablesLabeled", label: "Os cabos foram ETIQUETADOS corretamente?", type: "evidence", required: true }
          ]
        },
        {
          id: 7,
          title: "Links",
          icon: "fas fa-link",
          fields: [
            { id: "linksQuantity", label: "Quantos links a loja tem?", type: "select", required: true, options: ["1", "2", "3"] },
            { 
              id: "link1Type", 
              label: "Link 1 (foto do modem/roteador com número de série e, se for 4G, do sim card com o código)", 
              type: "select", 
              required: true, 
              options: ["BLC Claro 600Mbps", "BLD Claro 50Mbps", "Conectividade da Franquia", "BLM Claro (4G)", "BLC Claro - antigo (outra velocidade)", "BLD Claro - antigo (outra velocidade)", "BLC Terceiro - antigo", "MPLS Claro - antigo", "Satélite Claro - antigo"] 
            },
            { id: "link1Photo", label: "Foto do Link 1", type: "photo", required: true },
            { id: "link1Designation", label: "Designação Link 1 (solicite ao analista)", type: "text", required: true, conditional: { field: "link1Type", notValue: "Conectividade da Franquia" } },
            { id: "link1Mac", label: "MAC Address Link 1", type: "text", required: true, conditional: { field: "link1Type", notValue: "Conectividade da Franquia" } },
            { id: "link1IP", label: "O IP do Link 1 está no range correto? (verificar com analista e pegar print com ele)", type: "evidence", required: true },
            // Link 2 fields
            { 
              id: "link2Type", 
              label: "Link 2 (foto do modem/roteador com número de série e, se for 4G, do sim card com o código)", 
              type: "select",
              options: ["BLC Claro 600Mbps", "BLD Claro 50Mbps", "Conectividade da Franquia", "BLM Claro (4G)", "BLC Claro - antigo (outra velocidade)", "BLD Claro - antigo (outra velocidade)", "BLC Terceiro - antigo", "MPLS Claro - antigo", "Satélite Claro - antigo"], 
              conditional: { field: "linksQuantity", notValue: "1" } 
            },
            { id: "link2Photo", label: "Foto do Link 2", type: "photo", conditional: { field: "linksQuantity", notValue: "1" } },
            { id: "link2Designation", label: "Designação Link 2 (solicite ao analista)", type: "text", conditional: { field: "link2Type", notValue: "Conectividade da Franquia" } },
            { id: "link2Mac", label: "MAC Address Link 2", type: "text", conditional: { field: "link2Type", notValue: "Conectividade da Franquia" } },
            { id: "link2IP", label: "O IP do Link 2 está no range correto? (verificar com analista e pegar print com ele)", type: "evidence", conditional: { field: "linksQuantity", notValue: "1" } },
            // Link 3 fields
            { 
              id: "link3Type", 
              label: "Link 3 (foto do modem/roteador com número de série e, se for 4G, do sim card com o código)", 
              type: "select", 
              options: ["BLC Claro 600Mbps", "BLD Claro 50Mbps", "Conectividade da Franquia", "BLM Claro (4G)", "BLC Claro - antigo (outra velocidade)", "BLD Claro - antigo (outra velocidade)", "BLC Terceiro - antigo", "MPLS Claro - antigo", "Satélite Claro - antigo"], 
              conditional: { field: "linksQuantity", value: "3" } 
            },
            { id: "link3Photo", label: "Foto do Link 3", type: "photo", conditional: { field: "linksQuantity", value: "3" } },
            { id: "link3Designation", label: "Designação Link 3 (solicite ao analista)", type: "text", conditional: { field: "link3Type", notValue: "Conectividade da Franquia" } },
            { id: "link3Mac", label: "MAC Address Link 3", type: "text", conditional: { field: "link3Type", notValue: "Conectividade da Franquia" } },
            { id: "link3IP", label: "O IP do Link 3 está no range correto? (verificar com analista e pegar print com ele)", type: "evidence", conditional: { field: "linksQuantity", value: "3" } }
          ]
        },
        {
          id: 8,
          title: "MX",
          icon: "fas fa-router",
          fields: [
            { id: "mx68Installed", label: "O MX instalado é do modelo MX68?", type: "evidence", required: true },
            { id: "mxSerial", label: "Qual o número de série?", type: "text", required: true },
            { id: "mxSerialPhoto", label: "Foto do número de série", type: "photo", required: true }
          ]
        },
        {
          id: 9,
          title: "Access Point",
          icon: "fas fa-wifi",
          fields: [
            { id: "hasAP", label: "A loja possui AP?", type: "evidence", required: true },
            { id: "apMR36", label: "O(s) AP(s) é do modelo MR36?", type: "evidence", required: true, conditional: { field: "hasAP", value: "sim" } },
            { id: "apActive", label: "Todos os AP estão ativos e funcionais?", type: "evidence", required: true, conditional: { field: "hasAP", value: "sim" } },
            { id: "apLocation", label: "Onde o AP está instalado?", type: "select", required: true, options: ["No teto", "No balcão do PDV", "Outro lugar"], conditional: { field: "hasAP", value: "sim" } },
            { id: "apLocationOther", label: "Descreva outro local", type: "textarea", conditional: { field: "apLocation", value: "Outro lugar" } },
            { id: "mobshopsWorking", label: "OS Mobshops estão funcionando? (Verificar com responsável da loja)", type: "evidence", required: true, conditional: { field: "hasAP", value: "sim" } }
          ]
        },
        {
          id: 10,
          title: "Vitrine Digital",
          icon: "fas fa-tv",
          fields: [
            { id: "hasVitrine", label: "A loja possui Vitrine Digital (consultar gerente)?", type: "evidence", required: true },
            { id: "vitrineCabled", label: "A Vitrine Digital está CABEADA e funcional?", type: "evidence", required: true, conditional: { field: "hasVitrine", value: "sim" } }
          ]
        },
        {
          id: 11,
          title: "Equipamentos Não-Compliance",
          icon: "fas fa-exclamation-triangle",
          fields: [
            { id: "correctEquipments", label: "Todos os equipamentos conectados são os corretos (nenhum video-game, AP ou switch de outras marcas, etc)?", type: "evidence", required: true },
            { id: "noIrregularItems", label: "Não existe nada irregular(rádio fm, cafeteira, carregador, etc) dentro do rack ou conectado ao nobreak/estabilizador?", type: "evidence", required: true }
          ]
        },
        {
          id: 12,
          title: "Script de Migração",
          icon: "fas fa-code",
          fields: [
            { id: "migrationScript", label: "Print do Script de Migração (solicite ao analista Claro)", type: "photo", required: true }
          ]
        },
        {
          id: 13,
          title: "Evidências da Migração",
          icon: "fas fa-check-circle",
          fields: [
            { id: "storeUpGBTech", label: "A loja subiu corretamente na nova Organização?", type: "evidence", required: true },
            { id: "pdvConnected", label: "O PDV está conectado? (foto para evidência)", type: "evidence", required: true },
            { id: "mobshopsConnected", label: "Os Mobshops estão conectados? (fotos para evidência)", type: "evidence", required: true },
            { id: "vitrineConnected", label: "A Vitrine Digital está conectada? (foto para evidência)", type: "evidence", required: true },
            { id: "vpnClosed", label: "A VPN está fechada e com clientes? (peça print ao analista)", type: "evidence", required: true },
            { id: "wanPinging", label: "A(s) porta(s) WAN está píngando? (peça print ao analista)", type: "evidence", required: true },
            { id: "allPorts1Gb", label: "Todas as portas estão em 1Gb(exceto vitrine)? (peça print ao analista)", type: "evidence", required: true },
            { id: "apConnected", label: "O AP está conectado? (foto com o led aceso)", type: "evidence", required: true },
            { id: "switchConnected", label: "A loja tem switch e está conectado? (Se sim, foto)", type: "evidence", required: true },
            { id: "techSignature", label: "Assinatura - Técnico", type: "signature", required: true },
            { id: "storeSignature", label: "Assinatura - Loja", type: "signature", required: true }
          ]
        }
      ]
    };

    // Template 3: Ativação (Enhanced)
    const ativacaoTemplate: Template = {
      id: randomUUID(),
      name: "Ativação",
      type: "ativacao",
      description: "Template para ativação de novos pontos de conectividade",
      icon: "fas fa-power-off",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      sections: [
        {
          id: 1,
          title: "Dados do Técnico",
          icon: "fas fa-user-hard-hat",
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
          id: 2,
          title: "Dados da Loja",
          icon: "fas fa-store",
          fields: [
            { id: "storeCode", label: "Código da Loja", type: "text", required: true },
            { id: "storeManager", label: "Responsável", type: "text", required: true },
            { id: "storePhone", label: "Telefone", type: "tel", required: true }
          ]
        },
        {
          id: 3,
          title: "Preparação",
          icon: "fas fa-clipboard-check",
          fields: [
            { id: "materialsReceived", label: "Todos os materiais foram recebidos conforme especificação?", type: "evidence", required: true },
            { id: "sitePreparation", label: "O local está preparado para instalação?", type: "evidence", required: true },
            { id: "powerAvailable", label: "Energia elétrica está disponível no local?", type: "evidence", required: true },
            { id: "infraCheck", label: "A infraestrutura de rede está adequada?", type: "evidence", required: true }
          ]
        },
        {
          id: 4,
          title: "Instalação de Equipamentos",
          icon: "fas fa-tools",
          fields: [
            { id: "equipmentInstalled", label: "Os equipamentos foram instalados corretamente?", type: "evidence", required: true },
            { id: "rackInstallation", label: "O rack foi instalado e organizado adequadamente?", type: "evidence", required: true },
            { id: "cablingDone", label: "O cabeamento foi realizado conforme especificação?", type: "evidence", required: true },
            { id: "powerConnection", label: "As conexões de energia foram realizadas corretamente?", type: "evidence", required: true },
            { id: "equipmentPhoto", label: "Foto dos equipamentos instalados", type: "photo", required: true }
          ]
        },
        {
          id: 5,
          title: "Configuração",
          icon: "fas fa-cog",
          fields: [
            { id: "basicConfig", label: "Configuração básica foi aplicada?", type: "evidence", required: true },
            { id: "networkConfig", label: "Configuração de rede realizada com sucesso?", type: "evidence", required: true },
            { id: "securityConfig", label: "Configurações de segurança aplicadas?", type: "evidence", required: true },
            { id: "firmwareUpdate", label: "Firmware está atualizado?", type: "evidence", required: true }
          ]
        },
        {
          id: 6,
          title: "Testes de Conectividade",
          icon: "fas fa-wifi",
          fields: [
            { id: "connectivityTest", label: "Teste de conectividade realizado com sucesso?", type: "evidence", required: true },
            { id: "speedTest", label: "Velocidade do Speed Test (Mbps)", type: "number", required: true },
            { id: "speedTestPhoto", label: "Foto do Speed Test", type: "photo", required: true },
            { id: "latencyTest", label: "Teste de latência aprovado?", type: "evidence", required: true },
            { id: "stabilityTest", label: "Teste de estabilidade de conexão realizado?", type: "evidence", required: true }
          ]
        },
        {
          id: 7,
          title: "Testes Funcionais",
          icon: "fas fa-check-circle",
          fields: [
            { id: "pdvTest", label: "PDV funcionando corretamente?", type: "evidence", required: true },
            { id: "apTest", label: "Access Points funcionais?", type: "evidence", required: true },
            { id: "vitrineTest", label: "Vitrine digital funcionando (se aplicável)?", type: "evidence", required: true },
            { id: "mobshopTest", label: "Mobshops conectados e funcionais?", type: "evidence", required: true },
            { id: "finalTest", label: "Teste final com cliente aprovado?", type: "evidence", required: true }
          ]
        },
        {
          id: 8,
          title: "Finalização",
          icon: "fas fa-signature",
          fields: [
            { id: "cleanupDone", label: "Limpeza do local foi realizada?", type: "evidence", required: true },
            { id: "documentation", label: "Documentação entregue ao cliente?", type: "evidence", required: true },
            { id: "training", label: "Treinamento básico foi fornecido ao responsável?", type: "evidence", required: true },
            { id: "validationCode", label: "Código de Validação (solicite ao analista)", type: "text", required: true },
            { id: "techSignature", label: "Assinatura - Técnico", type: "signature", required: true },
            { id: "storeSignature", label: "Assinatura - Responsável da Loja", type: "signature", required: true }
          ]
        }
      ]
    };

    // Template 4: Manutenção (Enhanced)
    const manutencaoTemplate: Template = {
      id: randomUUID(),
      name: "Manutenção",
      type: "manutencao",
      description: "Template para manutenção preventiva e corretiva",
      icon: "fas fa-tools",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      sections: [
        {
          id: 1,
          title: "Dados do Técnico",
          icon: "fas fa-user-hard-hat",
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
          id: 2,
          title: "Dados da Loja",
          icon: "fas fa-store",
          fields: [
            { id: "storeCode", label: "Código da Loja", type: "text", required: true },
            { id: "storeManager", label: "Responsável", type: "text", required: true },
            { id: "storePhone", label: "Telefone", type: "tel", required: true }
          ]
        },
        {
          id: 3,
          title: "Tipo de Manutenção",
          icon: "fas fa-wrench",
          fields: [
            { id: "maintenanceType", label: "Tipo de Manutenção", type: "select", required: true, options: ["Preventiva", "Corretiva", "Emergencial"] },
            { id: "problemDescription", label: "Descrição do Problema", type: "textarea", required: true, conditional: { field: "maintenanceType", notValue: "Preventiva" } },
            { id: "urgencyLevel", label: "Nível de Urgência", type: "select", required: true, options: ["Baixa", "Média", "Alta", "Crítica"], conditional: { field: "maintenanceType", value: "Corretiva" } },
            { id: "scheduledMaintenance", label: "Manutenção estava programada?", type: "radio", required: true, options: ["SIM", "NÃO"] }
          ]
        },
        {
          id: 4,
          title: "Verificações Iniciais",
          icon: "fas fa-search",
          fields: [
            { id: "equipmentState", label: "Estado geral dos equipamentos está adequado?", type: "evidence", required: true },
            { id: "connectionState", label: "Todas as conexões estão firmes e funcionais?", type: "evidence", required: true },
            { id: "temperatureOK", label: "A temperatura do ambiente está adequada?", type: "evidence", required: true },
            { id: "ventilationOK", label: "Ventilação/refrigeração funcionando adequadamente?", type: "evidence", required: true },
            { id: "physicalDamage", label: "Há sinais de danos físicos nos equipamentos?", type: "evidence", required: true },
            { id: "initialPhoto", label: "Foto do estado inicial dos equipamentos", type: "photo", required: true }
          ]
        },
        {
          id: 5,
          title: "Inspeção Detalhada",
          icon: "fas fa-magnifying-glass",
          fields: [
            { id: "cableInspection", label: "Inspeção de cabos realizada?", type: "evidence", required: true },
            { id: "connectorInspection", label: "Conectores verificados e limpos?", type: "evidence", required: true },
            { id: "equipmentCleaning", label: "Limpeza dos equipamentos foi realizada?", type: "evidence", required: true },
            { id: "firmwareCheck", label: "Verificação de firmware/software atualizada?", type: "evidence", required: true },
            { id: "securityCheck", label: "Verificação de segurança realizada?", type: "evidence", required: true },
            { id: "configBackup", label: "Backup das configurações foi realizado?", type: "evidence", required: true }
          ]
        },
        {
          id: 6,
          title: "Ações Executadas",
          icon: "fas fa-clipboard-check",
          fields: [
            { id: "actionsPerformed", label: "Descreva as ações executadas", type: "textarea", required: true },
            { id: "partsReplaced", label: "Foram substituídas peças/equipamentos?", type: "evidence", required: true },
            { id: "partsReplacedList", label: "Liste as peças/equipamentos substituídos", type: "textarea", conditional: { field: "partsReplaced", value: "sim" } },
            { id: "partsReplacedPhoto", label: "Foto das peças substituídas", type: "photo", conditional: { field: "partsReplaced", value: "sim" } },
            { id: "configChanges", label: "Foram realizadas mudanças de configuração?", type: "evidence", required: true },
            { id: "configChangesList", label: "Descreva as mudanças de configuração", type: "textarea", conditional: { field: "configChanges", value: "sim" } }
          ]
        },
        {
          id: 7,
          title: "Testes de Performance",
          icon: "fas fa-tachometer-alt",
          fields: [
            { id: "performanceTest", label: "Teste de performance realizado?", type: "evidence", required: true },
            { id: "speedTest", label: "Velocidade do Speed Test (Mbps)", type: "number", required: true },
            { id: "speedTestPhoto", label: "Foto do Speed Test", type: "photo", required: true },
            { id: "latencyTest", label: "Teste de latência aprovado?", type: "evidence", required: true },
            { id: "bandwidthTest", label: "Teste de largura de banda satisfatório?", type: "evidence", required: true }
          ]
        },
        {
          id: 8,
          title: "Testes Finais",
          icon: "fas fa-vial",
          fields: [
            { id: "finalTest", label: "Teste final realizado com sucesso?", type: "evidence", required: true },
            { id: "performanceOK", label: "Performance está dentro do esperado?", type: "evidence", required: true },
            { id: "networkTest", label: "Teste de rede realizado com sucesso?", type: "evidence", required: true },
            { id: "stabilityTest", label: "Teste de estabilidade de 30 minutos realizado?", type: "evidence", required: true },
            { id: "clientApproval", label: "Cliente aprovou o serviço realizado?", type: "evidence", required: true },
            { id: "finalPhoto", label: "Foto final dos equipamentos", type: "photo", required: true }
          ]
        },
        {
          id: 9,
          title: "Finalização",
          icon: "fas fa-signature",
          fields: [
            { id: "recommendations", label: "Recomendações para próximas manutenções", type: "textarea" },
            { id: "nextMaintenanceDate", label: "Próxima manutenção programada (data sugerida)", type: "text" },
            { id: "reportDelivered", label: "Relatório de manutenção entregue ao responsável?", type: "evidence", required: true },
            { id: "cleanupDone", label: "Limpeza e organização do local foi realizada?", type: "evidence", required: true },
            { id: "validationCode", label: "Código de Validação (solicite ao analista)", type: "text", required: true },
            { id: "techSignature", label: "Assinatura - Técnico", type: "signature", required: true },
            { id: "storeSignature", label: "Assinatura - Responsável da Loja", type: "signature", required: true }
          ]
        }
      ]
    };

    this.templates.set(upgradeTemplate.id, upgradeTemplate);
    this.templates.set(migracaoTemplate.id, migracaoTemplate);
    this.templates.set(ativacaoTemplate.id, ativacaoTemplate);
    this.templates.set(manutencaoTemplate.id, manutencaoTemplate);
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const user: User = {
      id: randomUUID(),
      name: insertUser.name,
      role: insertUser.role,
      email: insertUser.email,
      password: hashedPassword,
      phone: insertUser.phone || null,
      cpf: insertUser.cpf || null,
      contractor: insertUser.contractor || null,
      active: insertUser.active ?? true,
      createdAt: new Date(),
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  // Session methods
  async createSession(userId: string): Promise<Session> {
    const session: Session = {
      id: randomUUID(),
      userId,
      token: randomUUID(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    };
    this.sessions.set(session.token, session);
    return session;
  }

  async getSession(token: string): Promise<Session | undefined> {
    const session = this.sessions.get(token);
    if (!session || session.expiresAt < new Date()) {
      this.sessions.delete(token);
      return undefined;
    }
    return session;
  }

  async deleteSession(token: string): Promise<boolean> {
    return this.sessions.delete(token);
  }

  // Template methods
  async getTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const template: Template = {
      id: randomUUID(),
      name: insertTemplate.name,
      type: insertTemplate.type,
      icon: insertTemplate.icon,
      description: insertTemplate.description || null,
      active: insertTemplate.active ?? true,
      createdAt: new Date(),
      sections: insertTemplate.sections,
      updatedAt: new Date(),
    };
    this.templates.set(template.id, template);
    return template;
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template | undefined> {
    const template = this.templates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...updates, updatedAt: new Date() };
    this.templates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    return this.templates.delete(id);
  }

  // Checklist methods
  async getChecklists(): Promise<Checklist[]> {
    return Array.from(this.checklists.values());
  }

  async getChecklist(id: string): Promise<Checklist | undefined> {
    return this.checklists.get(id);
  }

  async getChecklistsByTechnician(technicianId: string): Promise<Checklist[]> {
    return Array.from(this.checklists.values()).filter(c => c.technicianId === technicianId);
  }

  async createChecklist(insertChecklist: InsertChecklist): Promise<Checklist> {
    const checklistNumber = await this.generateChecklistNumber();
    const checklist: Checklist = {
      id: randomUUID(),
      checklistNumber,
      templateId: insertChecklist.templateId,
      status: insertChecklist.status || 'pendente',
      createdAt: new Date(),
      updatedAt: new Date(),
      technicianId: insertChecklist.technicianId,
      analystId: insertChecklist.analystId || null,
      storeCode: insertChecklist.storeCode,
      storeManager: insertChecklist.storeManager,
      storePhone: insertChecklist.storePhone,
      responses: insertChecklist.responses,
      photos: insertChecklist.photos,
      signature: insertChecklist.signature || null,
      validationCode: insertChecklist.validationCode || null,
      rating: insertChecklist.rating || null,
      feedback: insertChecklist.feedback || null,
      approvalComment: null,
      approvedBy: null,
      approvedAt: null,
      clientIp: null,
      userAgent: null,
      geoLocation: null,
      deviceInfo: null,
    };
    this.checklists.set(checklist.id, checklist);
    return checklist;
  }

  async updateChecklist(id: string, updates: Partial<Checklist>): Promise<Checklist | undefined> {
    const checklist = this.checklists.get(id);
    if (!checklist) return undefined;
    
    const updatedChecklist = { ...checklist, ...updates, updatedAt: new Date() };
    this.checklists.set(id, updatedChecklist);
    return updatedChecklist;
  }

  async deleteChecklist(id: string): Promise<boolean> {
    return this.checklists.delete(id);
  }

  // Missing methods implementation
  async getChecklistByNumber(checklistNumber: string): Promise<Checklist | undefined> {
    return Array.from(this.checklists.values()).find(c => c.checklistNumber === checklistNumber);
  }

  async getChecklistsByStore(storeCode: string): Promise<Checklist[]> {
    return Array.from(this.checklists.values()).filter(c => c.storeCode === storeCode);
  }

  async getChecklistsByStatus(status: string): Promise<Checklist[]> {
    return Array.from(this.checklists.values()).filter(c => c.status === status);
  }

  async getChecklistsByDateRange(startDate: Date, endDate: Date): Promise<Checklist[]> {
    return Array.from(this.checklists.values()).filter(c => 
      c.createdAt >= startDate && c.createdAt <= endDate
    );
  }

  async generateChecklistNumber(): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    
    // Get current sequence for the year
    let sequence = this.checklistSequences.get(year);
    if (!sequence) {
      sequence = {
        id: year,
        lastNumber: 0,
        year,
        updatedAt: now
      };
    }
    
    // Increment counter
    sequence.lastNumber += 1;
    sequence.updatedAt = now;
    
    // Store updated sequence
    this.checklistSequences.set(year, sequence);
    
    // Format: YYYY-NNNNNN (year + 6-digit padded number)
    return `${year}-${sequence.lastNumber.toString().padStart(6, '0')}`;
  }
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

      // Create default templates with all 4 types
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

// Choose storage implementation based on environment
const isSQLite = process.env.DATABASE_URL?.startsWith('file:') || !process.env.DATABASE_URL;
export const storage = isSQLite ? new SQLiteStorage() : new MemStorage();
