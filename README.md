# 🎓 Smart Attendance System

A comprehensive attendance tracking system that combines QR code scanning with GPS-based location verification, user authentication, and advanced analytics for secure and accurate attendance management.

![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)
![License](https://img.shields.io/badge/license-ISC-yellow.svg)

## ✨ Features

### Core Features
- 🔐 **User Authentication & Authorization** - Secure login/register with JWT tokens
- 📱 **QR Code Generation & Scanning** - Dynamic QR codes for each event
- 📍 **GPS Location Verification** - Ensure attendance within specified radius
- 👥 **Role-Based Access Control** - Admin and User roles with different permissions
- 📊 **Real-time Dashboard** - Statistics and analytics for events and attendance
- 📈 **Event Management** - Create, update, delete, and manage events
- 📋 **Attendance Tracking** - Mark and view attendance with detailed records

### Advanced Features
- 📥 **Excel Export** - Download attendance reports in Excel format
- 🔍 **Search & Filter** - Advanced filtering for attendance records
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🔒 **Security Features** - Rate limiting, helmet security headers, input validation
- 📧 **Email Notifications** - (Ready for integration)
- 🎨 **Modern UI/UX** - Beautiful gradient designs and smooth animations

## 🛠️ Tech Stack

### Frontend
- HTML5, CSS3, JavaScript (Vanilla)
- Bootstrap 5 - UI Framework
- Font Awesome - Icons
- html5-qrcode.js - QR Code Scanning

### Backend
- Node.js & Express.js - Server Framework
- Prisma ORM - Database Management
- SQLite - Database
- JWT - Authentication
- bcryptjs - Password Hashing
- ExcelJS - Excel Export
- Helmet - Security Headers
- Morgan - Logging
- Express Rate Limit - API Protection

## 📦 Installation

### Prerequisites
- Node.js >= 14.0.0
- npm or yarn

### Quick Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FINALYRPROJ
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and update the values:
   ```env
   PORT=3000
   DATABASE_URL="file:./database.sqlite"
   JWT_SECRET=your-super-secret-jwt-key
   NODE_ENV=development
   ```

4. **Setup database**
   ```bash
   npm run setup
   ```
   This will:
   - Generate Prisma Client
   - Run database migrations
   - Seed the database with default users

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Local: http://localhost:3000
   - Login with default credentials:
     - **Admin**: admin@attendance.com / admin123
     - **User**: user@attendance.com / user123

## 📁 Project Structure

```
FINALYRPROJ/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.js            # Database seeding script
├── src/
│   ├── config/
│   │   └── database.js    # Prisma client configuration
│   ├── controllers/
│   │   ├── authController.js       # Authentication logic
│   │   ├── eventController.js      # Event management
│   │   └── attendanceController.js # Attendance logic
│   ├── middleware/
│   │   └── auth.js        # Authentication middleware
│   ├── routes/
│   │   ├── auth.js        # Auth routes
│   │   ├── events.js      # Event routes
│   │   └── attendance.js  # Attendance routes
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css
│   │   ├── js/
│   │   │   ├── auth.js    # Authentication utilities
│   │   │   ├── admin.js   # Admin panel logic
│   │   │   ├── scanner.js # QR scanner logic
│   │   │   └── dashboard.js # Dashboard logic
│   │   ├── index.html     # Home page
│   │   ├── login.html     # Login page
│   │   ├── register.html  # Registration page
│   │   ├── dashboard.html # Dashboard page
│   │   ├── admin.html     # Admin panel
│   │   └── scan.html      # QR scanner page
│   ├── utils/
│   │   └── locationUtils.js # GPS validation utilities
│   └── app.js             # Application entry point
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Environment variables template
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

## 🚀 Available Scripts

```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed database with default data
npm run prisma:seed

# Open Prisma Studio (Database GUI)
npm run prisma:studio

# Complete setup (install + migrate + seed)
npm run setup
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "department": "Computer Science",
  "phone": "+1234567890"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/profile
Authorization: Bearer <token>
```

### Event Endpoints

#### Create Event (Admin)
```http
POST /api/events/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Tech Conference 2024",
  "description": "Annual technology conference",
  "date": "2024-12-01T10:00:00Z",
  "latitude": 12.9716,
  "longitude": 77.5946,
  "radius": 100,
  "venue": "Main Auditorium",
  "capacity": 200
}
```

#### Get All Events
```http
GET /api/events?status=UPCOMING&limit=10
```

#### Get Event Details
```http
GET /api/events/:eventId
```

#### Generate QR Code
```http
GET /api/events/:eventId/qr
Authorization: Bearer <token>
```

#### Export Attendance (Admin)
```http
GET /api/events/:eventId/export
Authorization: Bearer <token>
```

### Attendance Endpoints

#### Mark Attendance
```http
POST /api/attendance/mark
Authorization: Bearer <token>
Content-Type: application/json

{
  "eventId": 1,
  "location": {
    "latitude": 12.9716,
    "longitude": 77.5946
  }
}
```

#### Get Attendance List
```http
GET /api/attendance/list/:eventId?search=john&department=CS
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt with salt rounds
- **Rate Limiting** - Prevents brute force attacks
- **Helmet Security Headers** - Protects against common vulnerabilities
- **Input Validation** - Express-validator for request validation
- **CORS Configuration** - Controlled cross-origin requests
- **SQL Injection Protection** - Prisma ORM parameterized queries

## 🎨 User Interface

### Pages
1. **Login/Register** - Beautiful gradient authentication pages
2. **Dashboard** - Overview with statistics and recent events
3. **Admin Panel** - Event creation and management
4. **QR Scanner** - Camera-based QR code scanning
5. **Profile** - User profile and attendance history

## 🌟 Key Highlights

- ✅ **Production Ready** - Complete error handling and validation
- ✅ **Scalable Architecture** - Clean separation of concerns
- ✅ **Modern Stack** - Latest versions of all dependencies
- ✅ **Well Documented** - Comprehensive code comments
- ✅ **Type Safety** - Prisma schema for type-safe database access
- ✅ **Mobile Responsive** - Works on all device sizes

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 👨‍💻 Author

Developed with ❤️ for efficient attendance management

## 🐛 Known Issues

None at the moment. Please report any issues you find!

## 🔮 Future Enhancements

- [ ] Email notifications for event reminders
- [ ] SMS notifications
- [ ] Biometric authentication
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reports
- [ ] Integration with calendar systems
- [ ] Multi-language support
- [ ] Dark mode

---

**Note**: Remember to change the JWT_SECRET in production and never commit your `.env` file!
