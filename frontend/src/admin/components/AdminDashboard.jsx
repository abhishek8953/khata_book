import React, { useState, useEffect } from "react";
import {
	Users,
	ShoppingBag,
	CreditCard,
	TrendingUp,
	Search,
	LogOut,
	Menu,
	X,
	Settings,
	Copyright,
	UserCircle,
	SearchX,
} from "lucide-react";
import { adminApi } from "../utils/adminApi";
import { useNavigate } from "react-router-dom";
import AdminLicenses from "./AdminLicense";
import AdminGenerateLicense from "./AdminGenerateLicense";

const AdminDashboard = () => {
	const [stats, setStats] = useState(null);
	const [activeTab, setActiveTab] = useState("dashboard");
	const [sidebarOpen, setSidebarOpen] = useState(false);
	const [sellers, setSellers] = useState([]);
	const [customers, setCustomers] = useState([]);
	const [products, setProducts] = useState([]);
	const [transactions, setTransactions] = useState([]);
	const [searchTerm, setSearchTerm] = useState("");
	const [loading, setLoading] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [generate, setGenerate] = useState(false);

	// Simulated API calls - replace with actual API calls
	useEffect(() => {
		fetchDashboardData();
	}, []);

	const navigate = useNavigate();
	useEffect(() => {
		if (activeTab === "sellers") fetchSellers();
		if (activeTab === "customers") fetchCustomers();
		if (activeTab === "products") fetchProducts();
		if (activeTab === "transactions") fetchTransactions();
		if (activeTab === "license") fetchLicense();
	}, [activeTab, currentPage, searchTerm]);

	const fetchDashboardData = async () => {
		// Replace with actual API call
		try {
			const response = await adminApi.getDashboardStats();
			console.log(response.data.stats);
			setStats(response.data.stats);
		} catch (error) {
			console.error("Error fetching dashboard data:", error);
		}
		// setStats({
		//   totalSellers: 150,
		//   totalCustomers: 1250,
		//   totalProducts: 450,
		//   totalTransactions: 3200,
		//   activeSellers: 142,
		//   activeCustomers: 1180,
		//   totalOutstanding: 45000,
		// });
	};

	const fetchSellers = async () => {
		setLoading(true);
		try {
			const response = await adminApi.getSellers({
				page: currentPage,
				limit: 10,
				search: searchTerm,
			});

			console.log(response.data);
			setSellers(response.data.sellers);
			setTotalPages(response.data.totalPages);
		} catch (error) {
			console.error("Error fetching sellers:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleLogout = () => {
		localStorage.removeItem("adminToken");
		localStorage.removeItem('adminUser');

		navigate("/admin/login");
	};

	const fetchCustomers = async () => {
		setLoading(true);
		try {
			const res = await adminApi.getCustomers({
				page: currentPage,
				limit: 10,
				search: searchTerm,
			});
			console.log(res.data);
			setCustomers(res.data.customers);
		} catch (error) {
			console.log("errpr", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchProducts = async () => {
		setLoading(true);
		try {
			const res = await adminApi.getProducts();
			setProducts(res.data.products);
		} catch (error) {
			console.log("error", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchTransactions = async () => {
		setLoading(true);
		try {
			const res = await adminApi.getTransactions();
			setTransactions(res.data.transactions);
		} catch (error) {
			console.log("error", error);
		} finally {
			setLoading(false);
		}
	};

	const fetchLicense = () => {
		//TODO::
		console.log("licence");
	};

	const StatCard = ({ title, value, icon: Icon, color }) => (
		<div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-gray-500 text-sm font-medium">{title}</p>
					<p className="text-2xl font-bold mt-2">{value}</p>
				</div>
				<div className={`p-3 rounded-full ${color}`}>
					<Icon className="w-6 h-6 text-white" />
				</div>
			</div>
		</div>
	);

	const Sidebar = () => (
		<div
			className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-900 text-white transform ${
				sidebarOpen ? "translate-x-0" : "-translate-x-full"
			} lg:translate-x-0 transition-transform duration-300 ease-in-out`}
		>
			<div className="flex items-center justify-between p-4 border-b border-gray-800">
				<h1 className="text-xl font-bold">Admin Panel</h1>
				<button
					onClick={() => setSidebarOpen(false)}
					className="lg:hidden"
				>
					<X className="w-6 h-6" />
				</button>
			</div>
			<nav className="mt-6">
				{[
					{ id: "dashboard", label: "Dashboard", icon: TrendingUp },
					{ id: "sellers", label: "Sellers", icon: Users },
					{ id: "customers", label: "Customers", icon: UserCircle },
					{ id: "products", label: "Products", icon: ShoppingBag },
					{
						id: "transactions",
						label: "Transactions",
						icon: CreditCard,
					},
					{ id: "settings", label: "Settings", icon: Settings },
					{ id: "license", label: "License", icon: Copyright },
				].map((item) => (
					<button
						key={item.id}
						onClick={() => {
							setActiveTab(item.id);
							setSidebarOpen(false);
							setCurrentPage(1);
						}}
						className={`w-full flex items-center px-6 py-3 hover:bg-gray-800 transition-colors ${
							activeTab === item.id
								? "bg-gray-800 border-l-4 border-blue-500"
								: ""
						}`}
					>
						<item.icon className="w-5 h-5 mr-3" />
						<span>{item.label}</span>
					</button>
				))}
			</nav>
			<div className="absolute bottom-0 w-full p-4 border-t border-gray-800">
				<button
					onClick={() => {
						handleLogout();
					}}
					className="w-full flex items-center px-4 py-2 hover:bg-gray-800 rounded transition-colors"
				>
					<LogOut className="w-5 h-5 mr-3" />
					<span>Logout</span>
				</button>
			</div>
		</div>
	);

	const DashboardView = () => (
		<div className="space-y-6">
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
				<StatCard
					title="Total Sellers"
					value={stats?.totalSellers || 0}
					icon={Users}
					color="bg-blue-500"
				/>
				<StatCard
					title="Total Customers"
					value={stats?.totalCustomers || 0}
					icon={UserCircle}
					color="bg-green-500"
				/>
				<StatCard
					title="Total Products"
					value={stats?.totalProducts || 0}
					icon={ShoppingBag}
					color="bg-purple-500"
				/>
				<StatCard
					title="Total Transactions"
					value={stats?.totalTransactions || 0}
					icon={CreditCard}
					color="bg-orange-500"
				/>
			</div>
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<StatCard
					title="Active Sellers"
					value={stats?.activeSellers || 0}
					icon={Users}
					color="bg-teal-500"
				/>
				<StatCard
					title="Active Customers"
					value={stats?.activeCustomers || 0}
					icon={UserCircle}
					color="bg-indigo-500"
				/>
				<StatCard
					title="Outstanding Balance"
					value={`₹${stats?.totalOutstanding || 0}`}
					icon={TrendingUp}
					color="bg-red-500"
				/>
			</div>
		</div>
	);

	const TableView = ({ data, columns, type }) => (
		<div className="bg-white rounded-lg shadow overflow-hidden">
			<div className="p-4 border-b">
				<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
					{/* <h2 className="text-xl font-bold capitalize">{type}</h2>
					<div className="relative w-full sm:w-64">
						<Search className="absolute pointer-events-none left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
						<input
							type="text"
							placeholder={`Search ${type}...`}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div> */}
				</div>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full">
					<thead className="bg-gray-50">
						<tr>
							{columns.map((col) => (
								<th
									key={col.key}
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
								>
									{col.label}
								</th>
							))}
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								Actions
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{loading ? (
							<tr>
								<td
									colSpan={columns.length + 1}
									className="px-6 py-4 text-center text-gray-500"
								>
									Loading...
								</td>
							</tr>
						) : data.length === 0 ? (
							<tr>
								<td
									colSpan={columns.length + 1}
									className="px-6 py-4 text-center text-gray-500"
								>
									No data found
								</td>
							</tr>
						) : (
							data.map((item) => (
								<tr key={item._id} className="hover:bg-gray-50">
									{columns.map((col) => (
										<td
											key={col.key}
											className="px-6 py-4 whitespace-nowrap text-sm"
										>
											{col.render
												? col.render(item)
												: item[col.key]}
										</td>
									))}
									{/* <td className="px-6 py-4 whitespace-nowrap text-sm">
										<button className="text-blue-600 hover:text-blue-900 mr-3">
											View
										</button>
										<button className="text-red-600 hover:text-red-900">
											Delete
										</button>
									</td> */}
								</tr>
							))
						)}
					</tbody>
				</table>
			</div>
			{totalPages > 1 && (
				<div className="px-6 py-4 border-t flex items-center justify-between">
					<button
						onClick={() =>
							setCurrentPage((p) => Math.max(1, p - 1))
						}
						disabled={currentPage === 1}
						className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Previous
					</button>
					<span className="text-sm text-gray-700">
						Page {currentPage} of {totalPages}
					</span>
					<button
						onClick={() =>
							setCurrentPage((p) => Math.min(totalPages, p + 1))
						}
						disabled={currentPage === totalPages}
						className="px-4 py-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
					>
						Next
					</button>
				</div>
			)}
		</div>
	);

	return (
		<div className="flex h-screen bg-gray-100">
			<Sidebar />
			<div className="flex-1 overflow-auto">
				<header className="bg-white shadow-sm">
					<div className="flex items-center justify-between px-6 py-4">
						<button
							onClick={() => setSidebarOpen(true)}
							className="lg:hidden"
						>
							<Menu className="w-6 h-6" />
						</button>
						<h2 className="text-2xl font-bold">
							{activeTab.charAt(0).toUpperCase() +
								activeTab.slice(1)}
						</h2>
						<div className="flex items-center space-x-4">
							<span className="text-sm text-gray-600">
								Admin User
							</span>
						</div>
					</div>
				</header>
				<main className="p-6">
					{activeTab === "dashboard" && <DashboardView />}
					{activeTab === "sellers" && (
						<TableView
							data={sellers}
							type="sellers"
							columns={[
								{ key: "name", label: "Name" },
								{ key: "email", label: "Email" },
								{ key: "businessName", label: "Business" },
								{ key: "phone", label: "Phone" },
								{ key: "createdAt", label: "Joined" },
							]}
						/>
					)}
					{activeTab === "customers" && (
						<TableView
							data={customers}
							type="customers"
							columns={[
								{ key: "name", label: "Name" },
								{ key: "phone", label: "Phone" },
								{
									key: "sellerId",
									label: "Seller",
									render: (item) =>
										item.sellerId?.businessName,
								},
								{
									key: "outstandingBalance",
									label: "Balance",
									render: (item) =>
										`₹${item.outstandingBalance}`,
								},
							]}
						/>
					)}
					{activeTab === "products" && (
						<TableView
							data={products}
							type="products"
							columns={[
								{ key: "name", label: "Product Name" },
								{ key: "unit", label: "Unit" },
								{
									key: "sellerId",
									label: "Seller",
									render: (item) =>
										item.sellerId?.businessName,
								},
								{
									key: "isActive",
									label: "Status",
									render: (item) => (
										<span
											className={`px-2 py-1 rounded text-xs ${
												item.isActive
													? "bg-green-100 text-green-800"
													: "bg-red-100 text-red-800"
											}`}
										>
											{item.isActive
												? "Active"
												: "Inactive"}
										</span>
									),
								},
							]}
						/>
					)}
					{activeTab === "transactions" && (
						<TableView
							data={transactions}
							type="transactions"
							columns={[
								{
									key: "type",
									label: "Type",
									render: (item) => (
										<span
											className={`px-2 py-1 rounded text-xs ${
												item.type === "purchase"
													? "bg-blue-100 text-blue-800"
													: "bg-green-100 text-green-800"
											}`}
										>
											{item.type}
										</span>
									),
								},
								{
									key: "amount",
									label: "Amount",
									render: (item) => `₹${item.amount}`,
								},
								{ key: "date", label: "Date" },
								{
									key: "sellerId",
									label: "Seller",
									render: (item) =>
										item.sellerId?.businessName,
								},
								{
									key: "customerId",
									label: "Customer",
									render: (item) => item.customerId?.name,
								},
							]}
						/>
					)}
					{activeTab === "settings" && (
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-bold mb-4">Settings</h3>
							<p className="text-gray-600">
								Admin settings and configurations will be
								displayed here.
							</p>
						</div>
					)}
					{activeTab === "license" && (
						<div className="bg-white rounded-lg shadow p-6">
							<h3 className="text-lg font-bold mb-4">License</h3>
							<p className="text-gray-600">
								<button
									className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-lg
               hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300
               transition disabled:opacity-50"
									onClick={() => setGenerate((prev) => !prev)}
								>
									{generate ? "generate":"back"}
								</button>
							</p>
							{generate && <AdminGenerateLicense />}
							   { !generate &&<AdminLicenses />}
						</div>
					)}
				</main>
			</div>
			{sidebarOpen && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
					onClick={() => setSidebarOpen(false)}
				/>
			)}
		</div>
	);
};

export default AdminDashboard;
