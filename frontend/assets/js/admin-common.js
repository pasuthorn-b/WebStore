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

  const res = await fetch("http://localhost:4000/api" + path, options)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "เกิดข้อผิดพลาด")
  return data
}

// เช็คสิทธิ์ admin
function requireAdmin() {
  const user = api.auth.getUser()
  if (!user || user.role !== "admin") {
    alert("คุณไม่มีสิทธิ์เข้าหน้านี้")
    location.href = "../login_admin/login_ad.html"
    return null
  }
  return user
}

// สร้าง Navbar 
// activeTab = "orders" | "products" | "members"
function renderAdminNav(activeTab) {
  const user = api.auth.getUser()

  const tabs = [
    { id: "orders",   label: "📋 ออเดอร์", href: "../orders/orders.html"   },
    { id: "products", label: "📦 สินค้า",  href: "../products/products.html" },
    { id: "members",  label: "👥 สมาชิก",  href: "../members/members.html"  },
  ]

  const tabHtml = tabs.map(t => `
    <a href="${t.href}">
      <button class="btn btn-blue"
        style="${activeTab === t.id ? "background:#1d4ed8;color:#fff;border-color:#1d4ed8" : ""}">
        ${t.label}
      </button>
    </a>`
  ).join("")

  document.querySelector(".navbar").innerHTML = `
    <span style="font-weight:700;font-size:18px;color:#111">⚙️ แอดมิน</span>
    <div class="navbar-actions">
      <span style="font-size:13px;color:#888">👤 ${user?.name || ""}</span>
      ${tabHtml}
      <a href="../../Stores pages/Stores_pages.html">
        <button class="btn btn-blue">← ร้านค้า</button>
      </a>
      <button class="btn" onclick="adminLogout()"
        style="color:#ef4444;border-color:#ef444440">ออกจากระบบ</button>
    </div>
  `
}

// Logout
function adminLogout() {
  if (confirm("ออกจากระบบใช่ไหม?")) {
    api.auth.logout()
    location.href = "../../admin/login_admin/login_ad.html"
  }
}

// Helpers
function statCard(num, label) {
  return `
    <div class="stat-card">
      <div class="stat-num">${num}</div>
      <div class="stat-lbl">${label}</div>
    </div>`
}

function esc(str) {
  return String(str).replace(/'/g, "\\'").replace(/"/g, '\\"')
}