# Draft Clinic - Professional Document Review Services

A comprehensive document review platform offering proofreading, editing, and formatting services with instant quoting, secure payments, and fast turnaround times.

## Features

- **Document Upload & Review**: Upload documents for professional proofreading, editing, or formatting
- **Instant Quote Calculator**: Get transparent pricing based on word count, service type, and turnaround time
- **Multi-Currency Support**: Prices available in ZAR, USD, EUR, and GBP
- **Secure Payments**: Integration-ready for PayFast, Yoco, Ozow, Stripe, and PayPal
- **POPIA & GDPR Compliant**: Data handling follows South African and international privacy regulations
- **User Dashboard**: Track job progress, view history, and manage documents
- **Admin Panel**: Manage jobs, assign reviewers, and monitor platform statistics
- **VAT Invoice Generation**: Automatic invoice generation for South African clients

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for fast development and building
- TailwindCSS for styling
- Shadcn/ui components
- TanStack Query for data fetching
- Wouter for routing

### Backend
- **Python (Flask)**: Primary API server with SQLAlchemy ORM
- **Node.js (Express)**: Legacy support and real-time features
- PostgreSQL database
- Drizzle ORM (Node.js) / SQLAlchemy (Python)

## Project Structure

```
draft-clinic/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   └── lib/           # Utilities and helpers
│   └── public/            # Static assets
├── backend/               # Python Flask backend
│   ├── app/
│   │   ├── routes/        # API endpoints
│   │   ├── models/        # SQLAlchemy models
│   │   └── services/      # Business logic
│   └── run.py             # Entry point
├── server/                # Node.js Express backend (legacy)
├── shared/                # Shared TypeScript types
└── docs/                  # Documentation
```

## Getting Started

### Prerequisites

- Node.js 20.x
- Python 3.11+
- PostgreSQL 15+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/draft-clinic.git
   cd draft-clinic
   ```

2. **Install Node.js dependencies**
   ```bash
   npm install
   ```

3. **Install Python dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/draftclinic
   SESSION_SECRET=your-secure-session-secret
   NODE_ENV=development
   ```

5. **Set up the database**
   ```bash
   # Create the database
   createdb draftclinic
   
   # Run migrations (Node.js)
   npm run db:push
   
   # Or with Python/Alembic
   cd backend && alembic upgrade head
   ```

### Running the Application

#### Option 1: Node.js Backend (Current)
```bash
npm run dev
```
The application will be available at http://localhost:5000

#### Option 2: Python Backend
```bash
# Terminal 1: Start Python backend
cd backend
python run.py

# Terminal 2: Start frontend (Vite dev server)
npm run dev:frontend
```

### Running Tests

```bash
# Run all tests
npm test

# Run frontend tests
npm run test:frontend

# Run backend tests (Python)
cd backend && pytest
```

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/user` | Get current user |

### Jobs
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs` | List user's jobs |
| POST | `/api/jobs` | Create new job |
| GET | `/api/jobs/:id` | Get job details |
| PATCH | `/api/jobs/:id` | Update job |
| POST | `/api/jobs/:id/files` | Upload file to job |

### Quotes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/quotes/calculate` | Calculate quote |
| POST | `/api/quotes` | Create quote for job |
| GET | `/api/quotes/:jobId` | Get quote for job |

### Payments
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/mock` | Process mock payment |
| POST | `/api/orders` | Create order |
| GET | `/api/invoices/:orderId` | Get invoice |

### Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/unassigned-jobs` | Unassigned jobs |
| GET | `/api/admin/reviewers` | List reviewers |
| POST | `/api/jobs/:id/assign` | Assign reviewer |

## Configuration

### Service Types & Pricing

| Service | Base Price (ZAR) | Description |
|---------|------------------|-------------|
| Proofreading | R0.08/word | Spelling, grammar, punctuation |
| Editing | R0.15/word | Full content improvement |
| Formatting | R0.10/word | Style and layout optimization |

### Turnaround Multipliers

| Turnaround | Multiplier | Description |
|------------|------------|-------------|
| 24 Hours | 2.0x | Express delivery |
| 48 Hours | 1.5x | Fast turnaround |
| 72 Hours | 1.25x | Standard delivery |
| 1 Week | 1.0x | Economy option |

## Deployment

### Replit
The application is configured to run on Replit with automatic workflows.

### AWS Deployment
See [AWS_DEPLOYMENT.md](./AWS_DEPLOYMENT.md) for detailed AWS deployment instructions including:
- ECS Fargate setup
- RDS PostgreSQL configuration
- S3 for file storage
- CloudFront CDN
- CI/CD with GitHub Actions

### Docker

```bash
# Build the image
docker build -t draft-clinic .

# Run the container
docker run -p 5000:5000 \
  -e DATABASE_URL="postgresql://..." \
  -e SESSION_SECRET="..." \
  draft-clinic
```

## Security

- **Authentication**: Session-based with secure cookies
- **Data Encryption**: AES-256 encryption for documents at rest
- **HTTPS**: TLS 1.3 in production
- **POPIA Compliance**: South African privacy law compliance
- **GDPR Ready**: European data protection compliance
- **PCI DSS**: Payment data handled by certified gateways

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@draftclinic.com or open an issue on GitHub.
