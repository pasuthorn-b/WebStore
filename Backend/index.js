const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// serve frontend assets directly from project structure
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// serve uploads
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname); 
    const name = `${Date.now()}-${Math.floor(Math.random() * 10000)}${ext}`;
    cb(null, name);
  }
});
const upload = multer({ storage });

const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'webdb',
    port: 8820,
    multipleStatements: true
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        process.exit(1);
    }
    console.log('Connected to MySQL Database!');

    const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  phone VARCHAR(50),
  password VARCHAR(255) NOT NULL,
  role ENUM('customer','admin') NOT NULL DEFAULT 'customer',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  price DECIMAL(12,2) NOT NULL DEFAULT 0,
  stock INT NOT NULL DEFAULT 0,
  \`desc\` TEXT,
  category VARCHAR(100),
  img VARCHAR(255),
  imgType VARCHAR(50),
  imgUrl VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  customer VARCHAR(200) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address TEXT NOT NULL,
  userId INT,
  status VARCHAR(50) NOT NULL DEFAULT 'รอยืนยัน',
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  orderId INT NOT NULL,
  productId INT,
  qty INT NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  name VARCHAR(250),
  FOREIGN KEY (orderId) REFERENCES orders(id) ON DELETE CASCADE
);
`;

    db.query(schema, (schemaErr) => {
      if (schemaErr) console.error('Schema creation error:', schemaErr);
      else console.log('Database schema ready.');
    });
});

function sendError(res, err, status = 500) {
  console.error(err);
  return res.status(status).json({ error: err.message || err.toString() });
}

function generateToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

// ---- users/auth ----
app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !phone || !password) return res.status(400).json({ error: 'ข้อมูลไม่ครบ' });

  const checkSql = 'SELECT id FROM users WHERE email = ?';
  db.query(checkSql, [email], (err, results) => {
    if (err) return sendError(res, err);
    if (results.length > 0) return res.status(409).json({ error: 'อีเมลถูกใช้งานแล้ว' });

    const insertSql = 'INSERT INTO users (name,email,phone,password,role) VALUES (?,?,?,?,?)';
    db.query(insertSql, [name, email, phone, password, 'customer'], (err2, insertResult) => {
      if (err2) return sendError(res, err2);
      return res.json({ id: insertResult.insertId, name, email, phone, role: 'customer' });
    });
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'ข้อมูลไม่ครบ' });

  const sql = 'SELECT id,name,email,phone,role FROM users WHERE email = ? AND password = ? LIMIT 1';
  db.query(sql, [email, password], (err, users) => {
    if (err) return sendError(res, err);
    if (users.length === 0) return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' });

    const user = users[0];
    const token = generateToken();
    return res.json({ token, user });
  });
});

app.get('/api/users', (req, res) => {
  const sql = 'SELECT id,name,email,phone,role FROM users';
  db.query(sql, (err, data) => {
    if (err) return sendError(res, err);
    return res.json(data);
  });
});

// ---- products ----
app.get('/api/products', (req, res) => {
  db.query('SELECT * FROM products ORDER BY id DESC', (err, data) => {
    if (err) return sendError(res, err);
    return res.json(data);
  });
});

app.get('/api/products/:id', (req, res) => {
  db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err, data) => {
    if (err) return sendError(res, err);
    if (data.length === 0) return res.status(404).json({ error: 'ไม่พบสินค้า' });
    return res.json(data[0]);
  });
});

app.post('/api/products', (req, res) => {
  const { name, price, stock, desc, category, img, imgType, imgUrl } = req.body;
  if (!name || price == null) return res.status(400).json({ error: 'ข้อมูลสินค้าไม่ครบ' });

  const sql = 'INSERT INTO products (name,price,stock,`desc`,category,img,imgType,imgUrl) VALUES (?,?,?,?,?,?,?,?)';
  db.query(sql, [name, price, stock || 0, desc || '', category || '', img || '', imgType || 'emoji', imgUrl || ''], (err, result) => {
    if (err) return sendError(res, err);
    db.query('SELECT * FROM products WHERE id = ?', [result.insertId], (err2, rows) => {
      if (err2) return sendError(res, err2);
      return res.json(rows[0]);
    });
  });
});

app.put('/api/products/:id', (req, res) => {
  const { name, price, stock, desc, category, img, imgType, imgUrl } = req.body;
  const sql = 'UPDATE products SET name=?,price=?,stock=?,`desc`=?,category=?,img=?,imgType=?,imgUrl=? WHERE id=?';
  db.query(sql, [name, price, stock, desc, category, img, imgType, imgUrl, req.params.id], (err) => {
    if (err) return sendError(res, err);
    db.query('SELECT * FROM products WHERE id = ?', [req.params.id], (err2, rows) => {
      if (err2) return sendError(res, err2);
      if (rows.length === 0) return res.status(404).json({ error: 'ไม่พบสินค้า' });
      return res.json(rows[0]);
    });
  });
});

app.delete('/api/products/:id', (req, res) => {
  db.query('DELETE FROM products WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return sendError(res, err);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบสินค้า' });
    return res.json({ ok: true });
  });
});

app.post('/api/products/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'ไม่มีไฟล์ถูกส่ง' });
  const urlPath = '/uploads/' + req.file.filename;
  return res.json({ url: urlPath });
});

// ---- orders ----
app.get('/api/orders', (req, res) => {
  db.query('SELECT * FROM orders ORDER BY createdAt DESC', (err, orders) => {
    if (err) return sendError(res, err);
    if (orders.length === 0) return res.json([]);

    const orderIds = orders.map(o => o.id);
    db.query('SELECT * FROM order_items WHERE orderId IN (?)', [orderIds], (err2, items) => {
      if (err2) return sendError(res, err2);
      const grouped = orders.map(o => ({
        ...o,
        items: items.filter(i => i.orderId === o.id),
      }));
      return res.json(grouped);
    });
  });
});

app.get('/api/orders/:id', (req, res) => {
  const orderId = req.params.id;
  db.query('SELECT * FROM orders WHERE id = ?', [orderId], (err, orders) => {
    if (err) return sendError(res, err);
    if (orders.length === 0) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
    const order = orders[0];
    db.query('SELECT * FROM order_items WHERE orderId = ?', [orderId], (err2, items) => {
      if (err2) return sendError(res, err2);
      return res.json({ ...order, items });
    });
  });
});

app.post('/api/orders', (req, res) => {
  const { customer, phone, address, userId, items } = req.body;
  if (!customer || !phone || !address || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'ข้อมูลคำสั่งซื้อไม่ครบ' });
  }

  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const createdAt = new Date();
  const status = 'รอยืนยัน';

  db.query('INSERT INTO orders (customer,phone,address,userId,status,total,createdAt) VALUES (?,?,?,?,?,?,?)',
    [customer, phone, address, userId || null, status, total, createdAt], (err, result) => {
      if (err) return sendError(res, err);
      const orderId = result.insertId;

      const itemRows = items.map(i => [orderId, i.productId, i.qty, i.price, i.name || null]);
      db.query('INSERT INTO order_items (orderId,productId,qty,price,name) VALUES ?', [itemRows], (err2) => {
        if (err2) return sendError(res, err2);
        return res.json({ id: orderId, customer, phone, address, userId, status, total, createdAt, items });
      });
    });
});

app.patch('/api/orders/:id/status', (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });
  db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id], (err, result) => {
    if (err) return sendError(res, err);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'ไม่พบคำสั่งซื้อ' });
    return res.json({ ok: true });
  });
});

// fallback
app.use((req, res) => res.status(404).json({ error: 'ไม่พบ API endpoint' }));

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});