const GoogleStrategy = require('passport-google-oauth20').Strategy
const mongoose = require('mongoose')
const GoogleUser = require('../models/GoogleUser')

module.exports = function(passport) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "http://localhost:5000/api/auth/google/callback"
    },
    async (accessToken, refreshToken, profile, done) => {
        const newUser = {
            googleId: profile.id,
            userName: profile.displayName,
            fistName: profile.givenName,
            lastName: profile.name.familyName,
            googleProfilePic: profile.photos[0].value,
            isVerified: true
        }

        try {
            let user = await GoogleUser.findOne({ googleId: profile.id })
            if(user){

done(null, user)
            } else {
                user = await GoogleUser.create(newUser)
                done(null, user)
            }

        } catch (err) {
            console.error(err)
        }
    }
    
    ))

    passport.serializeUser((user, done) => {
        done(null, user.id)
    })
    passport.deserializeUser((id,done) => {
        GoogleUser.findById(id,(err, user) => (err, user))
    })
}