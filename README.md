# Attendance Tracker

A personal attendance tracker web app for **3rd Year Sem – II JNTUA CEA CSE**. Track subject-wise attendance, manage timetables, mark attendance dates, and add absence notes—all with user authentication.

## Features

- **User authentication** – Register and login with JWT (HTTP-only cookie)
- **Subject-wise attendance** – Store total classes and attended classes per subject; view percentage
- **Timetable** – Set weekly time slots and subjects (MON–SAT)
- **Attendance dates** – Mark dates when you were present/absent
- **Absence notes** – Add notes for specific absent dates
- **Profile** – View your profile (name, email)

## Tech Stack

- **Backend:** Node.js, Express (ES modules)
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT, bcryptjs, cookie-parser
- **Frontend:** Static HTML/CSS, Chart.js

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/NIKHILSOURI/Attendance-Tracker.git
   cd Attendance-Tracker
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment variables**

   Create a `.env` file in the project root:

   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/attendance-tracker
   JWT_SECRET=your-secret-key-change-in-production
   ```

   For MongoDB Atlas, use your connection string:

   ```env
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/attendance-tracker
   ```

4. **Run the app**

   ```bash
   npm start
   ```

   Open [http://localhost:3000](http://localhost:3000) (or the `PORT` you set).

## Project Structure

```
Attendance-Tracker/
├── app.js              # Express server, routes, Mongoose models
├── package.json
├── public/             # Static frontend
│   ├── home.html
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── styles.css
│   └── styles/
├── users_schema        # User schema reference
├── attendances_schema  # Attendance schema reference
├── sample_user         # Sample user JSON
└── sample_attendance  # Sample attendance JSON
```

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register (name, email, password) |
| POST | `/api/auth/login` | Login (email, password) |
| GET | `/api/user/profile` | Get profile (auth required) |
| GET/POST | `/api/attendance` | List / save subject attendance |
| GET/POST | `/api/timetable` | Get / save timetable |
| GET/POST/DELETE | `/api/attendance-dates` | List / add / remove attendance dates |
| GET/POST/DELETE | `/api/absence-notes` | List / add / delete absence notes |

Protected routes require a valid JWT in the `Authorization` header or in the `token` cookie.

## License

ISC

---

**JNTUA CEA CSE – 3rd Year Sem II** • [Repository](https://github.com/NIKHILSOURI/Attendance-Tracker)
