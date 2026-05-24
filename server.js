const express = require("express")
const router = express.Router();
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const cors = require("cors");
dotenv.config({ path: './config/config.env' });
const fs = require('fs');
const authRoute = require("./routes/oauth");
const bodyParser = require('body-parser');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const http = require('http');
// const socketIo = require('socket.io');
const app = express();

// Trust proxy for rate limiting behind Heroku
app.set('trust proxy', 1);

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
  secret: 'cceb95c4de4ece0427c3fd2ac73bbde6bffb85ce827620a1b2edecb78a360634',
  resave: false,
  saveUninitialized: false,
  store: new MongoDBStore({
    uri: process.env.MONGO_URI, // Replace with your MongoDB connection URI
    collection: 'sessions',
  }),
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
  allowedHeaders: '*',
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
app.use('/api/auth', auth);
app.use('/api/emailauth', emailAuth);
app.use('/api/emaillogin', emailLogin);
app.use('/api/metamasklogin', metamaskLogin);
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
app.use("/api/email/campaigns", emailCampaigns);
app.use("/api/email/templates", emailTemplates);
app.use("/api/email/unsubscribe", emailUnsubscribe);
app.use("/api/email/webhooks", emailWebhooks);
app.use("/api/email/analytics", emailAnalytics);
app.use("/api/email/crm", emailCRM);

// Handle unsubscribe at root level for Mailgun redirects
app.get("/unsubscribe", async (req, res) => {
  try {
    const { email, campaign, reason = 'user_request' } = req.query;

    if (!email) {
      return res.status(400).send('Email parameter is required');
    }

    const emailService = require('./services/emailService');
    await emailService.unsubscribeUser(email, campaign, reason);

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

// Serve static files from public directory
app.use(express.static('public'));

// Serve email marketing admin interface
app.get("/admin/email", (req, res) => {
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
