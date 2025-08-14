import { type User, type InsertUser, type Template, type InsertTemplate, type Checklist, type InsertChecklist, type Session, type InsertSession, type ChecklistSequence, UserRole } from "@shared/schema";
import { randomUUID } from "crypto";
import bcrypt from "bcrypt";

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

// Database storage implementation
import { db } from "./db";
import { users, templates, checklists, sessions, checklistSequence } from "@shared/schema";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }

  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await db.delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  async createSession(userId: string): Promise<Session> {
    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    
    const [session] = await db
      .insert(sessions)
      .values({ userId, token, expiresAt })
      .returning();
    
    return session;
  }

  async getSession(token: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.token, token));
    return session || undefined;
  }

  async deleteSession(token: string): Promise<boolean> {
    const result = await db.delete(sessions).where(eq(sessions.token, token));
    return result.rowCount > 0;
  }

  async getTemplates(): Promise<Template[]> {
    return await db.select().from(templates).where(eq(templates.active, true));
  }

  async getTemplate(id: string): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [newTemplate] = await db.insert(templates).values(template).returning();
    return newTemplate;
  }

  async updateTemplate(id: string, updates: Partial<Template>): Promise<Template | undefined> {
    const [updatedTemplate] = await db
      .update(templates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();
    return updatedTemplate || undefined;
  }

  async deleteTemplate(id: string): Promise<boolean> {
    const result = await db.delete(templates).where(eq(templates.id, id));
    return result.rowCount > 0;
  }

  async getChecklists(): Promise<Checklist[]> {
    return await db.select().from(checklists).orderBy(desc(checklists.createdAt));
  }

  async getChecklist(id: string): Promise<Checklist | undefined> {
    const [checklist] = await db.select().from(checklists).where(eq(checklists.id, id));
    return checklist || undefined;
  }

  async getChecklistByNumber(checklistNumber: string): Promise<Checklist | undefined> {
    const [checklist] = await db
      .select()
      .from(checklists)
      .where(eq(checklists.checklistNumber, checklistNumber));
    return checklist || undefined;
  }

  async getChecklistsByTechnician(technicianId: string): Promise<Checklist[]> {
    return await db
      .select()
      .from(checklists)
      .where(eq(checklists.technicianId, technicianId))
      .orderBy(desc(checklists.createdAt));
  }

  async getChecklistsByStore(storeCode: string): Promise<Checklist[]> {
    return await db
      .select()
      .from(checklists)
      .where(eq(checklists.storeCode, storeCode))
      .orderBy(desc(checklists.createdAt));
  }

  async getChecklistsByStatus(status: string): Promise<Checklist[]> {
    return await db
      .select()
      .from(checklists)
      .where(eq(checklists.status, status))
      .orderBy(desc(checklists.createdAt));
  }

  async getChecklistsByDateRange(startDate: Date, endDate: Date): Promise<Checklist[]> {
    return await db
      .select()
      .from(checklists)
      .where(and(gte(checklists.createdAt, startDate), lte(checklists.createdAt, endDate)))
      .orderBy(desc(checklists.createdAt));
  }

  async createChecklist(checklist: InsertChecklist, auditInfo?: AuditInfo): Promise<Checklist> {
    const checklistNumber = await this.generateChecklistNumber();
    
    const [newChecklist] = await db
      .insert(checklists)
      .values({
        ...checklist,
        checklistNumber,
        clientIp: auditInfo?.clientIp,
        userAgent: auditInfo?.userAgent,
        geoLocation: auditInfo?.geoLocation,
        deviceInfo: auditInfo?.deviceInfo,
      })
      .returning();
    
    return newChecklist;
  }

  async updateChecklist(id: string, updates: Partial<Checklist>): Promise<Checklist | undefined> {
    const [updatedChecklist] = await db
      .update(checklists)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(checklists.id, id))
      .returning();
    return updatedChecklist || undefined;
  }

  async deleteChecklist(id: string): Promise<boolean> {
    const result = await db.delete(checklists).where(eq(checklists.id, id));
    return result.rowCount > 0;
  }

  async generateChecklistNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    
    // Get or create sequence for current year
    const [sequence] = await db
      .select()
      .from(checklistSequence)
      .where(eq(checklistSequence.year, currentYear));
    
    let nextNumber = 1;
    
    if (sequence) {
      nextNumber = sequence.lastNumber + 1;
      await db
        .update(checklistSequence)
        .set({ lastNumber: nextNumber, updatedAt: new Date() })
        .where(eq(checklistSequence.id, sequence.id));
    } else {
      await db
        .insert(checklistSequence)
        .values({ lastNumber: nextNumber, year: currentYear });
    }
    
    return `CHK${currentYear}${nextNumber.toString().padStart(4, '0')}`;
  }
}

// Initialize database storage with default data
export class DatabaseStorageWithDefaults extends DatabaseStorage {
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    // Check if we need to seed data
    const existingUsers = await this.getUsers();
    if (existingUsers.length === 0) {
      await this.seedDefaultData();
    }
    
    this.initialized = true;
  }

  private async seedDefaultData() {
    // Create default admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    const adminUser = await this.createUser({
      email: "admin@checklistpro.com",
      password: hashedPassword,
      name: "Administrador",
      role: UserRole.ADMINISTRADOR,
      phone: "(11) 99999-9999",
      cpf: "000.000.000-00",
      contractor: "Sistema",
      active: true,
    });

    // Create sample technician
    const techPassword = await bcrypt.hash("tech123", 10);
    const techUser = await this.createUser({
      email: "tecnico@checklistpro.com",
      password: techPassword,
      name: "João Silva",
      role: UserRole.TECNICO,
      phone: "(11) 98888-8888",
      cpf: "111.111.111-11",
      contractor: "Global Hitss",
      active: true,
    });

    // Create analyst user
    const analystPassword = await bcrypt.hash("analyst123", 10);
    const analystUser = await this.createUser({
      email: "analista@checklistpro.com",
      password: analystPassword,
      name: "Maria Santos",
      role: UserRole.ANALISTA,
      phone: "(11) 97777-7777",
      cpf: "222.222.222-22",
      contractor: "Claro/Telmex",
      active: true,
    });

    // Create default templates - this will be a more complex seeding process
    await this.seedTemplates();
  }

  private async seedTemplates() {
    // Create MemStorage temporarily to get template data
    const memStorage = new MemStorage();
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for memStorage init
    
    try {
      // Get templates from MemStorage and create them in database
      const memTemplates = await memStorage.getTemplates();
      
      for (const template of memTemplates) {
        const { id, createdAt, updatedAt, ...templateData } = template;
        await this.createTemplate(templateData as InsertTemplate);
      }
      
      console.log(`✅ Database seeded with ${memTemplates.length} templates`);
    } catch (error) {
      console.log("⚠️ Error seeding templates:", error);
    }
  }
}

export const storage = new DatabaseStorageWithDefaults();
