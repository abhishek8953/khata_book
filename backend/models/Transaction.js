import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema(
	{
		sellerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Seller",
			required: true,
		},
		customerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Customer",
			required: true,
		},
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
		},
		type: {
			type: String,
			enum: ["purchase", "payment"],
			required: true,
		},
		quantity: {
			type: Number,
		},
		pricePerUnit: {
			type: Number,
		},
		amount: {
			type: Number,
			required: true,
		},
		interest: {
			type: Number,
		},
		interestRate: Number,
		interestDuration: Number,
		interestTimeUnit: String,
		interestStartDate: Date,

		description: {
			type: String,
			trim: true,
		},
		notes: {
			type: String,
			trim: true,
		},
		initialPayment: {
			type: Number,
			default: 0,
		},
		balanceAfterTransaction: {
			type: Number,
		},
		date: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);

// Indexes for efficient queries
transactionSchema.index({ sellerId: 1, customerId: 1, createdAt: -1 });
transactionSchema.index({ sellerId: 1, date: -1 });

export default mongoose.model("Transaction", transactionSchema);
