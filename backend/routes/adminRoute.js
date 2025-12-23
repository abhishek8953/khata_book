import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';
import Seller from '../models/Seller.js';
import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import Product from '../models/Product.js';
import { adminAuth, superAdminAuth } from '../middleware/adminAuth.js';
import { createLicenseKey } from '../utils/generateLicenceKey.js';
import LicenseKey from "../models/LicenceKey.js";


const router = express.Router();

// Admin Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await Admin.findOne({ username, isActive: true });
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, role: admin.role },
      process.env.ADMIN_JWT_SECRET || 'admin_secret_key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get Dashboard Stats
router.get('/dashboard/stats', adminAuth, async (req, res) => {
  
  try {
    const [
      totalSellers,
      totalCustomers,
      totalProducts,
      totalTransactions,
      activeSellers,
      activeCustomers,
      recentSellers,
      recentCustomers,
    ] = await Promise.all([
      Seller.countDocuments(),
      Customer.countDocuments(),
      Product.countDocuments(),
      Transaction.countDocuments(),
      Seller.countDocuments({ isActive: true }),
      Customer.countDocuments({ isActive: true }),
      Seller.find().sort({ createdAt: -1 }).limit(5).select('name email businessName createdAt'),
      Customer.find().sort({ createdAt: -1 }).limit(5).select('name phone outstandingBalance createdAt').populate('sellerId', 'businessName'),
    ]);

    // Calculate total outstanding balance
    const outstandingBalance = await Customer.aggregate([
      { $group: { _id: null, total: { $sum: '$outstandingBalance' } } },
    ]);

    // Calculate total transaction amount
    const transactionStats = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      stats: {
        totalSellers,
        totalCustomers,
        totalProducts,
        totalTransactions,
        activeSellers,
        activeCustomers,
        totalOutstanding: outstandingBalance[0]?.total || 0,
        transactionStats,
      },
      recentSellers,
      recentCustomers,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// CRUD Operations for Sellers
router.get('/sellers', adminAuth, async (req, res) => {
  try {
  
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = search
      ? {
          $or: [
            { name: new RegExp(search, 'i') },
            { email: new RegExp(search, 'i') },
            { businessName: new RegExp(search, 'i') },
            { phone: new RegExp(search, 'i') },
          ],
        }
      : {};

    const sellers = await Seller.find(query)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Seller.countDocuments(query);

    res.json({
      sellers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/sellers/:id', adminAuth, async (req, res) => {
  try {
  
    const seller = await Seller.findById(req.params.id).select('-password');
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    const [customerCount, productCount, transactionCount] = await Promise.all([
      Customer.countDocuments({ sellerId: seller._id }),
      Product.countDocuments({ sellerId: seller._id }),
      Transaction.countDocuments({ sellerId: seller._id }),
    ]);

    res.json({
      seller,
      stats: {
        customers: customerCount,
        products: productCount,
        transactions: transactionCount,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/sellers/:id', adminAuth, async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Prevent password update through this route

    const seller = await Seller.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    res.json({ message: 'Seller updated successfully', seller });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/sellers/:id', superAdminAuth, async (req, res) => {
  try {
    const seller = await Seller.findByIdAndDelete(req.params.id);
    if (!seller) {
      return res.status(404).json({ message: 'Seller not found' });
    }

    // Optionally delete related data
    await Promise.all([
      Customer.deleteMany({ sellerId: seller._id }),
      Product.deleteMany({ sellerId: seller._id }),
      Transaction.deleteMany({ sellerId: seller._id }),
    ]);

    res.json({ message: 'Seller and related data deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// CRUD Operations for Customers
router.get('/customers', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sellerId = '' } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    if (sellerId) {
      query.sellerId = sellerId;
    }

    const customers = await Customer.find(query)
      .populate('sellerId', 'name businessName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Customer.countDocuments(query);

    res.json({
      customers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/customers/:id', superAdminAuth, async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    await Transaction.deleteMany({ customerId: customer._id });

    res.json({ message: 'Customer and related transactions deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Products Routes
router.get('/products', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', sellerId = '' } = req.query;
    const query = {};

    if (search) {
      query.name = new RegExp(search, 'i');
    }

    if (sellerId) {
      query.sellerId = sellerId;
    }

    const products = await Product.find(query)
      .populate('sellerId', 'name businessName')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Product.countDocuments(query);

    res.json({
      products,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Transactions Routes
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 10, type = '', sellerId = '', customerId = '' } = req.query;
    const query = {};

    if (type) query.type = type;
    if (sellerId) query.sellerId = sellerId;
    if (customerId) query.customerId = customerId;

    const transactions = await Transaction.find(query)
      .populate('sellerId', 'name businessName')
      .populate('customerId', 'name phone')
      .populate('productId', 'name unit')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 });

    const count = await Transaction.countDocuments(query);

    res.json({
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Admin Management (Super Admin Only)
router.get('/admins', superAdminAuth, async (req, res) => {
  try {
    const admins = await Admin.find().select('-password').sort({ createdAt: -1 });
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/admins', superAdminAuth, async (req, res) => {
  try {
    const admin = new Admin(req.body);
    await admin.save();
    res.status(201).json({ message: 'Admin created successfully', admin: { ...admin.toObject(), password: undefined } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/admins/:id', superAdminAuth, async (req, res) => {
  try {
    const updates = req.body;
    const admin = await Admin.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true }).select('-password');
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({ message: 'Admin updated successfully', admin });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/admins/:id', superAdminAuth, async (req, res) => {
  try {
    if (req.params.id === req.admin._id.toString()) {
      return res.status(400).json({ message: 'Cannot delete your own admin account' });
    }
    const admin = await Admin.findByIdAndDelete(req.params.id);
    if (!admin) {
      return res.status(404).json({ message: 'Admin not found' });
    }
    res.json({ message: 'Admin deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/generate', async (req, res) => {

  
	// "key": "LIC-4D11-8E68-9B97"

  try {
    const { expireDays } = req.body;
    
    const key = await createLicenseKey(expireDays);
    res.json({ key });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not generate license key' });
  }
});



export const adminGetLicenses = async (req, res) => {
  const licenses = await LicenseKey.find()
    .populate('assignedToSeller', 'name email')
    .sort({ createdAt: -1 });
  
  res.json(licenses);
};

router.get('/licenses',adminGetLicenses)

export default router;