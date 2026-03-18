const MOCK_ACCOUNTS = {
  "admin@shop.com":  "admin1234",   // role: admin
  "somai@mail.com":  "123456",      // role: user
  "wichai@mail.com": "123456",      // role: user
}

const MOCK_USERS = [
  { id: 1, name: "Admin ระบบ",    email: "admin@shop.com",  role: "admin", phone: "099-000-0001" },
  { id: 2, name: "สมใจ ใจดี",     email: "somai@mail.com",  role: "user",  phone: "081-234-5678" },
  { id: 3, name: "วิชัย รักดี",   email: "wichai@mail.com", role: "user",  phone: "089-876-5432" },
  { id: 4, name: "มานี มีสุข",    email: "manee@mail.com",  role: "user",  phone: "062-111-2222" },
  { id: 5, name: "วารี ดีงาม",    email: "waree@mail.com",  role: "user",  phone: "090-333-4444" },
]

const MOCK_PRODUCTS = [
  { id: 1, name: "กระเป๋าผ้าแคนวาส", price: 290, stock: 15, img: "👜", imgType: "emoji", desc: "กระเป๋าผ้าแคนวาสสีธรรมชาติ ดีไซน์เรียบง่าย", category: "กระเป๋า" },
  { id: 2, name: "แก้วเซรามิค",       price: 180, stock: 30, img: "☕", imgType: "emoji", desc: "แก้วเซรามิคทำมือ ขนาด 350ml",                category: "แก้วน้ำ" },
  { id: 3, name: "สมุดโน้ต A5",       price: 120, stock: 50, img: "📓", imgType: "emoji", desc: "สมุดโน้ตกระดาษคราฟต์ 80 แผ่น",               category: "เครื่องเขียน" },
  { id: 4, name: "เทียนหอม",          price: 350, stock: 4,  img: "🕯️", imgType: "emoji", desc: "เทียนหอมจากน้ำมันธรรมชาติ กลิ่นลาเวนเดอร์", category: "ของตกแต่ง" },
  { id: 5, name: "พวงกุญแจไม้",       price: 89,  stock: 0,  img: "🗝️", imgType: "emoji", desc: "พวงกุญแจแกะสลักไม้ ทำมือ",                   category: "ของตกแต่ง" },
]

const MOCK_ORDERS = [
  {
    id: "ORD001", userId: 2, customer: "สมใจ ใจดี", phone: "081-234-5678",
    address: "123/4 ถ.สุขุมวิท แขวงคลองเตย กรุงเทพ 10110",
    items: [
      { name: "กระเป๋าผ้าแคนวาส", qty: 1, price: 290, product: { name: "กระเป๋าผ้าแคนวาส" } },
      { name: "เทียนหอม",          qty: 2, price: 350, product: { name: "เทียนหอม" } },
    ],
    total: 990, status: "รอยืนยัน", createdAt: "2026-03-14T10:00:00Z",
  },
  {
    id: "ORD002", userId: null, customer: "วิชัย รักดี", phone: "089-876-5432",
    address: "56 ถ.นิมมานเหมินทร์ ต.สุเทพ อ.เมือง เชียงใหม่ 50200",
    items: [
      { name: "แก้วเซรามิค", qty: 2, price: 180, product: { name: "แก้วเซรามิค" } },
    ],
    total: 360, status: "จัดส่งแล้ว", createdAt: "2026-03-13T14:30:00Z",
  },
  {
    id: "ORD003", userId: 3, customer: "มานี มีสุข", phone: "062-111-2222",
    address: "789 ถ.มิตรภาพ ต.ในเมือง อ.เมือง ขอนแก่น 40000",
    items: [
      { name: "สมุดโน้ต A5", qty: 3, price: 120, product: { name: "สมุดโน้ต A5" } },
      { name: "พวงกุญแจไม้", qty: 1, price: 89,  product: { name: "พวงกุญแจไม้" } },
    ],
    total: 449, status: "สำเร็จ", createdAt: "2026-03-12T09:15:00Z",
  },
  {
    id: "ORD004", userId: 4, customer: "วารี ดีงาม", phone: "090-333-4444",
    address: "321 ถ.ราชดำเนิน ต.หน้าเมือง อ.เมือง ฉะเชิงเทรา 24000",
    items: [
      { name: "กระเป๋าผ้าแคนวาส", qty: 2, price: 290, product: { name: "กระเป๋าผ้าแคนวาส" } },
    ],
    total: 580, status: "กำลังเตรียม", createdAt: "2026-03-11T16:45:00Z",
  },
  {
    id: "ORD005", userId: null, customer: "ทดสอบ ไม่มีบัญชี", phone: "088-999-0000",
    address: "999 ถ.เพชรบุรี แขวงราชเทวี กรุงเทพ 10400",
    items: [
      { name: "เทียนหอม", qty: 1, price: 350, product: { name: "เทียนหอม" } },
    ],
    total: 350, status: "ยกเลิก", createdAt: "2026-03-10T11:00:00Z",
  },
]

// ── override api object ────────────────────────────────────────
// รันหลัง api.js โหลดเสร็จ → เขียนทับฟังก์ชันด้วย mock
window.addEventListener("DOMContentLoaded", () => {

  // mock auth — login จริง เช็ครหัสผ่านด้วย
  api.auth.register = async ({ name, email, phone, password }) => {
    console.log("Mock register called for", email)
    // เพิ่มบัญชีใหม่เข้า mock data
    MOCK_ACCOUNTS[email] = password
    const newUser = { id: MOCK_USERS.length + 1, name, email, role: "user", phone }
    MOCK_USERS.push(newUser)
    return { user: newUser }
  }
  
  api.auth.login = async ({ email, password }) => {
    console.log("Mock login called for", email)
    const correct = MOCK_ACCOUNTS[email]
    if (!correct || correct !== password)
      throw new Error("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
    const user = MOCK_USERS.find(u => u.email === email)
    localStorage.setItem("token", "mock-token-" + user.id)
    localStorage.setItem("user", JSON.stringify(user))
    return { token: "mock-token", user }
  }
  api.auth.getUser = () => {
    const raw = localStorage.getItem("user")
    return raw ? JSON.parse(raw) : null
  }
  api.auth.isLoggedIn = () => !!localStorage.getItem("token")

  // mock products
  api.products.getAll = async () => [...MOCK_PRODUCTS]
  api.products.create = async (data) => {
    const p = { ...data, id: Date.now() }
    MOCK_PRODUCTS.push(p)
    return p
  }
  api.products.update = async (id, data) => {
    const i = MOCK_PRODUCTS.findIndex(p => p.id === id)
    if (i !== -1) MOCK_PRODUCTS[i] = { ...MOCK_PRODUCTS[i], ...data }
    return MOCK_PRODUCTS[i]
  }
  api.products.remove = async (id) => {
    const i = MOCK_PRODUCTS.findIndex(p => p.id === id)
    if (i !== -1) MOCK_PRODUCTS.splice(i, 1)
    return { ok: true }
  }
  api.products.upload = async (file) => {
    // mock upload → return URL จาก FileReader
    return new Promise((res) => {
      const reader = new FileReader()
      reader.onload = e => res({ url: e.target.result })
      reader.readAsDataURL(file)
    })
  }

  // mock orders
  api.orders.getAll = async () => [...MOCK_ORDERS]
  api.orders.getOne = async (id) => MOCK_ORDERS.find(o => o.id === id)
  api.orders.create = async (data) => {
    const order = {
      id: `ORD${String(MOCK_ORDERS.length + 1).padStart(3, "0")}`,
      ...data,
      status: "รอยืนยัน",
      createdAt: new Date().toISOString(),
    }
    MOCK_ORDERS.unshift(order)
    return order
  }
  api.orders.updateStatus = async (id, status) => {
    const o = MOCK_ORDERS.find(o => o.id === id)
    if (o) o.status = status
    return o
  }

  // mock users (ใช้ใน members)
  window.request = async (method, path) => {
    if (method === "GET" && path === "/users") {
      return MOCK_USERS.filter(u => u.role === "user")
    }
    return []
  }

  console.log("✅ Mock data โหลดแล้ว — ใช้ข้อมูลปลอมสำหรับทดสอบ")
})