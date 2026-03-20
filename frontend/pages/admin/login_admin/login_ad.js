// ถ้าเป็น admin อยู่แล้ว ไม่ต้อง login ซ้ำ
window.onload = () => {
  const user = api.auth.getUser()
  if (user?.role === "admin") {
    location.href = "../admin.html"
  }
}

async function handleLogin() {
  const email    = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value
  const errEl    = document.getElementById("err-msg")
  const btn      = document.getElementById("login-btn")

  // เคลียร์ error เก่า
  errEl.style.display = "none"

  if (!email || !password) {
    errEl.textContent = "กรุณากรอกอีเมลและรหัสผ่าน"
    errEl.style.display = "block"
    return
  }

  btn.disabled = true
  btn.textContent = "กำลังเข้าสู่ระบบ..."

  try {
    const res = await api.auth.login({ email, password })

    // เช็ค role ต้องเป็น admin เท่านั้น
    if (res.user.role !== "admin") {
      api.auth.logout()
      errEl.textContent = "บัญชีนี้ไม่มีสิทธิ์เข้าระบบแอดมิน"
      errEl.style.display = "block"
      btn.disabled = false
      btn.textContent = "เข้าสู่ระบบ"
      return
    }

    // เป็น admin ไปหน้าจัดการเลย
    location.href = "../admin.html"

  } catch (err) {
    errEl.textContent = err.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
    errEl.style.display = "block"
    btn.disabled = false
    btn.textContent = "เข้าสู่ระบบ"
  }
}

// กด Enter ได้เลย
document.addEventListener("keydown", e => {
  if (e.key === "Enter") handleLogin()
})