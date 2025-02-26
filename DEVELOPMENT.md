# Backend Development Guide

## Project Overview
This document outlines the development plan for our backend platform, which will handle project management, user applications, and task management.

### Tech Stack
- **Backend**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Dynamic SDK (@dynamic-labs/sdk-react-core)
- **Version Control**: Git

## Current Implementation Status

### Completed Features ✅
1. **Authentication Setup**
   - Dynamic SDK integration
   - User authentication flow

2. **Admin Access System**
   - Admin code verification page (`/admin`)
   - Rate-limited code verification
   - Session management with secure cookies
   - Protected admin routes

### Admin Routes Structure
```
/admin
├── /                 # Admin login page with code verification
├── /dashboard        # Main admin dashboard (to be implemented)
├── /projects         # Project management (to be implemented)
│   ├── /create      # Create new project
│   └── /:id         # Edit specific project
└── /api
    └── /verify      # Admin code verification endpoint
```

### API Endpoints Status

#### Implemented ✅
- `POST /api/admin/verify` - Verify admin access code
  - Rate limited (5 attempts/15 minutes)
  - Requires Dynamic authentication
  - Sets secure HTTP-only cookie

#### Pending Implementation
- `POST /admin/projects` - Create new project
- `PUT /admin/projects/:id/status` - Update project status
- `POST /admin/projects/:id/tasks` - Create tasks
- `PUT /admin/projects/:id/tasks/:taskId/verify` - Verify task submissions

### Security Features Implemented ✅
- Rate limiting for admin code attempts
- Secure session cookies
- Dynamic authentication integration
- IP-based attempt tracking
- Timeout for failed attempts
- Error logging

## Required Features Implementation

### 1. Database Schema Design
We need to create the following MongoDB schemas:

#### Project Schema
```javascript
{
  title: String,
  description: String,
  imageUrl: String,
  status: enum['OPEN', 'CLOSED', 'COMING_SOON'],
  createdAt: Date,
  updatedAt: Date
}
```

#### Application Schema
```javascript
{
  projectId: ObjectId,
  userId: ObjectId,
  answers: [String],
  status: enum['PENDING', 'ACCEPTED', 'REJECTED'],
  createdAt: Date
}
```

#### Task Schema
```javascript
{
  projectId: ObjectId,
  userId: ObjectId,
  title: String,
  description: String,
  platform: String,
  deliverables: [String],
  status: enum['PENDING', 'NEGOTIATION', 'IN_PROGRESS', 'SUBMITTED', 'ACCEPTED', 'DECLINED'],
  submission: {
    link: String,
    description: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### 2. API Endpoints Implementation

#### Admin Endpoints
- `POST /admin/projects` - Create new project
- `PUT /admin/projects/:id/status` - Update project status
- `POST /admin/projects/:id/tasks` - Create tasks
- `PUT /admin/projects/:id/tasks/:taskId/verify` - Verify task submissions

#### User Endpoints
- `GET /projects` - List available projects
- `POST /projects/:id/apply` - Submit application
- `GET /projects/:id/tasks` - Get user's tasks
- `POST /projects/:id/tasks/:taskId/submit` - Submit task
- `PUT /projects/:id/tasks/:taskId/negotiate` - Negotiate task terms

### 3. Authentication & Authorization
- ✅ Dynamic SDK integration
- ✅ Admin access code verification
- ✅ Session management with secure cookies
- ✅ Rate limiting for admin access
- Pending: Admin dashboard implementation
- Pending: Project management routes

### 4. File Upload
- Set up image upload functionality for projects
- Implement secure file storage system

## Next Steps

1. **Admin Dashboard**
   - Create dashboard layout
   - Implement project listing
   - Add project creation form
   - Implement task management

2. **Project Management**
   - Implement project CRUD operations
   - Add image upload functionality
   - Create task assignment system

3. **User Features**
   - Project browsing
   - Application submission
   - Task management interface

4. **Testing**
   - Write unit tests for models
   - Create integration tests for API endpoints
   - Implement end-to-end testing

## Development Guidelines

### Code Structure
```
src/
├── config/         # Configuration files
├── models/         # MongoDB schemas
├── controllers/    # Route controllers
├── middleware/     # Custom middleware
├── routes/         # API routes
├── services/       # Business logic
├── utils/          # Helper functions
└── tests/          # Test files
```

### Best Practices
- Follow RESTful API design principles
- Implement proper error handling
- Use async/await for asynchronous operations
- Validate all input data
- Implement rate limiting
- Use environment variables for configuration
- Document all API endpoints

### Security Measures
- Implement input validation
- Use helmet for security headers
- Rate limit API endpoints
- Sanitize user input
- Implement CORS properly
- Secure admin code handling:
  - Rate limit admin code attempts
  - Store admin code securely
  - Implement timeout for failed attempts
  - Log admin access attempts

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start development server: `npm run dev`

## Contributing
- Create feature branches from `develop`
- Follow commit message conventions
- Write tests for new features
- Update documentation as needed

## API Endpoints Reference

### User Endpoints
1. Projects
   - `GET /api/projects` - List all available projects
   - `GET /api/projects/:projectId` - Get single project details
   - `POST /api/projects/:projectId/apply` - Submit application for a project

2. Tasks
   - `GET /api/projects/:projectId/tasks` - Get user's tasks for a project
   - `GET /api/projects/:projectId/tasks/:taskId` - Get single task details
   - `POST /api/projects/:projectId/tasks/:taskId/submit` - Submit task completion
   - `PUT /api/projects/:projectId/tasks/:taskId/negotiate` - Negotiate task terms
   - `GET /api/projects/:projectId/tasks/:taskId/modifications` - Get task modification history
   - `PUT /api/projects/:projectId/tasks/:taskId/reset-status` - Reset task status (testing only)

3. Applications
   - `GET /api/applications` - List user's applications

4. Chat & Communication
   - `GET /api/projects/:projectId/chat` - Get project chat messages
   - `POST /api/projects/:projectId/chat` - Send project chat message

5. User Profile
   - `GET /api/user/profile` - Get user profile and statistics

### Admin Endpoints
1. Authentication
   - `POST /api/admin/verify` - Verify admin access code

2. Project Management
   - `POST /api/projects` - Create new project
   - `PUT /api/projects/:projectId/status` - Update project status
   - `PUT /api/applications/:applicationId/status` - Update application status

3. Task Management
   - `POST /api/projects/:projectId/tasks` - Create new task
   - `PUT /api/projects/:projectId/tasks/:taskId/verify` - Verify task submission
   - `PUT /api/projects/:projectId/tasks/:taskId/modifications/:modificationId` - Approve/reject task modifications

### Pending Implementation
1. File Upload
   - `POST /api/upload` - Upload project images or task files

### Common Features Across All Endpoints
- Authentication via Bearer token (email)
- Standard response format: `{ success: boolean, message?: string, data?: any }`
- Error handling with appropriate HTTP status codes
- CORS support via OPTIONS preflight
- Rate limiting for sensitive operations
- Input validation and sanitization 