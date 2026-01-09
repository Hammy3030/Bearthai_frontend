# BearThai Frontend - Web CAI ภาษาไทย ป.1

Frontend สำหรับระบบ Web CAI ภาษาไทย ป.1 สร้างด้วย React + Vite

## 📋 สารบัญ

- [คุณสมบัติ](#คุณสมบัติ)
- [ความต้องการของระบบ](#ความต้องการของระบบ)
- [การติดตั้ง](#การติดตั้ง)
- [การตั้งค่า](#การตั้งค่า)
- [การใช้งาน](#การใช้งาน)
- [โครงสร้างโปรเจค](#โครงสร้างโปรเจค)
- [การ Deploy](#การ-deploy)
- [Troubleshooting](#troubleshooting)

## ✨ คุณสมบัติ

### สำหรับครู (Teacher)
- 📚 จัดการห้องเรียน (สร้าง, แก้ไข, ลบ)
- 👥 สร้างและจัดการนักเรียน (สร้างหลายคนพร้อมกัน, สร้างได้แม้ไม่มีห้องเรียน)
- 📖 สร้างบทเรียนอัตโนมัติ
- 📝 สร้างแบบทดสอบและเกมอัตโนมัติ
- 📊 ดูสถิติและกราฟ
- 🔍 ค้นหาและกรองนักเรียน (Pagination, Search, Filter)
- 📈 Dashboard พร้อมกราฟแท่ง

### สำหรับนักเรียน (Student)
- 📖 เรียนบทเรียน CAI แบบ Interactive
- 🎮 เล่นเกมทบทวนความรู้
- 📝 ทำแบบทดสอบ (Pre-test, Post-test, Practice)
- 📊 ดูความคืบหน้าและคะแนน
- 🔔 รับการแจ้งเตือน
- 🎯 ระบบปลดล็อกตามลำดับ (Pre-test → เรียน → Post-test → เกม)
- 🔊 Text-to-Speech (อ่านช้าเหมาะสำหรับเด็ก)

## 🛠️ ความต้องการของระบบ

- **Node.js** >= 16.x
- **npm** >= 8.x หรือ **yarn** >= 1.x
- **Backend API** ต้องรันอยู่ที่ `http://localhost:3000` (หรือตามที่ตั้งค่าใน `.env`)

## 📦 การติดตั้ง

### 1. Clone Repository

```bash
git clone <repository-url>
cd ThaiFun_Learn
```

### 2. ติดตั้ง Dependencies

```bash
npm install
```

หรือ

```bash
yarn install
```

## ⚙️ การตั้งค่า

### 1. สร้างไฟล์ `.env`

```bash
# Windows PowerShell
Copy-Item env.example .env

# Mac/Linux
cp env.example .env
```

### 2. แก้ไขไฟล์ `.env`

เปิดไฟล์ `.env` และตั้งค่าตามนี้:

```env
# API Configuration (Required)
VITE_API_URL=http://localhost:3000

# Firebase Configuration (ถ้าใช้ Firebase)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id

# App Configuration
VITE_APP_NAME=BearThai
VITE_APP_VERSION=1.0.0
NODE_ENV=development
```

**สำคัญ:** ต้องแน่ใจว่า Backend API รันอยู่ที่ `VITE_API_URL` ที่ตั้งค่าไว้

## 🚀 การใช้งาน

### Development Mode

```bash
npm run dev
```

หรือ

```bash
yarn dev
```

แอปจะรันที่ `http://localhost:5173`

### Build สำหรับ Production

```bash
npm run build
```

ไฟล์ที่ build จะอยู่ในโฟลเดอร์ `dist/`

### Preview Production Build

```bash
npm run preview
```

### Lint Code

```bash
npm run lint
```

## 📁 โครงสร้างโปรเจค

```
ThaiFun_Learn/
├── src/
│   ├── components/          # React Components
│   │   ├── teacher/        # Components สำหรับครู
│   │   └── student/        # Components สำหรับนักเรียน
│   ├── contexts/           # React Contexts (Auth, Socket)
│   ├── pages/              # Page Components
│   │   ├── teacher/        # หน้าสำหรับครู
│   │   │   ├── TeacherDashboard.jsx
│   │   │   ├── ClassroomPage.jsx
│   │   │   └── CreateStudentPage.jsx
│   │   └── student/        # หน้าสำหรับนักเรียน
│   │       ├── MockStudentDashboard.jsx
│   │       ├── LessonDetailPage.jsx
│   │       ├── KidFriendlyLessonPage.jsx
│   │       └── MockTestPage.jsx
│   ├── services/           # API Services
│   ├── utils/              # Utility Functions
│   │   └── speechHelper.js # Text-to-Speech Helper
│   ├── App.jsx             # Main App Component
│   └── main.jsx            # Entry Point
├── public/                 # Static Files
├── package.json
├── vite.config.js          # Vite Configuration
├── tailwind.config.js      # Tailwind CSS Configuration
└── .env                    # Environment Variables (ไม่ commit)
```

## 🎨 เทคโนโลยีที่ใช้

- **React 18** - UI Library
- **Vite** - Build Tool
- **React Router** - Routing
- **Framer Motion** - Animations
- **Tailwind CSS** - Styling
- **React Query** - Data Fetching & Caching
- **React Hook Form** - Form Management
- **Axios** - HTTP Client
- **Lucide React** - Icons
- **QRCode React** - QR Code Generation
- **React Hot Toast** - Notifications
- **Web Speech API** - Text-to-Speech

## 🔐 Authentication Flow

1. **Login** - เข้าสู่ระบบด้วยอีเมล/รหัสผ่าน หรือ QR Code
2. **Token Storage** - JWT Token เก็บใน `localStorage`
3. **Protected Routes** - Routes ที่ต้อง login จะตรวจสอบ token
4. **Auto Logout** - Logout อัตโนมัติเมื่อ token หมดอายุ

## 📱 Responsive Design

แอปรองรับทุกขนาดหน้าจอ:
- 📱 Mobile (< 768px)
- 📱 Tablet (768px - 1024px)
- 💻 Desktop (> 1024px)

## 🔊 Text-to-Speech

ใช้ Web Speech API สำหรับอ่านข้อความ:
- อ่านช้า (rate: 0.5) เหมาะสำหรับเด็ก
- รองรับภาษาไทย
- สามารถหยุดการอ่านได้

## 🎯 Features หลัก

### 1. ระบบปลดล็อก (Unlock System)
- ต้องทำ Pre-test ก่อนเรียน
- เรียนจบแล้วปลดล็อก Post-test
- ทำ Post-test เสร็จแล้วปลดล็อกเกม

### 2. การจัดการนักเรียน
- สร้างนักเรียนหลายคนพร้อมกัน
- สร้างได้แม้ไม่มีห้องเรียน
- ค้นหาและกรองนักเรียน
- Pagination

### 3. Dashboard
- แสดงสถิติภาพรวม
- กราฟแท่งแสดงข้อมูล
- แสดงความคืบหน้า

### 4. การแจ้งเตือน
- แสดงการแจ้งเตือนแบบ Real-time
- Badge แสดงจำนวน unread
- Mark as read เมื่อกดดู

## 🚀 การ Deploy

### Deploy บน Vercel

1. **ติดตั้ง Vercel CLI** (ถ้ายังไม่มี)
```bash
npm i -g vercel
```

2. **Login Vercel**
```bash
vercel login
```

3. **Deploy**
```bash
vercel
```

4. **ตั้งค่า Environment Variables** ใน Vercel Dashboard:
   - `VITE_API_URL` - URL ของ Backend API
   - `VITE_FIREBASE_API_KEY` - Firebase API Key (ถ้าใช้)
   - และอื่นๆ ตามที่ต้องการ

### Deploy บน Netlify

1. **Build Project**
```bash
npm run build
```

2. **Deploy folder `dist/`** ไปยัง Netlify

3. **ตั้งค่า Environment Variables** ใน Netlify Dashboard

## 🐛 Troubleshooting

### ปัญหา: Cannot connect to API

**แก้ไข:**
1. ตรวจสอบว่า Backend API รันอยู่ที่ `http://localhost:3000`
2. ตรวจสอบ `VITE_API_URL` ในไฟล์ `.env`
3. ตรวจสอบ CORS settings ใน Backend

### ปัญหา: Speech API ไม่ทำงาน

**แก้ไข:**
1. ตรวจสอบว่า Browser รองรับ Web Speech API
2. ใช้ HTTPS หรือ localhost (HTTP ทำงานได้เฉพาะ localhost)
3. ตรวจสอบ Browser Permissions

### ปัญหา: Build Error

**แก้ไข:**
1. ลบ `node_modules` และ `package-lock.json`
2. รัน `npm install` ใหม่
3. ตรวจสอบ Node.js version (ต้อง >= 16.x)

### ปัญหา: Page Not Found

**แก้ไข:**
1. ตรวจสอบว่าใช้ `react-router-dom` ถูกต้อง
2. ตรวจสอบ Routes ใน `App.jsx`
3. ตรวจสอบว่าใช้ `BrowserRouter` หรือ `HashRouter`

## 📚 เอกสารเพิ่มเติม

- [Vite Documentation](https://vitejs.dev/)
- [React Documentation](https://react.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

ISC

## 👥 Authors

BearThai Team

## 📞 Support

หากมีปัญหาหรือข้อสงสัย กรุณาติดต่อทีมพัฒนา

---

**Happy Coding! 🚀**
