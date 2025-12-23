import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit2, Trash2, Search, Delete } from "lucide-react";
import Navbar from "../components/Navbar";
import { Card, Table } from "../components/Layout";
import Alert from "../components/Alert";
import { Button, Input, Select, Checkbox } from "../components/FormElements";
import { transactionAPI, customerAPI, productAPI } from "../utils/api";

const Transactions = () => {
	const { t } = useTranslation();
	const [transactions, setTransactions] = useState([]);
	const [customers, setCustomers] = useState([]);
	const [products, setProducts] = useState([]);
	const [loading, setLoading] = useState(true);
	const [alert, setAlert] = useState(null);
	const [showForm, setShowForm] = useState(false);
	const [editingId, setEditingId] = useState(null);
	const [errors, setErrors] = useState({});
	const [searchQuery, setSearchQuery] = useState("");
	const [filterType, setFilterType] = useState("all");
	const [debounceTimer, setDebounceTimer] = useState(null);
	const [showProductDetails, setShowProductDetails] = useState(false);
	const [formData, setFormData] = useState({
		customerId: "",
		type: "purchase",
		productId: "",
		quantity: "",
		pricePerUnit: "",
		amount: "",
		initialPayment: "0",
		description: "",
		notes: "",
		sendSMS: false,
		// New interest fields
		applyInterest: false,
		interestRate: "",
		interestDuration: "",
		interestTimeUnit: "months"
	});
  
	const [selectedCustomerBalance, setSelectedCustomerBalance] = useState(null);
	const [calculatedInterest, setCalculatedInterest] = useState(0);

	const transactionTypes = [
		{ value: "purchase", label: t("purchase") },
		{ value: "payment", label: t("payment") },
	];

	const timeUnitOptions = [
		{ value: "days", label: "Days" },
		{ value: "months", label: "Months" },
		{ value: "years", label: "Years" }
	];

	useEffect(() => {
		fetchInitialData();
	}, []);
	
	useEffect(() => {
		calculateAmount();
	}, [formData.pricePerUnit, formData.quantity]);

	// Calculate interest when relevant fields change
	useEffect(() => {
		if (formData.type === "purchase" && formData.applyInterest) {
			calculateInterestAmount();
		} else {
			setCalculatedInterest(0);
		}
	}, [
		formData.amount,
		formData.initialPayment,
		formData.interestRate,
		formData.interestDuration,
		formData.interestTimeUnit,
		formData.applyInterest,
		formData.type
	]);

	const fetchInitialData = async () => {
		try {
			const [transRes, custRes, prodRes] = await Promise.all([
				transactionAPI.getTransactions(),
				customerAPI.getCustomers({ isActive: "true" }),
				productAPI.getProducts({ isActive: "true" }),
			]);

			console.log("trans",transRes,custRes,prodRes);
			setTransactions(transRes.data.transactions);
			setCustomers(custRes.data.customers);
			setProducts(prodRes.data.products);
		} catch (error) {
			setAlert({ type: "error", message: t("somethingWentWrong") });
		} finally {
			setLoading(false);
		}
	};

	const calculateInterestAmount = () => {
		const principal = parseFloat(formData.amount)- parseFloat(formData.initialPayment);
		const rate = parseFloat(formData.interestRate);
		const time = parseFloat(formData.interestDuration);

		if (!principal || !rate || !time || principal <= 0 || rate <= 0 || time <= 0) {
			setCalculatedInterest(0);
			return;
		}

		let timeInYears = 0;
		switch(formData.interestTimeUnit) {
			case 'days':
				timeInYears = time / 365;
				break;
			case 'months':
				timeInYears = time / 12;
				break;
			case 'years':
				timeInYears = time;
				break;
			default:
				timeInYears = time / 12;
		}

		const interest = (principal * rate * timeInYears) / 100;
		setCalculatedInterest(parseFloat(interest.toFixed(2)));
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		const newValue = type === 'checkbox' ? checked : value;
   
		setFormData((prev) => ({ ...prev, [name]: newValue }));
		if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

		// Reset interest when switching to payment
		if (name === "type" && value === "payment") {
			setFormData(prev => ({
				...prev,
				applyInterest: false,
				interestRate: "",
				interestDuration: "",
				interestTimeUnit: "months"
			}));
			setCalculatedInterest(0);
		}

		// Update selected customer balance when customer changes
		if (name === "customerId") {
			const customer = customers.find((c) => c._id === value);
			setSelectedCustomerBalance(
				customer
					? {
							outstanding: customer.outstandingBalance || 0,
							totalPaid: customer.totalPaidAmount || 0,
							totalPurchase: customer.totalPurchaseAmount || 0,
					  }
					: null
			);
		}
	};

	const validateForm = () => {
		const newErrors = {};
		if (!formData.customerId) newErrors.customerId = t("fillAllFields");
		if (!formData.type) newErrors.type = t("fillAllFields");
		if (!formData.amount || parseFloat(formData.amount) <= 0) {
			newErrors.amount = "Amount must be greater than 0";
		}

		// Validate interest fields if interest is enabled
		if (formData.type === "purchase" && formData.applyInterest) {
			if (!formData.interestRate || parseFloat(formData.interestRate) <= 0) {
				newErrors.interestRate = "Interest rate must be greater than 0";
			}
			if (!formData.interestDuration || parseFloat(formData.interestDuration) <= 0) {
				newErrors.interestDuration = "Duration must be greater than 0";
			}
		}

		// Validate initial payment for purchase transactions
		if (formData.type === "purchase" && formData.initialPayment) {
			const initialPayment = parseFloat(formData.initialPayment);
			const totalAmount = parseFloat(formData.amount) + calculatedInterest;

			if (initialPayment < 0) {
				newErrors.initialPayment = "Initial payment cannot be negative";
			} else if (initialPayment > totalAmount) {
				newErrors.initialPayment = `Initial payment cannot exceed total amount (₹${totalAmount.toFixed(2)})`;
			}
		}

		// Check for overpayment on payment transactions
		if (formData.type === "payment" && selectedCustomerBalance) {
			const paymentAmount = parseFloat(formData.amount);
			const outstandingAmount = selectedCustomerBalance.outstanding;

			if (paymentAmount > outstandingAmount) {
				newErrors.amount = `Payment cannot exceed outstanding balance (₹${parseFloat(
					outstandingAmount
				).toFixed(2)})`;
			}
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const calculateAmount = () => {
		if (formData.quantity && formData.pricePerUnit) {
			const amount =
				parseFloat(formData.quantity) *
				parseFloat(formData.pricePerUnit);
			setFormData((prev) => ({ ...prev, amount: amount.toFixed(2) }));
		}
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;

		try {
			const submitData = {
				customerId: formData.customerId,
				type: formData.type,
				amount: parseFloat(formData.amount),
				quantity: formData.quantity
					? parseFloat(formData.quantity)
					: undefined,
				pricePerUnit: formData.pricePerUnit
					? parseFloat(formData.pricePerUnit)
					: undefined,
				productId: formData.productId || undefined,
				description: formData.description,
				notes: formData.notes,
				initialPayment:
					formData.type === "purchase" && formData.initialPayment
						? parseFloat(formData.initialPayment)
						: undefined,
				sendSMS: formData.sendSMS,
				// Interest fields
				applyInterest: formData.type === "purchase" && formData.applyInterest,
				interestRate: formData.applyInterest && formData.interestRate 
					? parseFloat(formData.interestRate) 
					: undefined,
				interestDuration: formData.applyInterest && formData.interestDuration 
					? parseFloat(formData.interestDuration) 
					: undefined,
				interestTimeUnit: formData.applyInterest 
					? formData.interestTimeUnit 
					: undefined,
			};

			if (editingId) {
				await transactionAPI.updateTransaction(editingId, submitData);
				setAlert({ type: "success", message: t("transactionUpdated") });
			} else {
				await transactionAPI.addTransaction(submitData);
				setAlert({ type: "success", message: t("transactionAdded") });
			}
			resetForm();
			fetchInitialData();
		} catch (error) {
			setAlert({
				type: "error",
				message:
					error.response?.data?.message || t("somethingWentWrong"),
			});
		}
	};

	const handleEdit = (transaction) => {
		setFormData({
			customerId: transaction.customerId._id,
			type: transaction.type,
			productId: transaction.productId?._id || "",
			quantity: transaction.quantity || "",
			pricePerUnit: transaction.pricePerUnit || "",
			amount: transaction.amount - (transaction.interest || 0),
			description: transaction.description || "",
			notes: transaction.notes || "",
			sendSMS: false,
			applyInterest: false,
			interestRate: "",
			interestDuration: "",
			interestTimeUnit: "months"
		});
		setEditingId(transaction._id);
		setShowForm(true);
	};

	const handleDelete = async (id) => {
		console.log(id);
		if (!window.confirm(t("deleteConfirmation"))) return;
		try {
			await transactionAPI.deleteTransaction(id);
			setAlert({ type: "success", message: t("transactionDeleted") });
			fetchInitialData();
		} catch (error) {
			setAlert({ type: "error", message: t("somethingWentWrong") });
		}
	};

	const resetForm = () => {
		setFormData({
			customerId: "",
			type: "purchase",
			productId: "",
			quantity: "",
			pricePerUnit: "",
			amount: "",
			initialPayment: "",
			description: "",
			notes: "",
			sendSMS: false,
			applyInterest: false,
			interestRate: "",
			interestDuration: "",
			interestTimeUnit: "months"
		});
		setSelectedCustomerBalance(null);
		setShowProductDetails(false);
		setCalculatedInterest(0);
		setEditingId(null);
		setShowForm(false);
		setErrors({});
	};

	const getFilteredTransactions = () => {
		let filtered = transactions;

		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			filtered = filtered.filter(
				(t) =>
					(t.customerId?.name || "Unknown")
						.toLowerCase()
						.includes(query) || t.type.toLowerCase().includes(query)
			);
		}

		if (filterType === "hasOutstanding") {
			filtered = filtered.filter((t) => t.balanceAfterTransaction > 0);
		} else if (filterType === "noOutstanding") {
			filtered = filtered.filter((t) => t.balanceAfterTransaction === 0);
		}

		return filtered;
	};

	const handleSearchChange = (e) => {
		const value = e.target.value;
		setSearchQuery(value);

		if (debounceTimer) clearTimeout(debounceTimer);

		const timer = setTimeout(() => {}, 300);
		setDebounceTimer(timer);
	};

	const tableData = getFilteredTransactions().map((t) => ({
		customer: t.customerId?.name || "Unknown",
		type: t.type,
		amount: `₹${parseFloat(t.amount).toFixed(2)}`,
		inital_amount: `₹${parseFloat(t.initialPayment).toFixed(2)}`,
		interest: t.interest ? `₹${parseFloat(t.interest).toFixed(2)}` : "₹0.00",
		balance: `₹${parseFloat(t.balanceAfterTransaction).toFixed(2)}`,
		date: new Date(t.date).toLocaleDateString(),
		transactionId: t._id,
	}));

	const customerOptions = customers.map((c) => ({
		value: c._id,
		label: c.name,
	}));
	const productOptions = products.map((p) => ({
		value: p._id,
		label: p.name,
	}));

	const getTotalWithInterest = () => {
		return parseFloat(formData.amount || 0) + calculatedInterest;
	};

	return (
		<>
			<Navbar />
			<div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
				<div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
					<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
						{t("transactions")}
					</h1>
					{!showForm && (
						<Button
							variant="primary"
							onClick={() => setShowForm(true)}
							size="md"
						>
							<Plus size={18} />
							<span className="hidden sm:inline">
								{t("recordTransaction")}
							</span>
							<span className="sm:hidden">{t("add")}</span>
						</Button>
					)}
				</div>

				{alert && (
					<Alert
						type={alert.type}
						message={alert.message}
						onClose={() => setAlert(null)}
					/>
				)}

				{!showForm && (
					<Card className="mb-6 sm:mb-8">
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
							<div className="sm:col-span-1">
								<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
									{t("search")}
								</label>
								<div className="relative">
									<Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
									<input
										type="text"
										placeholder="Search customer or type..."
										value={searchQuery}
										onChange={handleSearchChange}
										className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
									/>
								</div>
							</div>

							<div className="sm:col-span-1">
								<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
									{t("filter")} {t("amount")}
								</label>
								<Select
									name="filterType"
									value={filterType}
									onChange={(e) =>
										setFilterType(e.target.value)
									}
									options={[
										{
											value: "all",
											label: "All Transactions",
										},
										{
											value: "hasOutstanding",
											label: "With Outstanding Balance",
										},
										{
											value: "noOutstanding",
											label: "No Outstanding Balance",
										},
									]}
								/>
							</div>
						</div>
					</Card>
				)}

				{showForm && (
					<Card className="mb-6 sm:mb-8">
						<h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
							{editingId
								? t("editTransaction")
								: t("recordTransaction")}
						</h2>

						{selectedCustomerBalance && (
							<div className="mb-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
								<h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">
									{t("customerBalance")}
								</h3>
								<div className="grid grid-cols-3 gap-2 sm:gap-4">
									<div className="bg-white p-2 sm:p-3 rounded">
										<p className="text-xs text-gray-600">
											{t("totalPurchase")}
										</p>
										<p className="text-lg sm:text-xl font-bold text-green-600">
											₹
											{parseFloat(
												selectedCustomerBalance.totalPurchase
											).toFixed(2)}
										</p>
									</div>
									<div className="bg-white p-2 sm:p-3 rounded">
										<p className="text-xs text-gray-600">
											{t("totalPaid")}
										</p>
										<p className="text-lg sm:text-xl font-bold text-blue-600">
											₹
											{parseFloat(
												selectedCustomerBalance.totalPaid
											).toFixed(2)}
										</p>
									</div>
									<div className="bg-white p-2 sm:p-3 rounded">
										<p className="text-xs text-gray-600">
											{t("outstandingBalance")}
										</p>
										<p
											className={`text-lg sm:text-xl font-bold ${
												selectedCustomerBalance.outstanding >
												0
													? "text-red-600"
													: "text-green-600"
											}`}
										>
											₹
											{parseFloat(
												selectedCustomerBalance.outstanding
											).toFixed(2)}
										</p>
									</div>
								</div>
							</div>
						)}

						<form
							onSubmit={handleSubmit}
							className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
						>
							<Select
								label={t("selectCustomer")}
								name="customerId"
								value={formData.customerId}
								onChange={handleChange}
								error={errors.customerId}
								options={customerOptions}
							/>

							<Select
								label={t("transactionType")}
								name="type"
								value={formData.type}
								onChange={handleChange}
								error={errors.type}
								options={transactionTypes}
							/>

							<Input
								label={t("amount")}
								name="amount"
								type="number"
								step="0.01"
								min="0.01"
								value={formData.amount}
								onChange={handleChange}
								error={errors.amount}
							/>
							{formData.type === "purchase" && (
								<Input
									label={t("initialPayment")}
									name="initialPayment"
									type="number"
									step="0.01"
									min="0"
									value={formData.initialPayment}
									onChange={handleChange}
									error={errors.initialPayment}
									placeholder={
										formData.amount
											? `0 to ₹${getTotalWithInterest().toFixed(2)}`
											: "0"
									}
								/>
							)}


							{formData.customerId &&
								formData.type === "payment" &&
								selectedCustomerBalance && (
									<>
										<div className="sm:col-span-2 p-3 bg-green-50 border border-green-200 rounded-lg">
											<p className="text-sm text-green-800">
												💡 {t("outstandingBalance")}:{" "}
												<span className="font-semibold">
													₹
													{parseFloat(
														selectedCustomerBalance.outstanding
													).toFixed(2)}
												</span>
												{selectedCustomerBalance.outstanding >
												0
													? ` - ${t(
															"enterPaymentAmount"
													  )}`
													: " - No outstanding balance"}
											</p>
										</div>

										{formData.amount &&
											parseFloat(formData.amount) >
												selectedCustomerBalance.outstanding &&
											selectedCustomerBalance.outstanding >
												0 && (
												<div className="sm:col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg">
													<p className="text-sm text-red-800">
														⚠️{" "}
														<span className="font-semibold">
															Overpayment
															Detected!
														</span>{" "}
														Payment cannot exceed ₹
														{parseFloat(
															selectedCustomerBalance.outstanding
														).toFixed(2)}
													</p>
												</div>
											)}
									</>
								)}

							{formData.customerId &&
								formData.type === "purchase" && (
									<div className="sm:col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
										<p className="text-sm text-amber-800">
											💡 {t("enterSaleAmount")} -{" "}
											{t("balance")} {t("willUpdate")}
										</p>
									</div>
								)}
{/* TODO */}
							{formData.type === "purchase" && (
								<Checkbox
									name="showProductDetails"
									checked={showProductDetails}
									onChange={(e) =>
										setShowProductDetails(e.target.checked)
									}
									label="Add Product Details (Optional)"
									className="sm:col-span-2"
								/>
							)}

							{formData.type === "purchase" &&
								showProductDetails && (
									<>
										<Select
											label={t("selectProduct")}
											name="productId"
											value={formData.productId}
											onChange={handleChange}
											options={productOptions}
										/>
										<Input
											label={t("quantity")}
											name="quantity"
											type="number"
											step="0.01"
											min="0.01"
											value={formData.quantity}
											onChange={handleChange}
										/>
										<Input
											label={t("pricePerUnit")}
											name="pricePerUnit"
											type="number"
											step="0.01"
											min="0.01"
											value={formData.pricePerUnit}
											onChange={handleChange}
										/>
									</>
								)}

							

							{formData.type === "purchase" && (
								<>
									<Checkbox
										name="applyInterest"
										checked={formData.applyInterest}
										onChange={handleChange}
										label="Apply Interest (Simple Interest)"
										className="sm:col-span-2"
									/>

									{formData.applyInterest && (
										<>
											<div className="sm:col-span-2 p-3 bg-purple-50 border border-purple-200 rounded-lg">
												<p className="text-sm text-purple-800 font-semibold mb-2">
													📊 Interest Calculator
												</p>
												<p className="text-xs text-purple-700">
													Formula: (Principal × Rate × Time) / 100
												</p>
											</div>

											<Input
												label="Interest Rate (%)"
												name="interestRate"
												type="number"
												step="0.01"
												min="0.01"
												value={formData.interestRate}
												onChange={handleChange}
												error={errors.interestRate}
												placeholder="e.g., 12 for 12%"
											/>

											<Input
												label="Interest Duration"
												name="interestDuration"
												type="number"
												step="0.01"
												min="0.01"
												value={formData.interestDuration}
												onChange={handleChange}
												error={errors.interestDuration}
												placeholder="e.g., 6"
											/>

											<Select
												label="Time Unit"
												name="interestTimeUnit"
												value={formData.interestTimeUnit}
												onChange={handleChange}
												options={timeUnitOptions}
											/>



											{calculatedInterest > 0 && formData.amount && (
												<div className="sm:col-span-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
													<div className="grid grid-cols-4 gap-2">
														<div>
															<p className="text-xs text-gray-600">Principal</p>
															<p className="font-semibold text-indigo-700">
																₹{parseFloat(formData.amount).toFixed(2)-parseFloat(formData.initialPayment).toFixed(2)}
															</p>
														</div>
														<div>
															<p className="text-xs text-gray-600">Interest</p>
															<p className="font-semibold text-orange-600">
																₹{calculatedInterest.toFixed(2)}
															</p>
														</div>
														<div>
															<p className="text-xs text-gray-600">Total Amount</p>
															<p className="font-semibold text-green-600">
																₹{getTotalWithInterest().toFixed(2)}
															</p>
														</div>
														<div>
															<p className="text-xs text-gray-600">Rate & Time</p>
															<p className="font-semibold text-blue-600">
																{formData.interestRate}% / {formData.interestDuration} {formData.interestTimeUnit}
															</p>
														</div>
													</div>
												</div>
											)}
										</>
									)}
								</>
							)}

							
							{formData.type === "purchase" && formData.amount && !formData.applyInterest && (
								<div className="sm:col-span-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
									<p className="text-sm text-blue-800 mb-2">
										<span className="font-semibold">
											Payment Summary:
										</span>
									</p>
									<div className="grid grid-cols-4 gap-2">
										<div>
											<p className="text-xs text-gray-600">
												Base Purchase
											</p>
											<p className="font-semibold text-blue-700">
												₹{parseFloat(formData.amount).toFixed(2)}
											</p>
										</div>
										<div>
											<p className="text-xs text-gray-600">
												Interest
											</p>
											<p className="font-semibold text-orange-600">
												₹{calculatedInterest.toFixed(2)}
											</p>
										</div>
										<div>
											<p className="text-xs text-gray-600">
												Initial Payment
											</p>
											<p className="font-semibold text-green-700">
												₹
												{formData.initialPayment
													? parseFloat(formData.initialPayment).toFixed(2)
													: "0.00"}
											</p>
										</div>
										<div>
											<p className="text-xs text-gray-600">
												Outstanding
											</p>
											<p className="font-semibold text-red-700">
												₹
												{(
													getTotalWithInterest() -
													(formData.initialPayment
														? parseFloat(formData.initialPayment)
														: 0)
												).toFixed(2)}
											</p>
										</div>
									</div>
								</div>
							)}

							<Input
								label={t("description")}
								name="description"
								value={formData.description}
								onChange={handleChange}
								placeholder={
									formData.type === "purchase"
										? "E.g., Bulk order"
										: "E.g., Partial payment"
								}
							/>
							<Input
								label={t("notes")}
								name="notes"
								value={formData.notes}
								onChange={handleChange}
								className="sm:col-span-2"
							/>
							<Checkbox
								name="sendSMS"
								checked={formData.sendSMS}
								onChange={handleChange}
								label={t("sendSMSNotification")}
								className="sm:col-span-2"
							/>
							<div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:col-span-2">
								<Button
									type="submit"
									variant="primary"
									className="w-full sm:flex-1"
								>
									{editingId ? t("update") : t("add")}
								</Button>
								<Button
									type="button"
									variant="outline"
									className="w-full sm:flex-1"
									onClick={resetForm}
								>
									{t("cancel")}
								</Button>
							</div>
						</form>
					</Card>
				)}

				{loading ? (
					<p className="text-gray-500 text-center py-8 text-sm sm:text-base">
						{t("loading")}
					</p>
				) : (
					<Card>
						<Table
							headers={[
								t("customers"),
								t("transactionType"),
								t("amount"),
								t("Initial_amount"),
								t("Interest"),
								t("balance"),
								"Date",
								
							]}
							data={tableData}
							actions={(row) => (
								<div className="flex flex-wrap gap-1 sm:gap-2">
									<button
										onClick={() =>
											handleEdit(
												transactions.find(
													(t) =>
														t._id ===
														row.transactionId
												)
											)
										}
										className="text-blue-600 hover:text-blue-800 transition p-1"
										title={t("edit")}
									>
										<Edit2
											size={16}
											className="sm:w-[18px] sm:h-[18px]"
										/>
									</button>
									<button
										onClick={() =>
											handleDelete(row.transactionId)
										}
										className="text-blue-600 hover:text-blue-800 transition p-1"
										title={t("edit")}
									>
										<Delete
											size={16}
											className="sm:w-[18px] sm:h-[18px]"
										/>
									</button>
								</div>
							)}
						/>
					</Card>
				)}
			</div>
		</>
	);
};

export default Transactions;