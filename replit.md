# WaPlatform - Embedded WhatsApp Support Platform

## Overview

WaPlatform is a multi-tenant SaaS application that enables businesses to embed WhatsApp-based customer support into their websites and CRMs. The platform provides a complete solution for companies to connect their WhatsApp Business accounts, manage customer conversations through a dashboard, and offer an embeddable chat widget for their end users.

Key capabilities:
- Multi-tenant architecture supporting multiple companies
- WhatsApp Web integration for real-time messaging
- Embeddable chat widget for client websites
- Real-time communication via Socket.IO
- Agent dashboard for managing conversations

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight alternative to React Router)
- **State Management**: TanStack Query (React Query) for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with custom development plugins for Replit
- **Animations**: Framer Motion for UI transitions

The frontend follows a page-based structure with shared components. Protected routes use a wrapper component that checks authentication state before rendering.

### Backend Architecture
- **Framework**: Express.js 5 with TypeScript
- **Runtime**: Node.js with tsx for TypeScript execution
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Real-time**: Socket.IO for bidirectional communication between agents and customers
- **WhatsApp Integration**: whatsapp-web.js library using Puppeteer for browser automation

The server serves both the API and the static frontend in production, with Vite middleware handling development mode.

### Data Storage
- **Database**: mySQL
- **ORM**: Drizzle ORM with drizzle-zod for schema validation
- **Schema Location**: `shared/schema.ts` contains all table definitions
- **Migrations**: Managed via `drizzle-kit push`

Core entities:
- `tenants` - Companies using the platform
- `agents` - Support staff/admins per tenant
- `chats` - Customer conversations linked to WhatsApp remote JIDs
- `messages` - Individual messages within chats
- `sessions` - WhatsApp session persistence

### Authentication
- Session-based authentication (planned implementation)
- Multi-tenant isolation via `tenantId` on all relevant entities
- Public key system for widget embedding (`publicKey` on tenants)

### Real-time Communication
Socket.IO handles:
- Agent dashboards joining tenant-specific rooms (`tenant_{id}`)
- Widget instances joining chat-specific rooms (`chat_{id}`)
- QR code broadcasting for WhatsApp connection
- Live message updates

### Build System
- Development: Vite dev server with HMR proxied through Express
- Production: Vite builds frontend to `dist/public`, esbuild bundles server to `dist/index.cjs`
- Common dependencies are bundled to reduce cold start times

## External Dependencies

### Database
- **mySQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in mySQL

### WhatsApp Integration
- **whatsapp-web.js**: Unofficial WhatsApp Web API client
- **Puppeteer**: Headless Chrome for WhatsApp Web automation
- **qrcode**: Generates QR codes for WhatsApp authentication

### Frontend Libraries
- **@tanstack/react-query**: Server state management and caching
- **socket.io-client**: Real-time communication with backend
- **qrcode.react**: QR code rendering in React components
- **date-fns**: Date formatting utilities
- **framer-motion**: Animation library

### UI Components
- **shadcn/ui**: Component library built on Radix UI primitives
- **Radix UI**: Accessible, unstyled component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library

### Development Tools
- **Vite**: Frontend build tool and dev server
- **esbuild**: Server bundling for production
- **drizzle-kit**: Database migration tooling
- **TypeScript**: Type safety across full stack