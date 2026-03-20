const BASE_URL = "http://localhost:4000/api"

// ส่ง request
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

// upload รูป
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

// auth helpers
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

// api object
const api = {

  auth: {
    register: (data) => request("POST", "/auth/register", data),
    login: async (data) => {
      const res = await request("POST", "/auth/login", data)
      saveSession(res.token, res.user)
      return res
    },

    logout: () => {
      clearSession()
      location.href = "../login/login.html"
    },

    getUser,   
    isLoggedIn,
  },

  products: {
    getAll: () => request("GET", "/products"),
    getOne: (id) => request("GET", "/products/" + id),
    create: (data) => request("POST", "/products", data),
    update: (id, data) => request("PUT", "/products/" + id, data),
    remove: (id) => request("DELETE", "/products/" + id),
    upload: (file) => uploadImage(file),
  },

  orders: {
    getAll: () => request("GET", "/orders"),
    getOne: (id) => request("GET", "/orders/" + id),
    getMy: () => request("GET", "/orders/my"),
    create: (data) => request("POST", "/orders", data),
    updateStatus: (id, status) =>
      request("PATCH", "/orders/" + id + "/status", { status }),
  },

}