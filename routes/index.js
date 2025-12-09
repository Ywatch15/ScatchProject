const express = require("express");  
const router = express.Router();
const isLoggedin = require("../middleware/isLoggedin")
const productModel = require("../models/product-model");
const userModel = require("../models/user-model");
const jwt = require('jsonwebtoken');


router.get("/", (req,res)=>{
  const error = res.locals.error || [];
  const success = res.locals.success || [];
  const loggedin = !!res.locals.loggedin;
    res.render("index", { error, success, loggedin });
})

// health check for local and deployment
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});


router.get('/shop', isLoggedin, async (req, res) => {
  try {
    const docs = await productModel.find({}).lean();
    const products = docs.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      image: p.image, 
      imageUrl: p.imageUrl, 
      bgcolor: p.bgcolor || '#f3f4f6',
      panelcolor: p.panelcolor || '#ffffff',
      textcolor: p.textcolor || '#111827',
      discount: p.discount || 0,
    }));
    const success = req.flash ? req.flash('success') : [];
    req.flash && req.flash('success'); 
    res.render('shop', { products, user: req.user, success });
  } catch (err) {
    console.error('Error loading products for shop:', err);
    req.flash('error', 'Could not load products');
    const success = req.flash ? req.flash('success') : [];
    res.render('shop', { products: [], user: req.user, success });
  }
});
router.get('/cart', async (req, res) => {
  if (!req.cookies || !req.cookies.token) {
    req.flash('error', 'You need to login first');
    return res.redirect('/');
  }

  try {
    const decoded = jwt.verify(req.cookies.token, process.env.JWT_KEY);
    const user = await userModel.findOne({ email: decoded.email }).populate('cart');
    if (!user) {
      req.flash('error', 'You need to login first');
      return res.redirect('/');
    }
      const map = new Map();
      if (Array.isArray(user.cart)) {
        user.cart.forEach((p) => {
          const id = String(p._id);
          if (!map.has(id)) map.set(id, { product: p, qty: 0 });
          map.get(id).qty += 1;
        });
      }
      const cartItems = Array.from(map.values());
      const bill = cartItems.reduce((sum, it) => {
        const price = Number(it.product.price) || 0;
        const discount = Number(it.product.discount) || 0;
        return sum + it.qty * (price - discount);
      }, 0);

    const success = req.flash ? req.flash('success') : [];
      res.render('cart', { cart: cartItems, user, loggedin: true, success, bill });
  } catch (err) {
    console.error('Error rendering cart:', err);
    req.flash('error', 'You need to login first');
    res.redirect('/');
  }
});

router.get('/cart/increment/:id', isLoggedin, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    if (!user) return res.status(404).send('User not found');
    user.cart.push(req.params.id);
    await user.save();
    req.flash('success', 'Increased product quantity');
    res.redirect('/cart');
  } catch (err) {
    console.error('Error incrementing cart item:', err);
    req.flash('error', 'Could not update cart');
    res.redirect('/cart');
  }
});

// Account page - view and update profile
router.get('/account', isLoggedin, async (req, res) => {
  try {
    const success = req.flash ? req.flash('success') : [];
    res.render('account', { user: req.user, loggedin: true, success });
  } catch (err) {
    console.error('Error rendering account page:', err);
    req.flash('error', 'Could not load account');
    res.redirect('/');
  }
});

router.post('/account', isLoggedin, async (req, res) => {
  try {
    const { contact } = req.body;
    await userModel.findOneAndUpdate({ email: req.user.email }, { contact }, { new: true });
    req.flash('success', 'Profile updated');
    res.redirect('/account');
  } catch (err) {
    console.error('Error updating account:', err);
    req.flash('error', 'Could not update profile');
    res.redirect('/account');
  }
});

// Decrement quantity (remove one occurrence of product from user's cart)
router.get('/cart/decrement/:id', isLoggedin, async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.user.email });
    if (!user) return res.status(404).send('User not found');
    const idx = user.cart.findIndex(c => String(c) === String(req.params.id));
    if (idx > -1) {
      user.cart.splice(idx, 1);
      await user.save();
      req.flash('success', 'Decreased product quantity');
    }
    res.redirect('/cart');
  } catch (err) {
    console.error('Error decrementing cart item:', err);
    req.flash('error', 'Could not update cart');
    res.redirect('/cart');
  }
});
router.get("/addtocart/:id",isLoggedin, async (req,res)=>{
  let user = await userModel.findOne({ email: req.user.email })
  if (!user) return res.status(404).send('User not found');
  user.cart.push(req.params.id);
  await user.save()
  req.flash("success", "Product added to cart successfully");
  res.redirect("/shop");
})
// router.get('/logout')

// Subscribe endpoint for footer newsletter
const fs = require('fs');
const path = require('path');
router.post('/subscribe', async (req, res) => {
  try {
    const email = (req.body && req.body.email) ? String(req.body.email).trim() : '';
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      const errMsg = 'Please provide a valid email';
      if (req.xhr || (req.headers.accept || '').includes('application/json')) {
        return res.status(400).json({ success: false, message: errMsg });
      }
      req.flash('error', errMsg);
      return res.redirect(req.get('referer') || '/');
    }

    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    const file = path.join(dataDir, 'subscribers.json');
    let list = [];
    if (fs.existsSync(file)) {
      try { list = JSON.parse(fs.readFileSync(file, 'utf8') || '[]'); } catch (e) { list = []; }
    }
    // avoid duplicates
    let message = 'Thanks — we will notify you when new collections arrive';
    if (list.includes(email)) {
      message = 'You are already subscribed';
    } else {
      list.push(email);
      fs.writeFileSync(file, JSON.stringify(list, null, 2), 'utf8');
    }

    if (req.xhr || (req.headers.accept || '').includes('application/json')) {
      return res.json({ success: true, message });
    }

    req.flash('success', message);
    return res.redirect(req.get('referer') || '/');
  } catch (err) {
    console.error('Error processing subscription:', err);
    const errMsg = 'Could not process subscription';
    if (req.xhr || (req.headers.accept || '').includes('application/json')) {
      return res.status(500).json({ success: false, message: errMsg });
    }
    req.flash('error', errMsg);
    return res.redirect(req.get('referer') || '/');
  }
});

module.exports = router;