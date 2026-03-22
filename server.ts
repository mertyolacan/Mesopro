import express from 'express';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
dotenv.config();

// ── Cloudinary Configuration ──────────────────────────────────────────────────
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// SVG dosyaları için ayrı bir Cloudinary Storage oluşturuyoruz
// SVG'ler image resource_type ile, use_filename true ile yüklenmeli
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'mesopro',
      resource_type: 'image',
      allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
    };
  },
});

// SVG için memory storage (buffer'a alıp Cloudinary'ye raw olarak göndereceğiz)
const memoryStorage = multer.memoryStorage();

// Dosya tipi kontrolü
const imageFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const isSvg = file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg');
  const isImage = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.mimetype);
  if (isSvg || isImage) {
    cb(null, true);
  } else {
    cb(new Error(`Desteklenmeyen dosya türü: ${file.mimetype}`));
  }
};

// Normal görseller için multer (CloudinaryStorage)
const uploadImage = multer({
  storage: imageStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// SVG için multer (memory)
const uploadSvg = multer({
  storage: memoryStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 },
});


const app = express();

// Security Headers with a basic CSP
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Needed for some dev tools/inline scripts
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "https://api.cloudinary.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));
const PORT = parseInt(process.env.PORT || '3001', 10);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  skipSuccessfulRequests: true,
  message: { error: 'Çok fazla hatalı deneme yapıldı. Lütfen 15 dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const orderLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 orders per hour per IP
  message: { error: 'Çok fazla sipariş denemesi. Lütfen bir saat sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── PostgreSQL Pool ───────────────────────────────────────────────────────────
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 50,              // Increased pool size for concurrent admin actions
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('💥 Unexpected PostgreSQL pool error:', err);
});

app.use(express.json());

// ── CORS Configuration ────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001'];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ── Auth Middleware ──────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('❌ FATAL: JWT_SECRET environment variable is missing in production!');
  process.exit(1);
}
const SAFE_JWT_SECRET = JWT_SECRET || 'mesopro_dev_only_secret_2024_highly_insecure';

const verifyToken = (req: any, res: any, next: any) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Yetkisiz erişim.' });

  try {
    const decoded = jwt.verify(token, SAFE_JWT_SECRET);
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Geçersiz token.' });
  }
};

const verifyAdmin = (req: any, res: any, next: any) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Yetkisiz erişim.' });

  try {
    const decoded: any = jwt.verify(token, SAFE_JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok.' });
    }
    (req as any).user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Geçersiz token.' });
  }
};

const optionalToken = (req: any, _res: any, next: any) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    try { (req as any).user = jwt.verify(token, SAFE_JWT_SECRET); } catch {}
  }
  next();
};

// ── Email Transporter ────────────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

app.post('/api/auth/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1 AND role = $2', [username, 'admin']);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }
    const admin = rows[0];
    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Geçersiz kullanıcı adı veya şifre' });
    }
    const token = jwt.sign({ username: admin.email, role: 'admin', id: admin.id }, SAFE_JWT_SECRET, { expiresIn: '24h' });
    res.json({ success: true, message: 'Giriş başarılı', token });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: 'Giriş işlemi başarısız.' });
  }
});

// ── User Auth & Data ──────────────────────────────────────────────────────────

app.post('/api/auth/register', authLimiter, async (req, res) => {
  const { name, email, password, phone } = req.body;
  try {
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanılıyor.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, phone, role',
      [name, email, hashedPassword, phone, 'user']
    );
    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SAFE_JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, user, token });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Kayıt sırasında bir hata oluştu.' });
  }
});

app.post('/api/auth/user-login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT id, name, email, password, phone, address, role FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı.' });
    }
    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Şifre hatalı.' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, SAFE_JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email, phone: user.phone, address: user.address, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ error: 'Giriş sırasında bir hata oluştu.' });
  }
});

app.post('/api/auth/forgot-password', authLimiter, async (req, res) => {
  const { email } = req.body;
  const genericMessage = { message: "Eğer bu e-posta kayıtlıysa sıfırlama bağlantısı gönderildi." };
  
  try {
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (rows.length === 0) {
      return res.json(genericMessage);
    }
    
    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    
    await pool.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, hashedToken, expiresAt]
    );
    
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}&email=${email}`;
    
    const emailHtml = `
      <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; background-color: #f9fafb; padding: 20px;">
        <div style="background-color: #000; color: #fff; padding: 30px; text-align: center; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">MesoPro</h1>
          <p style="margin: 10px 0 0; opacity: 0.8;">Şifre Sıfırlama</p>
        </div>
        <div style="background-color: #fff; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <p style="font-size: 16px; margin-bottom: 25px;">Merhaba,</p>
          <p style="font-size: 15px; color: #4b5563; margin-bottom: 25px;">Hesabınız için bir şifre sıfırlama talebi aldık. Şifrenizi güvenli bir şekilde sıfırlamak için aşağıdaki butona tıklayabilirsiniz:</p>
          
          <div style="text-align: center; margin-bottom: 30px;">
            <a href="${resetLink}" style="display: inline-block; padding: 14px 28px; background-color: #000; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; transition: background-color 0.3s ease;">Şifremi Sıfırla</a>
          </div>

          <div style="background-color: #fff8f1; border-left: 4px solid #f97316; padding: 15px; margin-bottom: 25px; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px; color: #c2410c;"><strong>Önemli:</strong> Bu bağlantı güvenlik nedeniyle 1 saat boyunca geçerlidir.</p>
          </div>

          <p style="font-size: 14px; color: #6b7280; margin-bottom: 25px;">Eğer bu talebi siz yapmadıysanız, lütfen bu e-postayı dikkate almayın. Hesabınız güvende kalacaktır.</p>

          <div style="text-align: center; padding-top: 25px; border-top: 1px solid #eee;">
            <p style="font-size: 13px; color: #9ca3af; margin-bottom: 0;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayınız.</p>
            <p style="font-size: 13px; color: #9ca3af; margin-top: 5px;">${process.env.FRONTEND_URL || 'http://localhost:3000'}</p>
          </div>
        </div>
        <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
          &copy; 2024 MesoPro. Tüm hakları saklıdır.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"MesoPro" <noreply@mesopro.com>',
      to: email,
      subject: 'Şifre Sıfırlama İsteği',
      html: emailHtml,
    });
    
    res.json(genericMessage);
  } catch (err) {
    console.error('Forgot password error:', err);
    // Even on error, return the same message to avoid leak, but maybe log it
    res.json(genericMessage);
  }
});

app.post('/api/auth/reset-password', authLimiter, async (req, res) => {
  const { email, token, newPassword } = req.body;
  
  try {
    const { rows: userRows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userRows.length === 0) {
      return res.status(400).json({ error: 'Geçersiz istek.' });
    }
    
    const user = userRows[0];
    const { rows: resetRows } = await pool.query(
      'SELECT * FROM password_resets WHERE user_id = $1 AND used = FALSE AND expires_at > NOW()',
      [user.id]
    );
    
    let validReset = null;
    for (const row of resetRows) {
      const isMatch = await bcrypt.compare(token, row.token);
      if (isMatch) {
        validReset = row;
        break;
      }
    }
    
    if (!validReset) {
      return res.status(400).json({ error: 'Geçersiz veya süresi dolmuş bağlantı.' });
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, user.id]);
    await pool.query('UPDATE password_resets SET used = TRUE WHERE id = $1', [validReset.id]);
    
    res.json({ success: true, message: 'Şifreniz başarıyla güncellendi.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'İşlem sırasında bir hata oluştu.' });
  }
});

app.post('/api/auth/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = (req as any).user.id;

  try {
    const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (rows.length === 0) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    const user = rows[0];
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Mevcut şifreniz hatalı.' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);

    res.json({ success: true, message: 'Şifreniz başarıyla değiştirildi.' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'İşlem sırasında bir hata oluştu.' });
  }
});

app.get('/api/users/:id/favorites', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT product_id FROM favorites WHERE user_id = $1', [id]);
    res.json(result.rows.map(row => row.product_id));
  } catch (err) {
    console.error('Get favorites error:', err);
    res.status(500).json({ error: 'Favoriler alınamadı.' });
  }
});

app.post('/api/users/:id/favorites', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { productId } = req.body;
  try {
    const existing = await pool.query('SELECT * FROM favorites WHERE user_id = $1 AND product_id = $2', [id, productId]);
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM favorites WHERE user_id = $1 AND product_id = $2', [id, productId]);
      res.json({ success: true, action: 'removed' });
    } else {
      await pool.query('INSERT INTO favorites (user_id, product_id) VALUES ($1, $2)', [id, productId]);
      res.json({ success: true, action: 'added' });
    }
  } catch (err) {
    console.error('Toggle favorite error:', err);
    res.status(500).json({ error: 'Favori işlemi başarısız.' });
  }
});

app.get('/api/users/:id/orders', verifyToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Get user orders error:', err);
    res.status(500).json({ error: 'Sipariş geçmişi alınamadı.' });
  }
});

app.patch('/api/users/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { name, phone, address } = req.body;
  try {
    const result = await pool.query(
      'UPDATE users SET name = COALESCE($1, name), phone = COALESCE($2, phone), address = COALESCE($3, address) WHERE id = $4 RETURNING id, name, email, phone, address',
      [name, phone, address, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user: result.rows[0] });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Profil güncellenemedi.' });
  }
});

// ── Init Database ─────────────────────────────────────────────────────────────
async function initDb() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

      CREATE TABLE IF NOT EXISTS favorites (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id TEXT NOT NULL,
        PRIMARY KEY (user_id, product_id)
      );

      CREATE TABLE IF NOT EXISTS products (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT NOT NULL,
        category TEXT NOT NULL,
        problem TEXT[] NOT NULL DEFAULT '{}',
        base_price NUMERIC NOT NULL DEFAULT 0,
        image TEXT NOT NULL DEFAULT '',
        description TEXT NOT NULL DEFAULT '',
        ingredients TEXT DEFAULT '',
        indications TEXT DEFAULT '',
        application_area TEXT DEFAULT '',
        warnings TEXT DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        address TEXT NOT NULL,
        items JSONB NOT NULL DEFAULT '[]',
        applied_campaigns JSONB NOT NULL DEFAULT '[]',
        total NUMERIC NOT NULL DEFAULT 0,
        payment_method TEXT NOT NULL DEFAULT 'pay_later',
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TEXT NOT NULL
      );
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS applied_campaigns JSONB NOT NULL DEFAULT '[]';
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

      CREATE TABLE IF NOT EXISTS media (
        id SERIAL PRIMARY KEY,
        url TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS phone TEXT NOT NULL DEFAULT '';

      CREATE TABLE IF NOT EXISTS brands (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        logo TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        image TEXT NOT NULL DEFAULT '',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT NOT NULL DEFAULT '';

      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        target_value TEXT,
        min_quantity INTEGER NOT NULL DEFAULT 0,
        min_amount INTEGER NOT NULL DEFAULT 0,
        discount_type TEXT NOT NULL,
        discount_value DECIMAL NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT true,
        is_stackable BOOLEAN NOT NULL DEFAULT false,
        coupon_code TEXT,
        start_date TIMESTAMPTZ,
        end_date TIMESTAMPTZ,
        max_usage INTEGER NOT NULL DEFAULT 0,
        current_usage INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      -- Ensure columns exist (for tables created before this migration)
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS end_date TIMESTAMPTZ;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS is_stackable BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS coupon_code TEXT;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS max_usage INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS current_usage INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS bogo_free_quantity INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS per_user_limit INTEGER NOT NULL DEFAULT 0; -- 0 means no limit per user, 1 means once per user
      
      CREATE TABLE IF NOT EXISTS campaign_usage (
        id SERIAL PRIMARY KEY,
        campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        email TEXT NOT NULL,
        order_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_camp_usage_user ON campaign_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_camp_usage_email ON campaign_usage(email);
      ALTER TABLE products ADD COLUMN IF NOT EXISTS featured_badge TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS original_price NUMERIC;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS in_stock BOOLEAN NOT NULL DEFAULT true;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER NOT NULL DEFAULT -1;
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

      CREATE TABLE IF NOT EXISTS admin_invites (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        token TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        invited_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        admin_name TEXT,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        resource_id TEXT,
        detail TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);
      -- Performance indexes
      CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
      CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_campaigns_active ON campaigns(is_active);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
      CREATE INDEX IF NOT EXISTS idx_media_created ON media(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(is_read) WHERE is_read = false;

      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL DEFAULT ''
      );

      INSERT INTO settings (key, value) VALUES
        ('site_title', 'MesoPro'),
        ('contact_email', ''),
        ('contact_phone', ''),
        ('contact_address', ''),
        ('whatsapp_number', '905000000000'),
        ('whatsapp_greeting', 'Merhaba, bilgi almak istiyorum.'),
        ('site_logo', ''),
        ('favicon_url', '')
      ON CONFLICT (key) DO NOTHING;

      -- Support Tickets
      CREATE TABLE IF NOT EXISTS support_tickets (
        id SERIAL PRIMARY KEY,
        subject TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'open',
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        message TEXT NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON support_tickets(status);
      CREATE INDEX IF NOT EXISTS idx_tickets_email ON support_tickets(email);

      CREATE TABLE IF NOT EXISTS ticket_replies (
        id SERIAL PRIMARY KEY,
        ticket_id INTEGER NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
        message TEXT NOT NULL,
        is_admin BOOLEAN NOT NULL DEFAULT FALSE,
        author_name TEXT NOT NULL,
        author_email TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_ticket_replies_ticket ON ticket_replies(ticket_id);

      -- FAQs
      CREATE TABLE IF NOT EXISTS faqs (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'general',
        sort_order INTEGER NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      -- Blog Posts
      CREATE TABLE IF NOT EXISTS blog_posts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        excerpt TEXT,
        cover_image TEXT,
        author_name TEXT NOT NULL DEFAULT 'MesoPro',
        tags TEXT[] DEFAULT '{}',
        status TEXT NOT NULL DEFAULT 'draft',
        published_at TIMESTAMPTZ,
        seo_title TEXT,
        seo_description TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
      CREATE INDEX IF NOT EXISTS idx_blog_status ON blog_posts(status, published_at DESC);

      -- SEO Pages
      CREATE TABLE IF NOT EXISTS seo_pages (
        page TEXT PRIMARY KEY,
        title TEXT,
        description TEXT,
        og_title TEXT,
        og_description TEXT,
        og_image TEXT,
        robots TEXT DEFAULT 'index, follow',
        canonical TEXT,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_card TEXT DEFAULT 'summary_large_image';
      ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_title TEXT;
      ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS twitter_description TEXT;
      ALTER TABLE seo_pages ADD COLUMN IF NOT EXISTS meta_keywords TEXT;
      INSERT INTO seo_pages (page) VALUES ('home'), ('products'), ('blog'), ('sss'), ('destek')
      ON CONFLICT (page) DO NOTHING;

      -- Product SEO fields
      ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_title TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_description TEXT;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS keywords TEXT;

      -- Blog SEO keywords
      ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
    `);

    // ── Admin Seeding ──────────────────────────────────────────────────────
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'mesopro2024';
    const { rows: existingAdmins } = await client.query('SELECT * FROM users WHERE role = $1', ['admin']);

    if (existingAdmins.length === 0) {
      console.log('Seeding default admin user...');
      const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
      await client.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4)',
        ['Administrator', adminUsername, hashedAdminPassword, 'admin']
      );
    }

    // Migration: Hash any plain-text passwords
    const users = await client.query('SELECT id, password FROM users');
    for (const user of users.rows) {
      if (!user.password.startsWith('$2a$')) {
        const hashed = await bcrypt.hash(user.password, 10);
        await client.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
        console.log(`Migrated user ${user.id} password to hash.`);
      }
    }

    console.log('✅ Veritabanı başarıyla hazırlandı ve migrasyonlar tamamlandı.');
  } catch (err) {
    console.error('❌ Veritabanı hazırlama hatası:', err);
  } finally {
    client.release();
  }
}

// ── Upload ────────────────────────────────────────────────────────────────────

// POST /api/upload
// SVG → memory storage + cloudinary.uploader.upload (resource_type: raw)
// Diğer → CloudinaryStorage (multer-storage-cloudinary)
app.post('/api/upload', verifyAdmin, (req, res) => {
  // Tüm dosyaları önce memory'ye al, sonra tipine göre Cloudinary'ye gönder
  uploadSvg.single('image')(req, res, async (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: err.message || 'Dosya işlenemedi' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Dosya seçilmedi' });
    }

    const file = req.file;
    const isSvg = file.mimetype === 'image/svg+xml' || file.originalname.toLowerCase().endsWith('.svg');

    try {
      let url: string;

      if (isSvg) {
        // SVG: Cloudinary raw upload (resource_type: 'raw' SVG'yi kabul eder)
        // Buffer'ı base64'e çevirerek data URI olarak yükle
        const base64 = file.buffer.toString('base64');
        const dataUri = `data:image/svg+xml;base64,${base64}`;

        const result = await cloudinary.uploader.upload(dataUri, {
          folder: 'mesopro',
          resource_type: 'raw',
          public_id: `svg_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9]/g, '_')}`,
          format: 'svg',
        });

        url = result.secure_url;
        console.log(`📁 SVG Upload: ${file.originalname} → ${url}`);

      } else {
        // Normal görsel: CloudinaryStorage ile yükle
        // Dosyayı multer-storage-cloudinary üzerinden tekrar işle
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'mesopro',
            resource_type: 'image',
            allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
          },
          (error, result) => {
            if (error || !result) {
              console.error('Cloudinary upload error:', error);
              return res.status(500).json({ error: 'Cloudinary yüklemesi başarısız' });
            }
            url = result.secure_url;
            console.log(`📁 Image Upload: ${file.originalname} → ${url}`);

            // DB'ye kaydet
            pool.query('INSERT INTO media (url) VALUES ($1) RETURNING *', [url])
              .then(({ rows }) => res.json(rows[0]))
              .catch((dbErr) => {
                console.error('Save media error:', dbErr);
                res.status(500).json({ error: 'Medya kaydedilemedi' });
              });
          }
        );

        // Buffer'ı stream'e yaz
        const { Readable } = await import('stream');
        Readable.from(file.buffer).pipe(stream);
        return; // Callback içinde yanıt verilecek
      }

      // SVG için DB kaydı
      const { rows } = await pool.query(
        'INSERT INTO media (url) VALUES ($1) RETURNING *',
        [url]
      );
      res.json(rows[0]);

    } catch (uploadErr: any) {
      console.error('Upload error:', uploadErr);
      res.status(500).json({ error: uploadErr.message || 'Yükleme başarısız' });
    }
  });
});


// GET /api/media
app.get('/api/media', verifyAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM media ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/media error:', err);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
});

// DELETE /api/media/:id
app.delete('/api/media/:id', verifyAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('DELETE FROM media WHERE id = $1 RETURNING *', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Media not found' });

    // (Opsiyonel: Cloudinary SDK kullanarak cloudinary'den de silinebilir)
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/media error:', err);
    res.status(500).json({ error: 'Failed to delete media record' });
  }
});

// ── Products ──────────────────────────────────────────────────────────────────

// GET /api/products
app.get('/api/products', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM products ORDER BY created_at ASC'
    );
    const products = rows.map(rowToProduct);
    res.json(products);
  } catch (err) {
    console.error('GET /api/products error:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
app.get('/api/products/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
    res.json(rowToProduct(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products  (create or upsert)
app.post('/api/products', verifyAdmin, async (req, res) => {
  const p = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO products (id, name, brand, category, problem, base_price, image, description, ingredients, indications, application_area, warnings, featured_badge, original_price, in_stock, stock_quantity, seo_title, seo_description, keywords)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       ON CONFLICT (id) DO UPDATE SET
         name=$2, brand=$3, category=$4, problem=$5, base_price=$6,
         image=$7, description=$8, ingredients=$9, indications=$10,
         application_area=$11, warnings=$12, featured_badge=$13, original_price=$14, in_stock=$15, stock_quantity=$16,
         seo_title=$17, seo_description=$18, keywords=$19
       RETURNING *`,
      [p.id, p.name, p.brand, p.category, p.problem, p.basePrice, p.image, p.description, p.ingredients || '', p.indications || '', p.applicationArea || '', p.warnings || '', p.featuredBadge || null, p.originalPrice || null, p.inStock !== undefined ? p.inStock : true, p.stockQuantity !== undefined ? p.stockQuantity : -1, p.seoTitle || null, p.seoDescription || null, p.keywords || null]
    );
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'create', 'product', rows[0].id, p.name);
    res.json(rowToProduct(rows[0]));
  } catch (err) {
    console.error('POST /api/products error:', err);
    res.status(500).json({ error: 'Failed to save product' });
  }
});

// PATCH /api/products/:id/seo (Admin) — sadece SEO alanlarını günceller
app.patch('/api/products/:id/seo', verifyAdmin, async (req, res) => {
  try {
    const { seo_title, seo_description, keywords } = req.body;
    const { rows } = await pool.query(
      'UPDATE products SET seo_title=$1, seo_description=$2, keywords=$3 WHERE id=$4 RETURNING *',
      [seo_title || null, seo_description || null, keywords || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Product not found' });
    res.json(rowToProduct(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product SEO' });
  }
});

// DELETE /api/products/:id
app.delete('/api/products/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [req.params.id]);
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'delete', 'product', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// ── Messages ─────────────────────────────────────────────────────────────────

// POST /api/messages
app.post('/api/messages', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO messages (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, email, phone || '', message]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/messages error:', err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// GET /api/messages
app.get('/api/messages', verifyAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/messages error:', err);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// DELETE /api/messages/:id
app.delete('/api/messages/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM messages WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete message' });
  }
});

// PATCH /api/messages/:id/read
app.patch('/api/messages/:id/read', verifyAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('UPDATE messages SET is_read = true WHERE id = $1 RETURNING *', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read' });
  }
});

// ── Brands ────────────────────────────────────────────────────────────────────

// GET /api/brands
app.get('/api/brands', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM brands ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/brands error:', err);
    res.status(500).json({ error: 'Failed to fetch brands' });
  }
});

// POST /api/brands
app.post('/api/brands', verifyAdmin, async (req, res) => {
  try {
    const { name, logo } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO brands (name, logo) VALUES ($1, $2) RETURNING *',
      [name, logo || '']
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /api/brands error:', err);
    res.status(500).json({ error: 'Failed to create brand' });
  }
});

// DELETE /api/brands/:id
app.delete('/api/brands/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM brands WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete brand' });
  }
});

// PATCH /api/brands/:id
app.patch('/api/brands/:id', verifyAdmin, async (req, res) => {
  try {
    const { name, logo } = req.body;
    const { rows } = await pool.query(
      'UPDATE brands SET name = $1, logo = $2 WHERE id = $3 RETURNING *',
      [name, logo, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Brand not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/brands error:', err);
    res.status(500).json({ error: 'Failed to update brand' });
  }
});

// ── Categories ────────────────────────────────────────────────────────────────

// GET /api/categories
app.get('/api/categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /api/categories error:', err);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/categories
app.post('/api/categories', verifyAdmin, async (req, res) => {
  try {
    const { name, image } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const { rows } = await pool.query(
      'INSERT INTO categories (name, image) VALUES ($1, $2) RETURNING *',
      [name.trim(), image || '']
    );
    res.status(201).json(rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Bu kategori zaten mevcut' });
    console.error('POST /api/categories error:', err);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PATCH /api/categories/:id
app.patch('/api/categories/:id', verifyAdmin, async (req, res) => {
  try {
    const { name, image } = req.body;
    const { rows } = await pool.query(
      'UPDATE categories SET name = COALESCE($1, name), image = COALESCE($2, image) WHERE id = $3 RETURNING *',
      [name?.trim() || null, image, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    res.json(rows[0]);
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'Bu kategori adı zaten mevcut' });
    console.error('PATCH /api/categories error:', err);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
app.delete('/api/categories/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM categories WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/categories error:', err);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ── Campaigns ─────────────────────────────────────────────────────────────────

// GET /api/campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    let currentUserId: number | null = null;
    let currentUserEmail: string | null = null;

    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded: any = jwt.verify(token, SAFE_JWT_SECRET);
        currentUserId = decoded.id;
        currentUserEmail = decoded.username;
      } catch (e) { /* Ignore invalid tokens for non-locked routes */ }
    }

    const { rows: campaigns } = await pool.query('SELECT * FROM campaigns ORDER BY min_quantity ASC, created_at ASC');
    let data = campaigns.map(rowToCampaign);

    if (currentUserId || currentUserEmail) {
      // Mark campaigns as used only if perUserLimit > 0 AND usage count has reached the limit
      const { rows: used } = await pool.query(
        'SELECT campaign_id, COUNT(*) as usage_count FROM campaign_usage WHERE user_id = $1 OR email = $2 GROUP BY campaign_id',
        [currentUserId, currentUserEmail]
      );
      const usageMap = new Map(used.map(u => [u.campaign_id, parseInt(u.usage_count)]));
      data = data.map(c => ({
        ...c,
        isUsed: c.perUserLimit > 0 && (usageMap.get(c.id) || 0) >= c.perUserLimit
      }));
    }

    res.json(data);
  } catch (err) {
    console.error('GET /api/campaigns error:', err);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// POST /api/campaigns
app.post('/api/campaigns', verifyAdmin, async (req, res) => {
  const { name, type, targetValue, minQuantity, minAmount, discountType, discountValue, isActive, isStackable, couponCode, startDate, endDate, maxUsage, bogoFreeQuantity, perUserLimit, description } = req.body;
  const cleanCouponCode = couponCode && couponCode.trim().length > 0 ? couponCode.trim().toUpperCase() : null;
  try {
    const { rows } = await pool.query(
      `INSERT INTO campaigns (name, type, target_value, min_quantity, min_amount, discount_type, discount_value, is_active, is_stackable, coupon_code, start_date, end_date, max_usage, bogo_free_quantity, per_user_limit, description)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16) RETURNING *`,
      [name, type, targetValue || null, minQuantity || 0, minAmount || 0, discountType, discountValue, isActive ?? true, isStackable ?? false, cleanCouponCode, startDate || null, endDate || null, maxUsage || 0, bogoFreeQuantity || 1, perUserLimit || 0, description || '']
    );
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'create', 'campaign', String(rows[0].id), name);
    res.status(201).json(rowToCampaign(rows[0]));
  } catch (err) {
    console.error('POST /api/campaigns error:', err);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// PATCH /api/campaigns/:id
app.patch('/api/campaigns/:id', verifyAdmin, async (req, res) => {
  const { name, type, targetValue, minQuantity, minAmount, discountType, discountValue, isActive, isStackable, couponCode, startDate, endDate, maxUsage, bogoFreeQuantity, perUserLimit, description } = req.body;
  const cleanCouponCode = couponCode !== undefined ? (couponCode && couponCode.trim().length > 0 ? couponCode.trim().toUpperCase() : null) : undefined;
  try {
    const { rows } = await pool.query(
      `UPDATE campaigns SET
        name = COALESCE($1, name),
        type = COALESCE($2, type),
        target_value = $3,
        min_quantity = COALESCE($4, min_quantity),
        min_amount = COALESCE($5, min_amount),
        discount_type = COALESCE($6, discount_type),
        discount_value = COALESCE($7, discount_value),
        is_active = COALESCE($8, is_active),
        is_stackable = COALESCE($9, is_stackable),
        coupon_code = $10,
        start_date = $11,
        end_date = $12,
        max_usage = COALESCE($13, max_usage),
        bogo_free_quantity = COALESCE($14, bogo_free_quantity),
        per_user_limit = COALESCE($15, per_user_limit),
        description = COALESCE($16, description)
       WHERE id = $17 RETURNING *`,
      [name, type, targetValue === undefined ? null : targetValue, minQuantity, minAmount, discountType, discountValue, isActive, isStackable, cleanCouponCode === undefined ? null : cleanCouponCode, startDate === undefined ? null : startDate, endDate === undefined ? null : endDate, maxUsage, bogoFreeQuantity, perUserLimit, description, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Campaign not found' });
    res.json(rowToCampaign(rows[0]));
  } catch (err) {
    console.error('PATCH /api/campaigns error:', err);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// DELETE /api/campaigns/:id
app.delete('/api/campaigns/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM campaigns WHERE id = $1', [req.params.id]);
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'delete', 'campaign', req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/campaigns error:', err);
    res.status(500).json({ error: 'Failed to delete campaign' });
  }
});

// ── Settings ──────────────────────────────────────────────────────────────────

// GET /api/settings (public)
app.get('/api/settings', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT key, value FROM settings ORDER BY key ASC');
    const result: Record<string, string> = {};
    rows.forEach((r: { key: string; value: string }) => { result[r.key] = r.value; });
    res.json(result);
  } catch (err) {
    console.error('GET /api/settings error:', err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
});

// PUT /api/settings/:key (admin only)
app.put('/api/settings/:key', verifyAdmin, async (req, res) => {
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: 'value required' });
  try {
    const { rows } = await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2 RETURNING *',
      [req.params.key, value]
    );
    res.json({ key: rows[0].key, value: rows[0].value });
  } catch (err) {
    console.error('PUT /api/settings/:key error:', err);
    res.status(500).json({ error: 'Failed to update setting' });
  }
});

// ── Admin Users ───────────────────────────────────────────────────────────────

// GET /api/admin/users (Admin only)
app.get('/api/admin/users', verifyAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.name, u.email, u.phone, u.address, u.created_at,
             COUNT(o.id)::int AS order_count,
             COALESCE(SUM(o.total), 0)::numeric AS total_spent
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      WHERE u.role = 'user'
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json(rows.map(r => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone || '',
      address: r.address || '',
      createdAt: r.created_at,
      orderCount: r.order_count,
      totalSpent: parseFloat(r.total_spent),
    })));
  } catch (err) {
    console.error('GET /api/admin/users error:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ── Orders ────────────────────────────────────────────────────────────────────

// GET /api/orders (Admin only)
app.get('/api/orders', verifyAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(rows.map(rowToOrder));
  } catch (err) {
    console.error('GET /api/orders error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET /api/orders/:id (Self or Admin)
app.get('/api/orders/:id', verifyToken, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    
    const order = rows[0];
    const user: any = (req as any).user;

    // Authorization: Must be owner OR an admin
    if (order.user_id !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Bu siparişe erişim yetkiniz yok.' });
    }

    res.json(rowToOrder(order));
  } catch (err) {
    console.error('GET /api/orders/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

// POST /api/orders (create)
app.post('/api/orders', orderLimiter, async (req, res) => {
  const o = req.body;
  try {
    // ── Server-Side Campaign Validation ──────────────────────────────────
    const appliedCampaignIds = Array.isArray(o.appliedCampaigns) ? o.appliedCampaigns : [];
    if (appliedCampaignIds.length > 0) {
      const { rows: meta } = await pool.query(
        'SELECT id, name, per_user_limit, coupon_code FROM campaigns WHERE id = ANY($1::int[])',
        [appliedCampaignIds]
      );
      
      for (const camp of meta) {
        // Block all coupon-based campaigns for guests
        if (camp.coupon_code && !o.userId) {
          return res.status(400).json({ error: `"${camp.name}" kampanyası sadece kayıtlı kullanıcılar içindir. Lütfen giriş yapınız.` });
        }

        if (camp.per_user_limit > 0) {
           const { rows: existing } = await pool.query(
             'SELECT id FROM campaign_usage WHERE campaign_id = $1 AND (user_id = $2 OR email = $3)',
             [camp.id, o.userId || null, o.email]
           );
           if (existing.length >= camp.per_user_limit) {
              return res.status(400).json({ error: `Kampanya "${camp.name}" sadece ${camp.per_user_limit} kez kullanılabilir.` });
           }
        }
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO orders (id, customer_name, email, phone, address, items, applied_campaigns, total, payment_method, status, created_at, user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [o.id, o.customerName, o.email, o.phone, o.address, JSON.stringify(o.items), JSON.stringify(appliedCampaignIds), o.total, o.paymentMethod, o.status || 'pending', o.createdAt, o.userId || null]
    );

    // Record Campaign Usage & Increment Counts
    if (appliedCampaignIds.length > 0) {
      for (const campId of appliedCampaignIds) {
         // Insert into usage history
         await pool.query(
           'INSERT INTO campaign_usage (campaign_id, user_id, email, order_id) VALUES ($1, $2, $3, $4)',
           [campId, o.userId || null, o.email, o.id]
         ).catch(e => console.error('Usage recording failed:', e));
      }
      
      await pool.query(
        `UPDATE campaigns SET current_usage = current_usage + 1 WHERE id = ANY($1::int[])`,
        [appliedCampaignIds]
      ).catch(e => console.warn('Failed to increment usage counts for campaigns:', e));
    }

    const order = rowToOrder(rows[0]);
    res.json(order);

    // ── Send Email Notifications (Fire and Forget) ───────────────────────────
    (async () => {
      try {
        const itemsHtml = order.items.map((item: any) => `
          <tr>
            <td style="padding: 12px; border-bottom: 1px solid #eee;">
              <div style="font-weight: 600;">${item.productName || item.name || 'Bilinmeyen Ürün'}</div>
              <div style="font-size: 13px; color: #666;">${item.productBrand || item.brand || ''}</div>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right;">₺${parseFloat(item.price).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
            <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: right; font-weight: 600;">₺${(parseFloat(item.price) * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join('');

        const commonStyles = `
          font-family: 'Inter', system-ui, -apple-system, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 650px;
          margin: 0 auto;
          background-color: #f9fafb;
          padding: 20px;
        `;

        const headerStyles = `
          background-color: #000;
          color: #fff;
          padding: 30px;
          text-align: center;
          border-radius: 12px 12px 0 0;
        `;

        const contentBox = `
          background-color: #fff;
          padding: 30px;
          border-radius: 0 0 12px 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        `;

        const emailHtml = (title: string, greeting: string) => `
          <div style="${commonStyles}">
            <div style="${headerStyles}">
              <h1 style="margin: 0; font-size: 24px;">MesoPro</h1>
              <p style="margin: 10px 0 0; opacity: 0.8;">${title}</p>
            </div>
            <div style="${contentBox}">
              <p style="font-size: 16px; margin-bottom: 20px;">${greeting}</p>
              
              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
                <h3 style="margin-top: 0; color: #111;">Sipariş Bilgileri</h3>
                <p style="margin: 5px 0;"><strong>Sipariş No:</strong> #${order.id}</p>
                <p style="margin: 5px 0;"><strong>Tarih:</strong> ${new Date(order.createdAt).toLocaleString('tr-TR')}</p>
                <p style="margin: 5px 0;"><strong>Ödeme:</strong> ${order.paymentMethod === 'pay_later' ? 'Kapıda Ödeme' : 'Online Ödeme'}</p>
              </div>

              <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                <thead>
                  <tr style="background-color: #f9fafb;">
                    <th style="padding: 12px; text-align: left; font-size: 13px; text-transform: uppercase; color: #666; width: 45%;">Ürün</th>
                    <th style="padding: 12px; text-align: center; font-size: 13px; text-transform: uppercase; color: #666;">Adet</th>
                    <th style="padding: 12px; text-align: right; font-size: 13px; text-transform: uppercase; color: #666;">Fiyat</th>
                    <th style="padding: 12px; text-align: right; font-size: 13px; text-transform: uppercase; color: #666;">Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsHtml}
                </tbody>
                <tfoot>
                  <tr>
                    <td colspan="3" style="padding: 20px 12px 5px; text-align: right; font-weight: 500;">Ara Toplam:</td>
                    <td style="padding: 20px 12px 5px; text-align: right;">₺${order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr>
                    <td colspan="3" style="padding: 5px 12px; text-align: right; font-weight: 500;">Kargo:</td>
                    <td style="padding: 5px 12px; text-align: right;">Ücretsiz</td>
                  </tr>
                  <tr>
                    <td colspan="3" style="padding: 10px 12px; text-align: right; font-size: 18px; font-weight: 700;">Genel Toplam:</td>
                    <td style="padding: 10px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #000;">₺${order.total.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>

              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div style="background-color: #fff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px; color: #111;">Teslimat Adresi</h4>
                  <p style="margin: 0; font-size: 14px; color: #4b5563;">${order.customerName}<br>${order.address}<br>${order.phone}</p>
                </div>
                <div style="background-color: #fff; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px;">
                  <h4 style="margin: 0 0 10px; color: #111;">Teslimat Süresi</h4>
                  <p style="margin: 0; font-size: 14px; color: #4b5563;">Siparişiniz 2-4 iş günü içerisinde teslim edilecektir.</p>
                </div>
              </div>

              <div style="text-align: center; padding: 20px 0; border-top: 1px solid #eee;">
                <p style="font-size: 14px; color: #666; margin-bottom: 0;">Herhangi bir sorunuz varsa bize <strong>${process.env.FRONTEND_URL || 'http://localhost:3000'}</strong> üzerinden ulaşabilirsiniz.</p>
              </div>
            </div>
            <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
              &copy; 2024 MesoPro. Tüm hakları saklıdır.
            </div>
          </div>
        `;

        // 1. Send to Customer
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"MesoPro" <noreply@mesopro.com>',
          to: order.email,
          subject: `Siparişiniz Alındı! (#${order.id})`,
          html: emailHtml('Sipariş Onayı', `Merhaba ${order.customerName}, siparişiniz başarıyla alındı. Sizin için hazırlamaya başladık bile!`),
        });

        // 2. Send to Admin
        await transporter.sendMail({
          from: process.env.SMTP_FROM || '"MesoPro" <noreply@mesopro.com>',
          to: process.env.SMTP_USER,
          subject: `Yeni Sipariş Bildirimi! (#${order.id})`,
          html: emailHtml('Yeni Sipariş', `${order.customerName} tarafından yeni bir sipariş verildi. Detaylar aşağıdadır:`),
        });

        console.log(`✅ Order notification emails sent for #${order.id}`);
      } catch (mailErr) {
        console.error('❌ Failed to send order notification emails:', mailErr);
      }
    })();

  } catch (err) {
    console.error('POST /api/orders error:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// PATCH /api/orders/:id/status
app.patch('/api/orders/:id/status', verifyAdmin, async (req, res) => {
  const { status } = req.body;
  try {
    const { rows } = await pool.query(
      'UPDATE orders SET status=$1 WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Order not found' });
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'update', 'order', req.params.id, status);
    res.json(rowToOrder(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// PATCH /api/orders/:id/notes (Admin only)
app.patch('/api/orders/:id/notes', verifyAdmin, async (req, res) => {
  const { notes } = req.body;
  try {
    await pool.query('UPDATE orders SET notes=$1 WHERE id=$2', [notes || '', req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order notes' });
  }
});

// GET /api/analytics (Admin only)
app.get('/api/analytics', verifyAdmin, async (req, res) => {
  try {
    const now = new Date();
    const defaultFrom = new Date(now); defaultFrom.setDate(defaultFrom.getDate() - 29);
    const from = req.query.from ? new Date(req.query.from as string) : defaultFrom;
    const to = req.query.to ? new Date(req.query.to as string) : now;
    const diffMs = to.getTime() - from.getTime();
    const prevTo = new Date(from.getTime() - 1);
    const prevFrom = new Date(prevTo.getTime() - diffMs);

    const [kpiRes, kpiPrevRes, byDayRes, topProdRes, statusRes, newCustRes, newCustPrevRes, campaignRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS order_count, COALESCE(SUM(total),0)::numeric AS revenue, COALESCE(AVG(total),0)::numeric AS avg_order, COUNT(DISTINCT email)::int AS unique_customers FROM orders WHERE created_at >= $1 AND created_at <= $2`, [from, to]),
      pool.query(`SELECT COUNT(*)::int AS order_count, COALESCE(SUM(total),0)::numeric AS revenue, COALESCE(AVG(total),0)::numeric AS avg_order FROM orders WHERE created_at >= $1 AND created_at <= $2`, [prevFrom, prevTo]),
      pool.query(`SELECT DATE(created_at) AS day, COUNT(*)::int AS orders, COALESCE(SUM(total),0)::numeric AS revenue FROM orders WHERE created_at >= $1 AND created_at <= $2 GROUP BY DATE(created_at) ORDER BY day`, [from, to]),
      pool.query(`SELECT item->>'productName' AS name, SUM((item->>'quantity')::int)::int AS qty, SUM((item->>'price')::numeric * (item->>'quantity')::int)::numeric AS revenue FROM orders, jsonb_array_elements(items::jsonb) AS item WHERE created_at >= $1 AND created_at <= $2 GROUP BY name ORDER BY revenue DESC LIMIT 5`, [from, to]),
      pool.query(`SELECT status, COUNT(*)::int AS count FROM orders WHERE created_at >= $1 AND created_at <= $2 GROUP BY status`, [from, to]),
      pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role='user' AND created_at >= $1 AND created_at <= $2`, [from, to]),
      pool.query(`SELECT COUNT(*)::int AS count FROM users WHERE role='user' AND created_at >= $1 AND created_at <= $2`, [prevFrom, prevTo]),
      pool.query(`SELECT c.name, COUNT(cu.id)::int AS used_count FROM campaigns c LEFT JOIN campaign_usage cu ON cu.campaign_id = c.id AND cu.created_at >= $1 AND cu.created_at <= $2 GROUP BY c.id, c.name ORDER BY used_count DESC LIMIT 5`, [from, to]),
    ]);

    const kpi = kpiRes.rows[0];
    const kpiPrev = kpiPrevRes.rows[0];
    const pct = (curr: number, prev: number) => prev > 0 ? Math.round(((curr - prev) / prev) * 100) : 0;

    res.json({
      kpis: {
        revenue: parseFloat(kpi.revenue),
        orderCount: kpi.order_count,
        avgOrder: parseFloat(kpi.avg_order),
        uniqueCustomers: kpi.unique_customers,
        newCustomers: newCustRes.rows[0].count,
        prevRevenue: parseFloat(kpiPrev.revenue),
        prevOrderCount: kpiPrev.order_count,
        prevAvgOrder: parseFloat(kpiPrev.avg_order),
        prevNewCustomers: newCustPrevRes.rows[0].count,
        revenueChange: pct(parseFloat(kpi.revenue), parseFloat(kpiPrev.revenue)),
        orderChange: pct(kpi.order_count, kpiPrev.order_count),
        avgOrderChange: pct(parseFloat(kpi.avg_order), parseFloat(kpiPrev.avg_order)),
        newCustomerChange: pct(newCustRes.rows[0].count, newCustPrevRes.rows[0].count),
      },
      revenueByDay: byDayRes.rows.map(r => ({ day: r.day, orders: r.orders, revenue: parseFloat(r.revenue) })),
      topProducts: topProdRes.rows.map(r => ({ name: r.name, qty: r.qty, revenue: parseFloat(r.revenue) })),
      statusBreakdown: statusRes.rows.reduce((acc: any, r: any) => { acc[r.status] = r.count; return acc; }, {}),
      campaignStats: campaignRes.rows,
    });
  } catch (err) {
    console.error('GET /api/analytics error:', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/admin/notifications (Admin only)
app.get('/api/admin/notifications', verifyAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT
        (SELECT COUNT(*)::int FROM orders WHERE status='pending' AND created_at > NOW() - INTERVAL '24h') AS new_orders,
        (SELECT COUNT(*)::int FROM messages WHERE is_read = false) AS unread_messages,
        (SELECT COUNT(*)::int FROM products WHERE stock_quantity >= 0 AND stock_quantity <= 5) AS low_stock
    `);
    res.json({ newOrders: rows[0].new_orders, unreadMessages: rows[0].unread_messages, lowStock: rows[0].low_stock });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/admin/audit (Admin only)
app.get('/api/admin/audit', verifyAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 100');
    res.json(rows.map(r => ({
      id: r.id, adminId: r.admin_id, adminName: r.admin_name,
      action: r.action, resource: r.resource, resourceId: r.resource_id,
      detail: r.detail, createdAt: r.created_at,
    })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch audit log' });
  }
});

// GET /api/admin/team (Admin only)
app.get('/api/admin/team', verifyAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query(`SELECT id, name, email, created_at FROM users WHERE role='admin' ORDER BY created_at ASC`);
    res.json(rows.map(r => ({ id: r.id, name: r.name, email: r.email, createdAt: r.created_at })));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch admin team' });
  }
});

// DELETE /api/admin/team/:id (Admin only — cannot remove self)
app.delete('/api/admin/team/:id', verifyAdmin, async (req, res) => {
  const targetId = parseInt(req.params.id);
  if (targetId === (req as any).user.id) return res.status(400).json({ error: 'Kendi erişiminizi kaldıramazsınız.' });
  try {
    await pool.query(`UPDATE users SET role='user' WHERE id=$1`, [targetId]);
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'delete', 'admin', String(targetId), 'Admin access revoked');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove admin access' });
  }
});

// POST /api/admin/invite (Admin only)
app.post('/api/admin/invite', verifyAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email gerekli.' });
  try {
    const rawToken = require('crypto').randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48h
    await pool.query(
      `INSERT INTO admin_invites (email, token, invited_by, expires_at) VALUES ($1,$2,$3,$4)
       ON CONFLICT (email) DO UPDATE SET token=$2, expires_at=$4, used=false`,
      [email, hashedToken, (req as any).user.id, expiresAt]
    );
    const inviteUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/accept-invite?token=${rawToken}&email=${encodeURIComponent(email)}`;
    try {
      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'noreply@mesopro.com',
        to: email,
        subject: 'MesoPro Admin Paneli Daveti',
        html: `<p>Admin paneline davet edildiniz. Aşağıdaki linke tıklayarak hesap oluşturun:</p><p><a href="${inviteUrl}">${inviteUrl}</a></p><p>Bu link 48 saat geçerlidir.</p>`,
      });
    } catch (_mailErr) { /* Email optional — still return invite URL */ }
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'create', 'admin_invite', email, 'Admin invited');
    res.json({ success: true, inviteUrl });
  } catch (err) {
    console.error('POST /api/admin/invite error:', err);
    res.status(500).json({ error: 'Davet gönderilemedi.' });
  }
});

// POST /api/admin/accept-invite (Public)
app.post('/api/admin/accept-invite', async (req, res) => {
  const { token, email, name, password } = req.body;
  if (!token || !email || !name || !password) return res.status(400).json({ error: 'Eksik bilgi.' });
  try {
    const { rows } = await pool.query(`SELECT * FROM admin_invites WHERE email=$1 AND used=false AND expires_at > NOW()`, [email]);
    if (rows.length === 0) return res.status(400).json({ error: 'Davet linki geçersiz veya süresi dolmuş.' });
    const invite = rows[0];
    const validToken = await bcrypt.compare(token, invite.token);
    if (!validToken) return res.status(400).json({ error: 'Geçersiz token.' });
    const hashed = await bcrypt.hash(password, 10);
    await pool.query(`INSERT INTO users (name, email, password, role) VALUES ($1,$2,$3,'admin')`, [name, email, hashed]);
    await pool.query(`UPDATE admin_invites SET used=true WHERE id=$1`, [invite.id]);
    res.json({ success: true, message: 'Admin hesabı oluşturuldu. Giriş yapabilirsiniz.' });
  } catch (err: any) {
    if (err.code === '23505') return res.status(400).json({ error: 'Bu email ile zaten bir hesap var.' });
    res.status(500).json({ error: 'Hesap oluşturulamadı.' });
  }
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function logAudit(adminId: number, adminName: string, action: string, resource: string, resourceId?: string, detail?: string) {
  pool.query(
    'INSERT INTO audit_log (admin_id, admin_name, action, resource, resource_id, detail) VALUES ($1,$2,$3,$4,$5,$6)',
    [adminId || null, adminName || '', action, resource, resourceId || null, detail || null]
  ).catch(() => {});
}

function rowToProduct(row: any) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    problem: row.problem || [],
    basePrice: parseFloat(row.base_price),
    image: row.image,
    description: row.description,
    ingredients: row.ingredients || '',
    indications: row.indications || '',
    applicationArea: row.application_area || '',
    warnings: row.warnings || '',
    featuredBadge: row.featured_badge || null,
    originalPrice: row.original_price ? parseFloat(row.original_price) : null,
    inStock: row.in_stock !== undefined ? row.in_stock : true,
    stockQuantity: row.stock_quantity !== undefined ? row.stock_quantity : -1,
    seoTitle: row.seo_title || null,
    seoDescription: row.seo_description || null,
    keywords: row.keywords || null,
  };
}

function rowToOrder(row: any) {
  return {
    id: row.id,
    customerName: row.customer_name,
    email: row.email,
    phone: row.phone,
    address: row.address,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
    appliedCampaigns: (typeof row.applied_campaigns === 'string' ? JSON.parse(row.applied_campaigns || '[]') : row.applied_campaigns) || [],
    total: parseFloat(row.total),
    paymentMethod: row.payment_method,
    status: row.status,
    createdAt: row.created_at,
    userId: row.user_id,
    notes: row.notes || '',
  };
}

function rowToCampaign(row: any) {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    targetValue: row.target_value,
    minQuantity: row.min_quantity,
    minAmount: parseFloat(row.min_amount),
    discountType: row.discount_type,
    discountValue: parseFloat(row.discount_value),
    isActive: row.is_active,
    isStackable: row.is_stackable,
    couponCode: row.coupon_code,
    startDate: row.start_date,
    endDate: row.end_date,
    maxUsage: row.max_usage,
    currentUsage: row.current_usage,
    bogoFreeQuantity: row.bogo_free_quantity || 1,
    perUserLimit: row.per_user_limit || 0,
    description: row.description || '',
    createdAt: row.created_at,
  };
}

// ── Support Tickets ─────────────────────────────────────────────────────────

// POST /api/support (Public) — Yeni ticket oluştur
app.post('/api/support', optionalToken, async (req, res) => {
  try {
    const { subject, category = 'general', priority = 'medium', name, email, phone, message } = req.body;
    if (!subject || !name || !email || !message) return res.status(400).json({ error: 'Zorunlu alanlar eksik.' });
    const userId = (req as any).user?.id || null;
    const { rows } = await pool.query(
      'INSERT INTO support_tickets (subject, category, priority, name, email, phone, message, user_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [subject, category, priority, name, email, phone || null, message, userId]
    );
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// GET /api/support (Admin) — Tüm ticketlar
app.get('/api/support', verifyAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM support_tickets ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// GET /api/support/my (verifyToken) — Kullanıcının kendi ticketları
app.get('/api/support/my', verifyToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const userEmail = (req as any).user.email;
    // Geriye dönük: email eşleşen ama user_id=null olan ticketları güncelle
    await pool.query(
      'UPDATE support_tickets SET user_id=$1 WHERE user_id IS NULL AND email=$2',
      [userId, userEmail]
    );
    const { rows } = await pool.query(
      `SELECT st.*,
        (SELECT COUNT(*) FROM ticket_replies tr WHERE tr.ticket_id = st.id AND tr.is_admin = TRUE) AS admin_reply_count,
        (SELECT MAX(tr.created_at) FROM ticket_replies tr WHERE tr.ticket_id = st.id AND tr.is_admin = TRUE) AS last_admin_reply_at
       FROM support_tickets st WHERE st.user_id=$1 ORDER BY st.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// GET /api/support/my/:id (verifyToken) — Kullanıcının kendi ticket detayı
app.get('/api/support/my/:id', verifyToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { rows } = await pool.query('SELECT * FROM support_tickets WHERE id=$1 AND user_id=$2', [req.params.id, userId]);
    if (!rows.length) return res.status(404).json({ error: 'Ticket bulunamadı.' });
    const { rows: replies } = await pool.query('SELECT * FROM ticket_replies WHERE ticket_id=$1 ORDER BY created_at ASC', [req.params.id]);
    res.json({ ...rows[0], replies });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// GET /api/support/:id (Admin) — Ticket detayı + yanıtlar
app.get('/api/support/:id', verifyAdmin, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM support_tickets WHERE id=$1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Ticket bulunamadı.' });
    const { rows: replies } = await pool.query('SELECT * FROM ticket_replies WHERE ticket_id=$1 ORDER BY created_at ASC', [req.params.id]);
    res.json({ ...rows[0], replies });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// PATCH /api/support/:id/status (Admin) — Durum/priority güncelle
app.patch('/api/support/:id/status', verifyAdmin, async (req, res) => {
  try {
    const { status, priority } = req.body;
    const { rows } = await pool.query(
      'UPDATE support_tickets SET status=COALESCE($1,status), priority=COALESCE($2,priority), updated_at=NOW() WHERE id=$3 RETURNING *',
      [status || null, priority || null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Ticket bulunamadı.' });
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'update', 'support_ticket', req.params.id, status || priority);
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// POST /api/support/:id/reply (Admin) — Admin yanıtı + email
app.post('/api/support/:id/reply', verifyAdmin, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Mesaj gerekli.' });
    const admin = (req as any).user;
    const { rows: tickets } = await pool.query('SELECT * FROM support_tickets WHERE id=$1', [req.params.id]);
    if (!tickets.length) return res.status(404).json({ error: 'Ticket bulunamadı.' });
    const ticket = tickets[0];
    const { rows } = await pool.query(
      'INSERT INTO ticket_replies (ticket_id, message, is_admin, author_name, author_email) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.params.id, message, true, admin.name || 'Admin', admin.email]
    );
    await pool.query("UPDATE support_tickets SET status='in_progress', updated_at=NOW() WHERE id=$1 AND status='open'", [req.params.id]);
    try {
      const transporter = nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT) || 587, secure: false, auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } });
      await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to: ticket.email, subject: `Destek Talebiniz Yanıtlandı: ${ticket.subject}`, html: `<p>Merhaba ${ticket.name},</p><p>${message}</p><p><small>Ticket #${ticket.id}</small></p>` });
    } catch (emailErr) { console.error('Reply email error:', emailErr); }
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// DELETE /api/support/:id (Admin)
app.delete('/api/support/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM support_tickets WHERE id=$1', [req.params.id]);
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'delete', 'support_ticket', req.params.id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// ── FAQs ─────────────────────────────────────────────────────────────────────

// GET /api/faqs (Public)
app.get('/api/faqs', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM faqs WHERE is_active=true ORDER BY sort_order ASC, id ASC');
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// GET /api/faqs/all (Admin)
app.get('/api/faqs/all', verifyAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM faqs ORDER BY sort_order ASC, id ASC');
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// POST /api/faqs (Admin)
app.post('/api/faqs', verifyAdmin, async (req, res) => {
  try {
    const { question, answer, category = 'general', sort_order = 0, is_active = true } = req.body;
    if (!question || !answer) return res.status(400).json({ error: 'Soru ve cevap gerekli.' });
    const { rows } = await pool.query(
      'INSERT INTO faqs (question, answer, category, sort_order, is_active) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [question, answer, category, sort_order, is_active]
    );
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'create', 'faq', String(rows[0].id), question.substring(0, 50));
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// PATCH /api/faqs/:id (Admin)
app.patch('/api/faqs/:id', verifyAdmin, async (req, res) => {
  try {
    const { question, answer, category, sort_order, is_active } = req.body;
    const { rows } = await pool.query(
      'UPDATE faqs SET question=COALESCE($1,question), answer=COALESCE($2,answer), category=COALESCE($3,category), sort_order=COALESCE($4,sort_order), is_active=COALESCE($5,is_active) WHERE id=$6 RETURNING *',
      [question ?? null, answer ?? null, category ?? null, sort_order ?? null, is_active ?? null, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'FAQ bulunamadı.' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// DELETE /api/faqs/:id (Admin)
app.delete('/api/faqs/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM faqs WHERE id=$1', [req.params.id]);
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'delete', 'faq', req.params.id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// ── Blog ─────────────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text.toLowerCase()
    .replace(/ğ/g,'g').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ı/g,'i').replace(/ö/g,'o').replace(/ç/g,'c')
    .replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-').replace(/-+/g,'-');
}

// GET /api/blog (Public)
app.get('/api/blog', async (_req, res) => {
  try {
    const { rows } = await pool.query("SELECT id,title,slug,excerpt,cover_image,author_name,tags,published_at,created_at FROM blog_posts WHERE status='published' ORDER BY published_at DESC, created_at DESC");
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// GET /api/blog/admin/all (Admin)
app.get('/api/blog/admin/all', verifyAdmin, async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM blog_posts ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// GET /api/blog/:slug (Public)
app.get('/api/blog/:slug', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM blog_posts WHERE slug=$1 AND status='published'", [req.params.slug]);
    if (!rows.length) return res.status(404).json({ error: 'Yazı bulunamadı.' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// POST /api/blog (Admin)
app.post('/api/blog', verifyAdmin, async (req, res) => {
  try {
    const { title, content, excerpt, cover_image, author_name = 'MesoPro', tags = [], status = 'draft', seo_title, seo_description } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Başlık ve içerik gerekli.' });
    let slug = slugify(title);
    const { rows: existing } = await pool.query('SELECT id FROM blog_posts WHERE slug=$1', [slug]);
    if (existing.length) slug = slug + '-' + Date.now();
    const published_at = status === 'published' ? new Date() : null;
    const { seo_keywords } = req.body;
    const { rows } = await pool.query(
      'INSERT INTO blog_posts (title,slug,content,excerpt,cover_image,author_name,tags,status,published_at,seo_title,seo_description,seo_keywords) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *',
      [title, slug, content, excerpt || null, cover_image || null, author_name, tags, status, published_at, seo_title || null, seo_description || null, seo_keywords || null]
    );
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'create', 'blog_post', String(rows[0].id), title);
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// PATCH /api/blog/:id (Admin)
app.patch('/api/blog/:id', verifyAdmin, async (req, res) => {
  try {
    const { title, content, excerpt, cover_image, author_name, tags, status, seo_title, seo_description, seo_keywords } = req.body;
    const { rows: current } = await pool.query('SELECT * FROM blog_posts WHERE id=$1', [req.params.id]);
    if (!current.length) return res.status(404).json({ error: 'Yazı bulunamadı.' });
    const prev = current[0];
    const newStatus = status ?? prev.status;
    const published_at = newStatus === 'published' && prev.status !== 'published' ? new Date() : prev.published_at;
    const { rows } = await pool.query(
      `UPDATE blog_posts SET title=COALESCE($1,title), content=COALESCE($2,content), excerpt=COALESCE($3,excerpt),
       cover_image=COALESCE($4,cover_image), author_name=COALESCE($5,author_name), tags=COALESCE($6,tags),
       status=COALESCE($7,status), published_at=$8, seo_title=COALESCE($9,seo_title), seo_description=COALESCE($10,seo_description),
       seo_keywords=COALESCE($11,seo_keywords), updated_at=NOW() WHERE id=$12 RETURNING *`,
      [title ?? null, content ?? null, excerpt ?? null, cover_image ?? null, author_name ?? null, tags ?? null, status ?? null, published_at, seo_title ?? null, seo_description ?? null, seo_keywords ?? null, req.params.id]
    );
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'update', 'blog_post', req.params.id, title || prev.title);
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// DELETE /api/blog/:id (Admin)
app.delete('/api/blog/:id', verifyAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM blog_posts WHERE id=$1', [req.params.id]);
    logAudit((req as any).user.id, (req as any).user.name || (req as any).user.email, 'delete', 'blog_post', req.params.id);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// ── SEO ──────────────────────────────────────────────────────────────────────

// GET /api/seo (Public)
app.get('/api/seo', async (_req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM seo_pages');
    const map: Record<string, any> = {};
    rows.forEach(r => { map[r.page] = r; });
    res.json(map);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// GET /api/seo/:page (Public)
app.get('/api/seo/:page', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM seo_pages WHERE page=$1', [req.params.page]);
    if (!rows.length) return res.json({});
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// PUT /api/seo/:page (Admin)
app.put('/api/seo/:page', verifyAdmin, async (req, res) => {
  try {
    const { title, description, og_title, og_description, og_image, robots, canonical, twitter_card, twitter_title, twitter_description, meta_keywords } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO seo_pages (page,title,description,og_title,og_description,og_image,robots,canonical,twitter_card,twitter_title,twitter_description,meta_keywords,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
       ON CONFLICT (page) DO UPDATE SET title=EXCLUDED.title, description=EXCLUDED.description,
       og_title=EXCLUDED.og_title, og_description=EXCLUDED.og_description, og_image=EXCLUDED.og_image,
       robots=EXCLUDED.robots, canonical=EXCLUDED.canonical,
       twitter_card=EXCLUDED.twitter_card, twitter_title=EXCLUDED.twitter_title, twitter_description=EXCLUDED.twitter_description,
       meta_keywords=EXCLUDED.meta_keywords,
       updated_at=NOW() RETURNING *`,
      [req.params.page, title || null, description || null, og_title || null, og_description || null, og_image || null, robots || 'index, follow', canonical || null, twitter_card || 'summary_large_image', twitter_title || null, twitter_description || null, meta_keywords || null]
    );
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// POST /api/seo (Admin) — yeni özel sayfa ekle
app.post('/api/seo', verifyAdmin, async (req, res) => {
  try {
    const { page } = req.body;
    if (!page || typeof page !== 'string') return res.status(400).json({ error: 'Geçersiz sayfa adı.' });
    const slug = page.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const { rows } = await pool.query(
      `INSERT INTO seo_pages (page, robots, updated_at) VALUES ($1, 'index, follow', NOW()) ON CONFLICT (page) DO NOTHING RETURNING *`,
      [slug]
    );
    if (!rows.length) return res.status(409).json({ error: 'Bu sayfa zaten mevcut.' });
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});

// DELETE /api/seo/:page (Admin) — özel sayfayı sil (varsayılan 5 sayfa korunur)
app.delete('/api/seo/:page', verifyAdmin, async (req, res) => {
  try {
    const defaultPages = ['home', 'products', 'blog', 'sss', 'destek'];
    if (defaultPages.includes(req.params.page)) return res.status(400).json({ error: 'Varsayılan sayfalar silinemez.' });
    await pool.query('DELETE FROM seo_pages WHERE page=$1', [req.params.page]);
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Sunucu hatası.' }); }
});


// ── Sitemap & Robots ──────────────────────────────────────────────────────────

// GET /sitemap.xml (Public)
app.get('/sitemap.xml', async (_req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const [productsResult, blogResult] = await Promise.all([
      pool.query('SELECT id, created_at FROM products ORDER BY created_at ASC'),
      pool.query("SELECT slug, updated_at FROM blog_posts WHERE status='published' ORDER BY published_at DESC"),
    ]);

    const staticPages: { loc: string; priority: string; changefreq: string; lastmod?: string }[] = [
      { loc: `${baseUrl}/`, priority: '1.0', changefreq: 'weekly' },
      { loc: `${baseUrl}/urunler`, priority: '0.9', changefreq: 'daily' },
      { loc: `${baseUrl}/blog`, priority: '0.8', changefreq: 'weekly' },
      { loc: `${baseUrl}/sss`, priority: '0.7', changefreq: 'monthly' },
      { loc: `${baseUrl}/destek`, priority: '0.6', changefreq: 'monthly' },
    ];

    const productUrls = productsResult.rows.map(p => ({
      loc: `${baseUrl}/urun/${p.id}`,
      lastmod: new Date(p.created_at).toISOString().split('T')[0],
      priority: '0.8',
      changefreq: 'weekly',
    }));

    const blogUrls = blogResult.rows.map(b => ({
      loc: `${baseUrl}/blog/${b.slug}`,
      lastmod: new Date(b.updated_at).toISOString().split('T')[0],
      priority: '0.7',
      changefreq: 'monthly',
    }));

    const allUrls = [...staticPages, ...productUrls, ...blogUrls];
    const today = new Date().toISOString().split('T')[0];

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod || today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    res.setHeader('Content-Type', 'application/xml');
    res.send(xml);
  } catch (err) {
    console.error(err);
    res.status(500).send('Sitemap oluşturulamadı.');
  }
});

// GET /robots.txt (Public)
app.get('/robots.txt', (_req, res) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const content = `User-agent: *
Allow: /
Disallow: /admin

Sitemap: ${baseUrl}/sitemap.xml`;
  res.setHeader('Content-Type', 'text/plain');
  res.send(content);
});

// ── Start ─────────────────────────────────────────────────────────────────────
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 MesoPro API server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to initialize database:', err);
  process.exit(1);
});

export default app;
