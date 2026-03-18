const STATUS_COLOR = {
  "รอยืนยัน":   "#f59e0b",
  "กำลังเตรียม":"#3b82f6",
  "จัดส่งแล้ว": "#8b5cf6",
  "สำเร็จ":     "#10b981",
  "ยกเลิก":     "#ef4444",
}

window.onload = () => {
  // ถ้ามาจากหน้า cart จะมี ?id= ใน URL
  const params = new URLSearchParams(location.search)
  const id = params.get("id") || localStorage.getItem("lastOrderId") || ""
  if (id) {
    document.getElementById("track-input").value = id
    doTrack()
  }
}

async function doTrack() {
  const id = document.getElementById("track-input").value.trim()
  const resultEl = document.getElementById("track-result")
  if (!id) return

  resultEl.innerHTML = `<div class="loading">⏳ กำลังค้นหา...</div>`

  try {
    const order = await api.orders.getOne(id)
    const c = STATUS_COLOR[order.status] || "#888"

    resultEl.innerHTML = `
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <span style="font-weight:700;font-size:16px">${order.id}</span>
          <span style="background:${c}20;color:${c};border-radius:20px;
            padding:2px 12px;font-size:12px;font-weight:600;border:1px solid ${c}40">
            ${order.status}
          </span>
        </div>
        <div style="font-size:13px;color:#666;margin-bottom:8px">
          👤 ${order.customer} | 📞 ${order.phone}
        </div>
        <div style="font-size:13px;color:#666;margin-bottom:12px">
          📅 ${new Date(order.createdAt).toLocaleDateString("th-TH")}
        </div>
        <hr style="border:none;border-top:1px solid #f0f0f0;margin-bottom:12px">
        ${order.items.map(it => `
          <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px">
            <span>${it.product?.name || it.name} ×${it.qty}</span>
            <span>฿${(it.price * it.qty).toLocaleString()}</span>
          </div>`).join("")}
        <hr style="border:none;border-top:1px solid #f0f0f0;margin:10px 0">
        <div style="text-align:right;font-weight:700;font-size:15px">
          รวม ฿${order.total.toLocaleString()}
        </div>
        <a href="../Stores pages/index.html" style="display:block;margin-top:14px">
          <button class="btn btn-green">กลับร้านค้า</button>
        </a>
      </div>`

  } catch (err) {
    resultEl.innerHTML = `<div style="color:#ef4444;font-size:13px;margin-top:8px">ไม่พบออเดอร์ "${id}"</div>`
  }
}

document.addEventListener("keydown", e => {
  if (e.key === "Enter") doTrack()
})