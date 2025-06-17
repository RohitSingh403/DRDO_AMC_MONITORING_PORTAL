# 🛠️ DRDO AMC Monitoring Portal

A full-stack AMC (Annual Maintenance Contract) Monitoring Portal built using **ReactJS**, **Node.js**, **Express**, and **MongoDB** for DRDO IT personnel and administrators to manage daily, weekly, monthly equipment maintenance tasks and reports.

---

## 🔗 Live Demo

**Frontend**: [https://your-frontend.vercel.app](https://your-frontend.vercel.app)  
**Backend**: [https://your-backend.render.com/api](https://your-backend.render.com/api)

---

## 🚀 Tech Stack

| Category      | Technology               |
|---------------|---------------------------|
| Frontend      | ReactJS, Tailwind CSS     |
| Backend       | Node.js, Express.js       |
| Database      | MongoDB + Mongoose        |
| Auth          | JWT Token Authentication  |
| Deployment    | Vercel (Frontend), Render (Backend), MongoDB Atlas |
| API Testing   | Postman / Thunder Client  |

---

## 🔐 Features

- 🔑 Role-based login (Admin / Technician)
- ✅ Task management by frequency: Daily / Weekly / Monthly
- 📋 Remarks, status updates & file uploads
- 📅 Dashboard with pie chart (completion %), progress bars
- 🛎️ Alert system (Green, Orange, Red status)
- 📊 Reports: Date-wise, Month-wise, Task-wise filters
- 📁 Maintenance logs, AMC history, proof screenshots

---

## 🧪 Postman API Endpoints

| Method | Endpoint              | Description                  |
|--------|-----------------------|------------------------------|
| POST   | `/api/auth/login`     | Login with email & password |
| GET    | `/api/tasks`          | Fetch all tasks              |
| POST   | `/api/tasks`          | Create a task                |
| PUT    | `/api/tasks/:id`      | Update status/remarks        |
| GET    | `/api/reports/summary`| Get dashboard metrics        |

---

## 🛠️ Local Development

```bash
# Backend
cd amc-backend
npm install
npm run dev

# Frontend
cd amc-frontend
npm install
npm run dev
