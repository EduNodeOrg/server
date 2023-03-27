const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const auth = require("../middleware/auth"); // jtw handler
const passport = require("passport");
const GoogleUser = require('../models/Answer');