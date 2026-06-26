# n8n-ai

แอป Persona Insight Dashboard — React + Vite + Tailwind ที่เชื่อมกับ n8n webhook API
สำหรับวิเคราะห์กลุ่มลูกค้า (cluster/persona), ดูสมาชิก, และแชทกับ AI

---

## 🧰 เทคโนโลยีที่ใช้

- **React 18** + **Vite 5**
- **Tailwind CSS 3**
- **xlsx** (export รายชื่อสมาชิกเป็น Excel)
- Backend: **n8n webhook** (`https://tli0107.candidsandbox.academy/webhook`)

---

## ✅ สิ่งที่ต้องมีก่อน (Prerequisites)

- **Node.js** เวอร์ชัน 18 ขึ้นไป — เช็คด้วย `node -v`
- **npm** (มากับ Node อยู่แล้ว)

---

## 📦 วิธีติดตั้ง (Installation)

```bash
# 1. clone โปรเจกต์
git clone https://github.com/AwaneeMook/n8n-ai.git
cd n8n-ai

# 2. ติดตั้ง dependencies
npm install

# 3. สร้างไฟล์ .env (ดูหัวข้อ Config ด้านล่าง)
cp .env.example .env
```

---

## ⚙️ การตั้งค่า (Configuration)

ไฟล์ `.env` มีตัวแปรเดียว — base URL ของ API:

```env
VITE_API_BASE=https://tli0107.candidsandbox.academy/webhook
```

> ถ้าไม่มี `.env` แอปจะใช้ค่า fallback ที่ฮาร์ดโค้ดไว้ในโค้ด (URL เดียวกัน) ก็ยังรันได้
> ถ้าจะเปลี่ยน backend แค่แก้ค่านี้ที่เดียว ทุกหน้าจะตามทันที

---

## ▶️ วิธีรัน (Run)

```bash
# โหมดพัฒนา (hot reload) — เปิดที่ http://localhost:5173
npm run dev

# build เป็นไฟล์ production (อยู่ในโฟลเดอร์ dist/)
npm run build

# พรีวิว build ที่ทำเสร็จแล้ว
npm run preview
```

---

## 🔐 วิธีตั้ง / เติม User Login

การ login ทำงานผ่าน **n8n webhook** ไม่ได้เก็บ user ไว้ในโค้ดฝั่ง frontend

**Flow:** หน้า Login → ส่ง `POST /login` พร้อม `{ username, password }` → ถ้า backend ตอบ `{ success: true }` ถึงจะเข้าระบบได้

### 1) เพิ่ม/แก้ user (ฝั่ง backend — n8n)

user account ถูกจัดการใน **n8n workflow** ที่รับ webhook `/login`
ไปแก้ที่ workflow นั้น (เช่น เพิ่มรายชื่อใน database / ตรวจ username-password) — ไม่ต้องแก้โค้ดแอป

API ที่ frontend เรียก:

```http
POST https://tli0107.candidsandbox.academy/webhook/login
Content-Type: application/json

{ "username": "...", "password": "..." }
```

ต้องตอบกลับ (อย่างใดอย่างหนึ่งเป็น object หรือ array):

```json
{ "success": true }
```

### 2) เปลี่ยน username เริ่มต้นในช่องกรอก (ฝั่ง frontend)

แก้ที่ [`src/App.jsx`](src/App.jsx):

```js
const [username, setUsername] = useState("9007485"); // ← เปลี่ยนค่า default ตรงนี้
```

### 3) จุดที่เกี่ยวกับ login ในโค้ด

- ตรรกะ login + เก็บสถานะ (sessionStorage): `src/App.jsx` → ฟังก์ชัน `handleLogin`
- ถ้า login ไม่ผ่าน จะแสดง "Username หรือ Password ไม่ถูกต้อง"
- ถ้าเชื่อมต่อ API ไม่ได้ จะแสดง "เชื่อมต่อระบบไม่สำเร็จ กรุณาลองใหม่"

---

## 🗺️ โครงสร้างหน้า (Pages)

| หน้า            | ไฟล์               | หน้าที่                                     |
| --------------- | ------------------ | ------------------------------------------- |
| Login           | `src/App.jsx`      | เข้าสู่ระบบ                                 |
| Main Menu       | `src/MainMenu.jsx` | เลือก persona/cluster                       |
| Detail          | `src/Detail.jsx`   | ข้อมูล persona + ลิสต์สมาชิก + export Excel |
| Chat            | `src/Chat.jsx`     | แชทกับ AI (รายบุคคล / ระดับ persona)        |
| Setting (Admin) | `src/Admin.jsx`    | แก้ค่า attribute ของ persona + แชท          |
| Filter          | `src/Filter.jsx`   | กรองตามอายุ/โซน                             |

---

## 🔌 API Endpoints (base = `VITE_API_BASE`)

| Method | Path              | ใช้ที่                   |
| ------ | ----------------- | ------------------------ |
| POST   | `/login`          | Login                    |
| GET    | `/all_persona`    | Main Menu                |
| GET    | `/zone`           | Filter                   |
| POST   | `/calculate`      | Filter                   |
| POST   | `/persona`        | Detail / Chat / Admin    |
| POST   | `/persona/member` | Detail / Chat            |
| POST   | `/persona/save`   | Admin (บันทึก attribute) |
| POST   | `/chat`           | Chat / Admin             |

---

## 📁 โครงสร้างโปรเจกต์ (ย่อ)

```
src/
├─ App.jsx            # routing + login
├─ MainMenu.jsx
├─ Detail.jsx
├─ Chat.jsx
├─ Admin.jsx          # หน้า Setting
├─ Filter.jsx
├─ index.css          # Tailwind + อนิเมชันปุ่ม AI Coach
└─ data/
   ├─ promptBuilders.js   # สร้าง prompt ส่งให้ AI
   ├─ clusterData.js      # ข้อมูล cluster (⚠️ placeholder — เติมข้อมูลจริง)
   └─ attributeCriteria.js# เกณฑ์ดาวแต่ละ attribute (⚠️ placeholder)
public/img/             # รูปภาพทั้งหมด (ดู IMAGE_ASSETS_NEEDED.md)
```
