const mysql  = require('mysql2')
const bcrypt = require('bcryptjs')

const db = mysql.createConnection({
  host:     'localhost',
  user:     'root',
  password: 'root',
  database: 'webdb',
  port:     8820
})

async function main() {
  const hashed = await bcrypt.hash('admin1234', 10)
  db.query(
    'INSERT INTO users (name,email,phone,password,role) VALUES (?,?,?,?,?)',
    ['Admin', 'admin@shop.com', '099-000-0000', hashed, 'admin'],
    (err, result) => {
      if (err) {
        console.error(err)
      } else {
        console.log('✅ สร้าง admin สำเร็จ id:', result.insertId)
      }
      db.end()
    }
  )
}

main()