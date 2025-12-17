import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import path from "path";
import fs from "fs";
import XLSX from "xlsx";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
import session from "express-session";
import multer from "multer";
dotenv.config();


const app = express();
const PORT = process.env.PORT || 3000;

// Base URL configuration - use environment variable or construct from request
const BASE_URL = process.env.BASE_URL || (process.env.PORT ? `http://localhost:${PORT}` : "http://localhost:3000");

// --------------------------- Session Configuration --------------------------- //
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-this-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(cors({
  credentials: true,
  origin: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------------- Static Files --------------------------- //
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Create uploads folder
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

// ======================= Multer Configuration ======================= //
const upload = multer({ 
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

const mail = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});


const dbFile = path.join(process.cwd(), "database.db");
const db = new sqlite3.Database(dbFile);

// --------------------------- ADMIN AUTHENTICATION --------------------------- //
// Admin credentials (يمكنك تغييرها أو حفظها في قاعدة البيانات)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || "outlet",
  password: process.env.ADMIN_PASSWORD || "123456"
};

// Middleware للتحقق من تسجيل دخول Admin
const checkAdminAuth = (req, res, next) => {
  if (req.session && req.session.adminLoggedIn === true) {
    return next();
  }
  return res.status(401).json({ success: false, message: "غير مصرح - يرجى تسجيل الدخول" });
};

// API endpoint لتسجيل دخول Admin
app.post("/api/admin/login", (req, res) => {
  const { username, password } = req.body;
  
  if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
    req.session.adminLoggedIn = true;
    req.session.adminUsername = username;
    return res.json({ success: true, message: "تم تسجيل الدخول بنجاح" });
  }
  
  return res.json({ success: false, message: "اسم المستخدم أو كلمة المرور غير صحيحة" });
});

// API endpoint للتحقق من حالة تسجيل الدخول
app.get("/api/admin/check-auth", (req, res) => {
  if (req.session && req.session.adminLoggedIn === true) {
    return res.json({ success: true, authenticated: true });
  }
  return res.json({ success: false, authenticated: false });
});

// API endpoint لتسجيل الخروج
app.post("/api/admin/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.json({ success: false, message: "خطأ في تسجيل الخروج" });
    }
    return res.json({ success: true, message: "تم تسجيل الخروج بنجاح" });
  });
});

// --------------------------- LOGIN --------------------------- //
// --------------------------- REGISTER --------------------------- //
app.post("/api/register", (req, res) => {
  let { name, phone, email, password, address } = req.body;

  // تنظيف رقم الهاتف - قبول 0 أو بدون 0
  if (phone) {
    phone = phone.replace(/\s+/g, "");
    if (phone.startsWith("0")) phone = phone.substring(1);
    if (phone.startsWith("966")) phone = phone.substring(3);
    if (phone.startsWith("00966")) phone = phone.substring(5);
  }

  // البحث في قاعدة البيانات - مع 0 وبدون 0
  db.get("SELECT * FROM users WHERE (phone=? OR phone=?) OR email=?", [phone, "0" + phone, email], (err, row) => {
    if (err) {
      return res.json({ success: false, message: "خطأ في السيرفر" });
    }
    if (row) {
      return res.json({ success: false, message: "رقم الجوال أو الإيميل مسجل مسبقاً" });
    }

    // كود التفعيل المؤقت - يمكن تغييره لاحقاً
    const verifyCode = "111111";

    db.run(
      `INSERT INTO users (name, phone, email, password, address, verify_code, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, 0)`,
      [name, phone, email, password, address, verifyCode],
      function (err2) {
        if (err2) return res.json({ success: false, message: "خطأ في السيرفر" });

        mail.sendMail({
          to: email,
          subject: "تفعيل حسابك",
          text: `كود التفعيل الخاص بك هو: ${verifyCode}`
        });

        return res.json({ success: true, id: this.lastID });
      }
    );
  });
});

// --------------------------- التحقق من الإيميل والجوال --------------------------- //
app.post("/api/check-email", (req, res) => {
  const { email } = req.body;
  
  if (!email || !email.includes("@")) {
    return res.json({ exists: false });
  }
  
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err) {
      return res.json({ exists: false });
    }
    return res.json({ exists: !!row });
  });
});

app.post("/api/check-phone", (req, res) => {
  let { phone } = req.body;
  
  if (!phone) {
    return res.json({ exists: false });
  }
  
  // تنظيف رقم الهاتف
  phone = phone.replace(/\s+/g, "");
  if (phone.startsWith("0")) phone = phone.substring(1);
  if (phone.startsWith("966")) phone = phone.substring(3);
  if (phone.startsWith("00966")) phone = phone.substring(5);
  
  // التحقق من الصيغة
  if (!phone.match(/^5\d{8}$/)) {
    return res.json({ exists: false });
  }
  
  // البحث - مع 0 وبدون 0
  db.get("SELECT * FROM users WHERE phone = ? OR phone = ?", [phone, "0" + phone], (err, row) => {
    if (err) {
      return res.json({ exists: false });
    }
    return res.json({ exists: !!row });
  });
});

app.post("/api/login", (req, res) => {
  let { phone, password } = req.body;

  // تنظيف رقم الهاتف - قبول 0 أو بدون 0
  phone = phone.replace(/\s+/g, "");
  if (phone.startsWith("0")) phone = phone.substring(1);
  if (phone.startsWith("966")) phone = phone.substring(3);
  if (phone.startsWith("00966")) phone = phone.substring(5);

  // البحث في قاعدة البيانات - مع 0 وبدون 0
  db.get("SELECT * FROM users WHERE (phone = ? OR phone = ?) AND password = ?", [phone, "0" + phone, password], (err, row) => {
    if (!row) return res.json({ success: false, message: "بيانات غير صحيحة" });

    if (row.email_verified == 0)
      return res.json({ success: false, verify: true, message: "يرجى تفعيل الحساب" });

    res.json({ success: true, user: row });
  });
});
// --------------------------- تفعيل الحساب --------------------------- //
app.post("/api/verify", (req, res) => {
  const { phone, code } = req.body;

  db.get("SELECT * FROM users WHERE phone=? AND verify_code=?", [phone, code], (err, row) => {
    if (!row) return res.json({ success: false, message: "كود خاطئ" });

    db.run("UPDATE users SET email_verified=1, verify_code=NULL WHERE phone=?", [phone]);
    res.json({ success: true });
  });
});


app.post("/api/forgot", (req, res) => {
  const { email } = req.body;

  db.get("SELECT * FROM users WHERE email=?", [email], (err, user) => {
    if (!user) return res.json({ success: false, message: "الإيميل غير موجود" });

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    db.run("UPDATE users SET reset_code=? WHERE email=?", [resetCode, email]);

    mail.sendMail({
      to: email,
      subject: "إعادة ضبط كلمة المرور",
      text: `كود استعادة كلمة المرور: ${resetCode}`
    });

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

    // إنشاء كود جديد - كود التفعيل المؤقت
    const newCode = "111111";

    db.run(
      "UPDATE users SET verify_code=? WHERE phone=?",
      [newCode, phone],
      (err2) => {
        if (err2) {
          return res.json({ success: false, message: "خطأ في السيرفر" });
        }

        // إرسال الإيميل
        mail.sendMail({
          to: user.email,
          subject: "إعادة إرسال كود التفعيل",
          text: `كود التفعيل الجديد هو: ${newCode}`
        });

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

// Change password from profile
app.post("/api/change-password", (req, res) => {
  const { phone, current_password, new_password } = req.body;

  db.get("SELECT * FROM users WHERE phone=? AND password=?", [phone, current_password], (err, user) => {
    if (!user) return res.json({ success: false, message: "كلمة المرور الحالية غير صحيحة" });

    db.run("UPDATE users SET password=? WHERE phone=?", [new_password, phone], (err2) => {
      if (err2) return res.json({ success: false, message: "خطأ في تحديث كلمة المرور" });
      res.json({ success: true });
    });
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
      stock INTEGER DEFAULT 0,
      quantity INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add description column if missing
  db.run(`ALTER TABLE products ADD COLUMN description TEXT`, (err) => {});
  
  // Add stock/quantity columns if missing
  db.run(`ALTER TABLE products ADD COLUMN stock INTEGER DEFAULT 0`, (err) => {});
  db.run(`ALTER TABLE products ADD COLUMN quantity INTEGER DEFAULT 0`, (err) => {});

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

// -------- Pages Content Table -------- //
db.run(`
CREATE TABLE IF NOT EXISTS pages_content (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  page_type TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
)
`);

// -------- Complaints Table -------- //
db.run(`
CREATE TABLE IF NOT EXISTS complaints (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
`);

// -------- Banners Table -------- //
db.run(`
CREATE TABLE IF NOT EXISTS banners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  position TEXT NOT NULL,
  desktop_image TEXT NOT NULL,
  mobile_image TEXT NOT NULL,
  product_ids TEXT,
  active INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
)
`);

// إدراج المحتوى الافتراضي للصفحات
db.run(`
INSERT OR IGNORE INTO pages_content (page_type, title, content) 
VALUES 
  ('privacy', 'سياسة الاستخدام والخصوصية', '<h2>سياسة الاستخدام والخصوصية</h2><p>محتوى سياسة الاستخدام والخصوصية...</p>'),
  ('return', 'سياسة الاستبدال والارجاع', '<h2>سياسة الاستبدال والارجاع</h2><p>محتوى سياسة الاستبدال والارجاع...</p>'),
  ('terms', 'الشروط والأحكام', '<h2>الشروط والأحكام</h2><p>محتوى الشروط والأحكام...</p>'),
  ('faq', 'الأسئلة الشائعة', '{"questions":[{"question":"كيف يمكنني الطلب من المتجر؟","answer":"يمكنك الطلب بسهولة من خلال تصفح المنتجات، إضافتها إلى السلة، ثم إتمام عملية الشراء. نحن نوفر خدمة توصيل سريعة وآمنة لجميع أنحاء المملكة."},{"question":"ما هي مدة التوصيل؟","answer":"نقوم بالتوصيل خلال 2-5 أيام عمل داخل المدن الرئيسية، و5-7 أيام للمناطق الأخرى. يمكنك تتبع طلبك من خلال صفحة \"تتبع الطلب\"."},{"question":"ما هي طرق الدفع المتاحة؟","answer":"نقبل الدفع عند الاستلام (الدفع نقداً) في جميع المناطق. كما يمكنك الدفع عبر التحويل البنكي أو المحافظ الإلكترونية."},{"question":"هل يمكنني إرجاع المنتج؟","answer":"نعم، يمكنك إرجاع المنتج خلال 7 أيام من تاريخ الاستلام بشرط أن يكون في حالته الأصلية وغير مستخدم. راجع صفحة \"سياسة الاستبدال والارجاع\" للتفاصيل."},{"question":"هل المنتجات أصلية ومضمونة؟","answer":"نعم، جميع منتجاتنا أصلية 100% ومضمونة. نحن نتعامل مباشرة مع الموزعين الرسميين ونضمن جودة جميع المنتجات."}]}')
`, (err) => {});



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

  // Reviews Table
  db.run(`
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      user_email TEXT NOT NULL,
      user_phone TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      comment TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(product_id) REFERENCES products(id)
    )
  `);
  
  // Create index for faster queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status)`);

  // Social Media Table
  db.run(`
    CREATE TABLE IF NOT EXISTS social_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      platform TEXT UNIQUE NOT NULL,
      url TEXT NOT NULL,
      icon_url TEXT,
      active INTEGER DEFAULT 1,
      display_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Coupons Table
  db.run(`
    CREATE TABLE IF NOT EXISTS coupons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      discount_percent REAL DEFAULT 0,
      active INTEGER DEFAULT 1,
      show_in_banner INTEGER DEFAULT 0,
      first_order_only INTEGER DEFAULT 0,
      one_time_only INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Add new columns if missing (for migration)
  db.run(`ALTER TABLE coupons ADD COLUMN show_in_banner INTEGER DEFAULT 0`, (err) => {});
  db.run(`ALTER TABLE coupons ADD COLUMN first_order_only INTEGER DEFAULT 0`, (err) => {});
  db.run(`ALTER TABLE coupons ADD COLUMN one_time_only INTEGER DEFAULT 0`, (err) => {});
  db.run(`ALTER TABLE orders ADD COLUMN coupon_code TEXT`, (err) => {});
  db.run(`ALTER TABLE orders ADD COLUMN coupon_discount REAL DEFAULT 0`, (err) => {});
  
  // Coupon Usage Table - لتتبع استخدام الكوبونات
  db.run(`
    CREATE TABLE IF NOT EXISTS coupon_usage (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      coupon_id INTEGER NOT NULL,
      user_phone TEXT NOT NULL,
      order_id INTEGER,
      used_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (coupon_id) REFERENCES coupons(id)
    )
  `);
  
  // Create index for faster queries
  db.run(`CREATE INDEX IF NOT EXISTS idx_coupon_usage_phone ON coupon_usage(user_phone)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON coupon_usage(coupon_id)`);
  
  // Add icon_url column if missing (for migration)
  db.run(`ALTER TABLE social_media ADD COLUMN icon_url TEXT`, (err) => {});
  
  // Insert default social media platforms with icon URLs
  db.run(`
    INSERT OR IGNORE INTO social_media (platform, url, icon_url, display_order) 
    VALUES 
      ('facebook', 'https://facebook.com', 'https://cdn-icons-png.flaticon.com/512/124/124010.png', 1),
      ('twitter', 'https://twitter.com', 'https://cdn-icons-png.flaticon.com/512/124/124021.png', 2),
      ('instagram', 'https://instagram.com', 'https://cdn-icons-png.flaticon.com/512/174/174855.png', 3),
      ('whatsapp', 'https://wa.me', 'https://cdn-icons-png.flaticon.com/512/124/124034.png', 4),
      ('snapchat', 'https://snapchat.com', 'https://cdn-icons-png.flaticon.com/512/124/124157.png', 5),
      ('tiktok', 'https://tiktok.com', 'https://cdn-icons-png.flaticon.com/512/3046/3046120.png', 6),
      ('youtube', 'https://youtube.com', 'https://cdn-icons-png.flaticon.com/512/174/174883.png', 7),
      ('linkedin', 'https://linkedin.com', 'https://cdn-icons-png.flaticon.com/512/174/174857.png', 8)
  `, (err) => {});

});

// --------------------------- BRANDS API --------------------------- //
app.post("/api/admin/brands", checkAdminAuth, (req, res) => {
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
app.get("/api/admin/brands/excel", checkAdminAuth, (req, res) => {
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

// ======================= UPLOAD BRANDS EXCEL ======================= //
app.post("/api/admin/brands/upload-excel", checkAdminAuth, upload.single("file"), (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    data.forEach(b => {
      db.run(
        `INSERT INTO brands (name, brand_code, image_url, featured)
         VALUES (?, ?, ?, ?)`,
        [
          b.name || "",
          b.brand_code || "",
          b.image_url || "",
          b.featured || 0
        ]
      );
    });

    return res.json({ success: true });
  } catch (err) {
    return res.json({ error: "Excel Upload Error", details: err });
  }
});

app.put("/api/admin/brands/:id", checkAdminAuth, (req, res) => {
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

app.delete("/api/admin/brands/:id", checkAdminAuth, (req, res) => {
  db.run(`DELETE FROM brands WHERE id=?`, [req.params.id], (err) => {
    if (err) return res.json({ error: "Delete Error" });
    res.json({ success: true });
  });
});

app.post("/api/admin/brands/feature", checkAdminAuth, (req, res) => {
  const { id, featured } = req.body;

  db.run(
    `UPDATE brands SET featured=? WHERE id=?`,
    [featured, id],
    (err) => {
      res.json({ success: true });
    }
  );
});

app.get("/api/admin/brands", checkAdminAuth, (req, res) => {
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

// --------------------------- PUBLIC API (Frontend) --------------------------- //
// Public endpoint for brands (no authentication required)
app.get("/api/brands", (req, res) => {
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

// Public endpoint for products (no authentication required)
app.get("/api/products", (req, res) => {
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

// --------------------------- PRODUCTS API --------------------------- //
app.post("/api/admin/products", checkAdminAuth, (req, res) => {
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
    stock,
    quantity,
    stock_qty,
  } = req.body;

  const stockValue = parseInt(stock || quantity || stock_qty || 0);

  db.run(
    `
    INSERT INTO products
    (name, base_price, askon_code, intl_code, image_url, category,
     description, discount_value, discount_type, featured, brand_id, stock, quantity)
    VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)
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
      stockValue,
      stockValue,
    ],
    (err) => {
      if (err) return res.json({ error: "Insert Error" });
      res.json({ success: true });
    }
  );
});

app.put("/api/admin/products/:id", checkAdminAuth, (req, res) => {
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
    stock,
    quantity,
    stock_qty,
  } = req.body;

  // استخدام parseInt لضمان أن القيمة عدد صحيح
  const stockValue = stock !== undefined && stock !== null ? parseInt(stock) : (quantity !== undefined && quantity !== null ? parseInt(quantity) : (stock_qty !== undefined && stock_qty !== null ? parseInt(stock_qty) : 0));

  db.run(
    `
    UPDATE products SET
      name=?, base_price=?, askon_code=?, intl_code=?, image_url=?,
      category=?, description=?, discount_value=?, discount_type=?, featured=?, brand_id=?,
      stock=?, quantity=?
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
      stockValue,
      stockValue,
      id,
    ],
    (err) => {
      if (err) return res.json({ error: "Update Error" });
      res.json({ success: true });
    }
  );
});

app.delete("/api/admin/products/:id", checkAdminAuth, (req, res) => {
  db.run(`DELETE FROM products WHERE id=?`, [req.params.id], () => {
    res.json({ success: true });
  });
});

app.post("/api/admin/products/feature", checkAdminAuth, (req, res) => {
  const { id, featured } = req.body;

  db.run(
    `UPDATE products SET featured=? WHERE id=?`,
    [featured, id],
    () => res.json({ success: true })
  );
});

app.get("/api/admin/products", checkAdminAuth, (req, res) => {
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

// رفع الصور
app.post("/api/admin/upload-image", checkAdminAuth, upload.single("image"), (req, res) => {
  try {
    if (!req.file) {
      return res.json({ error: "لم يتم رفع أي ملف" });
    }
    
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.json({ error: "خطأ في رفع الصورة", details: error.message });
  }
});

app.post("/api/admin/products/upload-excel", checkAdminAuth, upload.single("file"), (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet);

    data.forEach(p => {
      // قراءة المخزون من العمود الأخير (stock أو quantity)
      const stock = parseInt(p.stock || p.quantity || p['المخزون'] || 0);
      
      db.run(
        `INSERT INTO products 
        (name, base_price, askon_code, intl_code, image_url, category, description, discount_value, discount_type, featured, brand_id, stock, quantity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          p.brand_id || null,
          stock,
          stock
        ]
      );
    });

    return res.json({ success: true });
  } catch (err) {
    return res.json({ error: "Excel Upload Error", details: err });
  }
});
// ======================= EXPORT EXCEL ======================= //
app.get("/api/admin/products/export", checkAdminAuth, (req, res) => {
  db.all("SELECT * FROM products", (err, rows) => {
    if (err) return res.json({ error: "Export Error" });

    if (!rows || rows.length === 0) {
      return res.json({ error: "No products to export" });
    }

    // إعادة ترتيب الأعمدة بحيث يكون المخزون في الأخير
    const orderedRows = rows.map(row => {
      const stockValue = parseInt(row.stock || row.quantity || 0);
      
      // إنشاء كائن جديد مع ترتيب محدد
      return {
        id: row.id,
        name: row.name,
        base_price: row.base_price,
        askon_code: row.askon_code,
        intl_code: row.intl_code,
        image_url: row.image_url,
        category: row.category,
        description: row.description,
        discount_value: row.discount_value,
        discount_type: row.discount_type,
        featured: row.featured,
        brand_id: row.brand_id,
        created_at: row.created_at,
        stock: stockValue,
        quantity: stockValue
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(orderedRows);
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
    coupon_code,
    items
  } = req.body;
  const phone2 = customer_phone2 || "";
  const notes = customer_notes || "";
  const address = customer_address || "";
  const location = customer_location || "";

  if (!items || items.length === 0)
    return res.json({ error: "No items provided" });

  // التحقق من استخدام الكوبون قبل إنشاء الطلب (إذا كان هناك كوبون)
  if (coupon_code && customer_phone) {
    // جلب معلومات الكوبون أولاً للتحقق من one_time_only
    db.get("SELECT * FROM coupons WHERE code = ? AND active = 1",
      [coupon_code.trim().toUpperCase()],
      (err, coupon) => {
        if (err) {
          return res.json({ error: "خطأ في التحقق من الكوبون" });
        }
        
        if (!coupon) {
          return res.json({ error: "كود الخصم غير صحيح أو غير نشط" });
        }
        
        // إذا كان الكوبون صالح لمرة واحدة فقط، التحقق من استخدامه مسبقاً
        if (coupon.one_time_only === 1) {
          db.get("SELECT COUNT(*) as usage_count FROM coupon_usage WHERE user_phone = ? AND coupon_id = ?",
            [customer_phone, coupon.id],
            (err2, usageData) => {
              if (err2) {
                return res.json({ error: "خطأ في التحقق من استخدام الكوبون" });
              }
              
              // إذا استخدم العميل هذا الكوبون مسبقاً، لا يسمح له باستخدامه مرة أخرى
              if (usageData.usage_count > 0) {
                return res.json({ error: `لقد استخدمت كوبون الخصم "${coupon.code}" مسبقاً. يمكن استخدام هذا الكوبون مرة واحدة فقط لكل عميل` });
              }
              
              // المتابعة مع إنشاء الطلب
              createOrderWithCouponCheck();
            }
          );
        } else {
          // إذا لم يكن one_time_only مفعلاً، يمكن استخدام الكوبون عدة مرات
          createOrderWithCouponCheck();
        }
      }
    );
  } else {
    // إذا لم يكن هناك كوبون، المتابعة مباشرة
    createOrderWithCouponCheck();
  }

  function createOrderWithCouponCheck() {
  const date = new Date().toLocaleString("ar-SA");

  db.run(`
    INSERT INTO orders 
    (customer_name, customer_phone, customer_phone2, customer_address, customer_location, customer_notes, date, status, coupon_code, coupon_discount)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
  `,
  [
    customer_name,
    customer_phone,
    customer_phone2 || "",
    customer_address || "",
    customer_location || "",
    customer_notes || "",
    date,
    coupon_code || null,
    0  // coupon_discount - سيتم تحديثه لاحقاً
  ],
  function (err) {

    if (err) return res.json({ error: "Order Insert Error" });

    const order_id = this.lastID;
    let total = 0;

  // حساب subtotal_before_vat أولاً لتطبيق الكوبون
  let subtotal_before_vat = 0;

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

  // حساب subtotal_before_vat (قبل الضريبة)
  subtotal_before_vat += priceAfterDiscount * qty;

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
      item.id || item.product_id || null,
      item.name,
      qty,
      base,
      priceAfterDiscount,
      priceWithVat,
      itemTotal
    ]
  );

  // خصم المخزون من المنتج
  if (item.id || item.product_id) {
    const productId = item.id || item.product_id;
    
    // جلب المخزون الحالي
    db.get("SELECT stock, quantity FROM products WHERE id = ?", [productId], (err, product) => {
      if (!err && product) {
        const currentStock = parseInt(product.stock || product.quantity || 0);
        const newStock = Math.max(0, currentStock - qty); // لا يقل عن 0
        
        // تحديث المخزون
        db.run(
          `UPDATE products SET stock = ?, quantity = ? WHERE id = ?`,
          [newStock, newStock, productId],
          (updateErr) => {
            if (updateErr) {
              console.error("خطأ في تحديث المخزون:", updateErr);
            }
          }
        );
      }
    });
  }

});

  // تطبيق الكوبون على subtotal_before_vat (بعد خصومات المنتجات وقبل الضريبة)
  let coupon_discount = 0;
  if (coupon_code) {
    db.get("SELECT * FROM coupons WHERE code = ? AND active = 1", 
      [coupon_code.trim().toUpperCase()],
      (err, coupon) => {
        if (!err && coupon) {
          // الكوبون يطبق على subtotal_before_vat (بعد خصومات المنتجات وقبل الضريبة)
          coupon_discount = subtotal_before_vat * (coupon.discount_percent / 100);
          console.log(`Coupon calculation: subtotal_before_vat=${subtotal_before_vat}, discount_percent=${coupon.discount_percent}, coupon_discount=${coupon_discount}`);
          // خصم الكوبون من الإجمالي (بعد الضريبة)
          // نحسب الضريبة على الخصم ونخصمها من الإجمالي
          const coupon_discount_with_vat = coupon_discount * 1.15;
          total = total - coupon_discount_with_vat;
          
          // حفظ استخدام الكوبون
          db.run("INSERT INTO coupon_usage (coupon_id, user_phone, order_id) VALUES (?, ?, ?)",
            [coupon.id, customer_phone, order_id],
            (usageErr) => {
              if (usageErr) console.error("خطأ في حفظ استخدام الكوبون:", usageErr);
            }
          );
        }
        
        // المتابعة مع الحساب النهائي
        const total_with_shipping = total + shipping + shipping_vat;

        db.run(
          `UPDATE orders 
           SET total=?, shipping=?, shipping_vat=?, total_with_shipping=?, coupon_code=?, coupon_discount=?
           WHERE id=?`,
          [
            total,
            shipping,
            shipping_vat,
            total_with_shipping,
            coupon_code || null,
            coupon_discount || 0,  // حفظ قيمة الخصم (بدون ضريبة)
            order_id
          ],
          (updateErr) => {
            if (updateErr) {
              console.error("خطأ في تحديث الطلب:", updateErr);
            } else {
              console.log(`تم حفظ الطلب ${order_id} مع خصم الكوبون: ${coupon_discount || 0}`);
            }
          }
        );

        res.json({ success: true, order_id });
      }
    );
    return; // إرجاع مبكر لأن الكوبون يحتاج query
  } else {
    // إذا لم يكن هناك كوبون
    const total_with_shipping = total + shipping + shipping_vat;

    db.run(
      `UPDATE orders 
       SET total=?, shipping=?, shipping_vat=?, total_with_shipping=?, coupon_code=?, coupon_discount=?
       WHERE id=?`,
      [
        total,
        shipping,
        shipping_vat,
        total_with_shipping,
        coupon_code || null,
        0,  // coupon_discount = 0 إذا لم يكن هناك كوبون
        order_id
      ]
    );

    res.json({ success: true, order_id });
  }
  }); // نهاية db.run callback
  } // نهاية createOrderWithCouponCheck
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
app.get("/api/admin/users", checkAdminAuth, (req, res) => {
  db.all("SELECT id, name, phone, email, password, address, created_at FROM users ORDER BY id DESC",
    (err, rows) => {
      if (err) return res.json({ error: "Users Fetch Error" });
      res.json(rows);
    }
  );
});

// ======================= GET NEW ORDERS COUNT ======================= //
app.get("/api/admin/new-orders-count", checkAdminAuth, (req, res) => {
  db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'new'",
    (err, row) => {
      if (err) return res.json({ error: "Count Error", count: 0 });
      res.json({ count: row.count || 0 });
    }
  );
});

// ======================= GET NEW USERS COUNT ======================= //
app.get("/api/admin/new-users-count", checkAdminAuth, (req, res) => {
  // الحصول على آخر زيارة من query parameter (سيتم إرساله من frontend)
  const lastVisit = req.query.lastVisit;
  
  let dateStr;
  if (lastVisit) {
    // استخدام آخر زيارة إذا كان متوفراً
    dateStr = new Date(lastVisit).toISOString().slice(0, 19).replace('T', ' ');
  } else {
    // إذا لم يكن هناك آخر زيارة، نستخدم آخر 24 ساعة كافتراضي
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);
    dateStr = oneDayAgo.toISOString().slice(0, 19).replace('T', ' ');
  }
  
  db.get("SELECT COUNT(*) as count FROM users WHERE created_at >= ?",
    [dateStr],
    (err, row) => {
      if (err) return res.json({ error: "Count Error", count: 0 });
      res.json({ count: row.count || 0 });
    }
  );
});

// ======================= DELETE USER ======================= //
app.delete("/api/admin/users/:id", checkAdminAuth, (req, res) => {
  const id = req.params.id;
  
  db.run("DELETE FROM users WHERE id = ?", [id], function(err) {
    if (err) return res.json({ error: "Delete Error", success: false });
    res.json({ success: true, message: "تم حذف العميل بنجاح" });
  });
});

// ======================= GET TOTAL USERS COUNT ======================= //
app.get("/api/admin/total-users-count", checkAdminAuth, (req, res) => {
  db.get("SELECT COUNT(*) as count FROM users",
    (err, row) => {
      if (err) return res.json({ error: "Count Error", count: 0 });
      res.json({ count: row.count || 0 });
    }
  );
});

// ======================= GET NEW REVIEWS COUNT ======================= //
app.get("/api/admin/new-reviews-count", checkAdminAuth, (req, res) => {
  db.get("SELECT COUNT(*) as count FROM reviews WHERE status = 'pending'",
    (err, row) => {
      if (err) return res.json({ error: "Count Error", count: 0 });
      res.json({ count: row.count || 0 });
    }
  );
});

// ======================= GET NEW COMPLAINTS COUNT ======================= //
app.get("/api/admin/new-complaints-count", checkAdminAuth, (req, res) => {
  db.get("SELECT COUNT(*) as count FROM complaints WHERE status = 'pending'",
    (err, row) => {
      if (err) return res.json({ error: "Count Error", count: 0 });
      res.json({ count: row.count || 0 });
    }
  );
});

// ======================= COMPLAINTS API ======================= //
// Test route
app.get("/api/complaints/test", (req, res) => {
  res.json({ message: "Complaints API is working!" });
});

// Submit complaint
app.post("/api/complaints", (req, res) => {
  console.log("POST /api/complaints called");
  console.log("Request body:", req.body);
  
  const { email, subject, message } = req.body;
  
  if (!email || !subject || !message) {
    return res.json({ error: "جميع الحقول مطلوبة" });
  }

  db.run(
    "INSERT INTO complaints (email, subject, message, status) VALUES (?, ?, ?, 'pending')",
    [email, subject, message],
    function(err) {
      if (err) {
        console.error("Error inserting complaint:", err);
        return res.json({ error: "خطأ في إرسال الشكوى", details: err.message });
      }
      console.log("Complaint inserted successfully with ID:", this.lastID);
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Get all complaints (admin)
app.get("/api/admin/complaints", checkAdminAuth, (req, res) => {
  console.log("GET /api/admin/complaints called");
  db.all("SELECT * FROM complaints ORDER BY created_at DESC", (err, rows) => {
    if (err) {
      console.error("Error fetching complaints:", err);
      return res.json({ error: "Fetch Error", details: err.message });
    }
    console.log("Complaints fetched:", rows.length);
    res.json(rows);
  });
});

// Update complaint status
app.put("/api/admin/complaints/:id/status", checkAdminAuth, (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  
  if (!status || !['pending', 'resolved'].includes(status)) {
    return res.json({ error: "حالة غير صحيحة" });
  }

  db.run(
    "UPDATE complaints SET status = ? WHERE id = ?",
    [status, id],
    function(err) {
      if (err) return res.json({ error: "Update Error" });
      res.json({ success: true });
    }
  );
});

// ======================= BANNERS API ======================= //
// Get banners by position
app.get("/api/banners/:position", (req, res) => {
  const position = req.params.position;
  console.log("GET /api/banners/" + position);
  db.all(
    "SELECT * FROM banners WHERE position = ? ORDER BY display_order ASC, id ASC",
    [position],
    (err, rows) => {
      if (err) {
        console.error("Error fetching banners:", err);
        return res.json({ error: "Fetch Error" });
      }
      
      console.log(`Found ${rows.length} total banners for position ${position}`);
      
      // تصفية النتائج للتأكد من أن active = 1 (للتعامل مع أي مشاكل في التخزين)
      const activeBanners = rows.filter(banner => {
        const activeValue = banner.active;
        // تحويل إلى number أولاً
        const activeNum = typeof activeValue === 'string' ? parseInt(activeValue) : (typeof activeValue === 'number' ? activeValue : 0);
        const isActive = activeNum === 1;
        
        if (!isActive) {
          console.log(`Banner ${banner.id} (${banner.title}) filtered out: active = ${activeValue} (type: ${typeof activeValue}, parsed: ${activeNum})`);
        } else {
          console.log(`Banner ${banner.id} (${banner.title}) is active: active = ${activeValue} (type: ${typeof activeValue}, parsed: ${activeNum})`);
        }
        return isActive;
      });
      
      console.log(`Returning ${activeBanners.length} active banners for position ${position}`);
      res.json(activeBanners);
    }
  );
});

// Get all banners (admin)
app.get("/api/admin/banners", checkAdminAuth, (req, res) => {
  console.log("GET /api/admin/banners");
  db.all("SELECT * FROM banners ORDER BY position, display_order ASC, id ASC", (err, rows) => {
    if (err) {
      console.error("Error fetching all banners:", err);
      return res.json({ error: "Fetch Error" });
    }
    res.json(rows);
  });
});

// Create banner
app.post("/api/admin/banners", checkAdminAuth, (req, res) => {
  console.log("POST /api/admin/banners");
  console.log("Request body:", req.body);
  const { title, position, desktop_image, mobile_image, product_ids, display_order } = req.body;
  
  if (!title || !position || !desktop_image || !mobile_image) {
    return res.json({ error: "جميع الحقول مطلوبة" });
  }

  const productIdsJson = product_ids ? JSON.stringify(product_ids) : "[]";
  const order = display_order || 0;

  db.run(
    "INSERT INTO banners (title, position, desktop_image, mobile_image, product_ids, display_order) VALUES (?, ?, ?, ?, ?, ?)",
    [title, position, desktop_image, mobile_image, productIdsJson, order],
    function(err) {
      if (err) {
        console.error("Error inserting banner:", err);
        return res.json({ error: "خطأ في إضافة البانر", details: err.message });
      }
      console.log("Banner inserted successfully with ID:", this.lastID);
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Update banner
app.put("/api/admin/banners/:id", checkAdminAuth, (req, res) => {
  const id = req.params.id;
  const { title, position, desktop_image, mobile_image, product_ids, active, display_order } = req.body;
  
  const productIdsJson = product_ids ? JSON.stringify(product_ids) : "[]";
  const order = display_order !== undefined ? display_order : 0;
  // التأكد من أن active هو number (0 أو 1)
  let isActive = 1;
  if (active !== undefined) {
    // تحويل إلى number إذا كان string
    const activeNum = typeof active === 'string' ? parseInt(active) : active;
    isActive = (activeNum === 1 || activeNum === true) ? 1 : 0;
  }

  db.run(
    "UPDATE banners SET title = ?, position = ?, desktop_image = ?, mobile_image = ?, product_ids = ?, active = ?, display_order = ? WHERE id = ?",
    [title, position, desktop_image, mobile_image, productIdsJson, isActive, order, id],
    function(err) {
      if (err) {
        console.error("Error updating banner:", err);
        return res.json({ error: "خطأ في تحديث البانر" });
      }
      console.log(`Banner ${id} updated: active = ${isActive}`);
      res.json({ success: true });
    }
  );
});

// Delete banner
app.delete("/api/admin/banners/:id", checkAdminAuth, (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM banners WHERE id = ?", [id], function(err) {
    if (err) return res.json({ error: "Delete Error" });
    res.json({ success: true });
  });
});

// ======================= COUPONS API ======================= //
// Get active banner coupon (public) - فقط الكوبونات التي تظهر في البانر
app.get("/api/coupon/active", (req, res) => {
  db.get("SELECT * FROM coupons WHERE active = 1 AND show_in_banner = 1 ORDER BY id DESC LIMIT 1",
    (err, row) => {
      if (err) return res.json({ error: "Database Error" });
      res.json(row || null);
    }
  );
});

// Get user orders count (for banner visibility)
app.get("/api/user-orders-count", (req, res) => {
  const phone = req.query.phone;
  if (!phone) {
    return res.json({ count: 0 });
  }
  
  db.get("SELECT COUNT(*) as count FROM orders WHERE customer_phone = ?",
    [phone],
    (err, row) => {
      if (err) return res.json({ error: "Database Error", count: 0 });
      res.json({ count: row.count || 0 });
    }
  );
});

// Validate coupon code
app.post("/api/coupon/validate", (req, res) => {
  const { code, user_phone } = req.body;
  
  if (!code) {
    return res.json({ success: false, message: "يرجى إدخال كود الخصم" });
  }

  // التحقق من الكوبون نفسه
  db.get("SELECT * FROM coupons WHERE code = ? AND active = 1",
    [code.trim().toUpperCase()],
    (err, row) => {
      if (err) return res.json({ success: false, message: "خطأ في قاعدة البيانات" });
      if (!row) return res.json({ success: false, message: "كود الخصم غير صحيح أو غير نشط" });
      
      // إذا كان هناك رقم هاتف، التحقق من استخدام الكوبون
      if (user_phone) {
        // التحقق من one_time_only - إذا كان مفعلاً، التحقق من استخدام نفس الكوبون فقط
        if (row.one_time_only === 1) {
          // التحقق من استخدام نفس الكوبون (coupon_id) للعميل الواحد
          db.get("SELECT COUNT(*) as usage_count FROM coupon_usage WHERE user_phone = ? AND coupon_id = ?",
            [user_phone, row.id],
            (err0, usageData) => {
              if (err0) {
                return res.json({ success: false, message: "خطأ في التحقق من استخدام الكوبون" });
              }
              
              // إذا استخدم العميل هذا الكوبون مسبقاً، لا يسمح له باستخدامه مرة أخرى
              if (usageData.usage_count > 0) {
                return res.json({ success: false, message: `لقد استخدمت كوبون الخصم "${row.code}" مسبقاً. يمكن استخدام هذا الكوبون مرة واحدة فقط لكل عميل` });
              }
              
              // التحقق من first_order_only إذا كان مفعلاً
              if (row.first_order_only === 1) {
                db.get("SELECT COUNT(*) as order_count FROM orders WHERE customer_phone = ?",
                  [user_phone],
                  (err2, orderData) => {
                    if (err2) {
                      return res.json({ success: false, message: "خطأ في التحقق من الطلبات السابقة" });
                    }
                    
                    if (orderData.order_count > 0) {
                      return res.json({ success: false, message: "هذا الكوبون صالح للطلبات الأولى فقط" });
                    }
                    
                    res.json({ success: true, coupon: row });
                  }
                );
              } else {
                res.json({ success: true, coupon: row });
              }
            }
          );
        } else {
          // إذا لم يكن one_time_only مفعلاً، يمكن استخدام الكوبون عدة مرات
          // لكن نتحقق من first_order_only إذا كان مفعلاً
          if (row.first_order_only === 1) {
            db.get("SELECT COUNT(*) as order_count FROM orders WHERE customer_phone = ?",
              [user_phone],
              (err2, orderData) => {
                if (err2) {
                  return res.json({ success: false, message: "خطأ في التحقق من الطلبات السابقة" });
                }
                
                if (orderData.order_count > 0) {
                  return res.json({ success: false, message: "هذا الكوبون صالح للطلبات الأولى فقط" });
                }
                
                res.json({ success: true, coupon: row });
              }
            );
          } else {
            res.json({ success: true, coupon: row });
          }
        }
      } else {
        // إذا لم يكن هناك رقم هاتف، فقط التحقق من الكوبون
        res.json({ success: true, coupon: row });
      }
    }
  );
});

// Get all coupons (admin)
app.get("/api/admin/coupons", checkAdminAuth, (req, res) => {
  db.all("SELECT * FROM coupons ORDER BY id DESC",
    (err, rows) => {
      if (err) return res.json({ error: "Database Error" });
      res.json(rows);
    }
  );
});

// Create coupon (admin)
app.post("/api/admin/coupons", checkAdminAuth, (req, res) => {
  const { name, code, discount_percent, show_in_banner, first_order_only, one_time_only } = req.body;

  if (!name || !code || !discount_percent) {
    return res.json({ success: false, message: "جميع الحقول مطلوبة" });
  }

  db.run("INSERT INTO coupons (name, code, discount_percent, active, show_in_banner, first_order_only, one_time_only) VALUES (?, ?, ?, 1, ?, ?, ?)",
    [name, code.toUpperCase().trim(), discount_percent, show_in_banner ? 1 : 0, first_order_only ? 1 : 0, one_time_only ? 1 : 0],
    function(err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.json({ success: false, message: "كود الخصم موجود مسبقاً" });
        }
        return res.json({ success: false, message: "خطأ في قاعدة البيانات" });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Update coupon (admin)
app.put("/api/admin/coupons/:id", checkAdminAuth, (req, res) => {
  const id = req.params.id;
  const { name, code, discount_percent, active, show_in_banner, first_order_only, one_time_only } = req.body;

  db.run("UPDATE coupons SET name = ?, code = ?, discount_percent = ?, active = ?, show_in_banner = ?, first_order_only = ?, one_time_only = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
    [name, code.toUpperCase().trim(), discount_percent, active ? 1 : 0, show_in_banner ? 1 : 0, first_order_only ? 1 : 0, one_time_only ? 1 : 0, id],
    function(err) {
      if (err) {
        if (err.message.includes("UNIQUE")) {
          return res.json({ success: false, message: "كود الخصم موجود مسبقاً" });
        }
        return res.json({ success: false, message: "خطأ في قاعدة البيانات" });
      }
      res.json({ success: true });
    }
  );
});

// Delete coupon (admin)
app.delete("/api/admin/coupons/:id", checkAdminAuth, (req, res) => {
  const id = req.params.id;
  
  db.run("DELETE FROM coupons WHERE id = ?", [id], function(err) {
    if (err) return res.json({ success: false, message: "خطأ في الحذف" });
    res.json({ success: true });
  });
});

// ======================= PAGES CONTENT API ======================= //
// Get page content
app.get("/api/pages/:type", (req, res) => {
  const type = req.params.type;
  db.get("SELECT * FROM pages_content WHERE page_type = ?", [type], (err, row) => {
    if (err) return res.json({ error: "Fetch Error" });
    if (!row) return res.json({ error: "Page not found" });
    res.json(row);
  });
});

// Get all pages (admin)
app.get("/api/admin/pages", checkAdminAuth, (req, res) => {
  db.all("SELECT * FROM pages_content ORDER BY id", (err, rows) => {
    if (err) return res.json({ error: "Fetch Error" });
    res.json(rows);
  });
});

// Update page content
app.put("/api/admin/pages/:type", checkAdminAuth, (req, res) => {
  const type = req.params.type;
  const { title, content } = req.body;
  
  if (!title || !content) {
    return res.json({ error: "Title and content are required" });
  }

  db.run(
    "UPDATE pages_content SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE page_type = ?",
    [title, content, type],
    function(err) {
      if (err) return res.json({ error: "Update Error" });
      if (this.changes === 0) {
        // إذا لم يتم العثور على الصفحة، قم بإنشائها
        db.run(
          "INSERT INTO pages_content (page_type, title, content) VALUES (?, ?, ?)",
          [type, title, content],
          (err2) => {
            if (err2) return res.json({ error: "Insert Error" });
            res.json({ success: true });
          }
        );
      } else {
        res.json({ success: true });
      }
    }
  );
});


// Update order status
app.put("/api/orders/:id/status", checkAdminAuth, (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  db.run(`UPDATE orders SET status=? WHERE id=?`, [status, id], (err) => {
    if (err) return res.json({ error: "Status Update Error" });
    res.json({ success: true });
  });
});

// --------------------------- REVIEWS API --------------------------- //

// Get reviews for a product (only approved)
app.get("/api/reviews/:productId", (req, res) => {
  const productId = req.params.productId;
  db.all(
    `SELECT * FROM reviews 
     WHERE product_id = ? AND status = 'approved' 
     ORDER BY created_at DESC`,
    [productId],
    (err, rows) => {
      if (err) return res.json({ error: "Database error" });
      res.json(rows);
    }
  );
});

// Get average rating for a product
app.get("/api/reviews/:productId/average", (req, res) => {
  const productId = req.params.productId;
  db.get(
    `SELECT 
      AVG(rating) as average_rating,
      COUNT(*) as total_reviews
     FROM reviews 
     WHERE product_id = ? AND status = 'approved'`,
    [productId],
    (err, row) => {
      if (err) return res.json({ error: "Database error" });
      res.json({
        average: row.average_rating ? parseFloat(row.average_rating).toFixed(1) : "0.0",
        total: row.total_reviews || 0
      });
    }
  );
});

// Add a review (check if user bought the product)
app.post("/api/reviews", (req, res) => {
  const { product_id, rating, comment } = req.body;
  const user_email = req.body.user_email || req.body.email;
  const user_phone = req.body.user_phone || req.body.phone;

  if (!user_email || !user_phone) {
    return res.json({ success: false, message: "يجب تسجيل الدخول أولاً" });
  }

  if (!product_id || !rating || rating < 1 || rating > 5) {
    return res.json({ success: false, message: "تقييم غير صحيح" });
  }

  // Check if user bought this product
  db.get(
    `SELECT oi.id FROM order_items oi
     JOIN orders o ON oi.order_id = o.id
     WHERE oi.product_id = ? 
     AND (o.customer_phone = ? OR o.customer_phone = ? OR o.customer_phone = ?)
     LIMIT 1`,
    [product_id, user_phone, "0" + user_phone, "966" + user_phone],
    (err, orderItem) => {
      if (err) {
        return res.json({ success: false, message: "خطأ في قاعدة البيانات" });
      }
      
      if (!orderItem) {
        return res.json({ success: false, message: "يجب شراء المنتج أولاً لتتمكن من تقييمه" });
      }

      // Check if user already reviewed this product
      db.get(
        `SELECT id FROM reviews 
         WHERE product_id = ? AND user_email = ? AND user_phone = ?`,
        [product_id, user_email, user_phone],
        (err2, existingReview) => {
          if (err2) {
            return res.json({ success: false, message: "خطأ في قاعدة البيانات" });
          }
          
          if (existingReview) {
            return res.json({ success: false, message: "لقد قمت بتقييم هذا المنتج مسبقاً" });
          }

          // Insert review
          db.run(
            `INSERT INTO reviews (product_id, user_email, user_phone, rating, comment, status)
             VALUES (?, ?, ?, ?, ?, 'pending')`,
            [product_id, user_email, user_phone, rating, comment || ""],
            function (err3) {
              if (err3) {
                return res.json({ success: false, message: "خطأ في إضافة التقييم" });
              }
              res.json({ success: true, id: this.lastID });
            }
          );
        }
      );
    }
  );
});

// Admin: Get all reviews
app.get("/api/admin/reviews", checkAdminAuth, (req, res) => {
  db.all(
    `SELECT 
      r.*,
      p.name as product_name,
      p.id as product_id
     FROM reviews r
     LEFT JOIN products p ON r.product_id = p.id
     ORDER BY r.created_at DESC`,
    [],
    (err, rows) => {
      if (err) return res.json({ error: "Database error" });
      res.json(rows);
    }
  );
});

// Admin: Update review status
app.post("/api/admin/reviews/:id/status", checkAdminAuth, (req, res) => {
  const reviewId = req.params.id;
  const { status } = req.body;

  if (!["pending", "approved", "rejected"].includes(status)) {
    return res.json({ success: false, message: "حالة غير صحيحة" });
  }

  db.run(
    `UPDATE reviews SET status = ? WHERE id = ?`,
    [status, reviewId],
    function (err) {
      if (err) return res.json({ success: false, message: "خطأ في التحديث" });
      res.json({ success: true });
    }
  );
});

// Admin: Delete review
app.delete("/api/admin/reviews/:id", checkAdminAuth, (req, res) => {
  const reviewId = req.params.id;
  db.run(`DELETE FROM reviews WHERE id = ?`, [reviewId], function (err) {
    if (err) return res.json({ success: false, message: "خطأ في الحذف" });
    res.json({ success: true });
  });
});

// --------------------------- SOCIAL MEDIA API --------------------------- //

// Get all social media (public)
app.get("/api/social-media", (req, res) => {
  db.all(
    `SELECT * FROM social_media WHERE active = 1 ORDER BY display_order ASC, id ASC`,
    [],
    (err, rows) => {
      if (err) return res.json({ error: "Database error" });
      res.json(rows);
    }
  );
});

// Admin: Get all social media
app.get("/api/admin/social-media", checkAdminAuth, (req, res) => {
  db.all(
    `SELECT * FROM social_media ORDER BY display_order ASC, id ASC`,
    [],
    (err, rows) => {
      if (err) return res.json({ error: "Database error" });
      res.json(rows);
    }
  );
});

// Admin: Update social media
app.put("/api/admin/social-media/:id", checkAdminAuth, (req, res) => {
  const id = req.params.id;
  const { url, icon_url, active, display_order } = req.body;

  db.run(
    `UPDATE social_media 
     SET url = ?, icon_url = ?, active = ?, display_order = ?, updated_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [url, icon_url || '', active ? 1 : 0, display_order || 0, id],
    function (err) {
      if (err) return res.json({ success: false, message: "خطأ في التحديث" });
      res.json({ success: true });
    }
  );
});

// Admin: Create social media
app.post("/api/admin/social-media", checkAdminAuth, (req, res) => {
  const { platform, url, icon_url, active, display_order } = req.body;

  if (!platform || !url) {
    return res.json({ success: false, message: "اسم المنصة والرابط مطلوبان" });
  }

  db.run(
    `INSERT INTO social_media (platform, url, icon_url, active, display_order) 
     VALUES (?, ?, ?, ?, ?)`,
    [platform, url, icon_url || '', active ? 1 : 0, display_order || 0],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.json({ success: false, message: "هذه المنصة موجودة بالفعل" });
        }
        return res.json({ success: false, message: "خطأ في الإضافة" });
      }
      res.json({ success: true, id: this.lastID });
    }
  );
});

// Admin: Delete social media
app.delete("/api/admin/social-media/:id", checkAdminAuth, (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM social_media WHERE id = ?`, [id], function (err) {
    if (err) return res.json({ success: false, message: "خطأ في الحذف" });
    res.json({ success: true });
  });
});

// ======================= SERVE FRONTEND & ADMIN ======================= //
// يجب أن تكون في النهاية بعد جميع API routes

// صفحة الموقع الرئيسية
app.get("/", (req, res) => {
  res.sendFile(path.join(process.cwd(), "../frontend/index.html"));
});

// ملفات لوحة التحكم admin/ - محمية
app.use("/admin", (req, res, next) => {
  // السماح بالوصول إلى login.html و auth-check.js بدون مصادقة
  if (req.path === "/login.html" || req.path === "/" || req.path === "/auth-check.js") {
    return next();
  }
  
  // التحقق من الجلسة للصفحات الأخرى
  if (req.session && req.session.adminLoggedIn === true) {
    return next();
  }
  
  // إعادة توجيه إلى صفحة تسجيل الدخول
  return res.redirect("/login.html");
}, express.static(path.join(process.cwd(), "../admin")));

// صفحة layout.html - محمية
app.get("/layout.html", (req, res) => {
  if (req.session && req.session.adminLoggedIn === true) {
    return res.sendFile(path.join(process.cwd(), "../layout.html"));
  }
  return res.redirect("/login.html");
});

// صفحة تسجيل دخول الأدمن - متاحة للجميع
app.get("/login.html", (req, res) => {
  res.sendFile(path.join(process.cwd(), "../login.html"));
});

// تحميل الملفات الأخرى في المشروع الرئيسي (يجب أن يكون في النهاية)
app.use("/", express.static(path.join(process.cwd(), "..")));

// --------------------------- API Config Endpoint --------------------------- //
// Endpoint to get base URL for frontend
app.get("/api/config", (req, res) => {
  // Construct base URL from request if BASE_URL env var is not set
  const baseUrl = process.env.BASE_URL || 
    (req.protocol + "://" + req.get("host"));
  
  res.json({
    success: true,
    baseUrl: baseUrl,
    apiUrl: baseUrl // For backward compatibility
  });
});

// --------------------------- START SERVER --------------------------- //
app.listen(PORT, () => {
  const baseUrl = process.env.BASE_URL || `http://localhost:${PORT}`;
  console.log(`✔ Server running on port ${PORT}`);
  console.log(`✔ Base URL: ${baseUrl}`);
});
