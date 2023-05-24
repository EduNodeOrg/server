const express = require("express")
const dotenv = require('dotenv');
const mongoose = require("mongoose");
const cors = require("cors");
dotenv.config({ path: './config/config.env' });
const fs = require('fs');
const passport =require('passport');
const cookieSession =require('cookie-session');
const authRoute = require("./routes/oauth");
const passportStrategy = require("./passport");

const PORT = process.env.PORT || 5001 

const app = express();
app.use(
   cookieSession({
    name:'session',
    keys:['cyberwolve'],
    macAge:24*60*60*100,
   })
)

app.use(passport.initialize())
app.use(passport.session())
app.use(
	cors({
		origin: "http://localhost:3000",
		methods: "GET,POST,PUT,DELETE",
		credentials: true,
	})
);
//app.use(cors());
app.use(express.json()); 
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Authorization,Content-Type,Accept,content-type,application/json');
  
  next();
}); 


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

app.get('/', (req, res) => {
  res.send('Welcome to the edunode API!');
});

app.get('/.well-known/stellar.toml', (req, res) => {
  console.log("hi")
  const tomlFilePath = __dirname + '/stellar.toml';
  const tomlContent = fs.readFileSync(tomlFilePath, 'utf8');
  res.send(tomlContent);
});

app.get('/.well-known/ai-plugin.json', (req, res) => {
  console.log("hi");
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
const profile = require("./routes/profile");
const project = require("./routes/project");
const cours = require("./routes/cours");
const google = require("./routes/google")
const blog = require("./routes/blog")
const chat = require("./routes/chat")
const passportSetup = require('./passport')
app.use('/api/gcallback', gcallback);
app.use('/api/search', search);
app.use('/api/users', users);
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
app.use("/api/profile", profile);
app.use("/api/project", project);
app.use("/api/cours", cours);
app.use("/api/google", google);
app.use("/api/blog", blog);
app.use("/api/chat", chat);
app.use("/auth", authRoute);





app.listen(PORT, () => console.log(`server started at ${PORT}`))
