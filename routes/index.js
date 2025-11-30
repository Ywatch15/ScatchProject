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


router.get('/shop', isLoggedin, async (req, res) => {
  try {
    // Load only products created/stored in the database (owners/admin)
    const docs = await productModel.find({}).lean();
    const products = docs.map((p) => ({
      _id: p._id,
      name: p.name,
      price: p.price,
      image: p.image, // Buffer or undefined
      imageUrl: p.imageUrl, // in case you store URLs in future
      bgcolor: p.bgcolor || '#f3f4f6',
      panelcolor: p.panelcolor || '#ffffff',
      textcolor: p.textcolor || '#111827',
      discount: p.discount || 0,
    }));
    const success = req.flash ? req.flash('success') : [];
    req.flash && req.flash('success'); // ensure flash is initialized
    res.render('shop', { products, user: req.user, success });
  } catch (err) {
    console.error('Error loading products for shop:', err);
    req.flash('error', 'Could not load products');
    const success = req.flash ? req.flash('success') : [];
    res.render('shop', { products: [], user: req.user, success });
  }
});
router.get('/cart', async (req, res) => {
  // Render the user's cart if logged in; otherwise redirect to index with a flash
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
      // Aggregate cart items to compute quantities: user.cart is an array of product docs
      const map = new Map();
      if (Array.isArray(user.cart)) {
        user.cart.forEach((p) => {
          const id = String(p._id);
          if (!map.has(id)) map.set(id, { product: p, qty: 0 });
          map.get(id).qty += 1;
        });
      }
      const cartItems = Array.from(map.values());
      // compute bill as sum of qty * price (subtract discount if present per-item)
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

// Increment quantity (add one occurrence of product to user's cart)
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

module.exports = router;