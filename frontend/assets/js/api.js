const BASE_URL = "http://localhost:4000/api"

// core request
const request = async (method, path, body = null) => {
  const token = localStorage.getItem("token")

  const options = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "Authorization": "Bearer " + token } : {})
    },
  }

  if (body) options.body = JSON.stringify(body)

  const res = await fetch(BASE_URL + path, options)

  // ถ้า server ตอบ 401 = token หมดอายุ → logout อัตโนมัติ
  if (res.status === 401) {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    window.location.href = "/pages/login/index.html"
    return
  }

  const data = await res.json()

  // ถ้า server ตอบ error ให้ throw ออกมาให้ catch จับได้
  if (!res.ok) {
    throw new Error(data.error || "เกิดข้อผิดพลาด")
  }

  return data
}

//upload รูป
const uploadImage = async (file) => {
  const token = localStorage.getItem("token")
  const formData = new FormData()
  formData.append("image", file)

  const res = await fetch(BASE_URL + "/products/upload", {
    method: "POST",
    headers: {
      ...(token ? { "Authorization": "Bearer " + token } : {})
      // ห้ามใส่ Content-Type ตรงนี้ browser จะ set ให้เองพร้อม boundary
    },
    body: formData
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "อัปโหลดไม่สำเร็จ")
  return data // { url: "/uploads/xxxx.jpg" }
}

//auth helpers
const getUser = () => {
  const raw = localStorage.getItem("user")
  return raw ? JSON.parse(raw) : null
}

const isLoggedIn = () => !!localStorage.getItem("token")

const saveSession = (token, user) => {
  localStorage.setItem("token", token)
  localStorage.setItem("user", JSON.stringify(user))
}

const clearSession = () => {
  localStorage.removeItem("token")
  localStorage.removeItem("user")
}

// api object
const api = {

  auth: {
    // POST /api/auth/register
    // body: { name, email, password }
    register: (data) => request("POST", "/auth/register", data),

    // POST /api/auth/login
    // body: { email, password }
    // return: { token, user }
    login: async (data) => {
      const res = await request("POST", "/auth/login", data)
      saveSession(res.token, res.user)
      return res
    },

    logout: () => {
      clearSession()
      window.location.href = "/pages/login/index.html"
    },

    getUser,
    isLoggedIn,
  },

  products: {
    // GET /api/products → return [ ...products ]
    getAll: () => request("GET", "/products"),

    // GET /api/products/:id → return product
    getOne: (id) => request("GET", "/products/" + id),

    // POST /api/products (admin) → return product
    // body: { name, price, stock, img, imgType, desc }
    create: (data) => request("POST", "/products", data),

    // PUT /api/products/:id (admin) → return product
    update: (id, data) => request("PUT", "/products/" + id, data),

    // DELETE /api/products/:id (admin) → return { ok: true }
    remove: (id) => request("DELETE", "/products/" + id),

    // POST /api/products/upload (admin) → return { url }
    upload: (file) => uploadImage(file),
  },

  orders: {
    // GET /api/orders (admin) → return [ ...orders ]
    getAll: () => request("GET", "/orders"),

    // GET /api/orders/:id → return order
    getOne: (id) => request("GET", "/orders/" + id),

    // POST /api/orders → return order
    // body: { customer, phone, address, items: [{ productId, qty, price }] }
    create: (data) => request("POST", "/orders", data),

    // PATCH /api/orders/:id/status (admin) → return order
    // body: { status }
    updateStatus: (id, status) =>
      request("PATCH", "/orders/" + id + "/status", { status }),
  },

}