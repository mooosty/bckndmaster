# Frontend Development Guide

## Project Overview
This document outlines the frontend development plan for our platform's user interface, focusing on project browsing, task management, and user interactions.

## Tech Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: TailwindCSS + DaisyUI
- **Authentication**: Dynamic SDK (@dynamic-labs/sdk-react-core)
- **State Management**: React Context + Hooks
- **Data Fetching**: React Query
- **Forms**: React Hook Form + Zod
- **UI Components**: Headless UI + Custom Components

## Required Features

### 1. Project Discovery
- Project Listing Page
  - Filterable Grid Layout
  - Project Status Indicators
  - Search & Filter System
  - Pagination/Infinite Scroll
- Project Detail Page
  - Project Information
  - Application Status
  - Task List
  - Chat Interface

### 2. Task Management
- Task List View
  - Status-based Grouping
  - Priority Indicators
  - Deadline Tracking
- Task Detail Page
  - Description & Requirements
  - Submission Interface
  - Modification Requests
  - Chat Thread
- Task Submission Flow
  - Multi-step Form
  - File/Link Attachments
  - Preview & Confirmation

### 3. Communication
- Project-level Chat
- Task-specific Discussions
- Notification System
- Status Updates

### 4. User Profile
- View Profile Information
- Active Tasks Overview
- Application History
- Project History

## Project Structure
```
├── app/                    # Next.js App Router (Frontend)
│   ├── admin/             # Admin-specific pages
│   ├── api/               # API Routes
│   ├── components/        # Shared Components
│   │   ├── projects/     # Project-related Components
│   │   ├── tasks/        # Task-related Components
│   │   ├── chat/         # Communication Components
│   │   └── shared/       # Common UI Components
│   ├── config/           # Frontend Configuration
│   ├── lib/              # Frontend Utilities
│   ├── middleware/       # Next.js Middleware
│   ├── models/           # Frontend Type Definitions
│   ├── types/           # TypeScript Types
│   ├── globals.css      # Global Styles
│   ├── layout.tsx       # Root Layout
│   ├── page.tsx         # Home Page
│   └── providers.tsx    # Context Providers
│
└── src/                  # Backend Source
    ├── app/api/         # API Implementation
    ├── config/          # Backend Configuration
    ├── controllers/     # API Controllers
    ├── lib/            # Backend Utilities
    ├── middleware/     # Backend Middleware
    ├── models/         # Database Models
    └── utils/          # Helper Functions

```

## Page Organization
```
app/
├── page.tsx                        # Home/Landing Page
├── projects/
│   ├── page.tsx                   # Project List
│   └── [id]/
│       ├── page.tsx              # Project Details
│       └── tasks/
│           ├── page.tsx         # Project Tasks List
│           └── [taskId]/
│               └── page.tsx    # Task Details
├── profile/
│   └── page.tsx                  # User Profile
└── chat/
    └── page.tsx                  # Messages & Communications
```

## Page Routes
- `/` - Landing/Home Page
- `/projects` - Project Discovery
- `/projects/[id]` - Project Details
- `/projects/[id]/tasks` - Project Tasks
- `/tasks/[id]` - Task Details
- `/profile` - User Profile
- `/chat` - Messages & Communications

## Component Guidelines

### Project Card
```typescript
interface ProjectCard {
  title: string;
  description: string;
  imageUrl: string;
  status: 'COMING_SOON' | 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  tasks: number;
  applications: number;
}
```

### Task Card
```typescript
interface TaskCard {
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'SUBMITTED' | 'ACCEPTED';
  deadline?: Date;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

### Chat Message
```typescript
interface ChatMessage {
  content: string;
  sender: string;
  timestamp: Date;
  type: 'GENERAL' | 'TASK' | 'SYSTEM';
}
```

## State Management
- User Context: Authentication & Profile
- Project Context: Active Project Data
- Task Context: Active Task Data
- Chat Context: Messages & Notifications

## API Integration
Use React Query for data fetching:
```typescript
const { data: projects } = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects
});
```

## UI/UX Guidelines

### Layout
- Responsive Design (Mobile-first)
- Sidebar Navigation
- Sticky Headers
- Bottom Navigation (Mobile)

### Components
- Use DaisyUI for base components
- Custom styling with Tailwind
- Consistent spacing and typography
- Loading states & skeletons
- Error boundaries

### Interactions
- Smooth transitions
- Loading indicators
- Error messages
- Success notifications
- Confirmation dialogs

### Forms
- Inline validation
- Error messages
- Auto-save where appropriate
- Progress indicators
- Clear success/error states

## Design System

### Color Palette
```scss
// Primary Colors
$cream-primary: #f5efdb;
$dark-bg: #2a2a28;

// Gradients
$cream-gradient: linear-gradient(135deg, #f5efdb 0%, #e5dfc9 100%);
$dark-gradient: linear-gradient(180deg, rgba(42, 42, 40, 0.95) 0%, rgba(30, 30, 28, 0.95) 100%);

// Transparency Levels
$cream-transparent-10: rgba(245, 239, 219, 0.1);
$cream-transparent-15: rgba(245, 239, 219, 0.15);
$cream-transparent-20: rgba(245, 239, 219, 0.2);
$cream-transparent-30: rgba(245, 239, 219, 0.3);
$cream-transparent-40: rgba(245, 239, 219, 0.4);

// System Colors
$error-red: #ff4c4c;
$error-red-transparent: rgba(255, 76, 76, 0.1);
```

### Glass Morphism
```scss
// Glass Effect Mixin
@mixin glass-effect {
  background: rgba(42, 42, 40, 0.3);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(245, 239, 219, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(245, 239, 219, 0.05);
}
```

### Typography
```scss
// Font Families
$primary-font: 'Inter', sans-serif;
$display-font: 'MedievalSharp', cursive;

// Font Sizes
$text-xs: 0.875rem;    // 14px
$text-sm: 0.9375rem;   // 15px
$text-base: 1rem;      // 16px
$text-lg: 1.125rem;    // 18px
$text-xl: 1.5rem;      // 24px
$text-2xl: 2rem;       // 32px

// Line Heights
$leading-normal: 1.6;
$leading-relaxed: 1.75;
```

### Spacing System
```scss
// Base spacing unit: 4px
$space-1: 0.25rem;   // 4px
$space-2: 0.5rem;    // 8px
$space-3: 0.75rem;   // 12px
$space-4: 1rem;      // 16px
$space-5: 1.25rem;   // 20px
$space-6: 1.5rem;    // 24px
$space-8: 2rem;      // 32px
$space-10: 2.5rem;   // 40px
$space-12: 3rem;     // 48px
```

### Border Radius
```scss
$radius-sm: 8px;
$radius-md: 12px;
$radius-lg: 16px;
$radius-xl: 20px;
$radius-2xl: 24px;
$radius-full: 9999px;
```

### Transitions
```scss
$transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
```

### Component Themes

#### Buttons
```scss
// Primary Button
.button-primary {
  background: $cream-gradient;
  color: #1e1e1c;
  border-radius: $radius-lg;
  padding: 0.75rem 1.5rem;
  font-weight: 500;
  transition: $transition-smooth;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// Secondary Button
.button-secondary {
  background: transparent;
  color: $cream-primary;
  border: 1px solid rgba($cream-primary, 0.3);
  border-radius: $radius-lg;
  padding: 0.75rem 1.5rem;
  transition: $transition-smooth;
}
```

#### Form Elements
```scss
// Input Fields
.input-field {
  padding: 1rem 1.25rem;
  border-radius: $radius-lg;
  background: rgba(42, 42, 40, 0.4);
  border: 1px solid rgba($cream-primary, 0.15);
  color: $cream-primary;
  transition: $transition-smooth;
  
  &:focus {
    border-color: rgba($cream-primary, 0.4);
    background: rgba(42, 42, 40, 0.6);
    box-shadow: 0 0 0 3px rgba($cream-primary, 0.1);
  }
}

// Select Chips
.chip {
  padding: 0.75rem 1.25rem;
  border-radius: $radius-2xl;
  background: rgba(42, 42, 40, 0.5);
  border: 1px solid rgba($cream-primary, 0.15);
  transition: $transition-smooth;
  
  &.selected {
    background: $cream-gradient;
    color: #1e1e1c;
    border: none;
  }
}
```

#### Cards
```scss
.card {
  @include glass-effect;
  border-radius: $radius-lg;
  padding: 1.5rem;
  
  h3 {
    color: rgba($cream-primary, 0.9);
    font-size: $text-lg;
    margin-bottom: 1.25rem;
  }
}
```

### Animation Guidelines
```scss
// Fade In
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// Slide Up
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Hover Effect
@mixin hover-lift {
  transition: $transition-smooth;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }
}
```

### Responsive Breakpoints
```scss
$breakpoints: (
  'sm': 480px,
  'md': 768px,
  'lg': 1024px,
  'xl': 1280px,
  '2xl': 1536px
);

@mixin responsive($breakpoint) {
  @media (max-width: map-get($breakpoints, $breakpoint)) {
    @content;
  }
}
```

## Performance Considerations
- Image optimization
- Code splitting
- Lazy loading
- Caching strategies
- Debounced search
- Virtualized lists

## Testing Strategy
- Unit Tests: Components & Hooks
- Integration Tests: Pages & Flows
- E2E Tests: Critical Paths
- Visual Regression Tests

## Accessibility
- ARIA labels
- Keyboard navigation
- Color contrast
- Screen reader support
- Focus management

## Getting Started
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_dynamic_id
   ```
4. Start development server: `npm run dev`

## Development Workflow
1. Create feature branch
2. Implement components
3. Add tests
4. Create PR
5. Review & merge

## Best Practices
- Use TypeScript strictly
- Follow component composition patterns
- Implement proper error boundaries
- Use proper loading states
- Handle edge cases
- Document complex components
- Write meaningful tests 