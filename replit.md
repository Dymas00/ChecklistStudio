# Checklist Virtual

## Overview

This is a comprehensive web-based checklist virtual system designed for operational workflows. The application enables technicians to complete digital checklists for various operational tasks (upgrades, maintenance, activation, migration) while providing management and analysis capabilities for supervisors. The system features role-based access control, mobile-responsive design, and comprehensive form validation with photo evidence capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

**January 14, 2025:**
- ✅ Criada documentação técnica completa (README.md)
- ✅ Documentação inclui arquitetura, API, deployment e troubleshooting
- ✅ Configurado acesso remoto para múltiplas máquinas na rede
- ✅ Criado guia simplificado para rodar sem PostgreSQL (SETUP_SIMPLES.md)
- ✅ Projeto configurado para usar SQLite por padrão (mais fácil setup local)
- ✅ Arquivo .env.example atualizado com opções SQLite e PostgreSQL
- ✅ Project renamed from "Checklist Management System/ChecklistPro" to "Checklist Virtual"
- ✅ Updated all UI references including login page, sidebar, and documentation
- ✅ Updated default user email domains from @checklistpro.com to @checklistvirtual.com (reverted back to @checklistpro.com per user request)
- ✅ Removed default credentials display from login screen for security
- ✅ Added proper page title to HTML document
- ✅ Fixed storage implementation issues with missing methods for checklist persistence
- ✅ Implemented complete template creation system with custom template builder
- ✅ Added template editing functionality with visual interface
- ✅ Created comprehensive VPS deployment guide and configuration files
- ✅ Added deployment scripts and production configuration (PM2, Nginx, SSL)
- ✅ Fixed all LSP TypeScript errors for clean production deployment
- ✅ Removed Templates menu access for technicians (restricted to analyst+ roles)
- ✅ Added "Desenvolvido por Dymas Gomes" footer throughout the application
- ✅ Enhanced mobile responsiveness for template descriptions with improved text wrapping
- ✅ Created complete VPS deployment guide with SSL certificate setup (DEPLOYMENT_VPS.md)
- ✅ Simplified photo upload to use gallery/file picker only (removed complex camera functionality per user request)

## System Architecture

### Frontend Architecture
The frontend is built with **React 18** using **TypeScript** for type safety. The application uses **Vite** as the build tool and development server, providing fast hot module replacement and optimized builds.

**UI Framework**: The system leverages **shadcn/ui** components built on top of **Radix UI** primitives, providing accessible and customizable UI components. **Tailwind CSS** handles styling with a custom design system using CSS variables for theming.

**State Management**: **TanStack Query (React Query)** manages server state, caching, and data synchronization. Local component state is handled with React hooks.

**Routing**: **Wouter** provides lightweight client-side routing with TypeScript support.

**Form Handling**: Custom form components handle complex checklist forms with conditional field rendering, file uploads, and signature capture capabilities.

### Backend Architecture
The backend is an **Express.js** server written in **TypeScript** with ES modules. The server provides a RESTful API and handles authentication, file uploads, and business logic.

**Session Management**: Uses token-based authentication stored in localStorage on the client side. Sessions are managed server-side with configurable storage.

**API Design**: RESTful endpoints for user management, template management, checklist operations, and file uploads. All endpoints include proper error handling and validation.

**File Handling**: **Multer** handles file uploads with validation for image types and size limits. Uploaded files are stored in a local uploads directory.

### Data Storage Solutions
**Database**: **PostgreSQL** with **Drizzle ORM** for type-safe database operations. The schema includes tables for users, templates, checklists, and sessions.

**Database Features**:
- UUID primary keys for security
- JSON columns for flexible form data storage
- Timestamp tracking for audit trails
- Foreign key relationships with proper constraints

**Migration System**: Drizzle Kit handles database migrations and schema changes.

**Development Storage**: In-memory storage implementation for development and testing, with interface-based design allowing easy switching to persistent storage.

### Authentication and Authorization
**Role-Based Access Control**: Four user roles with distinct permissions:
- **Técnico**: Create and submit checklists
- **Analista**: Review and approve/reject checklists  
- **Coordenador**: Manage team workflows and view analytics
- **Administrador**: Full system access including user and template management

**Security Features**:
- Password hashing with bcrypt
- Token-based session management
- Protected routes with middleware validation
- Input validation and sanitization

**Session Handling**: Secure token generation with configurable expiration and proper logout functionality.

### Form and Template System
**Dynamic Forms**: Templates define complex form structures with conditional field rendering based on user responses. The system supports various field types including text, radio, photo uploads, and digital signatures.

**Conditional Logic**: Advanced conditional field display based on previous answers, enabling complex branching logic in checklists.

**Validation**: Comprehensive client and server-side validation ensuring data integrity and required field completion.

**File Management**: Integrated photo upload and signature capture with preview capabilities and file type validation.

## External Dependencies

### Database Services
- **@neondatabase/serverless**: Serverless PostgreSQL driver for Neon database connections
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL dialect support
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### UI and Design System
- **Radix UI**: Comprehensive set of accessible, unstyled UI primitives
- **shadcn/ui**: Pre-built component library with consistent design patterns
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **Lucide React**: Icon library with consistent design language

### Development and Build Tools
- **Vite**: Fast build tool with HMR and optimized production builds
- **TypeScript**: Static type checking across the entire codebase
- **@replit/vite-plugin-runtime-error-modal**: Development error overlay for better debugging

### Authentication and Security
- **bcrypt**: Password hashing for secure credential storage
- **multer**: Multipart form data handling for file uploads
- **express**: Web framework with middleware support

### State Management and Data Fetching
- **TanStack React Query**: Server state management with caching and synchronization
- **Wouter**: Lightweight routing library with TypeScript support

### Form Handling and Validation
- **React Hook Form**: Performant form library with validation
- **@hookform/resolvers**: Validation resolvers for various schema libraries
- **Zod**: Schema validation with TypeScript inference
- **drizzle-zod**: Automatic Zod schema generation from Drizzle schemas

### Utilities and Helpers
- **clsx** and **tailwind-merge**: Conditional CSS class composition
- **date-fns**: Date manipulation and formatting utilities
- **class-variance-authority**: Component variant management

## Deployment Information

### Production Readiness
The project is fully configured for VPS deployment with:
- Production build scripts (`npm run build`, `npm start`)
- PM2 ecosystem configuration for process management
- Nginx reverse proxy configuration
- SSL/TLS setup with Certbot
- Automated deployment script (`scripts/deploy.sh`)
- Environment variable templates
- Logging and monitoring setup

### Default Users (Production)
- **Administrator**: admin@checklistpro.com / admin123
- **Technician**: tecnico@checklistpro.com / tech123  
- **Analyst**: analista@checklistpro.com / analyst123

### Key Files for Deployment
- `DEPLOYMENT.md`: Complete deployment guide
- `ecosystem.config.js`: PM2 process configuration
- `.env.example`: Environment variables template
- `scripts/deploy.sh`: Automated deployment script