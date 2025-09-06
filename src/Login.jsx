
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "./axiosInstance";
import companyLogo from './assets/logoCompany.jpg';
import useAuth from './useAuth';


export default function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleLogin = async (event) => {
    event.preventDefault();
    setError(null);

    try {
      const response = await axiosInstance.post('login/', { username, password });

      console.log("Full API response:", response.data);

      const { tokens, msg } = response.data;
      let userProfile = null;

      const isUserAdminFromBackend = msg === 'Admin Login Successful';
      // ⭐ FIX: Directly check for 'Supplier Login Successful' message
      const isUserSupplierFromBackend = msg === 'Supplier Login Successful'; 

      if (isUserAdminFromBackend) {
        const userIdFromToken = tokens?.access ? JSON.parse(atob(tokens.access.split('.')[1])).user_id : null;

        if (userIdFromToken) {
          userProfile = {
            id: userIdFromToken,
            username: username,
            isAdmin: true,
            isSupplier: false, // Explicitly set for admin
            isEmployee: false, // Explicitly set for admin
            adminData: response.data.data
          };
        } else {
          setError("Admin login successful, but user ID could not be retrieved from token.");
          console.error("Admin login success, but no user ID in token:", response.data);
          return;
        }
      } else if (response.data.profile) {
        // This path is for Employee or Supplier
        userProfile = { ...response.data.profile, isAdmin: isUserAdminFromBackend };

        // ⭐ FIX: Set isSupplier based on the message, not just company_name
        if (isUserSupplierFromBackend) {
            userProfile.isSupplier = true;
            userProfile.isEmployee = false;
        } else {
            // Default to employee if not admin and not explicitly supplier by message
            userProfile.isSupplier = false;
            userProfile.isEmployee = true;
        }

        // Ensure the profile has an 'id' which `PrivateRoute` checks
        if (!userProfile.id && userProfile.profile?.id) {
            userProfile.id = userProfile.profile.id;
        }
      } else {
        setError("Login successful, but no valid profile data found in response.");
        console.error("Login successful, but unhandled response structure:", response.data);
        return;
      }


      if (userProfile && userProfile.id && tokens?.access && tokens?.refresh) {

        setUser(userProfile);
        localStorage.setItem('access_token', tokens.access);
        localStorage.setItem('refreshToken', tokens.refresh);
        localStorage.setItem('user', JSON.stringify(userProfile));
        // Update AuthContext
        setAuth({
          user: userProfile,
          accessToken: tokens.access,
          refreshToken: tokens.refresh,
        });

        if (isUserAdminFromBackend) {
          localStorage.setItem('adminData', JSON.stringify(response.data.data));
          console.log("Login Successful as Admin. Navigating to /admin");
          navigate("/admin", { replace: true });
        } else if (userProfile.isSupplier) {
          console.log("Login Successful as Supplier. Navigating to /supplier-info");
          navigate("/supplier-info", { replace: true });
        } else {
          console.log("Login Successful as Employee. Navigating to /employee");
          navigate("/employee", { replace: true });
        }
      } else {
        setError("Login failed: Incomplete or malformed data received from the server. Please try again.");
        console.error("Login successful, but final validation failed:", { responseData: response.data, finalUserProfile: userProfile });
      }

    } catch (err) {
      console.error("Login failed:", err);
      if (err.response && err.response.data && err.response.data.msg) {
        setError(err.response.data.msg);
      } else {
        setError("Login failed. Please check your credentials.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neutral-50 font-sans p-4">
      <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-sm">
        <div className="flex justify-center mb-6">
          <img
            src={companyLogo}
            alt="Company Logo"
            className="w-32 h-auto object-contain rounded-full shadow-md border-2 border-neutral-200"
          />
        </div>

        <div className="text-center mb-6">
          <p className="text-neutral-600 text-sm">Enter your credentials to continue</p>
        </div>

        <form className="space-y-5" onSubmit={handleLogin}>
          <div>
            <label className="block text-neutral-700 text-sm font-medium mb-1" htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-neutral-50 text-neutral-900 placeholder-neutral-500 text-base shadow-sm"
              placeholder="Your username"
              required
            />
          </div>

          <div>
            <label className="block text-neutral-700 text-sm font-medium mb-1" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-neutral-50 text-neutral-900 placeholder-neutral-500 text-base shadow-sm"
              placeholder="Your password"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center py-2 bg-red-100 rounded-lg px-4">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 ease-in-out text-lg"
          >
            Log In
          </button>

          <div className="text-center pt-2">
          </div>
        </form>
      </div>
    </div>
  );
}
