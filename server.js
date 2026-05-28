const express = require("express")
const router = express.Router();
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
dotenv.config({ path: './config/config.env' });
const fs = require('fs');
const authRoute = require("./routes/oauth");
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const http = require('http');
// const socketIo = require('socket.io');
const app = express();

// Trust proxy for rate limiting behind Heroku/reverse proxy
app.set('trust proxy', 1);

// ── Global Security Headers (Helmet) ────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // CSP managed at CDN/proxy layer
  crossOriginEmbedderPolicy: false,
}));

// ── Global Rate Limiter ──────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(globalLimiter);

// ── Auth-specific Rate Limiter ───────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again in 15 minutes.' },
});

// const Message = require('./models/Messages');
const server = http.createServer(app);
// const io = socketIo(server);
const messagesRouter = require('./routes/messages');
const WebSocket = require('ws');


const wss = new WebSocket.Server({ port: 5002 });

const PORT = process.env.PORT || 5001 

// Stripe webhook MUST be registered BEFORE bodyParser.json so we can verify
// the signature against the raw request body.
const { webhookHandler: stripeWebhookHandler } = require('./routes/stripe');
app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  stripeWebhookHandler
);

// Increase the maximum size limit to 10MB
app.use(bodyParser.json({ limit: '20mb' }));


app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new MongoDBStore({
    uri: process.env.MONGO_URI,
    collection: 'sessions',
  }),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));
console.log('session set successfully');



const allowedOrigins = ['https://edunode.org', 'https://www.edunode.org', 'http://localhost:3000', 'https://edunode.herokuapp.com', 'http://localhost:5173', 'https://edunode.herokuapp.com/api', 'http://localhost:5000', 'http://localhost:5001', 'http://localhost:5500', 'http://localhost:5501'];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    // Live Server, Vite, etc. on localhost or 127.0.0.1 (any port)
    if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token', 'x-requested-with'],
  exposedHeaders: ['set-cookie'],
  optionsSuccessStatus: 200
}));



app.use(express.json()); 

// Removed redundant manual CORS header middleware; handled by cors package


// mongodb connection

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      //useCreateIndex: true,
      useUnifiedTopology: true
    });

    await console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.log(`Error: ${err.message}`);
    process.exit(1);
  }
}

connectDB();

// WebSocket connection event handler
wss.on('connection', (socket) => {
  // WebSocket message event handler
  socket.on('message', (message) => {
    // Broadcast the received message to all connected WebSocket clients
    wss.clients.forEach((client) => {
      if (client !== socket && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });
});

app.get('/.well-known/stellar.toml', (req, res) => {

  const tomlFilePath = __dirname + '/stellar.toml';
  const tomlContent = fs.readFileSync(tomlFilePath, 'utf8');
  res.send(tomlContent);
});

app.get('/.well-known/ai-plugin.json', (req, res) => {

  const tomlFilePath = __dirname + '/ai-plugin.json';
  res.sendFile(tomlFilePath);
});


const confirm = require('./routes/confirm');
const users = require('./routes/users');
const auth = require('./routes/auth');
const emailAuth = require('./routes/emailAuth');
const emailLogin = require('./routes/emailLogin');
const metamaskLogin = require('./routes/metamaskLogin');
const resend = require('./routes/resend');
const verifyCode = require('./routes/verifyCode');
const forgot = require('./routes/forgot');
const reset = require('./routes/reset');
const newpost = require('./routes/newpost');
const newComment = require('./routes/newComment');
const gcallback = require('./routes/gcallback');
const albedo = require('./routes/albedo');
const progress = require("./routes/progress");
const feed = require("./routes/feed");
const freighter = require("./routes/freighter");
const freighternft = require("./routes/freighternft");
const mozart = require("./routes/mozart");
const search = require("./routes/search");
const execute = require("./routes/execute");
const post = require("./routes/post");
const certificateRoutes = require("./routes/certificates");
const nftCertificate = require("./routes/nftCertificate");
const profile = require("./routes/profile");
const project = require("./routes/project");
const cours = require("./routes/cours");
const AddedCours = require("./routes/addedCourses");
const google = require("./routes/google")
const blog = require("./routes/blog")
const chat = require("./routes/chat")
const password = require('./routes/reset-password')
const uni =require('./routes/Uni')
const tutor =require('./routes/tutor')
const challenge =require('./routes/challenge')
const notif =require('./routes/notifications')
const gamechallenge =require('./routes/gameChallenge')
const compile = require('./routes/compile')
const universities = require('./routes/universities')
const valid = require('./routes/valid')
const glossary = require('./routes/glossary')
const game = require('./routes/game')
const messagesNotif = require('./routes/messageNotif');
const blogDy =require('./routes/blogDy')
const badge =require('./routes/badge')
const emailCampaigns = require('./routes/emailCampaigns')
const emailTemplates = require('./routes/emailTemplates')
const emailUnsubscribe = require('./routes/emailUnsubscribe')
const emailWebhooks = require('./routes/emailWebhooks')
const emailAnalytics = require('./routes/emailAnalytics')
const emailCRM = require('./routes/emailCRM')
const stripeRoutes = require('./routes/stripe')

app.use('/api/gcallback', gcallback);
app.use('/api/search', search);
app.use('/api/users', users);
app.use('/api/badge', badge);
app.use('/api/auth', authLimiter, auth);
app.use('/api/emailauth', authLimiter, emailAuth);
app.use('/api/emaillogin', authLimiter, emailLogin);
app.use('/api/metamasklogin', authLimiter, metamaskLogin);
app.use('/api/confirm', confirm);
app.use('/api/resend', resend);
app.use('/api/verifycode', verifyCode);
app.use('/api/forgot', forgot);
app.use('/api/reset', reset);
app.use('/api/newpost', newpost);
app.use('/api/newcomment', newComment);
app.use('/api/albedo', albedo);
app.use("/api/progress", progress);
app.use("/api/feed", feed);
app.use("/api/freighter", freighter);
app.use("/api/freighternft", freighternft);
app.use("/api/mozart", mozart);
app.use("/api/execute", execute);
app.use("/api/post", post);
app.use("/api/certificates", certificateRoutes);
app.use("/api/nftCertificate", nftCertificate);
app.use("/api/profile", profile);
app.use("/api/project", project);
app.use("/api/cours", cours);
app.use("/api/addedcours", AddedCours);
app.use("/api/google", google);
app.use("/api/blog", blog);
app.use("/api/blogdy", blogDy);
app.use("/api/chat", chat);
app.use("/auth", authRoute);
app.use("/api/password", password);
app.use("/api/universities", uni);
app.use("/api/challenge", challenge);
app.use("/api/compile", compile);
app.use("/api/universities", universities);
app.use("/api/validCertificate", valid);
app.use('/api/messages', messagesRouter);
app.use("/api/gamechallenge", gamechallenge);
app.use("/api/glossary", glossary);
app.use("/api/notif", notif);
app.use("/api/game", game);
app.use("/api/tutors", tutor);
app.use("/api/messageNotif", messagesNotif);
const adminAuth = require('./middleware/adminAuth');
app.use("/api/email/campaigns", adminAuth, emailCampaigns);
app.use("/api/email/templates", adminAuth, emailTemplates);
app.use("/api/email/unsubscribe", emailUnsubscribe);
app.use("/api/email/webhooks", emailWebhooks);
app.use("/api/email/analytics", adminAuth, emailAnalytics);
app.use("/api/email/crm", adminAuth, emailCRM);

// Handle unsubscribe at root level for Mailgun redirects
app.get("/unsubscribe", async (req, res) => {
  try {
    console.log('Unsubscribe route called at /unsubscribe');
    console.log('Query params:', req.query);
    const { email, campaign, reason = 'user_request' } = req.query;

    if (!email) {
      console.log('Email parameter missing');
      return res.status(400).send('Email parameter is required');
    }

    console.log('Processing unsubscribe for email:', email);
    const emailService = require('./services/emailService');
    await emailService.unsubscribeUser(email, campaign, reason);
    console.log('Unsubscribe processed successfully');

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribed - EduNode</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            text-align: center;
          }
          .container {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 30px;
            background-color: #f9f9f9;
          }
          h1 {
            color: #333;
            margin-bottom: 20px;
          }
          p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 15px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #007bff;
            margin-bottom: 30px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="logo">EduNode</div>
          <h1>Successfully Unsubscribed</h1>
          <p>You have been successfully unsubscribed from our email marketing communications.</p>
          <p>We're sorry to see you go! You can always manage your email preferences from your profile settings if you decide to re-subscribe in the future.</p>
          <p>If you unsubscribed by accident or have any questions, please contact our support team.</p>
          <p>Thank you for being part of the EduNode community!</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Error processing unsubscribe:', error);
    res.status(500).send('An error occurred while processing your request');
  }
});
app.use("/api/stripe", stripeRoutes);

// Block direct access to email-admin.html
app.use('/email-admin.html', (req, res) => {
  res.status(404).send('Not found');
});

// Serve static files from public directory
app.use(express.static('public'));

// Admin email login page (public)
app.get("/admin/email/login", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Email Admin Login - EduNode</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; justify-content: center; align-items: center; }
        .login-card { background: white; border-radius: 16px; padding: 40px; width: 100%; max-width: 420px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
        .login-card h1 { text-align: center; color: #333; margin-bottom: 8px; font-size: 24px; }
        .login-card .subtitle { text-align: center; color: #666; margin-bottom: 30px; font-size: 14px; }
        .form-group { margin-bottom: 20px; }
        .form-group label { display: block; margin-bottom: 6px; font-weight: bold; color: #333; font-size: 14px; }
        .form-group input { width: 100%; padding: 12px 16px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 16px; transition: border-color 0.3s; }
        .form-group input:focus { outline: none; border-color: #667eea; }
        .btn { width: 100%; padding: 14px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: bold; cursor: pointer; transition: opacity 0.3s; }
        .btn:hover { opacity: 0.9; }
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .error { background: #fee; color: #c00; padding: 12px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; display: none; }
        .info { text-align: center; margin-top: 20px; font-size: 12px; color: #999; }
      </style>
    </head>
    <body>
      <div class="login-card">
        <h1>Email Marketing Admin</h1>
        <p class="subtitle">Sign in with your @edunode.org email</p>
        <div id="error" class="error"></div>
        <form id="loginForm">
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" placeholder="you@edunode.org" required>
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Your password" required>
          </div>
          <button type="submit" class="btn" id="loginBtn">Sign In</button>
        </form>
        <p class="info">Only @edunode.org email addresses are authorized.</p>
      </div>
      <script>
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const errorEl = document.getElementById('error');
          const btn = document.getElementById('loginBtn');
          
          errorEl.style.display = 'none';
          btn.disabled = true;
          btn.textContent = 'Signing in...';
          
          try {
            const response = await fetch('/admin/email/auth', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (response.ok && data.token) {
              localStorage.setItem('adminToken', data.token);
              window.location.href = '/admin/email?token=' + data.token;
            } else {
              errorEl.textContent = data.error || 'Login failed';
              errorEl.style.display = 'block';
            }
          } catch (err) {
            errorEl.textContent = 'Network error. Please try again.';
            errorEl.style.display = 'block';
          }
          
          btn.disabled = false;
          btn.textContent = 'Sign In';
        });
      </script>
    </body>
    </html>
  `);
});

// Admin email login API
app.post("/admin/email/auth", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Only allow @edunode.org emails
    if (!email.toLowerCase().endsWith('@edunode.org')) {
      return res.status(403).json({ error: 'Only @edunode.org email addresses are authorized' });
    }
    
    // Find user and verify password
    const User = require('./models/User');
    const bcrypt = require('bcryptjs');
    const jwt = require('jsonwebtoken');
    
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Issue admin token (24h expiry)
    const token = jwt.sign(
      { id: user._id, email: user.email, isEmailAdmin: true },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ token });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Serve email marketing admin interface (admin only)
app.get("/admin/email", adminAuth, (req, res) => {
  res.sendFile(__dirname + '/public/email-admin.html');
});

// Serve forgot password page
app.get("/forgot_password", (req, res) => {
  res.sendFile(__dirname + '/public/forgot-password.html');
});

// Serve reset password page
app.get("/reset/:id", (req, res) => {
  res.sendFile(__dirname + '/public/reset-password.html');
});

// Set the time zone to Europe/Vienna
process.env.TZ = 'Europe/Vienna';


app.listen(PORT, () => console.log(`server started at ${PORT}`))
app.get("/", (req, res) => {
  res.send("Hello, welcome to edunode server!");
});
