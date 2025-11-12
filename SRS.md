# SOFTWARE REQUIREMENTS SPECIFICATION (SRS)

## MSA Smart Attendance System

**Version**: 2.0  
**Date**: November 2025  
**Prepared By**: Development Team  
**Project**: MSA Smart Attendance System  
**Organization**: Mathematics and Statistics Association (MSA)

---

## TABLE OF CONTENTS

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Features](#3-system-features)
4. [External Interface Requirements](#4-external-interface-requirements)
5. [System Requirements](#5-system-requirements)
6. [Non-Functional Requirements](#6-non-functional-requirements)
7. [Database Requirements](#7-database-requirements)
8. [Appendices](#8-appendices)

---

## 1. INTRODUCTION

### 1.1 Purpose
This Software Requirements Specification (SRS) document provides a complete description of the MSA Smart Attendance System. It details the functional and non-functional requirements, system interfaces, and constraints for the development and implementation of the web-based attendance management system.

### 1.2 Document Conventions
- **User**: Regular student/member who marks attendance
- **Admin**: Administrator with elevated privileges
- **Event**: Any meeting, session, or gathering requiring attendance
- **MES ID**: Unique identifier for each user
- **QR Code**: Quick Response code for attendance marking

### 1.3 Intended Audience
- Project Managers
- Developers and Programmers
- Testers and QA Team
- System Administrators
- End Users (Students and Administrators)
- Project Reviewers and Stakeholders

### 1.4 Project Scope
The MSA Smart Attendance System is designed to:
- Automate attendance tracking for educational institutions
- Provide real-time attendance monitoring and reporting
- Enable efficient user and event management
- Generate comprehensive reports and analytics
- Ensure secure authentication and data management

### 1.5 References
- IEEE Standard 830-1998 for SRS
- Node.js Documentation
- Express.js Documentation
- Prisma ORM Documentation
- Bootstrap 5 Documentation

---

## 2. OVERALL DESCRIPTION

### 2.1 Product Perspective
The MSA Smart Attendance System is a standalone web application that operates independently while integrating with modern web browsers and database systems. The system consists of:
- Web-based frontend interface
- RESTful API backend
- Database management system
- QR code generation and scanning modules

### 2.2 Product Functions
Major functions include:
- User authentication and authorization
- QR code-based attendance marking
- Event creation and management
- Real-time attendance tracking
- Report generation and export
- User management and password reset
- Defaulter list generation

### 2.3 User Classes and Characteristics

#### 2.3.1 Regular Users (Students/Members)
- **Technical Expertise**: Basic web browsing skills
- **Frequency of Use**: Daily/Weekly
- **Primary Functions**: Mark attendance, view history, manage profile

#### 2.3.2 Administrators
- **Technical Expertise**: Moderate to advanced
- **Frequency of Use**: Daily
- **Primary Functions**: Manage events, users, generate reports, reset passwords

### 2.4 Operating Environment
- **Client-side**: Modern web browsers (Chrome, Firefox, Safari, Edge)
- **Server-side**: Node.js runtime environment
- **Database**: PostgreSQL or SQLite
- **Hosting**: Cloud platform (Vercel)
- **Devices**: Desktop computers, tablets, smartphones

### 2.5 Design and Implementation Constraints
- Must use HTTPS for secure communication
- Must comply with data protection regulations
- Must support responsive design for mobile devices
- Must handle concurrent users efficiently
- Database must support ACID properties

### 2.6 Assumptions and Dependencies
- Users have access to internet-connected devices
- Users have modern web browsers
- Institution provides necessary infrastructure
- QR code scanning requires camera access
- Email service for notifications (future enhancement)

---

## 3. SYSTEM FEATURES

### 3.1 User Authentication

#### 3.1.1 Description
Secure user registration and login system using MES ID and password.

#### 3.1.2 Functional Requirements

**FR-AUTH-001**: System shall allow new users to register with required details
- Input: Email, password, name, MES ID, roll number, department, year, division
- Validation: Email format, password minimum 6 characters, unique MES ID
- Output: User account creation and JWT token

**FR-AUTH-002**: System shall authenticate users using MES ID and password
- Input: MES ID, password
- Process: Verify credentials against database
- Output: JWT token with 7-day expiry

**FR-AUTH-003**: System shall maintain user sessions using JWT tokens
- Token storage in localStorage/sessionStorage
- Automatic token validation on protected routes

**FR-AUTH-004**: System shall allow users to change their password
- Input: Current password, new password
- Validation: Current password verification, new password minimum 6 characters
- Output: Updated password hash in database

**FR-AUTH-005**: System shall prevent duplicate registrations
- Check for existing email, MES ID, roll number, admission number
- Return appropriate error messages

### 3.2 Attendance Management

#### 3.2.1 Description
QR code-based attendance marking and tracking system.

#### 3.2.2 Functional Requirements

**FR-ATT-001**: System shall generate unique QR codes for each event
- QR code contains event ID and validation token
- QR code displayed on event details page

**FR-ATT-002**: System shall allow users to scan QR codes to mark attendance
- Camera access for QR scanning
- Validation of event ID and timing
- Prevent duplicate attendance marking

**FR-ATT-003**: System shall record attendance with timestamp
- Store user ID, event ID, and marking time
- Capture IP address and user agent (optional)

**FR-ATT-004**: System shall display attendance status in real-time
- Show "Present" or "Absent" status
- Update attendance count dynamically

**FR-ATT-005**: System shall allow users to view their attendance history
- List all events attended
- Show event details and attendance timestamp
- Sort by most recent first

### 3.3 Event Management

#### 3.3.1 Description
Complete event lifecycle management for administrators.

#### 3.3.2 Functional Requirements

**FR-EVENT-001**: System shall allow admins to create new events
- Input: Event name, date, time, venue, description, type
- Validation: Required fields, valid date format
- Output: Event created with unique ID

**FR-EVENT-002**: System shall allow admins to edit existing events
- Update event details
- Prevent editing past events (optional)

**FR-EVENT-003**: System shall allow admins to delete events
- Soft delete or hard delete option
- Cascade delete related attendance records

**FR-EVENT-004**: System shall display list of all events
- Show event details: name, date, venue, attendance count
- Filter by date, type, status
- Sort by date (ascending/descending)

**FR-EVENT-005**: System shall show event-specific attendance details
- List of attendees with user details
- Attendance percentage
- Export functionality

### 3.4 User Management (Admin)

#### 3.4.1 Description
Comprehensive user management system for administrators.

#### 3.4.2 Functional Requirements

**FR-USER-001**: System shall display list of all registered users
- Show user details: name, email, MES ID, role, department, year
- Display attendance count per user
- Sort by role, year, roll number

**FR-USER-002**: System shall provide search functionality
- Search by name, email, roll number, MES ID
- Case-insensitive search
- Real-time search results

**FR-USER-003**: System shall provide filter functionality
- Filter by role (User/Admin)
- Filter by year (FY/SY/TY)
- Filter by department
- Multiple filters can be applied simultaneously

**FR-USER-004**: System shall allow admins to reset user passwords
- Two methods: Generate temporary password or set custom password
- Temporary password format: MSA + identifier + 4 random digits
- Custom password minimum 6 characters

**FR-USER-005**: System shall prevent admins from resetting other admin passwords
- Security measure to prevent privilege escalation
- Admins can only reset their own password

**FR-USER-006**: System shall display generated temporary password to admin
- Copy to clipboard functionality
- Password shown only once for security

### 3.5 Reporting System

#### 3.5.1 Description
Comprehensive reporting and analytics system.

#### 3.5.2 Functional Requirements

**FR-REPORT-001**: System shall generate monthly attendance reports
- Input: Month and year selection
- Output: Excel file with all events and attendance
- Include user details and attendance status

**FR-REPORT-002**: System shall generate event-wise attendance reports
- Export attendee list for specific event
- Include user details: roll no, name, year, division, department

**FR-REPORT-003**: System shall generate defaulter lists
- Show users who did not attend specific event
- Filter by year, division, department
- Export to Excel with year-wise segregation

**FR-REPORT-004**: System shall format Excel reports professionally
- Bold headers
- Year section headers (FY, SY, TY)
- Auto-fit column widths
- Proper alignment

**FR-REPORT-005**: System shall include summary statistics in reports
- Total registered users
- Total attended
- Total absent
- Attendance percentage

### 3.6 Defaulter Management

#### 3.6.1 Description
System to identify and track members who missed events.

#### 3.6.2 Functional Requirements

**FR-DEFAULT-001**: System shall identify defaulters for each event
- Compare registered users with attendees
- Exclude admin users from defaulter list
- Show only regular users who were absent

**FR-DEFAULT-002**: System shall display defaulter list in modal
- Show user details: roll no, name, year, division, department, team, contact
- Real-time count of defaulters

**FR-DEFAULT-003**: System shall provide filter options for defaulters
- Filter by year (FY/SY/TY)
- Filter by division (A/B/C)
- Filter by department
- Filters update list in real-time

**FR-DEFAULT-004**: System shall allow export of defaulter list
- Export to Excel format
- Segregate by year sections
- Include all user details

### 3.7 Profile Management

#### 3.7.1 Description
User profile viewing and editing functionality.

#### 3.7.2 Functional Requirements

**FR-PROFILE-001**: System shall display user profile information
- Show all user details
- Display attendance statistics

**FR-PROFILE-002**: System shall allow users to update profile
- Update name, email, phone, department
- Validate email uniqueness
- Update MES ID (optional)

**FR-PROFILE-003**: System shall allow password change
- Verify current password
- Validate new password strength
- Update password hash

---

## 4. EXTERNAL INTERFACE REQUIREMENTS

### 4.1 User Interfaces

#### 4.1.1 General UI Requirements
- **Responsive Design**: Must work on devices from 320px to 4K displays
- **Color Scheme**: Professional color palette with primary blue theme
- **Typography**: Clear, readable fonts (system fonts)
- **Icons**: Font Awesome icons for visual clarity
- **Navigation**: Intuitive navigation bar with role-based menu items

#### 4.1.2 Specific Page Requirements

**Login Page**
- MES ID input field
- Password input field (masked)
- "Remember Me" checkbox
- Login button
- Link to registration page

**Registration Page**
- Form with all required fields
- Real-time validation
- Password strength indicator
- Submit button
- Link to login page

**Dashboard (User)**
- Welcome message with user name
- Quick stats (total events, attended events)
- Recent events list
- Quick attendance marking option

**Admin Panel**
- Event management section
- User management button
- Monthly report generation
- Statistics overview

**User Management Page**
- Search bar
- Filter dropdowns
- User cards with details
- Reset password button per user

**Event Details Page**
- Event information display
- QR code for attendance
- Attendee list
- Defaulter list button
- Export options

### 4.2 Hardware Interfaces
- **Camera**: For QR code scanning (mobile devices)
- **Display**: Minimum 320px width support
- **Input Devices**: Keyboard, mouse, touchscreen

### 4.3 Software Interfaces

#### 4.3.1 Database Interface
- **System**: PostgreSQL 12+ or SQLite 3+
- **ORM**: Prisma Client
- **Connection**: Connection pooling for performance
- **Transactions**: ACID compliance

#### 4.3.2 External Libraries
- **bcryptjs**: Password hashing (v2.4.3+)
- **jsonwebtoken**: JWT token generation (v9.0.0+)
- **ExcelJS**: Excel file generation (v4.3.0+)
- **express**: Web framework (v4.18.0+)
- **Bootstrap**: UI framework (v5.1.3+)

### 4.4 Communication Interfaces
- **Protocol**: HTTPS for secure communication
- **API**: RESTful API architecture
- **Data Format**: JSON for request/response
- **Authentication**: Bearer token in Authorization header

---

## 5. SYSTEM REQUIREMENTS

### 5.1 Functional Requirements Summary

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-001 | User registration and authentication | High |
| FR-002 | QR code generation and scanning | High |
| FR-003 | Attendance marking and tracking | High |
| FR-004 | Event creation and management | High |
| FR-005 | User management | High |
| FR-006 | Password reset functionality | High |
| FR-007 | Report generation | Medium |
| FR-008 | Defaulter list generation | Medium |
| FR-009 | Excel export functionality | Medium |
| FR-010 | Profile management | Low |

### 5.2 Use Cases

#### Use Case 1: Mark Attendance
**Actor**: User  
**Precondition**: User is logged in, event exists  
**Main Flow**:
1. User navigates to event page
2. User scans QR code using camera
3. System validates QR code
4. System marks attendance
5. System displays success message

**Alternate Flow**:
- QR code invalid: Display error message
- Already marked: Display "Already marked" message
- Event not active: Display "Event not available" message

#### Use Case 2: Generate Monthly Report
**Actor**: Admin  
**Precondition**: Admin is logged in  
**Main Flow**:
1. Admin clicks "Monthly Report" button
2. System displays month/year selection modal
3. Admin selects month and year
4. Admin clicks "Generate Report"
5. System generates Excel file
6. System downloads file to admin's device

**Alternate Flow**:
- No data for selected month: Display "No data" message

#### Use Case 3: Reset User Password
**Actor**: Admin  
**Precondition**: Admin is logged in, user exists  
**Main Flow**:
1. Admin navigates to User Management page
2. Admin clicks "Reset Password" for a user
3. System displays reset options modal
4. Admin chooses "Generate Temporary Password"
5. System generates and displays temporary password
6. Admin copies password
7. Admin shares password with user

**Alternate Flow**:
- Admin chooses "Set Custom Password"
- Admin enters new password
- System validates and updates password

---

## 6. NON-FUNCTIONAL REQUIREMENTS

### 6.1 Performance Requirements

**NFR-PERF-001**: Response Time
- Page load time: < 3 seconds on standard broadband
- API response time: < 500ms for 95% of requests
- QR code generation: < 1 second
- Report generation: < 10 seconds for monthly reports

**NFR-PERF-002**: Scalability
- Support minimum 500 concurrent users
- Handle 10,000+ user records
- Process 1,000+ attendance marks per event

**NFR-PERF-003**: Database Performance
- Query execution time: < 100ms for simple queries
- Complex queries (reports): < 2 seconds
- Database connection pooling for efficiency

### 6.2 Security Requirements

**NFR-SEC-001**: Authentication
- Passwords hashed using bcrypt (10 salt rounds)
- JWT tokens with 7-day expiry
- Secure token storage (httpOnly cookies recommended)

**NFR-SEC-002**: Authorization
- Role-based access control (RBAC)
- Admin-only routes protected by middleware
- User can only access own data

**NFR-SEC-003**: Data Protection
- HTTPS for all communications
- SQL injection prevention (Prisma ORM)
- XSS protection (input sanitization)
- CSRF protection

**NFR-SEC-004**: Password Policy
- Minimum 6 characters
- Cannot be same as current password
- Hashed before storage

**NFR-SEC-005**: Session Management
- Automatic logout after token expiry
- Secure token transmission
- Token refresh mechanism (future)

### 6.3 Reliability Requirements

**NFR-REL-001**: Availability
- System uptime: 99% (excluding planned maintenance)
- Graceful degradation on component failure
- Error logging for debugging

**NFR-REL-002**: Data Integrity
- ACID compliance for database transactions
- Data validation on client and server side
- Backup and recovery mechanisms

**NFR-REL-003**: Error Handling
- User-friendly error messages
- Detailed error logging for developers
- Automatic retry for transient failures

### 6.4 Usability Requirements

**NFR-USE-001**: User Interface
- Intuitive navigation (max 3 clicks to any feature)
- Consistent design across all pages
- Clear visual feedback for user actions

**NFR-USE-002**: Accessibility
- Keyboard navigation support
- Screen reader compatibility (WCAG 2.1 Level A)
- Sufficient color contrast ratios

**NFR-USE-003**: Learning Curve
- New users should complete first attendance in < 5 minutes
- Admin training required: < 2 hours
- Inline help and tooltips

### 6.5 Maintainability Requirements

**NFR-MAIN-001**: Code Quality
- Modular architecture (MVC pattern)
- Code comments for complex logic
- Consistent coding standards

**NFR-MAIN-002**: Documentation
- API documentation
- Database schema documentation
- User manual and admin guide

**NFR-MAIN-003**: Testability
- Unit tests for critical functions
- Integration tests for API endpoints
- Test coverage > 70%

### 6.6 Portability Requirements

**NFR-PORT-001**: Browser Compatibility
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**NFR-PORT-002**: Device Compatibility
- Desktop (Windows, macOS, Linux)
- Tablets (iOS, Android)
- Smartphones (iOS, Android)

**NFR-PORT-003**: Database Portability
- Support PostgreSQL and SQLite
- Easy migration between databases
- Database-agnostic queries (Prisma)

---

## 7. DATABASE REQUIREMENTS

### 7.1 Database Schema

#### 7.1.1 User Table
```
User {
  id: Integer (Primary Key, Auto-increment)
  email: String (Unique, Required)
  password: String (Required, Hashed)
  name: String (Required)
  role: Enum (USER, ADMIN) (Default: USER)
  department: String
  phone: String
  rollNo: String (Unique)
  stream: String
  year: String (FY, SY, TY)
  division: String (A, B, C)
  msaTeam: String
  gender: String
  dateOfBirth: DateTime
  admissionNumber: String (Unique)
  mesId: String (Unique)
  createdAt: DateTime (Auto)
  updatedAt: DateTime (Auto)
}
```

#### 7.1.2 Event Table
```
Event {
  id: Integer (Primary Key, Auto-increment)
  name: String (Required)
  description: String
  date: DateTime (Required)
  venue: String
  type: String
  createdById: Integer (Foreign Key -> User.id)
  createdAt: DateTime (Auto)
  updatedAt: DateTime (Auto)
}
```

#### 7.1.3 Attendance Table
```
Attendance {
  id: Integer (Primary Key, Auto-increment)
  userId: Integer (Foreign Key -> User.id)
  eventId: Integer (Foreign Key -> Event.id)
  markedAt: DateTime (Auto)
  createdAt: DateTime (Auto)
  
  Unique Constraint: (userId, eventId)
}
```

### 7.2 Relationships
- User has many Attendance records (One-to-Many)
- Event has many Attendance records (One-to-Many)
- User creates many Events (One-to-Many)
- Attendance belongs to User and Event (Many-to-One)

### 7.3 Indexes
- User: email, mesId, rollNo, admissionNumber (Unique indexes)
- Event: date, createdById
- Attendance: userId, eventId, markedAt

### 7.4 Data Validation
- Email: Valid email format
- Password: Minimum 6 characters
- MES ID: Unique, not null
- Roll Number: Unique per user
- Date: Valid date format

---

## 8. APPENDICES

### 8.1 Glossary

| Term | Definition |
|------|------------|
| QR Code | Quick Response code used for attendance marking |
| JWT | JSON Web Token for authentication |
| MES ID | Unique identifier for each user in the institution |
| RBAC | Role-Based Access Control |
| ORM | Object-Relational Mapping |
| API | Application Programming Interface |
| CRUD | Create, Read, Update, Delete operations |
| Defaulter | User who did not attend a specific event |

### 8.2 Acronyms

| Acronym | Full Form |
|---------|-----------|
| SRS | Software Requirements Specification |
| MSA | Mathematics and Statistics Association |
| UI | User Interface |
| UX | User Experience |
| DB | Database |
| FY | First Year |
| SY | Second Year |
| TY | Third Year |
| HTTPS | Hypertext Transfer Protocol Secure |
| REST | Representational State Transfer |

### 8.3 API Endpoints Summary

#### Authentication APIs
- POST `/api/auth/register` - User registration
- POST `/api/auth/login` - User login
- GET `/api/auth/profile` - Get user profile
- PUT `/api/auth/profile` - Update user profile
- POST `/api/auth/change-password` - Change password
- GET `/api/auth/my-attendance` - Get user attendance history

#### Admin User Management APIs
- GET `/api/auth/users` - Get all users (Admin)
- POST `/api/auth/users/:userId/generate-temp-password` - Generate temp password (Admin)
- POST `/api/auth/users/:userId/reset-password` - Reset password (Admin)

#### Event APIs
- GET `/api/events` - Get all events
- POST `/api/events` - Create event (Admin)
- GET `/api/events/:id` - Get event details
- PUT `/api/events/:id` - Update event (Admin)
- DELETE `/api/events/:id` - Delete event (Admin)
- GET `/api/events/:eventId/defaulters` - Get defaulter list (Admin)
- GET `/api/events/:eventId/defaulters/export` - Export defaulters (Admin)

#### Attendance APIs
- POST `/api/attendance/mark` - Mark attendance
- GET `/api/attendance/event/:eventId` - Get event attendance
- GET `/api/attendance/user/:userId` - Get user attendance
- GET `/api/attendance/export/monthly` - Export monthly report (Admin)

### 8.4 Error Codes

| Code | Message | Description |
|------|---------|-------------|
| 200 | Success | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Duplicate entry |
| 500 | Internal Server Error | Server error |

### 8.5 Future Enhancements
1. Mobile application (React Native)
2. Biometric authentication
3. SMS/Email notifications
4. Advanced analytics dashboard
5. Geolocation-based attendance
6. Face recognition integration
7. Multi-language support
8. API for third-party integrations
9. Attendance prediction using ML
10. Parent/Guardian portal

---

**Document Version**: 2.0  
**Last Updated**: November 2025  
**Status**: Approved  
**Next Review Date**: January 2026
