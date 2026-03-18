window.onload = () => {
  renderCart()
}

function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]")
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart))
}

// ── render ตะกร้า ─────────────────────────────────────────────
function renderCart() {
  const cart = getCart()
  const user = api.auth.getUser()
  const content = document.getElementById("cart-content")
  const total = cart.reduce((s, x) => s + x.price * x.qty, 0)

  // banner แนะนำ login
  const loginBanner = !user ? `
    <div class="alert alert-blue" style="margin-bottom:16px">
      <span>เข้าสู่ระบบเพื่อติดตามออเดอร์ได้ง่ายขึ้น</span>
      <a href="../login/index.html">
        <button class="btn btn-green" style="width:auto;padding:5px 12px;font-size:12px">เข้าสู่ระบบ</button>
      </a>
    </div>` : ""

  if (cart.length === 0) {
    content.innerHTML = `
      ${loginBanner}
      <div class="card" style="margin-bottom:16px">
        <h2 style="font-size:18px;font-weight:700;margin-bottom:12px">🛒 ตะกร้าสินค้า</h2>
        <div class="empty"><div class="empty-icon">🛒</div>ตะกร้าว่างเปล่า</div>
      </div>`
    return
  }

  const itemsHtml = cart.map(item => `
    <div style="display:flex;align-items:center;justify-content:space-between;
      padding:12px 0;border-bottom:1px solid #f3f4f6">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:44px;height:44px;border-radius:8px;background:#f9fafb;
          display:flex;align-items:center;justify-content:center;font-size:26px;flex-shrink:0">
          ${item.img.startsWith("http")
            ? `<img src="${item.img}" style="width:44px;height:44px;object-fit:cover;border-radius:8px">`
            : item.img}
        </div>
        <div>
          <div style="font-weight:600;font-size:14px">${item.name}</div>
          <div style="font-size:12px;color:#888">฿${item.price.toLocaleString()} × ${item.qty}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px">
        <strong style="font-size:14px">฿${(item.price * item.qty).toLocaleString()}</strong>
        <button onclick="removeItem(${item.id})"
          style="background:none;border:none;cursor:pointer;color:#ef4444;font-size:18px">✕</button>
      </div>
    </div>`).join("")

  content.innerHTML = `
    ${loginBanner}
    <div class="card" style="margin-bottom:16px">
      <h2 style="font-size:18px;font-weight:700;margin-bottom:4px">🛒 ตะกร้าสินค้า</h2>
      ${itemsHtml}
      <div style="text-align:right;font-weight:700;font-size:17px;margin-top:12px">
        รวม: ฿${total.toLocaleString()}
      </div>
    </div>

    <div class="card">
      <h2 style="font-size:16px;font-weight:700;margin-bottom:14px">ข้อมูลการจัดส่ง</h2>
      <div class="form-group">
        <div>
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">ชื่อ-นามสกุล *</div>
          <input id="name" class="inp-field" placeholder="ชื่อ-นามสกุล"
            value="${user ? user.name : ""}"
            style="border:1px solid #d1d5db;border-radius:8px;padding:9px 12px;width:100%;font-size:14px;font-family:inherit;outline:none" />
        </div>
        <div>
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">เบอร์โทร *</div>
          <input id="phone" class="inp-field" placeholder="08X-XXX-XXXX"
            style="border:1px solid #d1d5db;border-radius:8px;padding:9px 12px;width:100%;font-size:14px;font-family:inherit;outline:none" />
        </div>
        <div>
          <div style="font-size:13px;font-weight:600;margin-bottom:4px">ที่อยู่จัดส่ง *</div>
          <textarea id="address" placeholder="บ้านเลขที่ ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์"
            style="border:1px solid #d1d5db;border-radius:8px;padding:9px 12px;width:100%;
            font-size:14px;font-family:inherit;outline:none;resize:vertical;min-height:80px"></textarea>
        </div>
        <div id="order-err" style="color:#ef4444;font-size:13px;display:none"></div>
        <button class="btn btn-green" onclick="placeOrder()">ยืนยันการสั่งซื้อ</button>
      </div>
    </div>`
}

// ── ลบสินค้าออกจากตะกร้า ─────────────────────────────────────
function removeItem(id) {
  let cart = getCart().filter(x => x.id !== id)
  saveCart(cart)
  renderCart()
}

// ── สั่งซื้อ ──────────────────────────────────────────────────
async function placeOrder() {
  const name    = document.getElementById("name").value.trim()
  const phone   = document.getElementById("phone").value.trim()
  const address = document.getElementById("address").value.trim()
  const errEl   = document.getElementById("order-err")
  const cart    = getCart()
  const user    = api.auth.getUser()

  if (!name || !phone || !address) {
    errEl.textContent = "กรุณากรอกข้อมูลให้ครบทุกช่อง"
    errEl.style.display = "block"
    return
  }

  const btn = document.querySelector("[onclick='placeOrder()']")
  btn.disabled = true
  btn.textContent = "กำลังสั่งซื้อ..."

  try {
    const order = await api.orders.create({
      customer: name,
      phone,
      address,
      userId: user?.id || null,
      items: cart.map(x => ({
        productId: x.id,
        qty: x.qty,
        price: x.price,
      }))
    })

    // ล้างตะกร้า
    saveCart([])

    // ไปหน้า success
    localStorage.setItem("lastOrderId", order.id)
    location.href = "../track/index.html?id=" + order.id

  } catch (err) {
    errEl.textContent = err.message || "สั่งซื้อไม่สำเร็จ กรุณาลองใหม่"
    errEl.style.display = "block"
    btn.disabled = false
    btn.textContent = "ยืนยันการสั่งซื้อ"
  }
}