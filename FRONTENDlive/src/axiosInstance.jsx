import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: 'https://employeemanagement.company/api/', // Updated API base URL
});

// Request interceptor to attach access token to headers
axiosInstance.interceptors.request.use(
  (config) => {
    // CORRECTED: Changed 'accessToken' to 'access_token'
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh on 401
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;


      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem('access_token');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        const response = await axios.post('https://employeemanagement.company/api/token/refresh/', { refresh: refreshToken });
        const { access } = response.data;
        if (access) {
          // CORRECTED: Use 'access_token' to store the new token
          localStorage.setItem('access_token', access);
          originalRequest.headers['Authorization'] = `Bearer ${access}`;
          return axiosInstance(originalRequest);
        } else {
          throw new Error('No access token in refresh response');
        }
      } catch (refreshError) {
        // Refresh token invalid or expired: clear storage and redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;