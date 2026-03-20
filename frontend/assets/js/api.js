const BASE_URL = "http://localhost:4000/api"

// ── ส่ง request ─────────────────────────────────────────────
async function request(method, path, body = null) {
  const token = localStorage.getItem("token")

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": "Bearer " + token } : {})
    }
  }

  if (body) options.body = JSON.stringify(body)

  const res = await fetch(BASE_URL + path, options)

  // token หมดอายุ → logout อัตโนมัติ
 if (res.status === 401) {
  localStorage.removeItem("token")
  localStorage.removeItem("user")

  const data = await res.json()
  // ถ้ากำลัง login อยู่ (ยังไม่มี token) → throw error ให้ catch จัดการ
  // ถ้า token หมดอายุ (มี token แต่ใช้ไม่ได้) → redirect

  if (!token) {
    throw new Error(data.error || "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
  }
  location.href = "../login/login.html"
  return
}

  const data = await res.json()

  if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด")
  return data
}

// ── upload รูป ───────────────────────────────────────────────
async function uploadImage(file) {
  const token = localStorage.getItem("token")
  const formData = new FormData()
  formData.append("image", file)

  const res = await fetch(BASE_URL + "/products/upload", {
    method: "POST",
    headers: token ? { "Authorization": "Bearer " + token } : {},
    body: formData
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ")
  return data // { url: "/uploads/xxx.jpg" }
}

// ── auth helpers ─────────────────────────────────────────────
function getUser() {
  const raw = localStorage.getItem("user")
  return raw ? JSON.parse(raw) : null
}

function isLoggedIn() {
  return !!localStorage.getItem("token")
}

function saveSession(token, user) {
  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(user))
}

function clearSession() {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

// ── api object ───────────────────────────────────────────────
const api = {

  auth: {
    // สมัครสมาชิก
    // body: { name, email, phone, password }
    register: (data) => request("POST", "/auth/register", data),

    // เข้าสู่ระบบ → บันทึก token + user ลง localStorage อัตโนมัติ
    // body: { email, password }
    login: async (data) => {
      const res = await request("POST", "/auth/login", data)
      saveSession(res.token, res.user)
      return res
    },

    // ออกจากระบบ → ลบ token + user แล้ว redirect ไป login
    logout: () => {
      clearSession()
      location.href = "../login/login.html"
    },

    getUser,      // ดึงข้อมูล user ปัจจุบัน → { id, name, email } หรือ null
    isLoggedIn,   // เช็คว่า login อยู่ไหม → true / false
  },

  products: {
    // ดึงสินค้าทั้งหมด → [ ...products ]
    getAll: () => request("GET", "/products"),

    // ดึงสินค้าชิ้นเดียว → product
    getOne: (id) => request("GET", "/products/" + id),

    // เพิ่มสินค้า (admin) → product
    // body: { name, price, stock, img, imgType, desc }
    create: (data) => request("POST", "/products", data),

    // แก้ไขสินค้า (admin) → product
    update: (id, data) => request("PUT", "/products/" + id, data),

    // ลบสินค้า (admin) → { ok: true }
    remove: (id) => request("DELETE", "/products/" + id),

    // อัปโหลดรูป (admin) → { url: "/uploads/xxx.jpg" }
    upload: (file) => uploadImage(file),
  },

  orders: {
    // ดึงออเดอร์ทั้งหมด (admin) → [ ...orders ]
    getAll: () => request("GET", "/orders"),

    // ดึงออเดอร์เดียว → order
    getOne: (id) => request("GET", "/orders/" + id),
    
    getMy: () => request("GET", "/orders/my"),

    // สั่งซื้อ → order
    // body: { customer, phone, address, items: [{ productId, qty, price }] }
    create: (data) => request("POST", "/orders", data),

    // อัปเดตสถานะ (admin) → order
    // body: { status }
    updateStatus: (id, status) =>
      request("PATCH", "/orders/" + id + "/status", { status }),
  },

}