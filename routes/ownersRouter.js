const express = require('express');
const router = express.Router();
const ownerModel = require('../models/owner-model')


router.post('/create', async (req, res) => {
    const allowCreate = (process.env.NODE_ENV === 'development') || (process.env.ALLOW_OWNER_CREATE === 'true');
    if (!allowCreate) {
        return res.status(403).send("Owner creation is disabled in this environment");
    }

    try {
        let owners = await ownerModel.find();
        if (owners.length > 0) {
            return res.status(403).send("You don't have permission to create a new owner");
        }

        let { fullname, email, password } = req.body;
        if (!fullname || !email || !password) {
            return res.status(400).send('fullname, email and password are required');
        }

        let createdOwner = await ownerModel.create({
            fullname,
            email,
            password,
        });

        res.status(201).json(createdOwner);
    } catch (err) {
        console.error('Error creating owner:', err);
        res.status(500).send('Internal server error');
    }
});

router.get('/admin',(req,res)=>{
    const success = req.flash ? req.flash('success') : [];
    res.render('createproducts', { success });
})





module.exports = router;