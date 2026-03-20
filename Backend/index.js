const express  = require('express')
const mysql    = require('mysql2')
const cors     = require('cors')
const multer   = require('multer')
const path     = require('path')
const fs       = require('fs')
const bcrypt   = require('bcryptjs')
const jwt      = require('jsonwebtoken')

const app = express()
app.use(cors())
app.use(express.json())

const JWT_SECRET = process.env.JWT_SECRET || 'myshop_secret_key_2026'

//serve frontend
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend')
app.use(express.static(FRONTEND_DIR))

// upload
const UPLOAD_DIR = path.join(__dirname, 'uploads')
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })
app.use('/uploads', express.static(UPLOAD_DIR))

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename:    (req, file, cb) => {
    const ext  = path.extname(file.originalname)
    const name = `${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`
    cb(null, name)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // max 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg','image/png','image/webp','image/gif']
    if (allowed.includes(file.mimetype)) cb(null, true)
    else cb(new Error('อนุญาตเฉพาะไฟล์รูปภาพเท่านั้น'))
  }
})

// database 
const db = mysql.createConnection({
  host:     'localhost',
  user:     'root',
  password: 'root',
  database: 'webdb',
  port:     8820,
  multipleStatements: true
})

db.connect((err) => {
  if (err) { console.error('MySQL connect error:', err); process.exit(1) }
  console.log('Connected to MySQL!')

  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      name      VARCHAR(150) NOT NULL,
      email     VARCHAR(150) NOT NULL UNIQUE,
      phone     VARCHAR(50),
      password  VARCHAR(255) NOT NULL,
      role      ENUM('customer','admin') NOT NULL DEFAULT 'customer',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS products (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      name      VARCHAR(200) NOT NULL,
      price     DECIMAL(12,2) NOT NULL DEFAULT 0,
      stock     INT NOT NULL DEFAULT 0,
      \`desc\`  TEXT,
      category  VARCHAR(100),
      img       VARCHAR(255),
      imgType   VARCHAR(50),
      imgUrl    VARCHAR(255),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS orders (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      customer  VARCHAR(200) NOT NULL,
      phone     VARCHAR(50) NOT NULL,
      address   TEXT NOT NULL,
      userId    INT,
      status    VARCHAR(50) NOT NULL DEFAULT 'รอยืนยัน',
      total     DECIMAL(12,2) NOT NULL DEFAULT 0,
      createdAt DATETIME NOT NULL,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id        INT AUTO_INCREMENT PRIMARY KEY,
      orderId   INT NOT NULL,
      productId INT,
      qty       INT NOT NULL,
      price     DECIMAL(12,2) NOT NULL,
      name      VARCHAR(250),
      FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
    );
  `
  db.query(schema, (err) => {
    if (err) console.error('Schema error:', err)
    else console.log('Database schema ready.')
  })
})

// helpers
const sendError = (res, err, status = 500) => {
  console.error(err)
  return res.status(status).json({ error: err.message || err.toString() })
}

// middleware เช็ค JWT
const requireAuth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' })
  }
}

// middleware เช็ค admin
const requireAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1]
  if (!token) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' })
  try {
    req.user = jwt.verify(token, JWT_SECRET)
    if (req.user.role !== 'admin')
      return res.status(403).json({ error: 'ไม่มีสิทธิ์เข้าถึง' })
    next()
  } catch {
    return res.status(401).json({ error: 'Token ไม่ถูกต้องหรือหมดอายุ' })
  }
}

//AUTH API 


// สมัครสมาชิก (Register)
app.post('/api/auth/register', async (req, res) => {

  const { name, email, phone, password } = req.body

  if (!name || !email || !phone || !password)
    return res.status(400).json({ error: 'ข้อมูลไม่ครบ' })

  db.query('SELECT id FROM users WHERE email = ?', [email], async (err, rows) => {

    if (err) return sendError(res, err)

    if (rows.length > 0)
      return res.status(409).json({ error: 'อีเมลถูกใช้งานแล้ว' })

    try {

      const hashed = await bcrypt.hash(password, 10)

      db.query(
        'INSERT INTO users (name,email,phone,password,role) VALUES (?,?,?,?,?)',
        [name, email, phone, hashed, 'customer'],
        (err2, result) => {

          if (err2) return sendError(res, err2)

          return res.json({
            id: result.insertId,
            name,
            email,
            phone,
            role: 'customer'
          })
        }
      )

    } catch (e) {
      return sendError(res, e)
    }
  })
})


// เข้าสู่ระบบ (Login)
app.post('/api/auth/login', (req, res) => {

  const { email, password } = req.body

  if (!email || !password)
    return res.status(400).json({ error: 'ข้อมูลไม่ครบ' })

  db.query(
    'SELECT id,name,email,phone,role,password FROM users WHERE email = ? LIMIT 1',
    [email],
    async (err, rows) => {

      if (err) return sendError(res, err)

      if (rows.length === 0)
        return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })

      const user = rows[0]

      try {
        const match = await bcrypt.compare(password, user.password)

        if (!match)
          return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })

        const token = jwt.sign(
          { id: user.id, name: user.name, email: user.email, role: user.role },
          JWT_SECRET,
          { expiresIn: '8h' }
        )
        const { password: _, ...userWithoutPassword } = user
        return res.json({ token, user: userWithoutPassword })

      } catch (e) {
        return sendError(res, e)
      }
    }
  )
})

// ดึงข้อมูลผู้ใช้ทั้งหมด (เฉพาะ admin เท่านั้น)
app.get('/api/users', requireAdmin, (req, res) => {

  db.query('SELECT id,name,email,phone,role,createdAt FROM users', (err, data) => {
    if (err) return sendError(res, err)
    return res.json(data)
  })
})


// PRODUCTS

// อัปโหลดรูปสินค้า (ต้อง login เป็น admin ก่อน)
app.post('/api/products/upload', requireAdmin, upload.single('image'), (req, res) => {

  if (!req.file) return res.status(400).json({ error: 'ไม่มีไฟล์ถูกส่ง' })
  return res.json({ url: '/uploads/' + req.file.filename })
})

// ดึงข้อมูลสินค้าทั้งหมด
app.get('/api/products', (req, res) => {
  
  db.query('SELECT * FROM products ORDER BY id DESC', (err, data) => {
    if (err) return sendError(res, err)
    return res.json(data)
  })
})


// ดึงข้อมูลสินค้า 1 ชิ้นตาม id
app.get('/api/products/:id', (req, res) => {

  db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err, data) => {
    if (err) return sendError(res, err)
    if (data.length === 0) return res.status(404).json({ error: 'ไม่พบสินค้า' })
    return res.json(data[0])
  })
})


// เพิ่มสินค้าใหม่ (ต้องเป็น admin เท่านั้น)
app.post('/api/products', requireAdmin, (req, res) => {

  const { name, price, stock, desc, category, img, imgType, imgUrl } = req.body

  if (!name || price == null) return res.status(400).json({ error: 'ข้อมูลสินค้าไม่ครบ' })

  db.query(
    'INSERT INTO products (name,price,stock,`desc`,category,img,imgType,imgUrl) VALUES (?,?,?,?,?,?,?,?)',
    [name, price, stock || 0, desc || '', category || '', img || '', imgType || 'emoji', imgUrl || ''],
    (err, result) => {
      if (err) return sendError(res, err)

      db.query('SELECT * FROM products WHERE id = ?', [result.insertId], (err2, rows) => {
        if (err2) return sendError(res, err2)
        return res.json(rows[0])
      })
    }
  )
})


// แก้ไขข้อมูลสินค้า (ต้องเป็น admin)
app.put('/api/products/:id', requireAdmin, (req, res) => {

  const { name, price, stock, desc, category, img, imgType, imgUrl } = req.body

  db.query(
    'UPDATE products SET name=?,price=?,stock=?,`desc`=?,category=?,img=?,imgType=?,imgUrl=? WHERE id=?',
    [name, price, stock, desc, category, img, imgType, imgUrl, req.params.id],
    (err) => {

      if (err) return sendError(res, err)

      db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err2, rows) => {
        if (err2) return sendError(res, err2)

        if (rows.length === 0) return res.status(404).json({ error: 'ไม่พบสินค้า' })

        return res.json(rows[0])
      })
    }
  )
})


// ลบสินค้า (ต้องเป็น admin)
app.delete('/api/products/:id', requireAdmin, (req, res) => {

  db.query('DELETE FROM products WHERE id = ?', [req.params.id], (err, result) => {

    if (err) return sendError(res, err)

    if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบสินค้า' })

    return res.json({ ok: true })
  })
})


//  ORDERS

// ดึงออเดอร์ของ user ที่ login อยู่
app.get('/api/orders/my', requireAuth, (req, res) => {
  const userId = req.user.id
  db.query('SELECT * FROM orders WHERE userId = ? ORDER BY createdAt DESC', [userId], (err, orders) => {
    if (err) return sendError(res, err)
    if (orders.length === 0) return res.json([])

    const ids = orders.map(o => o.id)
    db.query(`
      SELECT oi.id, oi.orderId, oi.productId, oi.qty, oi.price,
        COALESCE(oi.name, p.name) as name
      FROM order_items oi
      LEFT JOIN products p ON oi.productId = p.id
      WHERE oi.orderId IN (?)
    `, [ids], (err2, items) => {
      if (err2) return sendError(res, err2)
      const result = orders.map(o => ({
        ...o,
        items: items.filter(i => i.orderId === o.id)
      }))
      return res.json(result)
    })
  })
})

// ดึงออเดอร์ทั้งหมด (admin)
app.get('/api/orders', requireAdmin, (req, res) => {
  db.query('SELECT * FROM orders ORDER BY createdAt DESC', (err, orders) => {
    if (err) return sendError(res, err)
    if (orders.length === 0) return res.json([])

    const ids = orders.map(o => o.id)
    db.query(`
      SELECT oi.id, oi.orderId, oi.productId, oi.qty, oi.price,
        COALESCE(oi.name, p.name) as name
      FROM order_items oi
      LEFT JOIN products p ON oi.productId = p.id
      WHERE oi.orderId IN (?)
    `, [ids], (err2, items) => {
      if (err2) return sendError(res, err2)
      const result = orders.map(o => ({
        ...o,
        items: items.filter(i => i.orderId === o.id)
      }))
      return res.json(result)
    })
  })
})

// ดึงออเดอร์เดียว
app.get('/api/orders/:id', (req, res) => {
  db.query('SELECT * FROM orders WHERE id = ?', [req.params.id], (err, orders) => {
    if (err) return sendError(res, err)
    if (orders.length === 0) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' })
    const order = orders[0]
    db.query(`
      SELECT oi.id, oi.orderId, oi.productId, oi.qty, oi.price,
        COALESCE(oi.name, p.name) as name
      FROM order_items oi
      LEFT JOIN products p ON oi.productId = p.id
      WHERE oi.orderId = ?
    `, [req.params.id], (err2, items) => {
      if (err2) return sendError(res, err2)
      return res.json({ ...order, items })
    })
  })
})

// สร้างออเดอร์
app.post('/api/orders', (req, res) => {
  const { customer, phone, address, userId, items } = req.body
  if (!customer || !phone || !address || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'ข้อมูลคำสั่งซื้อไม่ครบ' })

  const total     = items.reduce((sum, i) => sum + i.price * i.qty, 0)
  const createdAt = new Date()

  db.query(
    'INSERT INTO orders (customer,phone,address,userId,status,total,createdAt) VALUES (?,?,?,?,?,?,?)',
    [customer, phone, address, userId || null, 'รอยืนยัน', total, createdAt],
    (err, result) => {
      if (err) return sendError(res, err)
      const orderId  = result.insertId
      const itemRows = items.map(i => [orderId, i.productId || null, i.qty, i.price, i.name || null])
      db.query('INSERT INTO order_items (orderId,productId,qty,price,name) VALUES ?', [itemRows], (err2) => {
        if (err2) return sendError(res, err2)

        // ── หัก stock 
        const updates = items
          .filter(i => i.productId)
          .map(i => new Promise((resolve, reject) => {
            db.query(
              'UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?',
              [i.qty, i.productId, i.qty],
              (err3) => err3 ? reject(err3) : resolve()
            )
          }))

        Promise.all(updates)
          .then(() => res.json({
            id: orderId, customer, phone, address,
            userId, status: 'รอยืนยัน', total, createdAt, items
          }))
          .catch(err3 => sendError(res, err3))
      })
    }
  )
})

// อัปเดตสถานะ (admin)
app.patch('/api/orders/:id/status', requireAdmin, (req, res) => {
  const { status } = req.body
  if (!status) return res.status(400).json({ error: 'status required' })
  db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id], (err, result) => {
    if (err) return sendError(res, err)
    if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' })
    return res.json({ ok: true })
  })
})
//404 fallback
app.use((req, res) => res.status(404).json({ error: 'ไม่พบ API endpoint' }))

const PORT = 4000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))