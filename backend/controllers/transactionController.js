import Transaction from "../models/Transaction.js";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import Seller from "../models/Seller.js";
import sendSMS from "../utils/smsService.js";
import { getSMSMessage } from "../utils/messages.js";
import sendEmail from "../utils/emailService.js";

export const getCustomerTotalInterest = async (customerId, sellerId) => {
	const transactions = await Transaction.find({
		customerId,
		sellerId,
		type: "purchase",
		interestRate: { $gt: 0 },
		interestStartDate: { $exists: true },
	}).lean();

	let totalInterest = 0;

	for (const tx of transactions) {
		totalInterest += calculateDeferredInterest(
			tx.amount - tx.initialPayment,
			tx.interestRate,
			tx.interestStartDate,
			tx.interestTimeUnit || "months"
		);
	}

	return Number(totalInterest.toFixed(2));
};

const calculateDeferredInterest = (principal, rate, startDate, timeUnit) => {
    if (principal == null || rate == null || !startDate) return 0;

    const start = new Date(startDate);
    const now = new Date(); // 12/22/2025 current date

    if (isNaN(start.getTime()) || isNaN(now.getTime())) return 0;
    if (now <= start) return 0; // no interest if current date before start

    let timeInYears = 0;

    if (timeUnit === "days") {
        const days = (now - start) / (1000 * 60 * 60 * 24); // total days
        timeInYears = days / 365;
    } else if (timeUnit === "months") {
        let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
        if (now.getDate() < start.getDate()) months--; // partial month not completed
        timeInYears = months / 12; // fractional years
    } else if (timeUnit === "years") {
        let years = now.getFullYear() - start.getFullYear();
        if (now.getMonth() < start.getMonth() || 
            (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) {
            years--; // full years only
        }
        // Now calculate extra months after full years as fractional year
        let extraMonths = (now.getMonth() - start.getMonth() + 12) % 12;
        if (now.getDate() < start.getDate()) extraMonths--; 
        timeInYears = years + extraMonths / 12; // total fractional years
    }

    if (timeInYears <= 0) return 0;

    const interest = (principal * rate * timeInYears) / 100;
    return Number(interest.toFixed(2));
};



// Calculate simple interest: (Principal × Rate × Time) / 100
export const calculateInterest = (
	principal,
	rate,
	time,
	timeUnit = "months"
) => {
	if (!principal || !rate || !time) return 0;

	let timeInYears = 0;
	switch (timeUnit) {
		case "days":
			timeInYears = time / 365;
			break;
		case "months":
			timeInYears = time / 12;
			break;
		case "years":
			timeInYears = time;
			break;
		default:
			timeInYears = time / 12; // default to months
	}

	const interest = (principal * rate * timeInYears) / 100;
	return parseFloat(interest.toFixed(2));
};

export const addTransaction = async (req, res) => {
	try {
		const {
			customerId,
			type,
			amount,
			quantity,
			pricePerUnit,
			productId,
			description,
			notes,
			initialPayment = 0,
			sendSMS: shouldSendSMS,
			applyInterest,
			interestRate,
			interestDuration,
			interestTimeUnit = "months",
		} = req.body;
		console.log("reqTT",req.body);

		const customer = await Customer.findOne({
			_id: customerId,
			sellerId: req.userId,
		});

		if (!customer) {
			return res
				.status(404)
				.json({ success: false, message: "Customer not found" });
		}

		if (!amount || amount <= 0) {
			return res.status(400).json({
				success: false,
				message: "Amount must be greater than 0",
			});
		}

		const seller = await Seller.findById(req.userId);

		let interestStartDate = null;
		let calculatedInterest = 0; // ⬅️ ALWAYS ZERO AT CREATION

		if (
			type === "purchase" &&
			applyInterest &&
			interestRate &&
			interestDuration
		) {
			interestStartDate = new Date();

			if (interestTimeUnit === "days")
				interestStartDate.setDate(
					interestStartDate.getDate() + interestDuration
				);
			if (interestTimeUnit === "months")
				interestStartDate.setMonth(
					interestStartDate.getMonth() + interestDuration
				);
			if (interestTimeUnit === "years")
				interestStartDate.setFullYear(
					interestStartDate.getFullYear() + interestDuration
				);
		}

		let balanceAfterTransaction = customer.outstandingBalance;

		if (type === "purchase") {
			customer.totalPurchaseAmount += amount;
			customer.totalPaidAmount += initialPayment;
			customer.outstandingBalance += amount - initialPayment;
			balanceAfterTransaction = customer.outstandingBalance;
		}
       const totalInterest=getCustomerTotalInterest(customer._id,seller._id);
		if (type === "payment") {
			if (amount > customer.outstandingBalance+totalInterest) {
				console.log(amount,customer.outstandingBalance);
				return res.status(400).json({
					success: false,
					message: `Payment cannot exceed outstanding balance (₹${customer.outstandingBalance.toFixed(
						2
					)})`,
				});
			}

			customer.totalPaidAmount += amount;
			customer.outstandingBalance -= amount;
			balanceAfterTransaction = customer.outstandingBalance;
		}

		await customer.save();

		const newTransaction = new Transaction({
			sellerId: req.userId,
			customerId,
			productId,
			type,
			quantity,
			pricePerUnit,
			amount,
			interest: 0, // ⬅️ NOT APPLIED NOW
			interestRate: applyInterest ? interestRate : null,
			interestDuration: applyInterest ? interestDuration : null,
			interestTimeUnit: applyInterest ? interestTimeUnit : null,
			interestStartDate,
			initialPayment,
			description,
			notes,
			balanceAfterTransaction,
			date: new Date(),
		});

		await newTransaction.save();

		if (shouldSendSMS && customer.phone && balanceAfterTransaction > 0) {
			const message = getSMSMessage(
				seller.language,
				"balanceNotification",
				customer.name,
				balanceAfterTransaction
			);
			await sendSMS(customer.phone, message);
		}

		res.status(201).json({
			success: true,
			message: "Transaction recorded successfully",
			transaction: newTransaction,
			interest: calculatedInterest,
			customerBalance: {
				totalPurchaseAmount: customer.totalPurchaseAmount,
				totalPaidAmount: customer.totalPaidAmount,
				outstandingBalance: customer.outstandingBalance,
				depositAmount: customer.depositAmount,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Failed to add transaction",
			error: error.message,
		});
	}
};

export const getTransactions = async (req, res) => {
	try {
		const { customerId, type, limit = 50, skip = 0 } = req.query;

		const query = { sellerId: req.userId };

		if (customerId) query.customerId = customerId;
		if (type) query.type = type;

		const transactions = await Transaction.find(query)
			.sort({ date: -1 })
			.limit(parseInt(limit))
			.skip(parseInt(skip))
			.populate("customerId", "name phone")
			.populate("productId.product", "name unit")
			.lean(); // ✅ important for mutation

		const enrichedTransactions = transactions.map((tx) => {
			let calculatedInterest = tx.interest || 0;
		
			if (
				tx.type === "purchase" &&
				tx.interestRate &&
				tx.interestStartDate
			) {
				calculatedInterest = calculateDeferredInterest(
					tx.amount-tx.initialPayment,
					tx.interestRate,
					tx.interestStartDate,
					tx.interestTimeUnit || "months"
				);
			}
		

			return {
				...tx,
				interest: calculatedInterest, // ✅ same field name
			};
		});


		const total = await Transaction.countDocuments(query);
  
		res.json({
			success: true,
			transactions: enrichedTransactions,
			pagination: {
				total,
				limit: parseInt(limit),
				skip: parseInt(skip),
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Failed to fetch transactions",
			error: error.message,
		});
	}
};

export const getTransaction = async (req, res) => {
	try {
		const transaction = await Transaction.findOne({
			_id: req.params.id,
			sellerId: req.userId,
		})
			.populate("customerId")
			.populate("productId")
			.lean();
       
		if (!transaction) {
			return res.status(404).json({
				success: false,
				message: "Transaction not found",
			});
		}

		let calculatedInterest = transaction.interest || 0;

		if (
			transaction.type === "purchase" &&
			transaction.interestRate &&
			transaction.interestStartDate
		) {
			calculatedInterest = calculateDeferredInterest(
				transaction.amount - transaction.initialPayment,
				transaction.interestRate,
				transaction.interestStartDate,
				transaction.interestTimeUnit || "months"
			);
		}

		transaction.interest = calculatedInterest; // ✅ same response key

		res.json({
			success: true,
			transaction,
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Failed to fetch transaction",
			error: error.message,
		});
	}
};

export const updateTransaction = async (req, res) => {
	try {
		const { amount, description, notes, sendSMS: shouldSendSMS } = req.body;
		console.log("sms", req.body);
		const oldTransaction = await Transaction.findOne({
			_id: req.params.id,
			sellerId: req.userId,
		});

		if (!oldTransaction) {
			return res
				.status(404)
				.json({ success: false, message: "Transaction not found" });
		}

		const customer = await Customer.findById(oldTransaction.customerId);
		const seller = await Seller.findById(req.userId);

		// Reverse old transaction
		if (oldTransaction.type === "purchase") {
			customer.totalPurchaseAmount -= oldTransaction.amount;
			customer.outstandingBalance -= oldTransaction.amount;
		} else if (oldTransaction.type === "payment") {
			customer.totalPaidAmount -= oldTransaction.amount;
			customer.outstandingBalance += oldTransaction.amount;
		}

		// Prevent overpayment when updating payment transactions
		if (
			oldTransaction.type === "payment" &&
			amount > customer.outstandingBalance
		) {
			return res.status(400).json({
				success: false,
				message: `Payment cannot exceed outstanding balance (₹${customer.outstandingBalance.toFixed(
					2
				)})`,
			});
		}

		// Apply new transaction
		if (oldTransaction.type === "purchase") {
			customer.totalPurchaseAmount += amount;
			customer.outstandingBalance += amount;
		} else if (oldTransaction.type === "payment") {
			customer.totalPaidAmount += amount;
			customer.outstandingBalance = Math.max(
				0,
				customer.outstandingBalance - amount
			);
		}

		await customer.save();

		const updatedTransaction = await Transaction.findByIdAndUpdate(
			req.params.id,
			{
				amount,
				description,
				notes,
				balanceAfterTransaction: customer.outstandingBalance,
			},
			{ new: true }
		);

		// Send SMS notification only if user explicitly requested it
		if (
			shouldSendSMS &&
			customer.phone &&
			customer.outstandingBalance > 0
		) {
			const message = getSMSMessage(
				seller.language,
				"balanceNotification",
				customer.name,
				customer.outstandingBalance
			);

			console.log("cust", customer.email);
			await sendEmail(customer.email, message);
			// await sendSMS(customer.phone, message);
		}

		res.json({
			success: true,
			message: "Transaction updated successfully",
			transaction: updatedTransaction,
			customerBalance: {
				totalPurchaseAmount: customer.totalPurchaseAmount,
				totalPaidAmount: customer.totalPaidAmount,
				outstandingBalance: customer.outstandingBalance,
				depositAmount: customer.depositAmount,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Failed to update transaction",
			error: error.message,
		});
	}
};

export const deleteTransaction = async (req, res) => {
	try {
		const transaction = await Transaction.findOne({
			_id: req.params.id,
			sellerId: req.userId,
		});

		if (!transaction) {
			return res
				.status(404)
				.json({ success: false, message: "Transaction not found" });
		}

		const customer = await Customer.findById(transaction.customerId);

		// Reverse transaction
		if (transaction.type === "purchase") {
			customer.totalPurchaseAmount -= transaction.amount;
			customer.outstandingBalance -= transaction.amount;
		} else if (transaction.type === "payment") {
			customer.totalPaidAmount -= transaction.amount;
			customer.outstandingBalance += transaction.amount;
		}

		await customer.save();
		await Transaction.deleteOne({ _id: req.params.id });

		res.json({
			success: true,
			message: "Transaction deleted successfully",
			customerBalance: {
				totalPurchaseAmount: customer.totalPurchaseAmount,
				totalPaidAmount: customer.totalPaidAmount,
				outstandingBalance: customer.outstandingBalance,
				depositAmount: customer.depositAmount,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Failed to delete transaction",
			error: error.message,
		});
	}
};

export const sendBalanceNotification = async (req, res) => {
	try {
		const { customerId } = req.params;

		const customer = await Customer.findOne({
			_id: customerId,
			sellerId: req.userId,
		});
		if (!customer) {
			return res
				.status(404)
				.json({ success: false, message: "Customer not found" });
		}

		const seller = await Seller.findById(req.userId);

		if (!customer.phone) {
			return res.status(400).json({
				success: false,
				message: "Customer phone number not found",
			});
		}

		const message = getSMSMessage(
			seller.language,
			"balanceNotification",
			customer.name,
			customer.outstandingBalance
		);
		// await sendSms(customer.phone, message);
		const result = await sendEmail(customer.email, message);

		if (result.success) {
			res.json({
				success: true,
				message: "SMS notification sent successfully",
			});
		} else {
			res.status(500).json({
				success: false,
				message: "Failed to send SMS",
				error: result.error,
			});
		}
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Failed to send notification",
			error: error.message,
		});
	}
};

export const getDashboardStats = async (req, res) => {
	try {
		const customers = await Customer.find({
			sellerId: req.userId,
			isActive: true,
		});
		const products = await Product.find({
			sellerId: req.userId,
			isActive: true,
		});
		const transactions = await Transaction.find({ sellerId: req.userId });

		const totalCustomers = customers.length;
		const totalProducts = products.length;

		let totalPurchases = 0;
		let totalPayments = 0;
		let totalOutstanding = 0;
		let totalActiveCustomers = 0;
		let totalInterest = 0;



		// Calculate totals from transactions
		transactions.forEach((t) => {
			if (t.type === "purchase") {
				totalPayments += t.initialPayment;
				totalPurchases += t.amount;

				totalInterest+=calculateDeferredInterest(
				t.amount - t.initialPayment,
				t.interestRate,
				t.interestStartDate,
				t.interestTimeUnit || "months"
			);

				if (t.interest) {
					totalInterest += t.interest;
				}
			} else if (t.type === "payment") {
				totalPayments += t.amount;
			}
		});

		// Count customers with outstanding balance
		customers.forEach((c) => {
			totalOutstanding += c.outstandingBalance || 0;
			if (c.outstandingBalance > 0) {
				totalActiveCustomers++;
			}
		});
		console.log("to--------------------------------------", totalPayments);
		res.json({
			success: true,
			stats: {
				totalCustomers,
				totalActiveCustomers,
				totalProducts,
				totalPurchases,
				totalPayments,
				totalOutstanding,
				totalInterest,
				totalTransactions: transactions.length,
			},
		});
	} catch (error) {
		res.status(500).json({
			success: false,
			message: "Failed to fetch stats",
			error: error.message,
		});
	}
};
