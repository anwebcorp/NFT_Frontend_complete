// App.js
import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes, Navigate } from "react-router-dom";
import Login from "./Login";
import Admin from "./Admin";
import Employee from "./Employee";
import SupplierInfo from "./SupplierInfo";
import SupplierDetails from "./SupplierDetails";
import Suppliers from "./Suppliers"; // Make sure to import Suppliers
import PrivateRoute from "./PrivateRoute";
import { AuthProvider } from "./authContext";
import Accounts from "./Accounts"; // Add this import

function App() {
  // ⭐ UPDATED: Initialize user to `undefined` to represent the 'loading' state
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
  const accessToken = localStorage.getItem('access_token');

  if (storedUser && accessToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser && parsedUser.id !== undefined) {
          setUser(parsedUser);
          console.log("App.js: User rehydrated from localStorage:", parsedUser);
        } else {
          console.error("App.js: Malformed user data in localStorage.");
          localStorage.removeItem('user');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refreshToken');
          // ⭐ UPDATED: Set to null when check is complete, but no user is found
          setUser(null);
        }
      } catch (e) {
        console.error("App.js: Failed to parse user from localStorage", e);
        localStorage.removeItem('user');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refreshToken');
        // ⭐ UPDATED: Set to null when check is complete, but an error occurred
        setUser(null);
      }
    } else {
  console.log("App.js: No user or access_token in localStorage on app load.");
        // ⭐ UPDATED: Set to null when check is complete, but no user is found
        setUser(null);
    }
  }, []);

  // ⭐ UPDATED: Conditionally render a loading screen while `user` is `undefined`
  if (user === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <p>Loading...</p>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route
            path="/admin"
            element={
              <PrivateRoute allowedId={18} user={user}>
                <Admin user={user} setUser={setUser} />
              </PrivateRoute>
            }
          />
          <Route
            path="/employee"
            element={
              <PrivateRoute allowedId={0} user={user}>
                <Employee user={user} setUser={setUser} />
              </PrivateRoute>
            }
          />
          <Route
            path="/supplier-info"
            element={
              <PrivateRoute allowedId={20} user={user}>
                <SupplierInfo user={user} setUser={setUser} />
              </PrivateRoute>
            }
          />
          {/* Route for the list of all suppliers */}
          <Route
            path="/suppliers"
            element={
              <PrivateRoute allowedId={20} user={user}>
                <Suppliers user={user} setUser={setUser} />
              </PrivateRoute>
            }
          />
          {/* Route for a specific supplier's details */}
          <Route
            path="/suppliers/:supplierId"
            element={
              <PrivateRoute allowedId={20} user={user}>
                <SupplierDetails user={user} setUser={setUser} />
              </PrivateRoute>
            }
          />
          {/* Add the new Accounts route before the catch-all route */}
          <Route
            path="/accounts"
            element={
              <PrivateRoute allowedId={18} user={user}>
                <Accounts user={user} setUser={setUser} />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
