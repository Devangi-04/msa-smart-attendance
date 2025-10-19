# Technologies Used in MSA Smart Attendance System

## 📋 Project Overview
**Project Name:** MSA Members Smart Attendance  
**Version:** 2.0.0  
**Description:** Mathematics and Statistics Association attendance tracking system with QR code scanning and GPS-based verification  
**Node Version:** >=14.0.0

---

## 🎯 Technology Stack

### **Backend Technologies**

#### **1. Runtime & Framework**
- **Node.js** (>=14.0.0) - JavaScript runtime environment
- **Express.js** (v4.18.2) - Fast, minimalist web framework for Node.js
- **Nodemon** (v3.0.1) - Development tool for auto-restarting server

#### **2. Database & ORM**
- **Prisma ORM** (v5.4.2) - Next-generation ORM for Node.js and TypeScript
- **@prisma/client** (v5.4.2) - Auto-generated database client
- **SQLite3** (v5.1.6) - Lightweight database for development
- **PostgreSQL (pg)** (v8.16.3) - Production-ready relational database

#### **3. Authentication & Security**
- **JWT (jsonwebtoken)** (v9.0.2) - JSON Web Token for authentication
- **bcryptjs** (v2.4.3) - Password hashing library
- **Helmet** (v7.1.0) - Security middleware for Express apps
- **express-rate-limit** (v7.1.5) - Rate limiting middleware to prevent abuse
- **express-validator** (v7.0.1) - Input validation and sanitization
- **CORS** (v2.8.5) - Cross-Origin Resource Sharing middleware

#### **4. File Processing & Generation**
- **ExcelJS** (v4.4.0) - Excel file generation and manipulation
- **QRCode** (v1.5.3) - QR code generation library

#### **5. Utilities**
- **dotenv** (v16.3.1) - Environment variable management
- **moment** (v2.29.4) - Date and time manipulation
- **morgan** (v1.10.0) - HTTP request logger middleware
- **body-parser** (v1.20.2) - Request body parsing middleware
- **nodemailer** (v6.9.7) - Email sending functionality

#### **6. Cloud Services (Optional)**
- **Firebase** (v10.14.1) - Firebase SDK for web
- **firebase-admin** (v12.7.0) - Firebase Admin SDK for server-side operations

---

### **Frontend Technologies**

#### **1. Core Technologies**
- **HTML5** - Markup language for web pages
- **CSS3** - Styling and layout
- **JavaScript (ES6+)** - Client-side programming language

#### **2. CSS Frameworks & Libraries**
- **Bootstrap 5.1.3** - Responsive CSS framework
  - Grid system
  - Components (cards, modals, buttons, forms)
  - Utilities
  - Responsive design

#### **3. Icon Libraries**
- **Font Awesome 6.4.0** - Icon toolkit
  - 1000+ icons used throughout the application
  - Scalable vector icons

#### **4. JavaScript Libraries**
- **QR Code Scanner** - Client-side QR code scanning
- **Geolocation API** - Browser-based GPS location access
- **Fetch API** - Modern HTTP client for API calls

---

## 🏗️ Architecture & Design Patterns

### **1. Architecture Pattern**
- **MVC (Model-View-Controller)** - Separation of concerns
  - **Models:** Prisma schema definitions
  - **Views:** HTML templates
  - **Controllers:** Business logic handlers

### **2. API Architecture**
- **RESTful API** - Standard HTTP methods (GET, POST, PUT, DELETE)
- **JSON** - Data exchange format
- **JWT Authentication** - Stateless authentication

### **3. Database Design**
- **Relational Database** - Normalized schema
- **ORM Pattern** - Prisma for database abstraction
- **Migration System** - Version-controlled schema changes

---

## 🔐 Security Technologies

### **1. Authentication**
- JWT (JSON Web Tokens)
- bcrypt password hashing (10 rounds)
- Session management with localStorage/sessionStorage

### **2. Authorization**
- Role-Based Access Control (RBAC)
- Admin vs User permissions
- Protected routes and endpoints

### **3. Security Middleware**
- Helmet.js - HTTP headers security
- Rate limiting - Prevent brute force attacks
- Input validation - Prevent SQL injection and XSS
- CORS - Control cross-origin requests

### **4. Data Protection**
- Password encryption
- Secure token storage
- HTTPS support (production)

---

## 📱 Features & Technologies

### **1. QR Code System**
- **Generation:** QRCode library (server-side)
- **Scanning:** HTML5 Camera API + JavaScript
- **Storage:** Base64 encoded in database

### **2. GPS Location Tracking**
- **Browser Geolocation API** - Get user coordinates
- **Haversine Formula** - Calculate distance between coordinates
- **Radius Verification** - Ensure user is within event location

### **3. Excel Export**
- **ExcelJS** - Generate .xlsx files
- **Styled Reports** - Headers, borders, formatting
- **Blob Download** - Client-side file download

### **4. Real-time Features**
- **Live Search** - Client-side filtering
- **Dynamic Updates** - AJAX requests
- **Instant Validation** - Form validation

---

## 🗄️ Database Schema

### **Models (Prisma)**
1. **User Model**
   - Authentication fields
   - Personal information
   - Academic details
   - MSA information

2. **Event Model**
   - Event details
   - GPS coordinates
   - Status tracking
   - QR code storage

3. **Attendance Model**
   - User-Event relationship
   - Timestamp tracking
   - Location verification
   - Lectures missed tracking

---

## 🎨 UI/UX Technologies

### **1. Design System**
- **Bootstrap Components** - Pre-built UI elements
- **Custom CSS** - Brand-specific styling
- **Gradient Backgrounds** - Modern visual design
- **Responsive Grid** - Mobile-first approach

### **2. Interactive Elements**
- **Modals** - Bootstrap modal components
- **Dropdowns** - Navigation and filters
- **Forms** - Input validation and feedback
- **Tables** - Data display with sorting

### **3. Icons & Graphics**
- **Font Awesome Icons** - Scalable vector icons
- **Avatar System** - Initial-based user avatars
- **Badge System** - Status indicators

---

## 🔧 Development Tools

### **1. Package Management**
- **npm** - Node Package Manager
- **package.json** - Dependency management

### **2. Database Tools**
- **Prisma Studio** - Visual database browser
- **Prisma Migrate** - Database migration tool
- **Prisma Generate** - Client generation

### **3. Development Utilities**
- **Nodemon** - Auto-restart on file changes
- **Morgan** - HTTP request logging
- **dotenv** - Environment configuration

---

## 📊 Data Flow Technologies

### **1. Client-Server Communication**
```
Frontend (HTML/CSS/JS)
    ↓ (Fetch API)
Express.js Server
    ↓ (Prisma ORM)
SQLite/PostgreSQL Database
```

### **2. Authentication Flow**
```
Login Form
    ↓ (POST /api/auth/login)
JWT Token Generation
    ↓ (localStorage)
Authenticated Requests
    ↓ (Authorization Header)
Protected Routes
```

### **3. Attendance Flow**
```
QR Code Scan
    ↓ (Camera API)
GPS Location Check
    ↓ (Geolocation API)
Attendance Submission
    ↓ (POST /api/attendance/mark)
Database Storage
```

---

## 🌐 Deployment Technologies

### **1. Hosting Options**
- **Vercel** - Serverless deployment (configured)
- **Heroku** - Container-based hosting
- **Railway** - Modern deployment platform
- **Local Server** - Development environment

### **2. Environment Configuration**
- **.env file** - Environment variables
- **dotenv** - Load environment configuration
- **Database URL** - Connection string management

---

## 📦 NPM Scripts

### **Available Commands:**
```bash
npm start              # Start production server
npm run dev            # Start development server with nodemon
npm run setup          # Complete setup (install, migrate, seed)
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run database migrations
npm run prisma:seed     # Seed database with initial data
npm run prisma:studio   # Open Prisma Studio
```

---

## 🎯 Key Features & Technologies

### **1. Events & Meetings Management**
- **CRUD Operations** - Full create, read, update, delete
- **Status Tracking** - UPCOMING, ACTIVE, COMPLETED, CANCELLED
- **Filtering System** - 6 filter options
- **Excel Export** - Attendance reports

### **2. Members Management**
- **User Directory** - Complete member information
- **Search & Filter** - Real-time search across fields
- **Role Management** - Admin vs User roles
- **Excel Export** - Member database export

### **3. Attendance System**
- **QR Code Scanning** - Camera-based scanning
- **GPS Verification** - Location-based validation
- **Radius Check** - Configurable distance verification
- **Lectures Missed** - Track missed lectures

### **4. Dashboard & Analytics**
- **Statistics Cards** - Real-time metrics
- **Event Tracking** - Upcoming and past events
- **Attendance Reports** - Visual data representation

---

## 🔗 API Endpoints

### **Authentication APIs**
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/profile` - Get user profile
- POST `/api/auth/change-password` - Change password

### **Events APIs**
- GET `/api/events` - Get all events
- GET `/api/events/:id` - Get single event
- POST `/api/events/create` - Create event
- PUT `/api/events/:id` - Update event
- DELETE `/api/events/:id` - Delete event
- GET `/api/events/:id/qr` - Generate QR code
- GET `/api/events/:id/export` - Export attendance

### **Attendance APIs**
- POST `/api/attendance/mark` - Mark attendance
- GET `/api/attendance/list/:id` - Get attendance records
- GET `/api/attendance/check/:eventId/:userId` - Check attendance status

### **Users APIs**
- GET `/api/users` - Get all users (Admin only)
- GET `/api/users/export` - Export users to Excel (Admin only)

---

## 📱 Browser Compatibility

### **Supported Browsers:**
- ✅ Chrome (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Edge (Latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

### **Required Browser Features:**
- HTML5 Camera API
- Geolocation API
- LocalStorage
- Fetch API
- ES6+ JavaScript

---

## 🎓 Learning Resources

### **Technologies Documentation:**
- **Express.js:** https://expressjs.com/
- **Prisma:** https://www.prisma.io/docs
- **Bootstrap:** https://getbootstrap.com/
- **JWT:** https://jwt.io/
- **Font Awesome:** https://fontawesome.com/

---

## 📊 Technology Summary

### **Backend Stack:**
```
Node.js + Express.js + Prisma ORM + SQLite/PostgreSQL
JWT Authentication + bcrypt + Helmet + Rate Limiting
```

### **Frontend Stack:**
```
HTML5 + CSS3 + JavaScript (ES6+)
Bootstrap 5 + Font Awesome 6
Fetch API + Geolocation API + Camera API
```

### **Additional Tools:**
```
ExcelJS + QRCode + Moment.js
Nodemon + Morgan + dotenv
```

---

**Total Technologies Used:** 30+ libraries and frameworks  
**Project Type:** Full-stack web application  
**Architecture:** MVC with RESTful API  
**Database:** Relational (SQLite/PostgreSQL)  
**Authentication:** JWT-based  
**Deployment:** Vercel-ready
