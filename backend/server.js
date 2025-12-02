import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import XLSX from "xlsx";
import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();


const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------------- Static Files --------------------------- //
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// ======================= SERVE FRONTEND & ADMIN ======================= //

// صفحة الموقع الرئيسية
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "../frontend/index.html"));
});

// ملفات لوحة التحكم admin/
app.use("/admin", express.static(path.join(process.cwd(), "../admin")));

// صفحة layout.html خارج المجلدات
app.get("/layout.html", (req, res) => {
  res.sendFile(path.join(process.cwd(), "../layout.html"));
});

// صفحة تسجيل دخول الأدمن
app.get("/admin-login", (req, res) => {
  res.sendFile(path.join(process.cwd(), "../admin/login.html"));
});

// تحميل الملفات الأخرى في المشروع الرئيسي
app.use("/", express.static(path.join(process.cwd(), "..")));

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail(to, subject, html) {
  try {
    const result = await resend.emails.send({
      from: "Gamalek <onboarding@resend.dev>",
      to,
      subject,
      html
    });

    console.log("✔ Email Sent Successfully:", result);
    return true;

  } catch (err) {
    console.error("❌ Email Sending Error:");
    console.error("Message:", err.message);
    console.error("Status:", err.statusCode || "NO_STATUS");
    console.error("Details:", err.response || err);
    return false;
  }
}



const dbFile = path.join(process.cwd(), "database.db");
const db = new sqlite3.Database(dbFile);


// Create uploads folder
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// --------------------------- LOGIN --------------------------- //
// --------------------------- REGISTER --------------------------- //
app.post("/api/register", async (req, res) => {
  const { name, phone, email, password, address } = req.body;

  db.get("SELECT * FROM users WHERE phone=? OR email=?", [phone, email], (err, row) => {
    if (row) {
      return res.json({ success: false, message: "رقم الجوال أو الإيميل مسجل مسبقاً" });
    }

    const verifyCode = Math.floor(100000 + Math.random() * 900000).toString();

    db.run(
      `INSERT INTO users (name, phone, email, password, address, verify_code, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [name, phone, email, password, address, verifyCode],
      async function (err2) {
        if (err2) return res.json({ success: false, message: "خطأ في السيرفر" });

        // إرسال الإيميل
        const sent = await sendEmail(
          email,
          "تفعيل حسابك",
          `<p>كود التفعيل الخاص بك هو: <b>${verifyCode}</b></p>`
        );

        if (!sent)
          return res.json({ success: false, message: "تعذر إرسال الإيميل" });

        return res.json({ success: true, id: this.lastID });
      }
    );
  });
});






app.post("/api/login", (req, res) => {
  const { phone, password } = req.body;

  db.get("SELECT * FROM users WHERE phone = ? AND password = ?", [phone, password], (err, row) => {
    if (!row) return res.json({ success: false, message: "بيانات غير صحيحة" });

    if (row.email_verified == 0)
      return res.json({ success: false, verify: true, message: "يرجى تفعيل الحساب" });

    res.json({ success: true, user: row });
  });
});
// --------------------------- تفعيل الحساب --------------------------- //
app.post("/api/verify", (req, res) => {
  const { phone, code } = req.body;

  db.get("SELECT * FROM users WHERE TRIM(phone)=TRIM(?) AND verify_code=?", [phone, code], (err, row) => {
    if (!row) return res.json({ success: false, message: "كود خاطئ" });

    db.run("UPDATE users SET email_verified=1, verify_code=NULL WHERE phone=?", [phone]);
    res.json({ success: true });
  });
});


app.post("/api/forgot", (req, res) => {
  const { email } = req.body;

  db.get("SELECT * FROM users WHERE email=?", [email], async (err, user) => {
    if (!user) return res.json({ success: false, message: "الإيميل غير موجود" });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    db.run("UPDATE users SET reset_code=? WHERE email=?", [resetCode, email]);

    await sendEmail(
  email,
  "إعادة ضبط كلمة المرور",
  `<p>كود استعادة كلمة المرور هو: <b>${resetCode}</b></p>`
);


    res.json({ success: true });
  });
});

// ========================= RESEND VERIFY CODE ========================= //
app.post("/api/resend-verify", (req, res) => {
  const { phone } = req.body;

  db.get("SELECT * FROM users WHERE phone=?", [phone], (err, user) => {
    if (!user) {
      return res.json({ success: false, message: "لا يوجد حساب بهذا الجوال" });
    }

    // إنشاء كود جديد
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();

    db.run(
      "UPDATE users SET verify_code=? WHERE phone=?",
      [newCode, phone],
      async (err2) => {
        if (err2) {
          return res.json({ success: false, message: "خطأ في السيرفر" });
        }

        // إرسال الإيميل
        await sendEmail(
  user.email,
  "إعادة إرسال كود التفعيل",
  `<p>كود التفعيل الجديد هو: <b>${newCode}</b></p>`
);


        res.json({ success: true, message: "تم إرسال كود جديد" });
      }
    );
  });
});


app.post("/api/reset-password", (req, res) => {
  const { email, code, new_password } = req.body;

  db.get("SELECT * FROM users WHERE email=? AND reset_code=?", [email, code], (err, user) => {
    if (!user) return res.json({ success: false, message: "الكود غير صحيح" });

    db.run("UPDATE users SET password=?, reset_code=NULL WHERE email=?", [new_password, email]);
    res.json({ success: true });
  });
});


// --------------------------- CREATE TABLES --------------------------- //
db.serialize(() => {
  // Brands
  db.run(`
    CREATE TABLE IF NOT EXISTS brands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      brand_code TEXT,
      image_url TEXT,
      featured INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      base_price REAL NOT NULL,
      askon_code TEXT,
      intl_code TEXT,
      image_url TEXT,
      category TEXT,
      description TEXT,
      discount_value REAL DEFAULT 0,
      discount_type TEXT DEFAULT "none",
      featured INTEGER DEFAULT 0,
      brand_id INTEGER,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add description column if missing
  db.run(`ALTER TABLE products ADD COLUMN description TEXT`, (err) => {});

// -------- Users Table (Clients) -------- //
db.run(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  password TEXT,
  address TEXT,
  email_verified INTEGER DEFAULT 0,
  verify_code TEXT,
  reset_code TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
`);



  // ---------------- Order Tables ---------------- //
    // جدول الطلبات الأساسي
  db.run(`
    CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_phone2 TEXT,
  customer_address TEXT,
  customer_location TEXT,
  customer_notes TEXT,
  date TEXT,
  status TEXT DEFAULT 'new',
  
  -- الشحن
  shipping REAL DEFAULT 15,
  shipping_vat REAL DEFAULT 2.25,

  -- الإجماليات
  total REAL DEFAULT 0,
  total_with_shipping REAL DEFAULT 0
)
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER,
      product_id INTEGER,
      name TEXT,
      base_price REAL,
      qty INTEGER,
      discount_value REAL,
      discount_type TEXT,
      price_after_discount REAL,
      price_with_vat REAL,
      total REAL,
      FOREIGN KEY(order_id) REFERENCES orders(id)
    )
  `);



});

// --------------------------- BRANDS API --------------------------- //
app.post("/api/admin/brands", (req, res) => {
  const { name, brand_code, image_url } = req.body;

  db.run(
    `INSERT INTO brands (name, brand_code, image_url) VALUES (?, ?, ?)`,
    [name, brand_code, image_url],
    function (err) {
      if (err) return res.json({ error: "Insert Error" });
      res.json({ success: true, id: this.lastID });
    }
  );
});
// ======================= EXPORT BRANDS EXCEL ======================= //
app.get("/api/admin/brands/excel", (req, res) => {
  db.all("SELECT * FROM brands", (err, rows) => {
    if (err) return res.json({ error: "Brands Export Error" });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Brands");

    const filePath = "brands.xlsx";
    XLSX.writeFile(workbook, filePath);

    res.download(filePath);
  });
});

app.put("/api/admin/brands/:id", (req, res) => {
  const id = req.params.id;
  const { name, brand_code, image_url, featured } = req.body;

  db.run(
    `
    UPDATE brands SET
      name=?, brand_code=?, image_url=?, featured=?
    WHERE id=?
  `,
    [name, brand_code, image_url, featured, id],
    (err) => {
      if (err) return res.json({ error: "Update Error" });
      res.json({ success: true });
    }
  );
});

app.delete("/api/admin/brands/:id", (req, res) => {
  db.run(`DELETE FROM brands WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.json({ error: "Delete Error" });
    res.json({ success: true });
  });
});

app.post("/api/admin/brands/feature", (req, res) => {
  const { id, featured } = req.body;

  db.run(
    `UPDATE brands SET featured=? WHERE id=?`,
    [featured, id],
    (err) => {
      res.json({ success: true });
    }
  );
});

app.get("/api/admin/brands", (req, res) => {
  db.all(
    `
    SELECT 
      b.*,
      (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id) AS product_count
    FROM brands b
    ORDER BY b.featured DESC, b.id DESC
  `,
    (err, rows) => res.json(rows)
  );
});

// --------------------------- PRODUCTS API --------------------------- //
app.post("/api/admin/products", (req, res) => {
  const {
    name,
    base_price,
    askon_code,
    intl_code,
    image_url,
    category,
    description,
    discount_value,
    discount_type,
    featured,
    brand_id,
  } = req.body;

  db.run(
    `
    INSERT INTO products
    (name, base_price, askon_code, intl_code, image_url, category,
     description, discount_value, discount_type, featured, brand_id)
    VALUES(?,?,?,?,?,?,?,?,?,?,?)
  `,
    [
      name,
      base_price,
      askon_code,
      intl_code,
      image_url,
      category,
      description,
      discount_value,
      discount_type,
      featured,
      brand_id,
    ],
    (err) => {
      if (err) return res.json({ error: "Insert Error" });
      res.json({ success: true });
    }
  );
});

app.put("/api/admin/products/:id", (req, res) => {
  const id = req.params.id;

  const {
    name,
    base_price,
    askon_code,
    intl_code,
    image_url,
    category,
    description,
    discount_value,
    discount_type,
    featured,
    brand_id,
  } = req.body;

  db.run(
    `
    UPDATE products SET
      name=?, base_price=?, askon_code=?, intl_code=?, image_url=?,
      category=?, description=?, discount_value=?, discount_type=?, featured=?, brand_id=?
    WHERE id=?
  `,
    [
      name,
      base_price,
      askon_code,
      intl_code,
      image_url,
      category,
      description,
      discount_value,
      discount_type,
      featured,
      brand_id,
      id,
    ],
    (err) => {
      if (err) return res.json({ error: "Update Error" });
      res.json({ success: true });
    }
  );
});

app.delete("/api/admin/products/:id", (req, res) => {
  db.run(`DELETE FROM products WHERE id=?`, [req.params.id], () => {
    res.json({ success: true });
  });
});

app.post("/api/admin/products/feature", (req, res) => {
  const { id, featured } = req.body;

  db.run(
    `UPDATE products SET featured=? WHERE id=?`,
    [featured, id],
    () => res.json({ success: true })
  );
});

app.get("/api/admin/products", (req, res) => {
  db.all(
    `
    SELECT 
      p.*, 
      b.name AS brand_name,
      b.brand_code AS brand_code
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.id
    ORDER BY p.id DESC
  `,
    (err, rows) => res.json(rows)
  );
});
// ======================= UPLOAD EXCEL ======================= //
import multer from "multer";
const upload = multer({ dest: "uploads/" });

app.post("/api/admin/products/upload-excel", upload.single("file"), (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    data.forEach(p => {
      db.run(
        `INSERT INTO products 
        (name, base_price, askon_code, intl_code, image_url, category, description, discount_value, discount_type, featured, brand_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.name || "",
          p.base_price || 0,
          p.askon_code || "",
          p.intl_code || "",
          p.image_url || "",
          p.category || "",
          p.description || "",
          p.discount_value || 0,
          p.discount_type || "none",
          p.featured || 0,
          p.brand_id || null
        ]
      );
    });

    return res.json({ success: true });
  } catch (err) {
    return res.json({ error: "Excel Upload Error", details: err });
  }
});
// ======================= EXPORT EXCEL ======================= //
app.get("/api/admin/products/export", (req, res) => {
  db.all("SELECT * FROM products", (err, rows) => {
    if (err) return res.json({ error: "Export Error" });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");

    const filePath = "products.xlsx";
    XLSX.writeFile(workbook, filePath);

    res.download(filePath);
  });
});

// --------------------------- ORDERS API --------------------------- //

// Create Order
// Create Order
app.post("/api/orders", (req, res) => {
  const shipping = 15;             // قيمة الشحن
  const shipping_vat = shipping * 0.15;   // ضريبة الشحن 15%
  const { 
    customer_name,
    customer_phone,
    customer_phone2,
    customer_address,
    customer_location,
    customer_notes,
    items
  } = req.body;
  const phone2 = customer_phone2 || "";
  const notes = customer_notes || "";
  const address = customer_address || "";
  const location = customer_location || "";

  if (!items || items.length === 0)
    return res.json({ error: "No items provided" });

  const date = new Date().toLocaleString("ar-SA");

  db.run(`
    INSERT INTO orders 
    (customer_name, customer_phone, customer_phone2, customer_address, customer_location, customer_notes, date, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'new')
  `,
  [
    customer_name,
    customer_phone,
    customer_phone2 || "",
    customer_address || "",
    customer_location || "",
    customer_notes || "",
    date
  ],
  function (err) {

    if (err) return res.json({ error: "Order Insert Error" });

    const order_id = this.lastID;
    let total = 0;

items.forEach((item) => {

  let base = parseFloat(item.base_price) || 0;
  let qty = parseFloat(item.qty) || 1;
  let discountValue = parseFloat(item.discount_value) || 0;
  let discountType = item.discount_type || "none";

  // السعر بعد الخصم
  let priceAfterDiscount = base;

  if (discountType === "percent") {
    priceAfterDiscount = base - (base * (discountValue / 100));
  } else if (discountType === "fixed") {
    priceAfterDiscount = base - discountValue;
  }

  if (priceAfterDiscount < 0) priceAfterDiscount = 0;

  // السعر بعد الضريبة
  let priceWithVat = priceAfterDiscount * 1.15;

  // إجمالي الصنف
  let itemTotal = priceWithVat * qty;

  total += itemTotal;

  db.run(
    `INSERT INTO order_items 
    (order_id, product_id, name, qty, base_price, price_after_discount, price_with_vat, total)
    VALUES (?,?,?,?,?,?,?,?)`,
    [
      order_id,
      item.product_id || null,
      item.name,
      qty,
      base,
      priceAfterDiscount,
      priceWithVat,
      itemTotal
    ]
  );

});


const total_with_shipping = total + shipping + shipping_vat;

db.run(
  `UPDATE orders 
   SET total=?, shipping=?, shipping_vat=?, total_with_shipping=?
   WHERE id=?`,
  [
    total,
    shipping,
    shipping_vat,
    total_with_shipping,
    order_id
  ]
);




    res.json({ success: true, order_id });
  });
});


// Get all orders

app.get("/api/orders/:id", (req, res) => {
  const id = req.params.id;

  db.get("SELECT * FROM orders WHERE id=?", [id], (err, order) => {
    if (err || !order) return res.json({ error: "Order not found" });

    db.all("SELECT * FROM order_items WHERE order_id=?", [id], (err2, items) => {
      if (err2) return res.json({ error: "Items not found" });

      res.json({ order, items });
    });
  });
});


// Get orders (Admin gets all, user gets his only)
app.get("/api/orders", (req, res) => {
  const phone = req.query.phone;

  if (phone) {
    // طلبات هذا العميل فقط
    db.all(
      "SELECT * FROM orders WHERE customer_phone = ? ORDER BY id DESC",
      [phone],
      (err, rows) => {
        if (err) return res.json({ error: err.message });
        res.json(rows);
      }
    );
  } else {
    // كل الطلبات للادمن
    db.all(
      "SELECT * FROM orders ORDER BY id DESC",
      [],
      (err, rows) => {
        if (err) return res.json({ error: err.message });
        res.json(rows);
      }
    );
  }
});







// Get full item info with images + askon + intl
app.get("/api/order_items_full/:order_id", (req, res) => {
  const order_id = req.params.order_id;

  const sql = `
    SELECT 
      oi.*,
      p.image_url,
      p.askon_code,
      p.intl_code
    FROM order_items oi
    LEFT JOIN products p ON oi.product_id = p.id
    WHERE oi.order_id = ?
  `;

  db.all(sql, [order_id], (err, rows) => {
    if (err) return res.json({ error: "DB Error", details: err });
    res.json(rows);
  });
});

// ======================= GET ALL USERS (ADMIN) ======================= //
app.get("/api/admin/users", (req, res) => {
  db.all("SELECT id, name, phone, email, address, created_at FROM users ORDER BY id DESC",
    (err, rows) => {
      if (err) return res.json({ error: "Users Fetch Error" });
      res.json(rows);
    }
  );
});


// Update order status
app.put("/api/orders/:id/status", (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  db.run(`UPDATE orders SET status=? WHERE id=?`, [status, id], (err) => {
    if (err) return res.json({ error: "Status Update Error" });
    res.json({ success: true });
  });
});

// --------------------------- START SERVER --------------------------- //
app.listen(PORT, () =>
  console.log("✔ Server running at http://localhost:" + PORT)
);





