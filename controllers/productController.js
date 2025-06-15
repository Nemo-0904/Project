const express = require('express');

const router = express.Router();

const Product = require('../models/Product');

router.get('/', async (req, res) => {

  try {

    const products = await Product.find(); // Fetch all products from MongoDB

    res.json(products);

  } catch (err) {

    console.error("Error fetching products:", err.message);

    res.status(500).json({ message: 'Server error while fetching products.' });

  }

});



router.post('/', async (req, res) => {

  const { title, price } = req.body;



  if (!title || !price) {

    return res.status(400).json({ message: 'Title and price are required.' });

  }



  try {

    const newProduct = new Product({ title, price });

    const saved = await newProduct.save();

    res.status(201).json(saved);

  } catch (err) {

    console.error("Error saving product:", err.message);

    res.status(500).json({ message: 'Server error while adding product.' });

  }

});



module.exports = router;