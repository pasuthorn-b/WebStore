let allMembers = []
let allOrders  = []

window.onload = async () => {
  if (!requireAdmin()) return
  renderAdminNav("members")
  await loadMembers()
}

async function loadMembers() {
  const listEl  = document.getElementById("members-list")
  const statsEl = document.getElementById("member-stats")
  listEl.innerHTML = `<div class="loading">⏳ กำลังโหลด...</div>`

  try {
    ;[allMembers, allOrders] = await Promise.all([
      request("GET", "/users"),
      request("GET", "/orders")
    ])

    // stats
    const memOrders = allOrders.filter(o => o.userId)
    const memRev = memOrders.reduce((s,o) => s + Number(o.total), 0)
    const avgOrder  = allMembers.length > 0
      ? Math.round(memRev / allMembers.length)
      : 0

    statsEl.innerHTML = `
      ${statCard(allMembers.length, "สมาชิกทั้งหมด")}
      ${statCard(memOrders.length, "ออเดอร์จากสมาชิก")}
      ${statCard("฿" + memRev.toLocaleString(), "ยอดจากสมาชิก")}
      ${statCard("฿" + avgOrder.toLocaleString(), "เฉลี่ย/คน")}
    `

    renderMembers(allMembers)

  } catch (err) {
    listEl.innerHTML = `<div style="color:#ef4444">${err.message}</div>`
  }
}

function renderMembers(members) {
  const listEl = document.getElementById("members-list")

  if (members.length === 0) {
    listEl.innerHTML = `<div class="empty"><div class="empty-icon">👥</div>ไม่พบสมาชิก</div>`
    return
  }

  listEl.innerHTML = members.map(u => {
    const mine  = allOrders.filter(o => o.userId === u.id)
    const total = mine.reduce((s, o) => s + Number(o.total), 0)
    const last  = mine.length > 0
      ? new Date(mine[mine.length-1].createdAt).toLocaleDateString("th-TH",{day:"2-digit",month:"2-digit",year:"numeric"})
      : null

    // initials avatar
    const initials = u.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()

    return `
      <div class="mem-card">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px">
          <div style="width:44px;height:44px;border-radius:50%;background:#eff6ff;
            display:flex;align-items:center;justify-content:center;
            font-size:15px;font-weight:700;color:#1d4ed8;flex-shrink:0">
            ${initials}
          </div>
          <div>
            <div style="font-weight:600;font-size:14px">${u.name}</div>
            <div style="font-size:12px;color:#888">${u.email}</div>
            ${u.phone ? `<div style="font-size:12px;color:#888">${u.phone}</div>` : ""}
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;font-size:12px;
          background:#f9fafb;border-radius:8px;padding:8px 12px;margin-bottom:6px">
          <span style="color:#666">ออเดอร์ทั้งหมด</span>
          <span style="font-weight:600">${mine.length} รายการ</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-size:12px;
          background:#f9fafb;border-radius:8px;padding:8px 12px;margin-bottom:6px">
          <span style="color:#666">ยอดใช้จ่าย</span>
          <span style="font-weight:600;color:#10b981">฿${total.toLocaleString()}</span>
        </div>
        ${last ? `
        <div style="display:flex;justify-content:space-between;font-size:12px;
          background:#f9fafb;border-radius:8px;padding:8px 12px">
          <span style="color:#666">ออเดอร์ล่าสุด</span>
          <span style="font-weight:600">${last}</span>
        </div>` : ""}
      </div>`
  }).join("")
}

function filterMembers() {
  const q = document.getElementById("search-mem").value.toLowerCase()
  const filtered = allMembers.filter(u =>
    u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
  )
  renderMembers(filtered)
}