// ── โหลดหน้า ──────────────────────────────────────────────────
window.onload = async () => {
  renderAuthArea()
  updateCartBadge()
  await loadProducts()
}

// ── แสดงปุ่ม login หรือ dropdown ชื่อ ─────────────────────────
function renderAuthArea() {
  const user = api.auth.getUser()
  const area = document.getElementById("auth-area")

  if (user) {
    // แสดง welcome banner
    document.getElementById("welcome-banner").style.display = "block"
    document.getElementById("welcome-name").textContent = user.name

    // dropdown profile
    area.innerHTML = `
      <div style="position:relative">
        <button class="btn btn-blue" onclick="toggleProfileMenu()">
          👤 ${user.name.split(" ")[0]}
        </button>
        <div id="profile-menu" style="display:none;position:absolute;right:0;top:calc(100% + 6px);
          background:#fff;border:1px solid #e5e7eb;border-radius:10px;
          box-shadow:0 8px 24px rgba(0,0,0,0.08);min-width:160px;z-index:50;overflow:hidden">
          <div style="padding:10px 14px;border-bottom:1px solid #f3f4f6">
          // แสดงชื่อและอีเมล
            <div style="font-weight:600;font-size:13px">${user.name}</div>
            <div style="font-size:11px;color:#999">${user.email}</div>
          </div>
          <button onclick="location.href='../my-orders/index.html'"
            style="width:100%;padding:10px 14px;border:none;background:none;
            cursor:pointer;text-align:left;font-size:13px">📦 My Orders</button>
          <button onclick="handleLogout()"
            style="width:100%;padding:10px 14px;border:none;background:none;
            cursor:pointer;text-align:left;font-size:13px;color:#ef4444">🚪 Logout</button>
        </div>
      </div>`
  } else {
    area.innerHTML = `
      <a href="../login/index.html">
        <button class="btn btn-green" style="width:auto;padding:6px 14px">Login</button>
      </a>`
  }
}

function toggleProfileMenu() {
  const menu = document.getElementById("profile-menu")
  if (menu.style.display === "none") {
  menu.style.display = "block"  // แสดงเมนู
} else {
  menu.style.display = "none"   // ซ่อนเมนู
}
}

function handleLogout() {
  api.auth.logout()
}

// ── อัปเดตตัวเลขในตะกร้า ──────────────────────────────────────
function updateCartBadge() {
  const cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const count = cart.reduce((s, x) => s + x.qty, 0)
  const el = document.getElementById("cart-count")
  el.textContent = count > 0 ? count : ""
}

// ── โหลดสินค้า ────────────────────────────────────────────────
async function loadProducts() {
  const grid = document.getElementById("product-grid")
  try {
    const products = await api.products.getAll()

    if (products.length === 0) {
      grid.innerHTML = `<div class="empty"><div class="empty-icon">📦</div>ยังไม่มีสินค้า</div>`
      return
    }

    let html = ""
    for (const p of products) {
      const imgHtml = p.imgType === "url"
        ? `<img src="http://localhost:4000${p.imgUrl}" style="width:80px;height:80px;object-fit:cover;border-radius:10px" />`
        : p.img

      html += `
        <div class="product-card">
          <div class="product-img">${imgHtml}</div>
          <div class="product-name">${p.name}</div>
          <div class="product-desc">${p.desc || ""}</div>
          <div class="product-footer">
            <span class="product-price">฿${p.price.toLocaleString()}</span>
            <span class="tag">คงเหลือ ${p.stock}</span>
          </div>
          ${p.stock > 0 ? `
          <div class="qty-row">
            <button class="qty-btn" onclick="changeQty(${p.id}, -1)">−</button>
            <span class="qty-value" id="qty-${p.id}">1</span>
            <button class="qty-btn" onclick="changeQty(${p.id}, 1)" data-max="${p.stock}">+</button>
          </div>` : ""}
          <button class="btn btn-green"
            id="add-btn-${p.id}"
            onclick="addToCart(${p.id}, '${p.name}', ${p.price}, '${p.imgType === "url" ? "http://localhost:4000" + p.imgUrl : p.img}')"
            ${p.stock === 0 ? "disabled" : ""}>
            ${p.stock === 0 ? "หมดสต็อก" : "+ ใส่ตะกร้า"}
          </button>
        </div>`
    }
    grid.innerHTML = html

  } catch (err) {
    grid.innerHTML = `<div class="empty"><div class="empty-icon">❌</div>${err.message}</div>`
  }
}

// ── เปลี่ยนจำนวน ──────────────────────────────────────────────
function changeQty(id, delta) {
  const el = document.getElementById("qty-" + id)
  const maxBtn = document.querySelector(`.qty-btn[onclick="changeQty(${id}, 1)"]`)
  const max = parseInt(maxBtn?.dataset.max || 99)
  let val = parseInt(el.textContent) + delta
  el.textContent = Math.min(Math.max(1, val), max)

  // อัปเดตปุ่มให้แสดงจำนวน
  const addBtn = document.getElementById("add-btn-" + id)
  if (addBtn) addBtn.textContent = `+ ใส่ตะกร้า (${el.textContent})`
}

// ── ใส่ตะกร้า ─────────────────────────────────────────────────
function addToCart(id, name, price, img) {
  const qty = parseInt(document.getElementById("qty-" + id)?.textContent || 1)

  let cart = JSON.parse(localStorage.getItem("cart") || "[]")
  const exist = cart.find(x => x.id === id)
  if (exist) exist.qty += qty
  else cart.push({ id, name, price, qty, img })

  localStorage.setItem("cart", JSON.stringify(cart))
  updateCartBadge()

  // feedback
  const btn = document.getElementById("add-btn-" + id)
  const original = `+ ใส่ตะกร้า (${qty})`
  btn.textContent = "✅ เพิ่มแล้ว!"
  btn.disabled = true
  setTimeout(() => {
    btn.textContent = original
    btn.disabled = false
    document.getElementById("qty-" + id).textContent = 1
  }, 1500)
}

// ── ปิด dropdown เมื่อคลิกนอก ─────────────────────────────────
document.addEventListener("click", e => {
  const menu = document.getElementById("profile-menu")
  if (menu && !e.target.closest("[onclick='toggleProfileMenu()']")) {
    menu.style.display = "none"
  }
})