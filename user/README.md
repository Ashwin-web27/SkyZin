# Education Platform Backend

A comprehensive Node.js backend with MongoDB Atlas integration for real-time scheduling and course management.

## Features

- **Real-time Scheduling**: WebSocket-powered live updates for schedules, attendance, and notifications
- **Course Management**: Complete CRUD operations for courses with enrollment tracking
- **User Authentication**: JWT-based auth with role-based access control (student, teacher, admin)
- **MongoDB Integration**: Optimized schemas with proper indexing and relationships
- **Real-time Updates**: Socket.IO for live notifications and updates
- **Security**: Helmet, CORS, rate limiting, and input validation

## Quick Start

### 1. Environment Setup

Copy `.env.local` and update with your MongoDB Atlas credentials:

\`\`\`bash
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/education-platform?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

This starts both the Next.js frontend (port 3000) and Node.js backend (port 3001).

### 4. MongoDB Compass Connection

Use this connection string in MongoDB Compass:
\`\`\`
mongodb+srv://username:password@cluster0.mongodb.net/education-platform
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/me` - Update profile
- `PUT /api/auth/change-password` - Change password

### Courses
- `GET /api/courses` - List courses with filtering
- `POST /api/courses` - Create course (teacher/admin)
- `GET /api/courses/:id` - Get course details
- `PUT /api/courses/:id` - Update course
- `POST /api/courses/:id/enroll` - Enroll in course
- `POST /api/courses/:id/unenroll` - Unenroll from course

### Schedules
- `GET /api/schedule` - Get user schedules
- `POST /api/schedule` - Create schedule (teacher/admin)
- `PUT /api/schedule/:id` - Update schedule
- `POST /api/schedule/:id/join` - Accept schedule invitation
- `POST /api/schedule/:id/attendance` - Mark attendance
- `DELETE /api/schedule/:id` - Delete schedule

### Users (Admin only)
- `GET /api/users` - List all users
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Real-time Events

### Socket.IO Events

**Client to Server:**
- `schedule_update` - Notify schedule changes
- `join_course` - Join course room for updates
- `leave_course` - Leave course room

**Server to Client:**
- `schedule_created` - New schedule created
- `schedule_updated` - Schedule modified
- `schedule_deleted` - Schedule removed
- `schedule_invitation` - Invited to schedule
- `schedule_accepted` - Invitation accepted
- `attendance_updated` - Attendance marked
- `student_enrolled` - New student enrollment
- `course_updated` - Course information changed

## Database Schema

### Collections

1. **Users** - User profiles, authentication, and preferences
2. **Courses** - Course information, enrollment, and materials
3. **Schedules** - Class schedules, meetings, and events with attendance tracking

### Key Features

- **Optimized Indexing** - Fast queries for schedules, courses, and users
- **Real-time Updates** - WebSocket integration for live notifications
- **Role-based Access** - Student, teacher, and admin permissions
- **Attendance Tracking** - Detailed attendance records with duration
- **Recurrence Support** - Recurring schedules (daily, weekly, monthly)
- **Multi-timezone Support** - Proper timezone handling for global users

## Production Deployment

1. Set `NODE_ENV=production` in environment variables
2. Update CORS origins to your production domain
3. Use strong JWT secrets and secure MongoDB credentials
4. Enable MongoDB Atlas IP whitelist for your server
5. Configure proper SSL certificates for WebSocket connections

## Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- CORS protection
- Helmet security headers
- Input validation and sanitization
- Role-based access control
