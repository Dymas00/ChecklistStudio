# Sistema de Checklists - Claro Empresas

## Overview

This is a comprehensive web-based checklist system designed for Claro Empresas operational workflows. The application enables technicians to complete digital checklists for various operational tasks (upgrades, maintenance, activation, migration) while providing management and analysis capabilities for supervisors. The system features role-based access control, mobile-responsive design, and comprehensive form validation with photo evidence capabilities. The business vision is to streamline operational processes, improve data accuracy, and provide actionable insights for Claro Empresas, leveraging digital transformation for enhanced efficiency and decision-making.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with **React 18** using **TypeScript** and **Vite**.
**UI Framework**: **shadcn/ui** components built on **Radix UI** primitives, styled with **Tailwind CSS**.
**State Management**: **TanStack Query (React Query)** manages server state; local state with React hooks.
**Routing**: **Wouter** provides lightweight client-side routing.
**Form Handling**: Custom components support complex forms with conditional rendering, file uploads, and signature capture.

### Backend Architecture
The backend is an **Express.js** server written in **TypeScript** with ES modules, providing a RESTful API for authentication, file uploads, and business logic.
**Session Management**: Token-based authentication stored in localStorage client-side.
**API Design**: RESTful endpoints with error handling and validation.
**File Handling**: **Multer** handles file uploads, storing them locally.

### Data Storage Solutions
**Database**: **PostgreSQL** with **Drizzle ORM** for type-safe operations.
**Database Features**: UUID primary keys, JSON columns for flexible data, timestamp tracking, foreign key relationships.
**Migration System**: Drizzle Kit manages database migrations.
**Development Storage**: In-memory storage for development, with automatic migration to SQLite for local persistence if configured.

### Authentication and Authorization
**Role-Based Access Control**: Four user roles: Técnico, Analista, Coordenador, and Administrador, each with distinct permissions.
**Security Features**: Password hashing (bcrypt), token-based session management, protected routes with middleware, input validation.

### Form and Template System
**Dynamic Forms**: Templates define complex form structures with conditional field rendering based on user responses, supporting various field types (text, radio, photo, digital signatures).
**Conditional Logic**: Advanced conditional field display based on previous answers.
**Validation**: Comprehensive client and server-side validation.
**File Management**: Integrated photo upload and signature capture with previews and validation.
**PDF Export**: Advanced PDF generation with template-faithful layout, section name translation, signature rendering, and proper template name display.

## External Dependencies

### Database Services
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **Drizzle ORM**: Type-safe database toolkit
- **connect-pg-simple**: PostgreSQL session store

### UI and Design System
- **Radix UI**: Accessible, unstyled UI primitives
- **shadcn/ui**: Pre-built component library
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development and Build Tools
- **Vite**: Fast build tool
- **TypeScript**: Static type checking

### Authentication and Security
- **bcrypt**: Password hashing
- **multer**: Multipart form data handling
- **express**: Web framework

### State Management and Data Fetching
- **TanStack React Query**: Server state management
- **Wouter**: Lightweight routing library

### Form Handling and Validation
- **React Hook Form**: Performant form library
- **Zod**: Schema validation
- **drizzle-zod**: Automatic Zod schema generation

### Utilities and Helpers
- **clsx** and **tailwind-merge**: CSS class composition
- **date-fns**: Date manipulation
- **class-variance-authority**: Component variant management