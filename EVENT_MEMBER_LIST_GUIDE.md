# Event/Member List - Public Access Website

## 🌐 Public Website for Everyone!

A publicly accessible page where anyone can view events and members without logging in!

---

## ✨ Features

### **1. Event List** 📅
- View all upcoming and past events
- See event details (date, time, location, description)
- Check attendance count and capacity
- **Admin CRUD:** Add, Edit, Delete events

### **2. Member List** 👥
- View all registered MSA members
- Search members by name, email, roll no, or department
- View detailed member profiles
- See academic information, MSA team, contact details

### **3. Public Access** 🔓
- **No login required** to view lists
- Anyone can open on their device
- Mobile-friendly responsive design
- Real-time data

---

## 🔗 Access the Page

### **URL:**
```
http://localhost:3001/list.html
```

### **Navigation:**
Available in navbar on all pages:
- Home → Event/Member List
- Dashboard → Event/Member List
- Scan QR → Event/Member List
- Admin → Event/Member List

---

## 📋 Event List Features

### **What Everyone Can See:**
✅ Event name
✅ Date and time
✅ Location
✅ Description
✅ Attendance count
✅ Capacity (if set)
✅ Status badge (Upcoming/Past)

### **What Admins Can Do:**
✅ **Add Event** - Create new events
✅ **Edit Event** - Modify event details
✅ **Delete Event** - Remove events
✅ All fields: Name, Date/Time, Location, Description, Capacity

### **Event Card Example:**
```
┌─────────────────────────────────────────┐
│ 📅 MSA General Meeting [Upcoming]      │
│ 🕐 Oct 25, 2025, 2:00 PM               │
│ 📍 Room 301, Main Building              │
│ Mathematics and Statistics topics...    │
│ 👥 Attendance: 45/100                   │
│                                          │
│ [Edit] [Delete] ← Admin only            │
└─────────────────────────────────────────┘
```

---

## 👥 Member List Features

### **What Everyone Can See:**
✅ Member name
✅ Roll number
✅ Email address
✅ Contact number
✅ Class (Year + Stream)
✅ Department
✅ MSA Team
✅ Role (Admin/Member badge)

### **Search Functionality:**
- Search by name
- Search by email
- Search by roll number
- Search by department
- Real-time filtering

### **View Details:**
Click "View" button to see:
- Personal Information (Name, Email, Phone, Gender, DOB)
- Academic Information (Roll No, Stream, Year, Division, Department)
- MSA & Institution (Team, Admission No, MES ID)
- Account Information (Role, Registration date)

### **Member Card Example:**
```
┌─────────────────────────────────────────┐
│ 👤 Rahul Sharma [Admin]                │
│                                          │
│ 🆔 Roll No: 2024001                     │
│ 📧 Email: rahul@example.com             │
│ 📞 Contact: 9876543210                  │
│                                          │
│ 🎓 Class: FY Science                    │
│ 🏢 Department: Mathematics              │
│ 👥 MSA Team: Core Team                  │
│                                          │
│                            [View] ←      │
└─────────────────────────────────────────┘
```

---

## 🔧 Technical Details

### **Files Created:**

1. **`src/public/list.html`**
   - Main page with tabs for Events and Members
   - Bootstrap modals for CRUD operations
   - Responsive design

2. **`src/public/js/list.js`**
   - Event CRUD operations
   - Member list display
   - Search functionality
   - Modal management

3. **`src/routes/users.js`**
   - Public API route for member list

4. **`src/controllers/userController.js`**
   - Controller for fetching user list
   - Excludes sensitive data (passwords)

5. **`src/app.js`**
   - Added `/api/users` route

### **API Endpoints:**

#### **Get All Events (Public)**
```
GET /api/events
Response: List of all events with attendance count
```

#### **Get All Members (Public)**
```
GET /api/users/list
Response: List of all members (no sensitive data)
```

#### **Create Event (Admin Only)**
```
POST /api/events
Body: { name, date, location, description, capacity }
Auth: Required (Admin)
```

#### **Update Event (Admin Only)**
```
PUT /api/events/:id
Body: { name, date, location, description, capacity }
Auth: Required (Admin)
```

#### **Delete Event (Admin Only)**
```
DELETE /api/events/:id
Auth: Required (Admin)
```

---

## 🎯 Use Cases

### **For Students:**
1. Check upcoming MSA events
2. See event details and timings
3. Find contact information of MSA members
4. Search for specific members
5. View MSA team structure

### **For Admins:**
1. Manage events (Add/Edit/Delete)
2. Update event information
3. Set event capacity
4. Monitor member list
5. View member details

### **For Public:**
1. Anyone can view events
2. Anyone can see member list
3. No login required
4. Share URL with others
5. Access from any device

---

## 📱 Mobile Friendly

- Responsive design
- Works on phones, tablets, desktops
- Touch-friendly buttons
- Optimized for small screens
- Fast loading

---

## 🔒 Security & Privacy

### **What's Public:**
✅ Event information
✅ Member names and contact info
✅ Academic information
✅ MSA team assignments

### **What's Protected:**
❌ Passwords (never exposed)
❌ Event creation (Admin only)
❌ Event editing (Admin only)
❌ Event deletion (Admin only)

### **Data Exposed:**
- Name, Email, Phone (contact info)
- Roll No, Stream, Year, Division (academic)
- Department, MSA Team (organizational)
- Gender, DOB (optional personal)
- Admission No, MES ID (institutional)

**Note:** All data shown is already provided by members during registration.

---

## 🎨 User Interface

### **Tabs:**
```
┌─────────────────────────────────────┐
│ [Events] [Members]                  │
├─────────────────────────────────────┤
│                                     │
│  Content based on selected tab      │
│                                     │
└─────────────────────────────────────┘
```

### **Colors:**
- Primary: Purple gradient (#667eea to #764ba2)
- Success: Green badges for upcoming events
- Danger: Red badges for admin role
- Secondary: Gray badges for past events

---

## 🚀 How to Use

### **As a Visitor (No Login):**
1. Go to: http://localhost:3001/list.html
2. Click "Events" tab to see events
3. Click "Members" tab to see members
4. Use search box to find specific members
5. Click "View" to see member details

### **As an Admin:**
1. Login to the system
2. Go to Event/Member List page
3. Click "Add Event" button (visible to admins only)
4. Fill in event details
5. Click "Save Event"
6. Edit or delete events using buttons on event cards

---

## 📊 Statistics

### **Events Tab Shows:**
- Total number of events
- Upcoming vs Past events
- Attendance for each event
- Capacity utilization

### **Members Tab Shows:**
- Total number of members
- Admin count (red badges)
- Regular members
- MSA team distribution

---

## 🌟 Benefits

1. **Transparency:** Everyone can see events and members
2. **Accessibility:** No login barrier for viewing
3. **Convenience:** Easy to share with others
4. **Mobile-Ready:** Access from any device
5. **Real-Time:** Always up-to-date information
6. **Searchable:** Find members quickly
7. **Organized:** Clear tabs and categories
8. **Professional:** Clean, modern design

---

## 🔄 Updates

### **Auto-Refresh:**
- Data loads when page opens
- Refresh when switching tabs
- Updates after CRUD operations

### **Real-Time:**
- Events show current attendance
- Member list shows latest registrations
- Status badges update automatically

---

## 📞 Sharing

### **Share the Link:**
```
http://localhost:3001/list.html
```

### **Or Share QR Code:**
Generate QR code for the URL and share it!

### **Access Methods:**
- Direct URL
- Navigation menu
- Home page link
- Mobile browser
- Desktop browser

---

## ✅ Testing Checklist

### **As Visitor:**
- [ ] Open list.html without login
- [ ] See events list
- [ ] See members list
- [ ] Search for members
- [ ] View member details
- [ ] Check mobile responsiveness

### **As Admin:**
- [ ] Login as admin
- [ ] See "Add Event" button
- [ ] Create new event
- [ ] Edit existing event
- [ ] Delete event
- [ ] Verify changes appear immediately

---

## 🎉 Summary

**Event/Member List is now a public website that anyone can access!**

### **Key Features:**
✅ Public access (no login required)
✅ Event list with full details
✅ Member list with search
✅ Admin CRUD for events
✅ Mobile-friendly design
✅ Real-time updates
✅ Professional UI

### **URL:**
http://localhost:3001/list.html

**Share this link with everyone in your association!** 🚀
