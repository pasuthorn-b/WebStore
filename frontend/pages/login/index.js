if (api.auth.isLoggedIn()) location.href = "../Stores pages/index.html"

async function handleLogin() {
  const email    = document.getElementById("email").value.trim()
  const password = document.getElementById("password").value
  const errEl    = document.getElementById("err-msg")
  const btn      = document.getElementById("login-btn")

  console.log("handleLogin called")

  if (!email || !password) {
    errEl.textContent = "กรุณากรอกอีเมลและรหัสผ่าน"
    errEl.style.display = "block"
    return
  }

  btn.disabled = true
  btn.textContent = "กำลังเข้าสู่ระบบ..."

  try {
    await api.auth.login({ email, password })
    location.href = "../Stores pages/index.html"
  } catch (err) {
    errEl.textContent = err.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
    errEl.style.display = "block"
    btn.disabled = false
    btn.textContent = "เข้าสู่ระบบ"
  }
}

document.addEventListener("keydown", e => { if (e.key === "Enter") handleLogin() })