// ถ้า login อยู่แล้ว ไม่ต้องสมัครใหม่ → ไปหน้าร้านเลย
if (api.auth.isLoggedIn()) {
  location.href = "../Stores pages/index.html"
}

// ── แสดง error ────────────────────────────────────────────────
function showError(msg) {
  const el = document.getElementById("err-msg")
  el.textContent = msg
  el.style.display = "block"
  document.getElementById("ok-msg").style.display = "none"
}

// ── แสดง success ──────────────────────────────────────────────
function showSuccess(msg) {
  const el = document.getElementById("ok-msg")
  el.textContent = msg
  el.style.display = "block"
  document.getElementById("err-msg").style.display = "none"
}

// ── validate ──────────────────────────────────────────────────
function validate(name, email, password, confirm) {
  if (!name)              return "กรุณากรอกชื่อ-นามสกุล"
  if (!email)             return "กรุณากรอกอีเมล"
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                          return "รูปแบบอีเมลไม่ถูกต้อง"
  if (!password)          return "กรุณากรอกรหัสผ่าน"
  if (password.length < 6) return "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"
  if (password !== confirm) return "รหัสผ่านไม่ตรงกัน"
  return null // ผ่านหมด
}

// ── สมัครสมาชิก ───────────────────────────────────────────────
async function handleRegister() {
  const name     = document.getElementById("name").value.trim()
  const email    = document.getElementById("email").value.trim()
  const phone    = document.getElementById("phone").value.trim()
  const password = document.getElementById("password").value
  const confirm  = document.getElementById("confirm").value
  const btn      = document.getElementById("register-btn")

  // เช็คก่อนส่ง
  const err = validate(name, email, password, confirm)
  if (err) return showError(err)

  // ปิดปุ่มระหว่างรอ API
  btn.disabled = true
  btn.textContent = "กำลังสมัคร..."

  try {
    // 1. สมัครสมาชิก
    await api.auth.register({ name, email, phone, password })

    // 2. login ให้เลยอัตโนมัติ
    await api.auth.login({ email, password })

    // 3. แจ้งสำเร็จ แล้วพาไปหน้าร้าน
    showSuccess("สมัครสมาชิกสำเร็จ! กำลังพาไปหน้าร้านค้า...")
    setTimeout(() => {
      location.href = "../Stores pages/index.html"
    }, 1200)

  } catch (error) {
    showError(error.message || "สมัครสมาชิกไม่สำเร็จ กรุณาลองใหม่")
    btn.disabled = false
    btn.textContent = "สมัครสมาชิก"
  }
}

// ── กด Enter ส่งฟอร์มได้เลย ───────────────────────────────────
document.addEventListener("keydown", e => {
  if (e.key === "Enter") handleRegister()
})