const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const path = require('path')
const db = require('./config/mongoose-connection')
const ownersRouter = require('./routes/ownersRouter')
const usersRouter = require('./routes/usersRouter')
const productsRouter = require('./routes/productsRouter')
const indexRouter = require('./routes/index')
const expressSession = require('express-session')
const MongoStore = require('connect-mongo');
const flash = require('connect-flash')
// const crypto = require('crypto');
// const sessionSecret = crypto.randomBytes(32).toString('hex');

require ('dotenv').config()


app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')))
app.set('view engine', 'ejs')
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days in ms
    }
}))

app.use(flash())
// expose flash messages and logged-in state to all views
app.use((req, res, next) => {
    res.locals.success = req.flash ? req.flash('success') : [];
    res.locals.error = req.flash ? req.flash('error') : [];
    res.locals.loggedin = !!(req.cookies && req.cookies.token);
    next();
});
app.use("/", indexRouter)
app.use('/owners', ownersRouter)
app.use('/users', usersRouter)
app.use('/products', productsRouter)

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});