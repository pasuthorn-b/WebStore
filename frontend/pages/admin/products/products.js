let editingId  = null
let allProducts = []

function esc(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
}

window.onload = async () => {
  if (!requireAdmin()) return
  renderAdminNav("products")
  await loadProducts()
}

// โหลดสินค้า
async function loadProducts() {
  const listEl = document.getElementById("products-list")
  listEl.innerHTML = `<div class="loading">⏳ กำลังโหลด...</div>`

  try {
    allProducts = await api.products.getAll()
    renderProducts(allProducts)
  } catch (err) {
    listEl.innerHTML = `<div style="color:#ef4444">${err.message}</div>`
  }
}

//render การ์ดสินค้า
function renderProducts(products) {
  const listEl = document.getElementById("products-list")

  if (products.length === 0) {
    listEl.innerHTML = `<div class="empty"><div class="empty-icon">📦</div>ไม่พบสินค้า</div>`
    return
  }

  listEl.innerHTML = products.map(p => {
    const imgHtml = p.imgType === "url" && p.imgUrl
      ? `<img src="http://localhost:4000${p.imgUrl}" style="width:100%;height:140px;object-fit:cover;border-radius:8px" />`
      : `<div style="font-size:48px;text-align:center;padding:12px 0;background:#f9fafb;border-radius:8px">${p.img || "🎁"}</div>`

    const stockColor = p.stock === 0 ? "#ef4444" : p.stock <= 5 ? "#f59e0b" : "#10b981"

    return `
      <div class="prod-card">
        ${imgHtml}
        <div style="font-weight:600;font-size:14px">${p.name}</div>
        ${p.category ? `<div style="font-size:11px;background:#eff6ff;color:#1d4ed8;border-radius:6px;padding:2px 8px;width:fit-content">${p.category}</div>` : ""}
        <div style="font-size:12px;color:#888">${p.desc || ""}</div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span style="font-weight:700;font-size:15px">฿${p.price.toLocaleString()}</span>
          <span style="font-size:11px;background:${stockColor}20;color:${stockColor};border-radius:6px;padding:2px 8px;font-weight:600">
            ${p.stock === 0 ? "หมด" : `สต็อก ${p.stock}`}
          </span>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn btn-blue" style="flex:1;padding:7px;font-size:13px"
            onclick="startEdit(${p.id},'${esc(p.name)}',${p.price},${p.stock},'${esc(p.desc||"")}','${esc(p.category||"")}','${esc(p.imgUrl||"")}','${esc(p.imgType||"")}')"
          >แก้ไข</button>
          <button class="btn" style="flex:1;padding:7px;font-size:13px;background:#fee2e2;color:#ef4444;border-color:#ef444440"
            onclick="deleteProduct(${p.id},'${esc(p.name)}')"
          >ลบ</button>
        </div>
      </div>`
  }).join("")
}

//ค้นหาสินค้า
function filterProducts() {
  const q = document.getElementById("search-prod").value.toLowerCase()
  const filtered = allProducts.filter(p =>
    p.name.toLowerCase().includes(q) || (p.desc||"").toLowerCase().includes(q)
  )
  renderProducts(filtered)
}

//preview รูป
function previewImg() {
  const file = document.getElementById("p-img").files[0]
  if (!file) return

  // เช็คขนาดไฟล์ไม่เกิน 5MB
  if (file.size > 5 * 1024 * 1024) {
    showFormErr("รูปภาพต้องมีขนาดไม่เกิน 5MB")
    document.getElementById("p-img").value = ""
    return
  }

  const reader = new FileReader()
  reader.onload = e => {
    const preview = document.getElementById("img-preview")
    const placeholder = document.getElementById("upload-placeholder")
    preview.src = e.target.result
    preview.style.display = "block"
    placeholder.style.display = "none"
    document.getElementById("clear-img-btn").style.display = "inline-block"
  }
  reader.readAsDataURL(file)
}

//เอารูปออก
function clearImg() {
  document.getElementById("p-img").value = ""
  document.getElementById("img-preview").style.display = "none"
  document.getElementById("upload-placeholder").style.display = "block"
  document.getElementById("clear-img-btn").style.display = "none"
}

//บันทึกสินค้า
async function saveProduct() {
  const name  = document.getElementById("p-name").value.trim()
  const price = document.getElementById("p-price").value
  const stock = document.getElementById("p-stock").value
  const desc  = document.getElementById("p-desc").value.trim()
  const cat   = document.getElementById("p-cat").value.trim()
  const file  = document.getElementById("p-img").files[0]
  const btn   = document.getElementById("save-btn")
  // validate
  if (!name)  {
    return showFormErr("กรุณากรอกชื่อสินค้า")
  }
  if (!price) {
    return showFormErr("กรุณากรอกราคา")
  }
  if (+price < 0) {
    return showFormErr("ราคาต้องไม่ติดลบ")
  }
  if (!file && !editingId) {
    return showFormErr("กรุณาเลือกรูปสินค้า")
  }

  clearFormErr()

  btn.disabled = true
  btn.textContent = "กำลังบันทึก..."
  try {
    let imgUrl = null, imgType = "emoji"

    if (file) {
      const res = await api.products.upload(file)
      imgUrl  = res.url
      imgType = "url"
    }
    const data = {
      name,
      price:    +price,
      stock:    +stock || 0,
      desc,
      category: cat,
      img:      "🎁",
      imgType,
      imgUrl,
    }

    if (editingId) {
      await api.products.update(editingId, data)
      alert("บันทึกการแก้ไขสำเร็จ")
    } else {
      await api.products.create(data)
      alert("เพิ่มสินค้าสำเร็จ")
    }
    clearForm()
    await loadProducts()
    // reload หน้าร้านใหม่อย่างสมบูรณ์
    setTimeout(() => {
      window.open("../../Stores pages/Stores_pages.html", "_self")
    }, 800)
  } catch (err) {
    showFormErr(err.message || "บันทึกไม่สำเร็จ")
  } finally {
    btn.disabled = false
    btn.textContent = "บันทึกสินค้า"
  }
}

//เริ่มแก้ไข
function startEdit(id, name, price, stock, desc, cat, imgUrl, imgType) {
  editingId = id
  document.getElementById("p-name").value  = name
  document.getElementById("p-price").value = price
  document.getElementById("p-stock").value = stock
  document.getElementById("p-desc").value  = desc
  document.getElementById("p-cat").value   = cat

  // ถ้ามีรูปเดิม แสดง preview
  if (imgType === "url" && imgUrl) {
    const preview = document.getElementById("img-preview")
    preview.src = "http://localhost:4000" + imgUrl
    preview.style.display = "block"
    document.getElementById("upload-placeholder").style.display = "none"
    document.getElementById("clear-img-btn").style.display = "inline-block"
  }

  document.getElementById("form-title").textContent   = "✏️ แก้ไขสินค้า"
  document.getElementById("save-btn").textContent     = "บันทึกการแก้ไข"
  document.getElementById("cancel-btn").style.display = "block"
  window.scrollTo({ top: 0, behavior: "smooth" })
}

//ยกเลิกแก้ไข
function cancelEdit() {
  editingId = null
  clearForm()
}

//เคลียร์ฟอร์ม
function clearForm() {
  editingId = null
  ;["p-name","p-price","p-stock","p-desc","p-cat"].forEach(id => {
    document.getElementById(id).value = ""
  })
  clearImg()
  clearFormErr()
  document.getElementById("form-title").textContent   = "➕ เพิ่มสินค้าใหม่"
  document.getElementById("save-btn").textContent     = "บันทึกสินค้า"
  document.getElementById("cancel-btn").style.display = "none"
}

//ลบสินค้า
async function deleteProduct(id, name) {
  if (!confirm(`ลบสินค้า "${name}" ใช่ไหม?\nไม่สามารถย้อนกลับได้นะ`)) { 
    return 
  }
  try {
    await api.products.remove(id)
    await loadProducts()
  } catch (err) {
    alert("ลบไม่สำเร็จ: " + err.message)
  }
}

//form error helpers
function showFormErr(msg) {
  const el = document.getElementById("form-err")
  el.textContent = msg
  el.style.display = "block"
}

function clearFormErr() {
  document.getElementById("form-err").style.display = "none"
}