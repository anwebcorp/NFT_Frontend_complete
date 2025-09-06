import { useEffect } from "react";
import axios from './axios'; 
import useRefreshToken from "./useRefreshToken";
import useAuth from "./useAuth";

const useAxiosPrivate = () => {
    const refresh = useRefreshToken();
    const { auth } = useAuth();

    useEffect(() => {
        // Intercept requests and attach the Authorization header
        const requestIntercept = axios.interceptors.request.use(
            (config) => {
                if (!config.headers["Authorization"]) {
                    // Check if the user is authenticated and has an access token
                    if (auth?.accessToken) {
                        config.headers["Authorization"] = `Bearer ${auth.accessToken}`;
                    } else {
                        // If no token in context, check localStorage for one
                        const storedToken = localStorage.getItem('access_token');
                        if (storedToken) {
                            config.headers["Authorization"] = `Bearer ${storedToken}`;
                        }
                    }
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Intercept responses to handle 401 Unauthorized errors
        const responseIntercept = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const prevRequest = error?.config;
                // If it's a 401 and not a retry attempt
                if (error?.response?.status === 401 && !prevRequest?._retry) {
                    prevRequest._retry = true;
                    try {
                        const newAccessToken = await refresh(); // Call refresh hook to get new token
                        prevRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
                        return axios(prevRequest); // Retry the original request with new token
                    } catch (refreshError) {
                        // Refresh token failed, clear auth data and redirect to login
                        localStorage.removeItem('access_token');
                        localStorage.removeItem('refreshToken');
                        localStorage.removeItem('user');
                        window.location.href = '/login';
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );

        // Clean up interceptors when the component unmounts
        return () => {
            axios.interceptors.request.eject(requestIntercept);
            axios.interceptors.response.eject(responseIntercept);
        };
    }, [auth, refresh]); // Depend on auth and refresh to re-run if they change

    return axios;
};

export default useAxiosPrivate;