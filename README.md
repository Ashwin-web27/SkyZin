# E-Learning Platform - Complete Backend Integration

This project contains a complete e-learning platform with separate admin and user interfaces, connected to a Node.js backend with MongoDB Atlas integration.

## 📁 Project Structure

```
websample6/
├── backend/           # Node.js Express API server
│   ├── models/        # MongoDB models (User, Course, Payment, Enrollment)
│   ├── routes/        # API routes (auth, admin, user)
│   ├── controllers/   # Business logic controllers
│   ├── middleware/    # Authentication & validation middleware
│   ├── config/        # Database configuration
│   └── utils/         # JWT utilities
├── admin/             # Next.js Admin Dashboard
│   ├── services/      # API integration services
│   ├── components/    # Admin UI components
│   └── app/           # Admin pages & layouts
├── user/              # Next.js User Interface
│   ├── services/      # API integration services  
│   ├── components/    # User UI components
│   ├── lib/           # Cart & enrollment utilities
│   └── app/           # User pages & layouts
└── README.md
```

## 🚀 Quick Setup

### 1. Backend Setup

```bash
cd backend
npm install
```

**Configure Environment Variables:**
Edit `backend/.env`:
```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/elearning?retryWrites=true&w=majority

# JWT Configuration  
JWT_SECRET=your_super_secret_jwt_key_here_make_it_complex
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# CORS Configuration
FRONTEND_ADMIN_URL=http://localhost:3001
FRONTEND_USER_URL=http://localhost:3000
```

**Start Backend Server:**
```bash
npm run dev
# or
npm start
```

Server will run on: `http://localhost:5000`

### 2. Admin Dashboard Setup

```bash
cd admin
npm install
```

Environment is already configured in `.env.local`:
- Admin API: `http://localhost:5000/api/admin`
- Auth API: `http://localhost:5000/api/auth`

**Start Admin Dashboard:**
```bash
npm run dev
```

Admin Dashboard: `http://localhost:3001`

### 3. User Interface Setup

```bash
cd user
npm install
```

Environment is already configured in `.env.local`:
- User API: `http://localhost:5000/api/users`
- Auth API: `http://localhost:5000/api/auth`

**Start User Interface:**
```bash
npm run dev
```

User Interface: `http://localhost:3000`

## 📋 API Documentation

### Authentication Endpoints

#### Admin Authentication
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/profile` - Get current user profile

#### User Authentication  
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token

### Admin API Endpoints

All admin routes require admin authentication (`Authorization: Bearer <token>`):

#### Dashboard
- `GET /api/admin/dashboard/stats` - Get dashboard statistics

#### User Management
- `GET /api/admin/users` - Get users with pagination & filters
- `GET /api/admin/users/:id` - Get user by ID
- `PUT /api/admin/users/:id/status` - Update user status
- `DELETE /api/admin/users/:id` - Delete user

#### Course Management  
- `GET /api/admin/courses` - Get courses with pagination & filters
- `POST /api/admin/courses` - Create new course
- `PUT /api/admin/courses/:id` - Update course
- `DELETE /api/admin/courses/:id` - Delete course

#### Instructor Management
- `GET /api/admin/instructors` - Get instructors with pagination

#### Payment Management
- `GET /api/admin/payments` - Get payments with pagination & filters

### User API Endpoints

#### Course Browsing (Public)
- `GET /api/users/courses` - Get published courses with filters
- `GET /api/users/courses/:id` - Get course details

#### Profile Management (Private)
- `GET /api/users/profile` - Get user profile  
- `PUT /api/users/profile` - Update profile
- `PUT /api/users/password` - Change password

#### Enrollment Management (Private)
- `POST /api/users/enroll` - Enroll in course
- `GET /api/users/enrollments` - Get user enrollments
- `POST /api/users/courses/:id/progress` - Update course progress

#### Payment (Private)
- `POST /api/users/payments/intent` - Create payment intent

## 🛠 Service Integration

### Admin Services

**Authentication Service (`admin/services/authService.ts`):**
```typescript
import { authService } from '@/services/authService';

// Login
const response = await authService.adminLogin({ email, password });

// Logout
await authService.logout();

// Check authentication
const isAuth = authService.isAuthenticated();
```

**Admin Service (`admin/services/adminService.ts`):**
```typescript  
import { adminService } from '@/services/adminService';

// Get dashboard stats
const stats = await adminService.getDashboardStats();

// User management
const users = await adminService.getUsers({ page: 1, limit: 10 });
await adminService.updateUserStatus(userId, 'Blocked');

// Course management
const courses = await adminService.getCourses({ status: 'Published' });
await adminService.createCourse(courseData);
```

### User Services

**Authentication Service (`user/services/authService.ts`):**
```typescript
import { authService } from '@/services/authService';

// Register
const response = await authService.register({ name, email, password });

// Login  
const response = await authService.login({ email, password });

// Get profile
const profile = await authService.getProfile();
```

**User Service (`user/services/userService.ts`):**
```typescript
import { userService } from '@/services/userService';

// Browse courses
const courses = await userService.getCourses({ 
  category: 'Programming', 
  page: 1 
});

// Enroll in course
await userService.enrollInCourse(courseId);

// Get enrollments
const enrollments = await userService.getMyEnrollments();

// Update progress
await userService.updateCourseProgress(courseId, lessonId, 30);
```

## 🔐 Authentication Flow

### Admin Authentication
1. Admin logs in via `/admin/login`
2. Backend validates credentials with admin role check
3. JWT token stored in `localStorage` as `admin_token`
4. All admin API calls include `Authorization: Bearer <token>`
5. Failed auth redirects to login page

### User Authentication  
1. User registers via `/register` or logs in via `/login`
2. Backend validates and creates/authenticates user
3. JWT token stored in `localStorage` as `user_token`
4. API calls include token for protected routes
5. Supports both authenticated and guest browsing

## 🗄️ Database Models

### User Model
- Authentication (email, password, role)
- Profile information (name, avatar)  
- Status management (Active, Blocked, Pending)
- Enrolled courses tracking
- Role-based access (admin, instructor, user)

### Course Model
- Course details (title, description, price)
- Instructor relationship
- Lesson management
- Enrollment tracking
- Rating & review system
- Status management (Published, Draft, Archived)

### Payment Model  
- Transaction tracking
- Multiple payment gateway support
- Automatic invoice generation
- Refund management
- Status tracking

### Enrollment Model
- User-course relationship
- Progress tracking per lesson
- Completion certificates
- Time spent analytics
- Status management

## 🛡️ Security Features

- **JWT Authentication** with access & refresh tokens
- **Role-based Authorization** (admin, instructor, user)
- **Rate Limiting** on API endpoints
- **Input Validation** using express-validator
- **Password Hashing** with bcrypt
- **CORS Configuration** for allowed origins
- **Helmet.js** for security headers
- **Environment Variable Protection**

## 🔄 Error Handling

- Global error handler middleware
- Consistent API response format
- Validation error handling
- Authentication error management  
- MongoDB error handling
- Client-side error boundaries

## 📊 Features Implemented

### Admin Dashboard
- ✅ User management (CRUD, status updates)
- ✅ Course management (CRUD, publishing)
- ✅ Instructor management (view, status)
- ✅ Payment tracking & management
- ✅ Dashboard analytics & stats
- ✅ Authentication & authorization

### User Interface  
- ✅ Course browsing & filtering
- ✅ User registration & login
- ✅ Course enrollment system
- ✅ Progress tracking
- ✅ Profile management
- ✅ Cart functionality (localStorage)
- ✅ Payment integration (demo)

### Backend API
- ✅ RESTful API design
- ✅ MongoDB integration  
- ✅ JWT authentication
- ✅ Role-based authorization
- ✅ Input validation
- ✅ Error handling
- ✅ Rate limiting
- ✅ CORS configuration

## 🔧 Environment Configuration

### MongoDB Atlas Setup
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create new cluster
3. Create database user
4. Get connection string
5. Update `MONGODB_URI` in backend/.env

### JWT Secret Generation
```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🚀 Production Deployment

### Backend Deployment
- Set `NODE_ENV=production`
- Use environment variables for all secrets
- Configure proper CORS origins
- Set up database connection pooling
- Enable SSL/HTTPS

### Frontend Deployment
- Update API URLs in `.env.local`
- Build static assets: `npm run build`
- Configure CDN for assets
- Set up SSL certificates

## 📞 API Testing

Use the health check endpoint to verify backend:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2025-01-13T14:35:52.000Z",
  "environment": "development"
}
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)  
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Backend won't start:**
- Check MongoDB connection string
- Ensure all environment variables are set
- Verify port 5000 is available

**Admin/User UI won't connect:**
- Verify backend is running on port 5000
- Check API URLs in .env.local files
- Ensure CORS is configured correctly

**Authentication not working:**
- Check JWT secret is set
- Verify token storage in localStorage
- Check browser network tab for API errors

**Database connection issues:**
- Verify MongoDB Atlas IP whitelist
- Check database user permissions
- Ensure connection string format is correct

For more help, check the console logs in both browser and terminal.