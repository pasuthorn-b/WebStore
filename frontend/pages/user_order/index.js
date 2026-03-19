const STATUS_COLOR = {
  "รอยืนยัน":"#f59e0b","กำลังเตรียม":"#3b82f6",
  "กำลังจัดส่ง":"#8b5cf6","สำเร็จ":"#10b981","ยกเลิก":"#ef4444"
}

window.onload = async () => {
  if (!api.auth.isLoggedIn()) {
    location.href = "../login/index.html"
    return
  }

  const user = api.auth.getUser()
  document.getElementById("user-name").textContent = "สวัสดี " + user.name

  const listEl = document.getElementById("orders-list")

  try {
    const mine = await api.orders.getMy()

    if (mine.length === 0) {
      listEl.innerHTML = `
        <div class="empty">
          <div class="empty-icon">📦</div>
          ยังไม่มีออเดอร์
          <a href="../Stores pages/index.html" style="display:block;margin-top:12px">
            <button class="btn btn-green">เลือกซื้อสินค้า</button>
          </a>
        </div>`
      return
    }

    listEl.innerHTML = mine.map(o => {
      const c = STATUS_COLOR[o.status] || "#888"
      return `
        <div class="card" style="margin-bottom:12px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
            <span style="font-weight:700">${o.id}</span>
            <span style="background:${c}20;color:${c};border-radius:20px;
              padding:2px 12px;font-size:12px;font-weight:600;border:1px solid ${c}40">
              ${o.status}
            </span>
          </div>
          <div style="font-size:12px;color:#888;margin-bottom:8px">
            📅 ${new Date(o.createdAt).toLocaleDateString("th-TH")}
          </div>
          ${o.items.map(it=>`
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px">
              <span>${it.product?.name||it.name} ×${it.qty}</span>
              <span>฿${(it.price*it.qty).toLocaleString()}</span>
            </div>`).join("")}
          <hr style="border:none;border-top:1px solid #f0f0f0;margin:8px 0">
          <div style="text-align:right;font-weight:700;font-size:14px">
            รวม ฿${o.total.toLocaleString()}
          </div>
        </div>`
    }).join("")

  } catch (err) {
    listEl.innerHTML = `<div style="color:#ef4444">${err.message}</div>`
  }
}