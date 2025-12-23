import axios from 'axios';

const API_BASE = '/api/admin';

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken')}`,
});

export const adminApi = {
  // Dashboard
  getDashboardStats: () => 
    axios.get(`${API_BASE}/dashboard/stats`, { headers: getAuthHeader() }),

  // Sellers
  getSellers: (params) => 
    axios.get(`${API_BASE}/sellers`, { params, headers: getAuthHeader() }),
  getSeller: (id) => 
    axios.get(`${API_BASE}/sellers/${id}`, { headers: getAuthHeader() }),
  updateSeller: (id, data) => 
    axios.put(`${API_BASE}/sellers/${id}`, data, { headers: getAuthHeader() }),
  deleteSeller: (id) => 
    axios.delete(`${API_BASE}/sellers/${id}`, { headers: getAuthHeader() }),

  // Customers
  getCustomers: (params) => 
    axios.get(`${API_BASE}/customers`, { params, headers: getAuthHeader() }),
  deleteCustomer: (id) => 
    axios.delete(`${API_BASE}/customers/${id}`, { headers: getAuthHeader() }),

  // Products
  getProducts: (params) => 
    axios.get(`${API_BASE}/products`, { params, headers: getAuthHeader() }),

  // Transactions
  getTransactions: (params) => 
    axios.get(`${API_BASE}/transactions`, { params, headers: getAuthHeader() }),

  // Admins
  getAdmins: () => 
    axios.get(`${API_BASE}/admins`, { headers: getAuthHeader() }),
  createAdmin: (data) => 
    axios.post(`${API_BASE}/admins`, data, { headers: getAuthHeader() }),
  updateAdmin: (id, data) => 
    axios.put(`${API_BASE}/admins/${id}`, data, { headers: getAuthHeader() }),
  deleteAdmin: (id) => 
    axios.delete(`${API_BASE}/admins/${id}`, { headers: getAuthHeader() }),
};