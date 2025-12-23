import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

// ============================
// 🔐 REQUEST INTERCEPTOR
// ============================
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ============================
// 🔄 RESPONSE INTERCEPTOR (AUTO REFRESH)
// ============================
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // if token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve,
            reject,
          });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token");

        // call backend to refresh
        const res = await axios.post("/api/auth/refresh", {
          refreshToken,
        });

        const newAccessToken = res.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);

        api.defaults.headers.Authorization = `Bearer ${newAccessToken}`;

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ============================
// 📌 API DEFINITIONS
// ============================

export const authAPI = {
  register: (data) => api.post("/auth/register", data),
  login: (email, password) => api.post("/auth/login", { email, password }),
  getSeller: () => api.get("/auth/seller"),
  updateSeller: (data) => api.put("/auth/seller", data),
};

export const customerAPI = {
  addCustomer: (data) => api.post("/customers", data),
  getCustomers: (params) => api.get("/customers", { params }),
  getCustomer: (id) => api.get(`/customers/${id}`),
  updateCustomer: (id, data) => api.put(`/customers/${id}`, data),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
  getBalance: (id) => api.get(`/customers/${id}/balance`),
};

export const productAPI = {
  addProduct: (data) => api.post("/products", data),
  getProducts: (params) => api.get("/products", { params }),
  getProduct: (id) => api.get(`/products/${id}`),
  updateProduct: (id, data) => api.put(`/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/products/${id}`),
};

export const transactionAPI = {
  addTransaction: (data) => api.post("/transactions", data),
  getTransactions: (params) => api.get("/transactions", { params }),
  getTransaction: (id) => api.get(`/transactions/${id}`),
  updateTransaction: (id, data) => api.put(`/transactions/${id}`, data),
  deleteTransaction: (id) => api.delete(`/transactions/${id}`),
  getDashboardStats: () => api.get("/transactions/stats/dashboard"),
  sendSMS: (customerId) => api.post(`/transactions/${customerId}/send-sms`),
};

export default api;
