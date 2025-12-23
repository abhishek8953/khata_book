import Product from '../models/Product.js';

export const addProduct = async (req, res) => {
  try {
    const { name, unit, description } = req.body;

    // Check if product already exists
    const existingProduct = await Product.findOne({ sellerId: req.userId, name });
    if (existingProduct) {
      return res.status(400).json({ success: false, message: 'Product with this name already exists' });
    }

    const newProduct = new Product({
      sellerId: req.userId,
      name,
      unit,
      description,
    });

    await newProduct.save();

    res.status(201).json({
      success: true,
      message: 'Product added successfully',
      product: newProduct,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add product', error: error.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const { isActive = true } = req.query;

    const query = { sellerId: req.userId };
    if (isActive !== 'all') {
      query.isActive = isActive === 'true';
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch products', error: error.message });
  }
};

export const getProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      sellerId: req.userId,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch product', error: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { name, unit, description } = req.body;

    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.userId },
      { name, unit, description },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product updated successfully',
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update product', error: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.userId },
      { isActive: false },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
      product,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete product', error: error.message });
  }
};
