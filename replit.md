# Draft Clinic - Document Review Platform

## Overview

Draft Clinic is a professional document review platform offering proofreading, editing, and formatting services. The application provides instant quote calculation based on word count, service type, and turnaround time, with multi-currency support (ZAR, USD, EUR, GBP). Key features include document upload, secure payment integration readiness (PayFast, Yoco, Ozow, Stripe, PayPal), POPIA/GDPR compliance, user dashboards for job tracking, and admin panels for reviewer management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite for fast development
- **Styling**: TailwindCSS with Shadcn/ui component library (New York style)
- **State Management**: TanStack Query for server state and data fetching
- **Routing**: Wouter for lightweight client-side routing
- **Theme**: Light/dark mode support with CSS custom properties

### Backend Architecture
The project uses a dual-backend approach:

**Primary Backend (Node.js/Express)**:
- Express server with TypeScript
- Handles API routes, authentication, and business logic
- Uses Drizzle ORM for type-safe database operations
- Replit Auth integration with OpenID Connect
- Session management via connect-pg-simple

**Secondary Backend (Python/Flask)**:
- Flask application with SQLAlchemy ORM
- Serves as legacy support and alternative API endpoints
- CORS-enabled with filesystem session storage
- Modular route structure (auth, jobs, quotes, admin)

### Database Design
- **Database**: PostgreSQL with Drizzle ORM schema definitions
- **Key Tables**: users, sessions, jobs, job_files, quotes, orders, payments, invoices, notifications, disputes, reviewer_profiles, pricing_config, exchange_rates
- **Enums**: service_type (proofreading/editing/formatting), turnaround (24h/48h/72h/1week), job_status (10 states), payment_status, currency, user_role

### Authentication
- Replit Auth with OpenID Connect discovery
- Session-based authentication stored in PostgreSQL
- Role-based access control (customer, reviewer, admin)

### Build System
- Vite for frontend bundling with React plugin
- ESBuild for server bundling with selective dependency bundling
- Path aliases configured (@/ for client, @shared/ for shared code)

## External Dependencies

### Payment Integrations (Integration-Ready)
- PayFast, Yoco, Ozow (South African gateways)
- Stripe, PayPal (International gateways)

### Third-Party Services
- **Email**: AWS SES ready (boto3 in Python requirements)
- **File Storage**: AWS S3 ready for document uploads
- **CDN**: CloudFront deployment option documented

### Key NPM Dependencies
- drizzle-orm, drizzle-zod for database operations
- @tanstack/react-query for data fetching
- Radix UI primitives for accessible components
- react-dropzone for file uploads
- nodemailer for email functionality

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Session encryption key
- `REPL_ID`: Replit deployment identifier
- `REPLIT_DEPLOYMENT_URL` or `REPLIT_DEV_DOMAIN`: For auth callback URLs