
# 🚀 Shulker Backend
A modular, production-ready Node.js/Express backend for user management, authentication, profile updates, and file handling. Integrates JWT, Google OAuth, secure password reset, Cloudinary media storage, and a modern scalable architecture.

💡 **Made by [Vansh Verma](https://github.com/vansh-000)**  

---

## ✅ Overview

A production-ready **Node.js + Express backend** with modular architecture and scalable APIs for:
- Authentication (JWT + Google OAuth)
- Meetings (create, join, end, schedule, participants)
- File uploads (Cloudinary-based)
- Recording uploads (stream upload)
- Email notifications
- Role-based security & session management

---

## 🛠 Tech Stack

| Category         | Technologies Used |
|------------------|--------------------|
| Backend          | Node.js, Express.js |
| Database         | MongoDB + Mongoose |
| Authentication   | JWT, Google OAuth (Passport.js) |
| File Storage     | Cloudinary + Multer (Memory Storage + Stream Upload) |
| Email Service    | Nodemailer |
| Session          | express-session, cookies |
| Utilities        | dotenv, crypto, streamifier |

---

## 📁 Folder Structure

```
├── .env.sample
├── .gitignore
├── README.md
├── package-lock.json
├── package.json
├── public
    └── user.png
└── src
    ├── app.js
    ├── controllers
        ├── files.controller.js
        ├── meetings.controller.js
        ├── questions.controller.js
        ├── responses.controller.js
        ├── summary.controller.js
        └── user.controller.js
    ├── db
        └── index.js
    ├── middlewares
        ├── auth.middleware.js
        ├── error.middleware.js
        └── multer.middleware.js
    ├── models
        ├── files.model.js
        ├── meetings.model.js
        ├── questions.model.js
        ├── responses.model.js
        ├── summary.model.js
        └── user.model.js
    ├── routes
        ├── files.routes.js
        ├── meetings.routes.js
        ├── questions.routes.js
        ├── responses.routes.js
        ├── summary.routes.js
        └── user.routes.js
    ├── server.js
    └── utils
        ├── ApiError.js
        ├── ApiResponse.js
        ├── FileHelper.js
        ├── asyncHandler.js
        ├── cloudinary.js
        ├── cookiesOptions.js
        ├── passport.js
        ├── sendEmail.js
        └── streamClient.js
```

---

## ⚙️ Setup Guide

```bash
# 1️⃣ Clone repository
git clone https://github.com/vansh-000/Shulker_server.git
cd Shulker_server

# 2️⃣ Install dependencies
npm install

# 3️⃣ Configure environment
cp .env.sample .env  # fill values inside

# 4️⃣ Run server
npm run dev           # or nodemon src/server.js
```

---

## 🔐 Environment Variables (`.env`)

| Key                       | Description                                |
|---------------------------|--------------------------------------------|
| `PORT`                    | Server port                                |
| `FRONTEND_URL`           | React frontend URL                         |
| `BACKEND_URL`            | Backend server URL                         |
| `MONGODB_URI`            | MongoDB connection string                  |
| `ACCESS_TOKEN_SECRET`    | JWT Access Token secret                    |
| `ACCESS_TOKEN_EXPIRY`    | Access Token expiry time                   |
| `REFRESH_TOKEN_SECRET`   | JWT Refresh Token secret                   |
| `REFRESH_TOKEN_EXPIRY`   | Refresh Token expiry time                  |
| `SESSION_SECRET`         | Session encryption secret                  |
| `GOOGLE_CLIENT_ID`       | Google OAuth Client ID                     |
| `GOOGLE_CLIENT_SECRET`   | Google OAuth Client Secret                 |
| `EMAIL_USER`             | Email (SMTP) service user                  |
| `EMAIL_PASS`             | Email (SMTP) service password              |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary cloud name                      |
| `CLOUDINARY_API_KEY`     | Cloudinary API key                         |
| `CLOUDINARY_API_SECRET`  | Cloudinary API secret                      |
| `CLOUDINARY_URL`         | Cloudinary connection URL                  |
| `STREAM_API_KEY`         | Stream API Key (for video/chat)            |
| `STREAM_API_SECRET`      | Stream API Secret                          |
| `NODE_ENV`               | Environment (`development` / `production`) |

---

## 📌 API Routes and Database diagram

### **Database Diagram**
<img width="1426" height="896" alt="Image" src="https://github.com/user-attachments/assets/3105e074-e80b-4923-8f70-fd77298ba728" />

### 👤 **Auth & User Routes**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/users/register` | Register user |
| POST | `/api/v1/users/login` | Login with email/password |
| POST | `/api/v1/users/logout` | Logout user |
| POST | `/api/v1/users/refresh-token` | Refresh token |
| GET | `/api/v1/users/current-user` | Get logged-in user |
| POST | `/api/v1/users/forgot-password` | Send reset email |
| POST | `/api/v1/users/reset-password/:token` | Reset password |
| POST | `/api/v1/users/update-avatar` | Upload profile picture |
| POST | `/api/v1/users/change-password` | Change existing password |

---

### 📅 **Meeting Routes**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/meetings/create` | Create instant meeting |
| POST | `/api/v1/meetings/schedule` | Schedule meeting |
| POST | `/api/v1/meetings/join` | Join meeting |
| POST | `/api/v1/meetings/leave` | Leave meeting |
| POST | `/api/v1/meetings/end` | End meeting |
| GET | `/api/v1/meetings/user/:userId` | Get user’s meetings |
| POST | `/api/v1/meetings/add-participants` | Invite users via email |
| POST | `/api/v1/meetings/accept-invite` | Accept invitation |

---

### 🎥 **Recordings API**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/meetings/add-recording` | Upload meeting recording (Cloudinary) |
| GET | `/api/v1/meetings/recordings/:meetingId` | Get recordings by meeting |
| GET | `/api/v1/meetings/recordings` | Get all recordings |

---

### 📁 **File Uploads API**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/meetings/:meetingId/files` | Upload a file to meeting |
| GET | `/api/v1/meetings/:meetingId/files` | Get all files in meeting |
| GET | `/api/v1/files/:fileId` | Get single file details |
| DELETE | `/api/v1/files/:fileId` | Delete file from Cloudinary + DB |

---

### ❓ **Questions & Responses**

| Category | Method | Endpoint | Description |
|----------|--------|----------|-------------|
| Questions | POST | `/api/v1/meetings/:meetingId/questions` | Add questions |
|           | GET | `/api/v1/meetings/:meetingId/questions` | Get meeting questions |
| Responses | POST | `/api/v1/response/:meetingId/responses` | Submit response |
|           | GET | `/api/v1/response/:meetingId/responses` | View all responses |

---

### 📝 **Meeting Summaries**

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/summary/generate` | Generate AI summary |
| GET | `/api/v1/summary/meeting/:meetingId` | Get summary by meeting |

---

## 🤝 Contributing

1. Fork the repository  
2. Create a new branch (`feature/new-feature`)  
3. Commit changes & push  
4. Open a PR 🎉

---

## ⭐ Acknowledgements

- Inspired by VConnect  
- Built by a passionate team  
- Cloud-powered with MongoDB & Cloudinary  

---

*Powered by Node.js, built for Shulker — the collaborative v2 evolution of VConnect.*
