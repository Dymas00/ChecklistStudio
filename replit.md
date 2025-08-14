# Sistema de Checklists - Claro Empresas

## Overview

This is a comprehensive web-based checklist system designed for Claro Empresas operational workflows. The application enables technicians to complete digital checklists for various operational tasks (upgrades, maintenance, activation, migration) while providing management and analysis capabilities for supervisors. The system features role-based access control, mobile-responsive design, and comprehensive form validation with photo evidence capabilities. The business vision is to streamline operational processes, improve data accuracy, and enhance efficiency for Claro Empresas, offering significant market potential through digital transformation of field operations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with **React 18** using **TypeScript** and **Vite**.
**UI Framework**: **shadcn/ui** components built on **Radix UI** primitives, styled with **Tailwind CSS**.
**State Management**: **TanStack Query (React Query)** for server state; React hooks for local state.
**Routing**: **Wouter** for client-side routing.
**Form Handling**: Custom components for complex checklist forms, conditional field rendering, file uploads, and signature capture.

### Backend Architecture
The backend is an **Express.js** server written in **TypeScript** with ES modules. It provides a RESTful API for authentication, file uploads, and business logic.
**Session Management**: Token-based authentication stored in localStorage on the client, managed server-side.
**API Design**: RESTful endpoints with error handling and validation.
**File Handling**: **Multer** for file uploads, storing files in a local uploads directory.

### Data Storage Solutions
**Database**: **PostgreSQL** with **Drizzle ORM** for type-safe operations. Schema includes users, templates, checklists, and sessions, utilizing UUID primary keys, JSON columns for flexible data, and timestamp tracking.
**Migration System**: Drizzle Kit manages database migrations.
**Development Storage**: In-memory storage for local development.

### Authentication and Authorization
**Role-Based Access Control**: Four user roles (Técnico, Analista, Coordenador, Administrador) with distinct permissions.
**Security Features**: Password hashing (bcrypt), token-based session management, protected routes, input validation, and sanitization.
**Session Handling**: Secure token generation with configurable expiration.

### Form and Template System
**Dynamic Forms**: Templates define complex form structures with conditional field rendering, supporting various field types including text, radio, photo uploads, and digital signatures.
**Conditional Logic**: Advanced conditional field display based on previous answers.
**Validation**: Comprehensive client and server-side validation.
**File Management**: Integrated photo upload and signature capture with previews and validation.

### UI/UX Decisions
The application uses a clean, modern design with a focus on mobile responsiveness. The color scheme and branding are aligned with Claro Empresas' visual identity, including the use of their logo throughout the application (sidebar, login, technician dashboard). Naming conventions have been standardized to "Sistema de Checklists" and "Loja [código]". PDF exports reflect the updated visual identity and are designed to include all relevant photographic evidence and details.

## External Dependencies

### Database Services
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **Drizzle ORM**: Type-safe database toolkit
- **connect-pg-simple**: PostgreSQL session store

### UI and Design System
- **Radix UI**: Accessible UI primitives
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
- **@hookform/resolvers**: Validation resolvers
- **Zod**: Schema validation
- **drizzle-zod**: Automatic Zod schema generation

### Utilities and Helpers
- **clsx** and **tailwind-merge**: CSS class composition
- **date-fns**: Date manipulation