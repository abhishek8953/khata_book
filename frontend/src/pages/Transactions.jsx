import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Edit2, Trash2, Search, Delete } from "lucide-react";
import Navbar from "../components/Navbar";
import { Card, Table } from "../components/Layout";
import Alert from "../components/Alert";
import { Button, Input, Select, Checkbox } from "../components/FormElements";
import { transactionAPI, customerAPI, productAPI } from "../utils/api";

//your name is abhishek tiwari;

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
		interestTimeUnit: "months",
	});

	const [selectedCustomerBalance, setSelectedCustomerBalance] =
		useState(null);
	const [calculatedInterest, setCalculatedInterest] = useState(0);
	const [addedProducts, setAddedProducts] = useState([]);
	const [tempProductForm, setTempProductForm] = useState({
		productId: "",
		quantity: "",
		pricePerUnit: "",
	});
	const [productSearch, setProductSearch] = useState("");
	const [searchDebounceTimer, setSearchDebounceTimer] = useState(null);
	const [filteredProducts, setFilteredProducts] = useState([]);
	const [customerSearch, setCustomerSearch] = useState("");
	const [customerDebounceTimer, setCustomerDebounceTimer] = useState(null);
	const [filteredCustomers, setFilteredCustomers] = useState([]);

	const transactionTypes = [
		{ value: "purchase", label: t("purchase") },
		{ value: "payment", label: t("payment") },
	];

	const timeUnitOptions = [
		{ value: "days", label: "Days" },
		{ value: "months", label: "Months" },
		{ value: "years", label: "Years" },
	];

	useEffect(() => {
		fetchInitialData();
	}, []);

	useEffect(() => {
		calculateAmount();
	}, [formData.pricePerUnit, formData.quantity, addedProducts]);

	// Initialize filtered products on component mount or when products change
	useEffect(() => {
		setFilteredProducts(products);
	}, [products]);

	// Initialize filtered customers on component mount or when customers change
	useEffect(() => {
		setFilteredCustomers(customers);
	}, [customers]);

	// Debounced product search
	useEffect(() => {
		if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

		const timer = setTimeout(() => {
			if (productSearch.trim() === "") {
				setFilteredProducts(products);
			} else {
				const query = productSearch.toLowerCase();
				const filtered = products.filter((product) =>
					product.name.toLowerCase().includes(query) ||
					product._id.toLowerCase().includes(query)
				);
				setFilteredProducts(filtered);
			}
		}, 500); // 300ms debounce

		setSearchDebounceTimer(timer);

		return () => clearTimeout(timer);
	}, [productSearch, products]);

	// Debounced customer search
	useEffect(() => {
		if (customerDebounceTimer) clearTimeout(customerDebounceTimer);

		const timer = setTimeout(() => {
			if (customerSearch.trim() === "") {
				setFilteredCustomers(customers);
			} else {
				const query = customerSearch.toLowerCase();
				const filtered = customers.filter((customer) =>
					customer.name.toLowerCase().includes(query) ||
					customer.phone.includes(customerSearch) ||
					customer._id.toLowerCase().includes(query)
				);
				setFilteredCustomers(filtered);
			}
		}, 500); // 500ms debounce

		setCustomerDebounceTimer(timer);

		return () => clearTimeout(timer);
	}, [customerSearch, customers]);

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
		formData.type,
	]);

	const fetchInitialData = async () => {
		try {
			const [transRes, custRes, prodRes] = await Promise.all([
				transactionAPI.getTransactions(),
				customerAPI.getCustomers({ isActive: "true" }),
				productAPI.getProducts({ isActive: "true" }),
			]);

			console.log("trans", transRes, custRes, prodRes);
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
		const principal =
			parseFloat(formData.amount) - parseFloat(formData.initialPayment);
		const rate = parseFloat(formData.interestRate);
		const time = parseFloat(formData.interestDuration);

		if (
			!principal ||
			!rate ||
			!time ||
			principal <= 0 ||
			rate <= 0 ||
			time <= 0
		) {
			setCalculatedInterest(0);
			return;
		}

		let timeInYears = 0;
		switch (formData.interestTimeUnit) {
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
				timeInYears = time / 12;
		}

		const interest = (principal * rate * timeInYears) / 100;
		setCalculatedInterest(parseFloat(interest.toFixed(2)));
	};

	const handleChange = (e) => {
		const { name, value, type, checked } = e.target;
		const newValue = type === "checkbox" ? checked : value;

		setFormData((prev) => ({ ...prev, [name]: newValue }));
		if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

		// Reset interest when switching to payment
		if (name === "type" && value === "payment") {
			setFormData((prev) => ({
				...prev,
				applyInterest: false,
				interestRate: "",
				interestDuration: "",
				interestTimeUnit: "months",
			}));
			setCalculatedInterest(0);
		}

		// Update selected customer balance when customer changes
		if (name === "customerId") {
			const customer = customers.find((c) => c._id === value);
			console.log("cust", customer);
			setSelectedCustomerBalance(
				customer
					? {
							outstanding:
								customer.outstandingBalance +
									customer.totalInterest || 0,
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
			if (
				!formData.interestRate ||
				parseFloat(formData.interestRate) <= 0
			) {
				newErrors.interestRate = "Interest rate must be greater than 0";
			}
			if (
				!formData.interestDuration ||
				parseFloat(formData.interestDuration) <= 0
			) {
				newErrors.interestDuration = "Duration must be greater than 0";
			}
		}

		// Validate initial payment for purchase transactions
		if (formData.type === "purchase" && formData.initialPayment) {
			const initialPayment = parseFloat(formData.initialPayment);
			const totalAmount =
				parseFloat(formData.amount) + calculatedInterest;

			if (initialPayment < 0) {
				newErrors.initialPayment = "Initial payment cannot be negative";
			} else if (initialPayment > totalAmount) {
				newErrors.initialPayment = `Initial payment cannot exceed total amount (₹${totalAmount.toFixed(
					2
				)})`;
			}
		}

		// Check for overpayment on payment transactions
		if (formData.type === "payment" && selectedCustomerBalance) {
			const paymentAmount = parseFloat(formData.amount);

			const outstandingAmount = selectedCustomerBalance.outstanding;
			console.log("trdddd", outstandingAmount, paymentAmount);

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
		} else if (addedProducts.length > 0) {
			// Calculate total from added products
			const total = addedProducts.reduce((sum, product) => {
				return sum + product.total;
			}, 0);
			setFormData((prev) => ({ ...prev, amount: total.toFixed(2) }));
		}
	};

	const addProduct = () => {
		if (
			!tempProductForm.productId ||
			!tempProductForm.quantity ||
			!tempProductForm.pricePerUnit
		) {
			setAlert({
				type: "error",
				message: "Please fill all product fields",
			});
			return;
		}

		const productTotal =
			parseFloat(tempProductForm.quantity) *
			parseFloat(tempProductForm.pricePerUnit);

		const productName = products.find(
			(p) => p._id === tempProductForm.productId
		)?.name;

		const newProduct = {
			id: Date.now(),
			productId: tempProductForm.productId,
			productName: productName,
			quantity: parseFloat(tempProductForm.quantity),
			pricePerUnit: parseFloat(tempProductForm.pricePerUnit),
			total: parseFloat(productTotal.toFixed(2)),
		};

		setAddedProducts([...addedProducts, newProduct]);
		setTempProductForm({ productId: "", quantity: "", pricePerUnit: "" });
	};

	const removeProduct = (id) => {
		setAddedProducts(addedProducts.filter((product) => product.id !== id));
	};

	const getTotalProductsAmount = () => {
		return addedProducts.reduce((sum, product) => sum + product.total, 0);
	};

	const handleProductSearch = (e) => {
		setProductSearch(e.target.value);
	};

	const handleCustomerSearch = (e) => {
		setCustomerSearch(e.target.value);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;

		const tempProductId = addedProducts.map((p) => ({
			product: p.productId, // This is the productId from frontend
			name: p.productName,
			quantity: p.quantity,
			pricePerUnit: p.pricePerUnit,
			totalPrice: p.total,
		}));

		console.log("tempProductId", tempProductId);
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
				productId: tempProductId || undefined,
				description: formData.description,
				notes: formData.notes,
				initialPayment:
					formData.type === "purchase" && formData.initialPayment
						? parseFloat(formData.initialPayment)
						: undefined,
				sendSMS: formData.sendSMS,
				// Interest fields
				applyInterest:
					formData.type === "purchase" && formData.applyInterest,
				interestRate:
					formData.applyInterest && formData.interestRate
						? parseFloat(formData.interestRate)
						: undefined,
				interestDuration:
					formData.applyInterest && formData.interestDuration
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
			interestTimeUnit: "months",
		});
		setAddedProducts([]);
		setTempProductForm({
			productId: "",
			quantity: "",
			pricePerUnit: "",
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
			interestTimeUnit: "months",
		});
		setSelectedCustomerBalance(null);
		setShowProductDetails(false);
		setCalculatedInterest(0);
		setAddedProducts([]);
		setTempProductForm({
			productId: "",
			quantity: "",
			pricePerUnit: "",
		});
		setProductSearch("");
		setFilteredProducts(products);
		setCustomerSearch("");
		setFilteredCustomers(customers);
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
		interest: t.interest
			? `₹${parseFloat(t.interest).toFixed(2)}`
			: "₹0.00",
		balance: `₹${
			parseFloat(t.balanceAfterTransaction).toFixed(2) > 0
				? parseFloat(t.balanceAfterTransaction).toFixed(2)
				: 0
		}`,
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
							{/* Customer Search Input */}
							<div className="sm:col-span-2">
								<label className="block text-xs font-medium text-gray-600 mb-2">
									🔍 Search Customer by Name, Phone or ID
								</label>
								<input
									type="text"
									placeholder="Type customer name, phone or ID..."
									value={customerSearch}
									onChange={handleCustomerSearch}
									className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
								/>
								{customerSearch && (
									<p className="text-xs text-gray-500 mt-1">
										Found {filteredCustomers.length} customer(s)
									</p>
								)}
							</div>

							<Select
								label={t("selectCustomer")}
								name="customerId"
								value={formData.customerId}
								onChange={handleChange}
								error={errors.customerId}
								options={filteredCustomers.map((c) => ({
									value: c._id,
									label: `${c.name} (${c.phone})`,
								}))}
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
											? `0 to ₹${getTotalWithInterest().toFixed(
													2
											  )}`
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
										<div className="sm:col-span-2 p-4 bg-gray-50 border border-gray-200 rounded-lg">
											<h3 className="text-sm font-semibold text-gray-700 mb-4">
												Add Products
											</h3>

											{/* Product Search Input */}
											<div className="mb-3">
												<label className="block text-xs font-medium text-gray-600 mb-2">
													🔍 Search Product by Name or ID
												</label>
												<input
													type="text"
													placeholder="Type product name or ID..."
													value={productSearch}
													onChange={handleProductSearch}
													className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
												/>
												{productSearch && (
													<p className="text-xs text-gray-500 mt-1">
														Found {filteredProducts.length} product(s)
													</p>
												)}
											</div>

											<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
												<Select
													label={t("selectProduct")}
													name="productId"
													value={
														tempProductForm.productId
													}
													onChange={(e) =>
														setTempProductForm(
															(prev) => ({
																...prev,
																productId:
																	e.target
																		.value,
															})
														)
													}
													options={filteredProducts.map(
														(p) => ({
															value: p._id,
															label: `${p.name} (${p.unit})`,
														})
													)}
												/>
												<Input
													label={t("quantity")}
													name="quantity"
													type="number"
													step="0.01"
													min="0.01"
													value={
														tempProductForm.quantity
													}
													onChange={(e) =>
														setTempProductForm(
															(prev) => ({
																...prev,
																quantity:
																	e.target
																		.value,
															})
														)
													}
												/>
												<Input
													label={t("pricePerUnit")}
													name="pricePerUnit"
													type="number"
													step="0.01"
													min="0.01"
													value={
														tempProductForm.pricePerUnit
													}
													onChange={(e) =>
														setTempProductForm(
															(prev) => ({
																...prev,
																pricePerUnit:
																	e.target
																		.value,
															})
														)
													}
												/>
											</div>
											<Button
												type="button"
												variant="primary"
												onClick={addProduct}
												className="w-full"
											>
												<Plus size={16} />
												Add Product
											</Button>

											{addedProducts.length > 0 && (
												<div className="mt-4">
													<h4 className="text-sm font-semibold text-gray-700 mb-3">
														Added Products (
														{addedProducts.length})
													</h4>
													<div className="space-y-2">
														{addedProducts.map(
															(product) => (
																<div
																	key={
																		product.id
																	}
																	className="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200"
																>
																	<div className="flex-1">
																		<p className="text-sm font-medium text-gray-800">
																			{
																				product.productName
																			}
																		</p>
																		<p className="text-xs text-gray-600">
																			{product.quantity.toFixed(
																				2
																			)}{" "}
																			× ₹
																			{product.pricePerUnit.toFixed(
																				2
																			)}{" "}
																			={" "}
																			<span className="font-semibold text-green-600">
																				₹
																				{product.total.toFixed(
																					2
																				)}
																			</span>
																		</p>
																	</div>
																	<button
																		type="button"
																		onClick={() =>
																			removeProduct(
																				product.id
																			)
																		}
																		className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
																		title="Remove product"
																	>
																		<Trash2
																			size={
																				16
																			}
																		/>
																	</button>
																</div>
															)
														)}
													</div>

													{addedProducts.length >
														0 && (
														<div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
															<div className="flex justify-between items-center">
																<span className="text-sm font-semibold text-blue-800">
																	Total
																	Products
																	Amount:
																</span>
																<span className="text-lg font-bold text-blue-600">
																	₹
																	{getTotalProductsAmount().toFixed(
																		2
																	)}
																</span>
															</div>
														</div>
													)}
												</div>
											)}
										</div>
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
													Formula: (Principal × Rate ×
													Time) / 100
												</p>
											</div>

											<Input
												label={t("interestRate")}
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
												label={t("InterestDuration")}
												name="interestDuration"
												type="number"
												step="0.01"
												min="0.01"
												value={
													formData.interestDuration
												}
												onChange={handleChange}
												error={errors.interestDuration}
												placeholder="e.g., 6"
											/>

											<Select
												label={t("timeUnit")}
												name="interestTimeUnit"
												value={
													formData.interestTimeUnit
												}
												onChange={handleChange}
												options={timeUnitOptions}
											/>

											{calculatedInterest > 0 &&
												formData.amount && (
													<div className="sm:col-span-2 p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
														<div className="grid grid-cols-4 gap-2">
															<div>
																<p className="text-xs text-gray-600">
																	Principal
																</p>
																<p className="font-semibold text-indigo-700">
																	₹
																	{parseFloat(
																		formData.amount
																	).toFixed(
																		2
																	) -
																		parseFloat(
																			formData.initialPayment
																		).toFixed(
																			2
																		)}
																</p>
															</div>
															<div>
																<p className="text-xs text-gray-600">
																	Interest
																</p>
																<p className="font-semibold text-orange-600">
																	₹
																	{calculatedInterest.toFixed(
																		2
																	)}
																</p>
															</div>
															<div>
																<p className="text-xs text-gray-600">
																	Total Amount
																</p>
																<p className="font-semibold text-green-600">
																	₹
																	{getTotalWithInterest().toFixed(
																		2
																	)}
																</p>
															</div>
															<div>
																<p className="text-xs text-gray-600">
																	Rate & Time
																</p>
																<p className="font-semibold text-blue-600">
																	{
																		formData.interestRate
																	}
																	% /{" "}
																	{
																		formData.interestDuration
																	}{" "}
																	{
																		formData.interestTimeUnit
																	}
																</p>
															</div>
														</div>
													</div>
												)}
										</>
									)}
								</>
							)}

							{formData.type === "purchase" &&
								formData.amount &&
								!formData.applyInterest && (
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
													₹
													{parseFloat(
														formData.amount
													).toFixed(2)}
												</p>
											</div>
											<div>
												<p className="text-xs text-gray-600">
													Interest
												</p>
												<p className="font-semibold text-orange-600">
													₹
													{calculatedInterest.toFixed(
														2
													)}
												</p>
											</div>
											<div>
												<p className="text-xs text-gray-600">
													Initial Payment
												</p>
												<p className="font-semibold text-green-700">
													₹
													{formData.initialPayment
														? parseFloat(
																formData.initialPayment
														  ).toFixed(2)
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
															? parseFloat(
																	formData.initialPayment
															  )
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
								t("interest"),
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
									{/* <button
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
									</button> */}
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
