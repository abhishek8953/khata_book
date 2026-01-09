import React from "react";
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
	useNavigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import "./i18n";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customers";
import Products from "./pages/Products";
import Transactions from "./pages/Transactions";
import Settings from "./pages/Settings";

import AdminLogin from "./admin/pages/adminLogin";
import AdminDashboard from "./admin/components/AdminDashboard";

// Protected Route Component
const AdminProtectedRoute = ({ children }) => {
	const token = localStorage.getItem("adminToken");
	return token ? children : <Navigate to="/admin/login" />;
};

const ProtectedRoute = ({ children }) => {
	const { token, loading } = useAuth();

	if (loading) {
		return (
			<div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-blue-100">
				<p className="text-gray-500 text-lg">Loading...</p>
			</div>
		);
	}

	return token ? children : <Navigate to="/login" />;
};

const AppRoutes = () => {
	const navigate=useNavigate();
	const { token } = useAuth();
	if(window.location.pathname=='/admin'){
		navigate("/admin/login");
	}


	return (
		<Routes>
			
			{/* Public Routes */}
			<Route
				path="/login"
				element={token ? <Navigate to="/dashboard" /> : <Login />}
			/>
			<Route
				path="/register"
				element={token ? <Navigate to="/dashboard" /> : <Register />}
			/>

			{/* Protected Routes */}
			<Route
				path="/dashboard"
				element={
					<ProtectedRoute>
						<Dashboard />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/customers"
				element={
					<ProtectedRoute>
						<Customers />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/products"
				element={
					<ProtectedRoute>
						<Products />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/transactions"
				element={
					<ProtectedRoute>
						<Transactions />
					</ProtectedRoute>
				}
			/>
			<Route
				path="/settings"
				element={
					<ProtectedRoute>
						<Settings />
					</ProtectedRoute>
				}
			/>
            
			<Route path="/admin/login" element={<AdminLogin />} />
			<Route
				path="/admin/dashboard"
				element={
					<AdminProtectedRoute>
						<AdminDashboard />
					</AdminProtectedRoute>
				}
			/>
			{/* Default Redirect */}
			<Route path="/" element={<Navigate to="/dashboard" />} />
		</Routes>
	);
};

function App() {
	return (
		<Router>
			<AuthProvider>
				<AppRoutes />
			</AuthProvider>
		</Router>
	);
}

export default App;
