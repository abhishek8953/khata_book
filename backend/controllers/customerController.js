import Customer from '../models/Customer.js';
import Transaction from '../models/Transaction.js';
import { getCustomerTotalInterest } from './transactionController.js';

export const addCustomer = async (req, res) => {
  try {
    const { name, phone, address, city, state, pincode, email, notes } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ sellerId: req.userId, phone });
    if (existingCustomer) {
      return res.status(400).json({ success: false, message: 'Customer with this phone already exists' });
    }

    const newCustomer = new Customer({
      sellerId: req.userId,
      name,
      phone,
      address,
      city,
      state,
      pincode,
      email,
      notes,
    });

    await newCustomer.save();

    res.status(201).json({
      success: true,
      message: 'Customer added successfully',
      customer: newCustomer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to add customer', error: error.message });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const { isActive = true } = req.query;

    const query = { sellerId: req.userId };
    if (isActive !== "all") {
      query.isActive = isActive === "true";
    }

    const customers = await Customer.find(query)
      .sort({ createdAt: -1 })
      .lean(); // 👈 important

    const enrichedCustomers = await Promise.all(
      customers.map(async (customer) => {
        const totalInterest = await getCustomerTotalInterest(
          customer._id,
          req.userId
        );

        return {
          ...customer,
          totalInterest, // ✅ added field only
        };
      })
    );

    res.json({ success: true, customers: enrichedCustomers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
};

export const getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      sellerId: req.userId,
    }).lean();

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    const totalInterest = await getCustomerTotalInterest(
      customer._id,
      req.userId
    );

    res.json({
      success: true,
      customer: {
        ...customer,
        totalInterest, // ✅ added safely
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
      error: error.message,
    });
  }
};


export const updateCustomer = async (req, res) => {
  try {
    const { name, phone, address, city, state, pincode, email, notes } = req.body;

    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, sellerId: req.userId },
      { name, phone, address, city, state, pincode, email, notes },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      customer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update customer', error: error.message });
  }
};

export const deleteCustomer = async (req, res) => {
  try {
    
    const customer = await Customer.deleteOne(
      { _id: req.params.id, sellerId: req.userId },
    );
    const transaction=await Transaction.deleteMany({customerId:req.params.id})
    
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully',
      customer,
      deleteCount:transaction.deletedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete customer', error: error.message });
  }
};

export const getCustomerBalance = async (req, res) => {
  try {
    const customer = await Customer.findOne({
      _id: req.params.id,
      sellerId: req.userId,
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const transactions = await Transaction.find({
      sellerId: req.userId,
      customerId: req.params.id,
    }).sort({ date: -1 });

    res.json({
      success: true,
      balance: {
        totalPurchaseAmount: customer.totalPurchaseAmount,
        totalPaidAmount: customer.totalPaidAmount,
        outstandingBalance: customer.outstandingBalance,
        depositAmount: customer.depositAmount,
      },
      transactions,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch balance', error: error.message });
  }
};
