import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import axios from "axios";

/* =====================================================
   AXIOS INSTANCE
===================================================== */

const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

/* =====================================================
   REFRESH TOKEN QUEUE LOGIC
===================================================== */

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(promise => {
    error ? promise.reject(error) : promise.resolve(token);
  });
  failedQueue = [];
};

/* =====================================================
   AUTH CONTEXT
===================================================== */

const AuthContext = createContext(null);

/* =====================================================
   AUTH PROVIDER
===================================================== */

export const AuthProvider = ({ children }) => {
  const [seller, setSeller] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("accessToken"));
  const [refreshToken, setRefreshToken] = useState(
    localStorage.getItem("refreshToken")
  );
  const [loading, setLoading] = useState(true);

  /* =====================================================
     LOGOUT (USED EVERYWHERE)
  ===================================================== */

  const logout = () => {
    setSeller(null);
    setToken(null);
    setRefreshToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    window.location.href = "/login";
  };

  /* =====================================================
     AXIOS INTERCEPTORS (REGISTER ONCE)
  ===================================================== */

  useEffect(() => {
    // REQUEST INTERCEPTOR
    const requestInterceptor = api.interceptors.request.use(
      config => {
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      error => Promise.reject(error)
    );

    // RESPONSE INTERCEPTOR
    const responseInterceptor = api.interceptors.response.use(
      response => response,
      async error => {
        const originalRequest = error.config;

        if (
          error.response?.status === 401 &&
          !originalRequest._retry
        ) {
          if (!refreshToken) {
            logout();
            return Promise.reject(error);
          }

          // If refresh already in progress → queue request
          if (isRefreshing) {
            return new Promise((resolve, reject) => {
              failedQueue.push({ resolve, reject });
            }).then(newToken => {
              originalRequest.headers.Authorization =
                `Bearer ${newToken}`;
              return api(originalRequest);
            });
          }

          originalRequest._retry = true;
          isRefreshing = true;

          try {
            const { data } = await api.post("/auth/refresh", {
              refreshToken,
            });

            const newAccessToken = data.accessToken;

            setToken(newAccessToken);
            localStorage.setItem("accessToken", newAccessToken);

            processQueue(null, newAccessToken);

            originalRequest.headers.Authorization =
              `Bearer ${newAccessToken}`;

            return api(originalRequest);
          } catch (err) {
            processQueue(err, null);
            logout();
            return Promise.reject(err);
          } finally {
            isRefreshing = false;
          }
        }

        return Promise.reject(error);
      }
    );

    // CLEANUP
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [token, refreshToken]);

  /* =====================================================
     FETCH SELLER (ON PAGE REFRESH)
  ===================================================== */

  useEffect(() => {
    const fetchSeller = async () => {
      try {
        const { data } = await api.get("/auth/seller");
        setSeller(data.seller);
      } catch (err) {
        logout();
      } finally {
        setLoading(false);
      }
    };

    token ? fetchSeller() : setLoading(false);
  }, [token]);

  /* =====================================================
     LOGIN
  ===================================================== */

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", {
      email,
      password,
    });

    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setSeller(data.seller);

    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    return data;
  };

  /* =====================================================
     REGISTER
  ===================================================== */

  const register = async payload => {
    const { data } = await api.post("/auth/register", payload);

    setToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setSeller(data.seller);

    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);

    return data;
  };

  /* =====================================================
     CONTEXT PROVIDER
  ===================================================== */

  return (
    <AuthContext.Provider
      value={{
        seller,
        token,
        loading,
        login,
        register,
        logout,
        api, // expose api if needed
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* =====================================================
   USE AUTH HOOK
===================================================== */

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
