# Draft Clinic - Admin Guide

This guide explains how to set up and use admin functionality in Draft Clinic.

## Test Credentials

### Admin Account
- **Email:** admin@draftclinic.com
- **Password:** Admin123!
- **Role:** admin

### Test User Account
- **Email:** user@test.com
- **Password:** User123!
- **Role:** customer

## How to Register as Admin

### Method 1: Database Update (Recommended for First Admin)

After registering a normal account, update the user's role in the database:

```sql
-- Connect to your PostgreSQL database
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

### Method 2: Using the Python Backend

If using the Python backend, you can create an admin user via the API:

```python
# In backend/app/routes/auth.py, temporarily modify the register endpoint
# to accept a role parameter for initial setup

# Or run this script:
from app.models import User
from app import db_session
import uuid

admin_user = User(
    id=str(uuid.uuid4()),
    email='admin@draftclinic.com',
    first_name='Admin',
    last_name='User',
    role='admin',
    is_active=True
)
db_session.add(admin_user)
db_session.commit()
```

### Method 3: Using Drizzle ORM (Node.js Backend)

```typescript
// Run this in a Node.js script or add to seed file
import { db } from './server/db';
import { users } from './shared/schema';

await db.insert(users).values({
  email: 'admin@draftclinic.com',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
}).onConflictDoUpdate({
  target: users.email,
  set: { role: 'admin' }
});
```

## Admin Features

Once logged in as an admin, you have access to:

### Admin Dashboard (`/admin`)
- View platform statistics (total jobs, revenue, active jobs)
- See all unassigned jobs
- Manage reviewer assignments

### Job Management
- View all jobs across all users
- Assign reviewers to jobs
- Update job statuses
- Resolve disputes

### User Management
- View all users
- Update user roles (customer, reviewer, admin)
- Deactivate accounts

## API Endpoints for Admins

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/stats` | GET | Get platform statistics |
| `/api/admin/unassigned-jobs` | GET | List jobs needing assignment |
| `/api/admin/reviewers` | GET | List all reviewers with workload |
| `/api/jobs/:id/assign` | POST | Assign a reviewer to a job |

## Setting Up Multiple Admins

You can have multiple admin users. Each admin has full access to:
- All jobs and orders
- User management
- Reviewer assignment
- Platform statistics

To add another admin:
1. Have the user register normally at `/login`
2. Update their role in the database to 'admin'

## Security Best Practices

1. **Change default passwords** immediately after setup
2. **Use strong passwords** (min 12 characters, mix of letters, numbers, symbols)
3. **Enable 2FA** when available (future feature)
4. **Limit admin accounts** to only those who need full access
5. **Audit admin actions** via database logs
6. **Use HTTPS** in production

## Troubleshooting

### Cannot access admin panel
- Verify your user role is set to 'admin' in the database
- Clear browser cookies and log in again
- Check console for API errors

### Admin endpoints return 403
- Ensure you're logged in with an admin account
- Check the session is valid (not expired)

### Database connection issues
- Verify DATABASE_URL environment variable is set
- Check PostgreSQL server is running
- Ensure database exists and migrations are applied

## Environment Variables

For admin functionality, ensure these are set:

```env
DATABASE_URL=postgresql://user:password@host:5432/draftclinic
SESSION_SECRET=your-secure-session-secret
```

## Support

For technical issues, check the logs or open an issue on GitHub.
