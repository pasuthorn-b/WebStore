const STATUS_COLOR = {
  "รอยืนยัน":    "#f59e0b",
  "กำลังเตรียม": "#3b82f6",
  "กำลังจัดส่ง":  "#8b5cf6",
  "สำเร็จ":      "#10b981",
  "ยกเลิก":      "#ef4444",
}
const ALL_STATUS = ["รอยืนยัน","กำลังเตรียม","กำลังจัดส่ง","สำเร็จ","ยกเลิก"]

let allOrders = []

window.onload = async () => {
  if (!requireAdmin()) return
  renderAdminNav("orders")
  await loadOrders()
}

//โหลดออเดอร์
async function loadOrders() {
  const listEl  = document.getElementById("orders-list")
  const statsEl = document.getElementById("order-stats")
  listEl.innerHTML = `<div class="loading">⏳ กำลังโหลด...</div>`

  try {
    allOrders = await api.orders.getAll()

    // stats
    const total   = allOrders.reduce((s,o) => s + Number(o.total), 0)
    const waiting = allOrders.filter(o => o.status === "รอยืนยัน").length
    const prep    = allOrders.filter(o => o.status === "กำลังเตรียม").length
    const done    = allOrders.filter(o => o.status === "สำเร็จ").length

    statsEl.innerHTML = `
      ${statCard("฿" + total.toLocaleString(), "ยอดรวมทั้งหมด")}
      ${statCard(allOrders.length, "ออเดอร์ทั้งหมด")}
      ${statCard(waiting, "รอยืนยัน")}
      ${statCard(prep, "กำลังเตรียม")}
      ${statCard(done, "สำเร็จแล้ว")}
    `

    renderOrders(allOrders)

  } catch (err) {
    listEl.innerHTML = `<div style="color:#ef4444">${err.message}</div>`
  }
}

//render ออเดอร์
function renderOrders(orders) {
  const listEl = document.getElementById("orders-list")

  if (orders.length === 0) {
    listEl.innerHTML = `<div class="empty"><div class="empty-icon">📋</div>ไม่พบออเดอร์</div>`
    return
  }

  listEl.innerHTML = orders.map(o => orderCard(o)).join("")
}

//กรองออเดอร์
function filterOrders() {
  const q      = document.getElementById("search-order").value.toLowerCase()
  const status = document.getElementById("filter-status").value

  const filtered = allOrders.filter(o => {
    const matchSearch = !q ||
      o.id.toString().includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      o.phone.includes(q)
    const matchStatus = !status || o.status === status
    return matchSearch && matchStatus
  })

  renderOrders(filtered)
}

// สร้าง card ออเดอร์
function orderCard(o) {
  const c = STATUS_COLOR[o.status] || "#888"

  const statusBtns = ALL_STATUS.map(st => {
    const sc = STATUS_COLOR[st]
    const active = o.status === st
    return `<button class="status-btn"
      onclick="updateStatus('${o.id}','${st}')"
      style="background:${active ? sc : sc+"18"};color:${active?"#fff":sc};border:1.5px solid ${sc}">
      ${st}
    </button>`
  }).join("")

  const items = o.items.map(it =>
    `<div style="display:flex;justify-content:space-between;font-size:13px;color:#555;padding:3px 0">
      <span>${it.product?.name || it.name} ×${it.qty}</span>
      <span>฿${(it.price * it.qty).toLocaleString()}</span>
    </div>`
  ).join("")

  return `
    <div class="order-card">
      <!-- Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;margin-bottom:10px">
        <div>
          <span style="font-weight:700;font-size:15px">${o.id}</span>
          <span style="font-size:13px;color:#666;margin-left:8px">${o.customer}</span>
          <span style="font-size:12px;color:#aaa;margin-left:6px">${o.phone}</span>
        </div>
        <span style="background:${c}20;color:${c};border:1px solid ${c}40;
          border-radius:20px;padding:2px 12px;font-size:12px;font-weight:600">${o.status}</span>
      </div>

      <!-- Info -->
      <div style="font-size:12px;color:#888;margin-bottom:10px;display:flex;flex-wrap:wrap;gap:12px">
        <span>📅 ${new Date(o.createdAt).toLocaleDateString("th-TH",{day:"2-digit",month:"2-digit",year:"numeric"})}</span>
        <span>📍 ${o.address || "-"}</span>
        ${o.userId ? `<span style="color:#10b981">👤 สมาชิก</span>` : `<span style="color:#888">👤 ลูกค้าทั่วไป</span>`}
      </div>

      <!-- Items -->
      <div style="background:#f9fafb;border-radius:8px;padding:10px 12px;margin-bottom:10px">
        ${items}
        <div style="text-align:right;font-weight:700;font-size:14px;margin-top:8px;
          padding-top:8px;border-top:1px solid #e5e7eb">
          รวม ฿${Number(o.total).toLocaleString()}
        </div>
      </div>

      <!-- Status buttons -->
      <div style="display:flex;gap:6px;flex-wrap:wrap">${statusBtns}</div>
    </div>`
}

// อัปเดตสถานะ
async function updateStatus(orderId, status) {
  try {
    await api.orders.updateStatus(orderId, status)
    await loadOrders()
    // คง filter ไว้หลัง reload
    filterOrders()
  } catch (err) {
    alert("อัปเดตสถานะไม่สำเร็จ: " + err.message)
  }
}