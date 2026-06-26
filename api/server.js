const express = require('express');
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
require('dotenv').config();
const http = require('http' );
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app );
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

io.on('connection', (socket) => {
  console.log(`🔌 Socket client connected: ${socket.id}`);
  socket.on('disconnect', () => {
    console.log(`🔌 Socket client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3000;
const DB_FILE = path.join(__dirname, '..', 'back', 'db.json');

// 1. Security Headers
app.use((req, res, next) => {
  // Only restrict framing when not running inside Hugging Face Spaces
  if (!process.env.SPACE_ID) {
    res.setHeader('X-Frame-Options', 'DENY');
  }
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  if (req.secure) {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// 2. Parse JSON body
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 3. Input Sanitization for XSS
function sanitizeInput(val) {
  if (typeof val === 'string') {
    return val.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  } else if (Array.isArray(val)) {
    return val.map(sanitizeInput);
  } else if (val !== null && typeof val === 'object') {
    const sanitized = {};
    for (const key in val) {
      if (Object.prototype.hasOwnProperty.call(val, key)) {
        sanitized[key] = sanitizeInput(val[key]);
      }
    }
    return sanitized;
  }
  return val;
}

app.use((req, res, next) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  next();
});

// 4. Rate Limiter for API endpoints (300 requests per minute per IP)
const rateLimits = {};
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  const ip = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
  const now = Date.now();

  if (!rateLimits[ip]) {
    rateLimits[ip] = { count: 1, resetTime: now + 60000 };
  } else {
    if (now > rateLimits[ip].resetTime) {
      rateLimits[ip].count = 1;
      rateLimits[ip].resetTime = now + 60000;
    } else {
      rateLimits[ip].count++;
    }
  }

  if (rateLimits[ip].count > 300) {
    return res.status(429).json({
      success: false,
      message: "لقد تجاوزت الحد المسموح به من الطلبات. يرجى المحاولة لاحقاً."
    });
  }
  next();
});

// Forgot Password Rate Limiter (5 requests per hour per IP)
const forgotPasswordLimits = {};
function forgotPasswordRateLimiter(req, res, next) {
  const ip = req.headers['x-forwarded-for'] || (req.socket && req.socket.remoteAddress) || '127.0.0.1';
  const now = Date.now();

  if (!forgotPasswordLimits[ip]) {
    forgotPasswordLimits[ip] = { count: 1, resetTime: now + 3600000 };
  } else {
    if (now > forgotPasswordLimits[ip].resetTime) {
      forgotPasswordLimits[ip].count = 1;
      forgotPasswordLimits[ip].resetTime = now + 3600000;
    } else {
      forgotPasswordLimits[ip].count++;
    }
  }

  if (forgotPasswordLimits[ip].count > 5) {
    return res.status(429).json({
      success: false,
      message: "لقد قمت بمحاولات كثيرة لاستعادة كلمة المرور. يرجى المحاولة بعد ساعة."
    });
  }
  next();
}

// Custom clean routes for dashboards
app.get('/priest', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front', 'index.html'));
});

app.get('/servant', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'front', 'servants.html'));
});

app.get('/priest/', (req, res) => {
  res.redirect('/priest');
});

app.get('/servant/', (req, res) => {
  res.redirect('/servant');
});

app.get('/index.html', (req, res) => {
  res.redirect('/priest');
});

app.get('/servants.html', (req, res) => {
  res.redirect('/servant');
});

app.get('/', (req, res) => {
  res.redirect('/priest');
});

// 5. Serve static files
app.use(express.static(path.join(__dirname, '..', 'front')));

// Initialize local JSON database with Cache / MongoDB Atlas
const defaultDb = {
  priests: [],
  servants: [],
  waznat: [],
  priestServices: [], // يتم تخزين الأسر هنا، وسنضيف حقل serviceDay لكل كائن داخل هذه المصفوفة.
  deadlines: {},
  chat_messages: [],
  _versions: {
    priests: 1,
    servants: 1,
    waznat: 1,
    priestServices: 1,
    deadlines: 1,
    chat_messages: 1
  }
};

let dbMemory = defaultDb;
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'ghedma_db';
const COLLECTION_NAME = 'system_store';
const SNAPSHOT_COLLECTION = 'visitation_snapshots'; // إضافة مجموعة تخزين اللقطات التاريخية.
let mongoClient = null;
let mongoDb = null;
let useMongo = !!MONGODB_URI;
let lastFetchTime = 0;
// تغيير من 1000 إلى 5000 (خمس ثوانٍ) لتقليل الضغط وتسريع التحميل
const CACHE_TTL = 5000; 


async function initDb() {
  if (MONGODB_URI) {
    try {
      console.log("🔄 Connecting to MongoDB Atlas...");
      mongoClient = new MongoClient(MONGODB_URI, {
        connectTimeoutMS: 5000,
        socketTimeoutMS: 5000
      });
      await mongoClient.connect();
      mongoDb = mongoClient.db(DB_NAME);
      useMongo = true;
      console.log("🔌 Connected successfully to MongoDB Atlas!");
      runAutoArchiving(); // تشغيل فحص الأرشفة عند بدء الاتصال بقاعدة البيانات.
    } catch (e) {
      console.error("❌ Failed to connect to MongoDB. Falling back to local db.json.", e);
      useMongo = false;
      loadLocalDb();
      runAutoArchiving();
    }
  } else {
    console.log("ℹ️ No MONGODB_URI found in environment. Using local db.json.");
    useMongo = false;
    loadLocalDb();
    runAutoArchiving();
  }
}

function loadLocalDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), 'utf8');
      } catch (writeErr) {
        console.error("⚠️ Failed to initialize local db.json file (Read-only filesystem?):", writeErr);
      }
      dbMemory = defaultDb;
    } else {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      dbMemory = JSON.parse(data);
      if (!dbMemory._versions) {
        dbMemory._versions = {
          priests: 1,
          servants: 1,
          waznat: 1,
          priestServices: 1,
          deadlines: 1,
          chat_messages: 1
        };
      }
    }
    console.log("📦 Loaded database from local db.json file.");
  } catch (e) {
    console.error("Error reading JSON database:", e);
    dbMemory = defaultDb;
  }
}

// Ensure database connection and fresh data before handling API requests
async function ensureDb(req, res, next) {
  if (useMongo) {
    try {
      if (!mongoClient || !mongoDb) {
        await initDb();
      }
      const now = Date.now();
      if (!dbMemory || (now - lastFetchTime > CACHE_TTL)) {
        const doc = await mongoDb.collection(COLLECTION_NAME).findOne({ _id: 'state' });
        if (doc) {
          dbMemory = doc.data;
          if (!dbMemory._versions) {
            dbMemory._versions = {
              priests: 1,
              servants: 1,
              waznat: 1,
              priestServices: 1,
              deadlines: 1,
              chat_messages: 1
            };
          }
          lastFetchTime = now;
        } else {
          // Initialize state if not found
          await mongoDb.collection(COLLECTION_NAME).insertOne({ _id: 'state', data: defaultDb });
          dbMemory = defaultDb;
          lastFetchTime = now;
        }
      }
    } catch (e) {
      console.error("❌ MongoDB connection or fetch failed in middleware:", e);
      loadLocalDb();
    }
  } else {
    if (!dbMemory || dbMemory === defaultDb) {
      loadLocalDb();
    }
  }
  next();
}

// Apply the middleware to all API routes
app.use('/api', ensureDb);

function readDb() {
  return dbMemory;
}

async function writeDb(data, changedKey) {
if (!data._versions) {
data._versions = {
priests: 1,
servants: 1,
waznat: 1,
priestServices: 1,deadlines: 1,
chat_messages: 1
};
}
if (changedKey) {
data._versions[changedKey] = (data._versions[changedKey] || 0) + 1;
}
dbMemory = data;
lastFetchTime = Date.now();
if (useMongo && mongoDb) {
try {
await mongoDb.collection(COLLECTION_NAME).updateOne(
{ _id: 'state' },
{ $set: { data: dbMemory } },
{ upsert: true }
);
} catch (err) {
console.error("❌ Error writing to MongoDB:", err);
}
} else {
try {
fs.writeFileSync(DB_FILE, JSON.stringify(dbMemory, null, 2), 'utf8');
} catch (err) {
console.error("❌ Error writing JSON database locally:", err);
}
}
if (changedKey) {
  io.emit('data-changed', { versions: data._versions, changedKey, data: data[changedKey] });
}

}

// Flush DB Synchronously on shutdown
async function flushDbSync() {
  try {
    if (useMongo && mongoDb && mongoClient) {
      await mongoDb.collection(COLLECTION_NAME).updateOne(
        { _id: 'state' },
        { $set: { data: dbMemory } },
        { upsert: true }
      );
      await mongoClient.close();
      console.log("💾 Database successfully flushed to MongoDB Atlas and connection closed.");
    } else {
      fs.writeFileSync(DB_FILE, JSON.stringify(dbMemory, null, 2), 'utf8');
      console.log("💾 Database successfully flushed to local disk on shutdown.");
    }
  } catch (e) {
    console.error("Error flushing DB on shutdown:", e);
  }
}

if (!process.env.VERCEL) {
  process.on('SIGTERM', async () => {
    await flushDbSync();
    process.exit(0);
  });
  process.on('SIGINT', async () => {
    await flushDbSync();
    process.exit(0);
  });
}

// APIs
app.get('/api/sync', (req, res) => {
  const db = readDb();
  res.json({ ...db, isFallback: !useMongo });
});

app.get('/api/sync/versions', (req, res) => {
  const db = readDb();
  if (!db._versions) {
    db._versions = {
      priests: 1,
      servants: 1,
      waznat: 1,
      priestServices: 1,
      deadlines: 1,
      chat_messages: 1
    };
  }
  res.json({ ...db._versions, isFallback: !useMongo });
});

app.get('/api/sync/key/:key', (req, res) => {
  const { key } = req.params;
  const db = readDb();
  if (key in db) {
    res.json({ [key]: db[key], isFallback: !useMongo });
  } else {
    res.status(404).json({ success: false, message: `Key ${key} not found` });
  }
});

app.post('/api/sync', async (req, res) => {
  const { key, data } = req.body;
  if (!key) {
    return res.status(400).json({ success: false, message: "Missing database key" });
  }
  const db = readDb();
  db[key] = data;
  await writeDb(db, key);
  res.json({ success: true, versions: db._versions });
});

app.post('/api/sync/delta', async (req, res) => {
  const { key, prev, next } = req.body;
  if (!key) {
    return res.status(400).json({ success: false, message: "Missing database key" });
  }

  try {
    const db = readDb();
    const serverVal = db[key] || (key === 'deadlines' ? {} : []);

    let merged;
    if (key === 'deadlines') {
      merged = {};
      const allPriests = new Set([
        ...Object.keys(serverVal || {}),
        ...Object.keys(prev || {}),
        ...Object.keys(next || {})
      ]);

      allPriests.forEach(priest => {
        let serverList = (serverVal && serverVal[priest]) || [];
        if (serverList && !Array.isArray(serverList)) {
          if (serverList.date && serverList.time) {
            serverList = [{ id: 'legacy', scope: 'all', scopeValue: '', date: serverList.date, time: serverList.time, applied: false }];
          } else {
            serverList = [];
          }
        }
        let prevList = (prev && prev[priest]) || [];
        if (prevList && !Array.isArray(prevList)) {
          if (prevList.date && prevList.time) {
            prevList = [{ id: 'legacy', scope: 'all', scopeValue: '', date: prevList.date, time: prevList.time, applied: false }];
          } else {
            prevList = [];
          }
        }
        let nextList = (next && next[priest]) || [];
        if (nextList && !Array.isArray(nextList)) {
          if (nextList.date && nextList.time) {
            nextList = [{ id: 'legacy', scope: 'all', scopeValue: '', date: nextList.date, time: nextList.time, applied: false }];
          } else {
            nextList = [];
          }
        }

        const prevMap = new Map(prevList.filter(x => x).map(x => [x.id || 'legacy', x]));
        const nextMap = new Map(nextList.filter(x => x).map(x => [x.id || 'legacy', x]));
        const serverMap = new Map(serverList.filter(x => x).map(x => [x.id || 'legacy', x]));

        const mergedList = [];

        nextList.forEach(item => {
          if (!item) return;
          const id = item.id || 'legacy';
          const prevItem = prevMap.get(id);
          const serverItem = serverMap.get(id);

          if (!prevItem) {
            // Added by client
            mergedList.push(item);
          } else {
            // Existed in prev
            if (JSON.stringify(item) !== JSON.stringify(prevItem)) {
              // Modified by client
              mergedList.push(item);
            } else {
              // Unchanged by client: keep server version (which might have updates from others)
              if (serverItem) {
                mergedList.push(serverItem);
              }
            }
          }
        });

        // Process items in server that were NOT in client's next or prev (added by others)
        serverList.forEach(serverItem => {
          if (!serverItem) return;
          const id = serverItem.id || 'legacy';
          if (!nextMap.has(id) && !prevMap.has(id)) {
            mergedList.push(serverItem);
          }
        });

        merged[priest] = mergedList;
      });
    } else {
      // Array keys: priests, servants, waznat, priestServices, chat_messages
      const idKey = (key === 'servants' || key === 'priests') ? 'username' : (key === 'priestServices' ? 'priestUser' : 'id');

      const prevMap = new Map((prev || []).filter(x => x).map(x => [x[idKey], x]));
      const nextMap = new Map((next || []).filter(x => x).map(x => [x[idKey], x]));
      const serverMap = new Map((serverVal || []).filter(x => x).map(x => [x[idKey], x]));

      const mergedList = [];

      // 1. Process items in client's next state
      (next || []).forEach(item => {
        if (!item) return;
        const id = item[idKey];
        const prevItem = prevMap.get(id);
        const serverItem = serverMap.get(id);

        if (!prevItem) {
          // Added by client
          mergedList.push(item);
        } else {
          // Existed in prev
          if (JSON.stringify(item) !== JSON.stringify(prevItem)) {
            // Modified by client
            mergedList.push(item);
          } else {
            // Unchanged by client: keep server version (which might have updates from others)
            if (serverItem) {
              mergedList.push(serverItem);
            }
          }
        }
      });

      // 2. Process items in server that were NOT in client's next or prev (added by others)
      (serverVal || []).forEach(serverItem => {
        if (!serverItem) return;
        const id = serverItem[idKey];
        if (!nextMap.has(id) && !prevMap.has(id)) {
          mergedList.push(serverItem);
        }
      });

      if (key === 'chat_messages') {
        mergedList.sort((a, b) => a.id - b.id);
      }

      merged = mergedList;
    }

    db[key] = merged;
    await writeDb(db, key);
    res.json({ success: true, merged, versions: db._versions, isFallback: !useMongo });
  } catch (err) {
    console.error(`❌ [DELTA SYNC ERROR] key: ${key}:`, err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/sync/messages', (req, res) => {
  const db = readDb();
  res.json({ chat_messages: db.chat_messages || [] });
});

// Forgot Password API using Nodemailer
app.post('/api/priests/forgot-password', forgotPasswordRateLimiter, async (req, res) => {
  const { username, email } = req.body;
  if (!username || !email) {
    return res.status(400).json({ success: false, message: "الرجاء إدخال اسم المستخدم والبريد الإلكتروني!" });
  }

  const db = readDb();
  const priests = db.priests || [];
  const foundPriest = priests.find(p => p.username.trim().toLowerCase() === username.trim().toLowerCase() && p.email.trim().toLowerCase() === email.trim().toLowerCase());

  if (!foundPriest) {
    return res.status(404).json({ success: false, message: "اسم المستخدم أو البريد الإلكتروني غير متطابق!" });
  }

  const emailPass = process.env.EMAIL_PASS || '';
  const emailUser = process.env.EMAIL_USER || 'stmakariosonair@gmail.com';
  const brevoApiKey = process.env.BREVO_API_KEY || '';

  if (!brevoApiKey && (!emailPass || emailPass === 'your_gmail_app_password_here')) {
    return res.status(500).json({ 
      success: false, 
      message: "خدمة استعادة كلمة المرور عبر البريد الإلكتروني غير مفعلة على السيرفر حالياً. يرجى التواصل مع الدعم الفني." 
    });
  }

  // Create transporter only if Brevo API is NOT used
  let transporter = null;
  if (!brevoApiKey) {
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for port 465, false for port 587
      auth: {
        user: emailUser,
        pass: emailPass
      },
      tls: {
        rejectUnauthorized: false // avoids SSL/TLS handshake connection issues on cloud hosting providers
      }
    });
  }

  // Prepare beautifully styled HTML template matching the dark theme of the login page
  const htmlContent = `
  <div style="direction: rtl; text-align: right; background-color: #060e22; padding: 40px 30px; font-family: 'Cairo', Tahoma, Arial, sans-serif; border-radius: 16px; max-width: 550px; margin: 0 auto; border: 2px solid #c9a84c; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);">
      <div style="text-align: center; margin-bottom: 30px;">
          <!-- Attached Church Logo -->
          <div style="display: inline-block; width: 90px; height: 90px; border-radius: 50%; border: 3px solid #c9a84c; background-color: #162654; padding: 8px;">
              <img src="cid:logo" alt="شعار الكنيسة" style="width: 100%; height: 100%; object-fit: contain;">
          </div>
          <h1 style="color: #f0d080; font-size: 24px; margin-top: 15px; font-weight: bold; margin-bottom: 5px;">استعادة كلمة المرور</h1>
      </div>
      
      <div style="background-color: rgba(255, 255, 255, 0.04); border: 1px solid rgba(201, 168, 76, 0.22); border-radius: 12px; padding: 25px; margin-bottom: 25px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);">
          <p style="font-size: 18px; color: #f0d080; font-weight: bold; margin-top: 0; margin-bottom: 20px; text-align: center; border-bottom: 1px solid rgba(201, 168, 76, 0.2); padding-bottom: 10px;">سلام ونعمة يا ابونا❤️</p>
          <p style="color: #f7f2e8; font-size: 15px; margin-bottom: 20px; line-height: 1.6; text-align: center;">
              ده الباسورد بتاع قدسك:
          </p>
          
          <div style="background-color: #162654; padding: 18px; border-radius: 8px; border-right: 5px solid #c9a84c; text-align: center; margin: 20px 0;">
              <strong style="font-size: 28px; color: #fdf6e3; letter-spacing: 1px; font-family: monospace;">${foundPriest.password}</strong>
          </div>
          
          <p style="color: rgba(201, 168, 76, 0.6); font-size: 13px; text-align: center; margin-top: 20px; font-style: italic;">
              «اذْهَبِ انْظُرْ سَلاَمَةَ إِخْوَتِكَ وَسَلاَمَةَ الْغَنَمِ وَرُدَّ لِي خَبَرًا»<br>(تك 14:37)
          </p>
      </div>
      
      <hr style="border: 0; border-top: 1px solid rgba(201, 168, 76, 0.22); margin: 25px 0;">
      
      <div style="text-align: center; color: rgba(201, 168, 76, 0.6); font-size: 12px;">
          جميع الحقوق محفوظة &copy; أسرة الأنبا مكاريوس ON AIR
      </div>
  </div>
  `;

  const mailOptions = {
    from: `"أسرة الأنبا مكاريوس" <${emailUser}>`,
    to: email,
    subject: 'سلام ونعمة يا ابونا - استعادة كلمة المرور',
    html: htmlContent,
    attachments: []
  };

  // Embed logo image inline if exists in parent folder
  const logoPath = path.join(__dirname, '..', 'front', 'logo-removebg-preview.png');
  if (fs.existsSync(logoPath)) {
    mailOptions.attachments.push({
      filename: 'logo-removebg-preview.png',
      path: logoPath,
      cid: 'logo'
    });
  }

  // Return success immediately to client so they see instantaneous feedback
  res.json({ success: true });

  if (brevoApiKey) {
    // Send the email in the background asynchronously via Brevo HTTP API
    fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': brevoApiKey,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: {
          name: "أسرة الأنبا مكاريوس",
          email: emailUser
        },
        to: [{ email: email }],
        subject: 'سلام ونعمة يا ابونا - استعادة كلمة المرور',
        htmlContent: htmlContent
      })
    })
    .then(async response => {
      const resBody = await response.json();
      if (response.ok) {
        console.log("==========================================");
        console.log("📧 Recovery Email Sent Successfully via Brevo (HTTP Async)!");
        console.log("Recipient:", email);
        console.log("Message ID:", resBody.messageId);
        console.log("==========================================");

        try {
          const db = readDb();
          if (!db.email_logs) db.email_logs = [];
          db.email_logs.push({
            timestamp: new Date().toISOString(),
            recipient: email,
            success: true,
            method: 'Brevo API',
            messageId: resBody.messageId
          });
          if (db.email_logs.length > 50) db.email_logs.shift();
          writeDb(db, 'email_logs').catch(e => console.error("Error writing email logs:", e));
        } catch (err) {
          console.error("Error updating email_logs in DB:", err);
        }
      } else {
        throw new Error(resBody.message || JSON.stringify(resBody));
      }
    })
    .catch(error => {
      console.error("==========================================");
      console.error("❌ Error sending recovery email via Brevo (HTTP Async):", error);
      console.error("==========================================");

      try {
        const db = readDb();
        if (!db.email_logs) db.email_logs = [];
        db.email_logs.push({
          timestamp: new Date().toISOString(),
          recipient: email,
          success: false,
          method: 'Brevo API',
          error: error.message || String(error)
        });
        if (db.email_logs.length > 50) db.email_logs.shift();
        writeDb(db, 'email_logs').catch(e => console.error("Error writing email logs:", e));
      } catch (err) {
        console.error("Error updating email_logs in DB:", err);
      }
    });
  } else if (transporter) {
    // Send the email in the background asynchronously via SMTP
    transporter.sendMail(mailOptions)
      .then(info => {
        console.log("==========================================");
        console.log("📧 Recovery Email Sent Successfully (SMTP Async)!");
        console.log("Recipient:", email);
        console.log("SMTP Response:", info.response);
        console.log("Message ID:", info.messageId);
        console.log("==========================================");

        try {
          const db = readDb();
          if (!db.email_logs) db.email_logs = [];
          db.email_logs.push({
            timestamp: new Date().toISOString(),
            recipient: email,
            success: true,
            method: 'SMTP',
            response: info.response,
            messageId: info.messageId
          });
          if (db.email_logs.length > 50) db.email_logs.shift();
          writeDb(db, 'email_logs').catch(e => console.error("Error writing email logs:", e));
        } catch (err) {
          console.error("Error updating email_logs in DB:", err);
        }
      })
      .catch(error => {
        console.error("==========================================");
        console.error("❌ Error sending recovery email (SMTP Async):", error);
        console.error("==========================================");

        try {
          const db = readDb();
          if (!db.email_logs) db.email_logs = [];
          db.email_logs.push({
            timestamp: new Date().toISOString(),
            recipient: email,
            success: false,
            method: 'SMTP',
            error: error.message || String(error),
            stack: error.stack
          });
          if (db.email_logs.length > 50) db.email_logs.shift();
          writeDb(db, 'email_logs').catch(e => console.error("Error writing email logs:", e));
        } catch (err) {
          console.error("Error updating email_logs in DB:", err);
        }
      });
  }
});

app.get('/api/reports/archived', async (req, res) => {
    const { priestUser, serviceId, type, year, month, fromDate, toDate } = req.query;
    let query = {};
    
    if (serviceId && serviceId !== 'all') {
        query.serviceId = serviceId;
    } else if (priestUser) {
        query.serviceId = { $regex: `^${priestUser}_` };
    }

    if (fromDate && toDate) {
        query.archivedAt = { $gte: new Date(fromDate), $lte: new Date(toDate + 'T23:59:59.999Z') };
    } else if (type === 'weekly') {
        const now = new Date();
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        query.archivedAt = { $gte: lastWeek };
    } else if (type === 'monthly') {
        const now = new Date();
        const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
        const targetYear = year ? parseInt(year) : now.getFullYear();
        const startOfMonth = new Date(targetYear, targetMonth, 1);
        const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
        query.archivedAt = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (type === 'yearly') {
        const now = new Date();
        const targetYear = year ? parseInt(year) : now.getFullYear();
        const startOfYear = new Date(targetYear, 0, 1);
        const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);
        query.archivedAt = { $gte: startOfYear, $lte: endOfYear };
    }

    try {
        let reports = [];
        if (useMongo && mongoDb) {
            reports = await mongoDb.collection(SNAPSHOT_COLLECTION).find(query).sort({ archivedAt: -1 }).toArray();
        } else {
            reports = getLocalSnapshots(priestUser, serviceId, fromDate, toDate, type, year, month);
        }
        res.json({ success: true, reports });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

function getLocalSnapshots(priestUser, serviceId, fromDate, toDate, type, year, month) {
    const db = readDb();
    let list = db.snapshots || [];
    
    if (serviceId && serviceId !== 'all') {
        list = list.filter(s => s.serviceId === serviceId);
    } else if (priestUser) {
        list = list.filter(s => s.serviceId && s.serviceId.startsWith(priestUser + '_'));
    }
    
    list = list.filter(s => {
        const archivedAt = new Date(s.archivedAt);
        if (isNaN(archivedAt.getTime())) return false;
        
        if (fromDate && toDate) {
            return archivedAt >= new Date(fromDate) && archivedAt <= new Date(toDate + 'T23:59:59.999Z');
        } else if (type === 'weekly') {
            const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            return archivedAt >= lastWeek;
        } else if (type === 'monthly') {
            const now = new Date();
            const targetMonth = month ? parseInt(month) - 1 : now.getMonth();
            const targetYear = year ? parseInt(year) : now.getFullYear();
            const startOfMonth = new Date(targetYear, targetMonth, 1);
            const endOfMonth = new Date(targetYear, targetMonth + 1, 0, 23, 59, 59, 999);
            return archivedAt >= startOfMonth && archivedAt <= endOfMonth;
        } else if (type === 'yearly') {
            const now = new Date();
            const targetYear = year ? parseInt(year) : now.getFullYear();
            const startOfYear = new Date(targetYear, 0, 1);
            const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999);
            return archivedAt >= startOfYear && archivedAt <= endOfYear;
        }
        return true;
    });
    
    return list;
}

async function runAutoArchiving() {
    const db = readDb();
    const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    let changed = false;
    
    for (const priestRecord of db.priestServices || []) {
        for (const osra of priestRecord.osras || []) {
            if (osra.serviceDay === todayName) {
                const snapshot = {
                    id: Date.now() + Math.random().toString(),
                    serviceId: `${priestRecord.priestUser}_${osra.name}`,
                    weekStartDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    weekEndDate: new Date().toISOString().split('T')[0],
                    dataSnapshot: (db.waznat || []).filter(w => w.osra === osra.name),
                    archivedAt: new Date().toISOString()
                };
                
                if (useMongo && mongoDb) {
                    try {
                        await mongoDb.collection(SNAPSHOT_COLLECTION).insertOne(snapshot);
                    } catch (e) {
                        console.error("MongoDB snapshot save failed, saving locally:", e);
                        if (!db.snapshots) db.snapshots = [];
                        db.snapshots.push(snapshot);
                        changed = true;
                    }
                } else {
                    if (!db.snapshots) db.snapshots = [];
                    const exists = db.snapshots.some(s => s.serviceId === snapshot.serviceId && s.weekEndDate === snapshot.weekEndDate);
                    if (!exists) {
                        db.snapshots.push(snapshot);
                        changed = true;
                    }
                }
            }
        }
    }
    if (changed) {
        await writeDb(db, 'snapshots');
    }
}

// فحص الأرشفة يومياً
setInterval(runAutoArchiving, 24 * 60 * 60 * 1000);

app.get('/api/admin/diagnose', (req, res) => {
  const db = readDb();
  res.json({
    useMongo: useMongo,
    mongoConnected: !!mongoDb,
    emailUserConfigured: !!process.env.EMAIL_USER,
    emailUser: process.env.EMAIL_USER || 'stmakariosonair@gmail.com',
    emailPassConfigured: !!process.env.EMAIL_PASS,
    emailPassLength: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0,
    emailPassPlaceholderUsed: process.env.EMAIL_PASS === 'your_gmail_app_password_here',
    emailLogs: db.email_logs || [],
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT
    }
  });
});

module.exports = app;
initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 Server successfully started on port ${PORT}!`);
    console.log(`🔗 Priest Dashboard:  http://localhost:${PORT}/index.html`);
    console.log(`🔗 Servant Dashboard: http://localhost:${PORT}/servants.html`);
    console.log(`==================================================`);
  });
});
