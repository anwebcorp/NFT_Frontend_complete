import axiosInstance from './axiosInstance';
import useAuth from './useAuth';

const useRefreshToken = () => {
    const { auth, setAuth } = useAuth();

    const refresh = async () => {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token available');
        const response = await axiosInstance.post('token/refresh/', { refresh: refreshToken });
        const { access } = response.data;
        if (access) {
            setAuth(prev => ({ ...prev, accessToken: access }));
            localStorage.setItem('access_token', access);
            return access;
        } else {
            throw new Error('No access token in refresh response');
        }
    };

    return refresh;
};

export default useRefreshToken;