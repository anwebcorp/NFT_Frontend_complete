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

// ⭐ NEW: Import your new components here
import Inbox from "./Inbox"; 
import GenerateDemand from "./GenerateDemand";

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
        console.error("App.js: Failed to parse user data from localStorage.", e);
        localStorage.removeItem('user');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refreshToken');
        setUser(null);
      }
    } else {
      // ⭐ UPDATED: If no user data or token exists, explicitly set user to null
      setUser(null);
    }
  }, []);

  if (user === undefined) {
    // Show a loading indicator while we check for user data
    return <div className="flex justify-center items-center h-screen text-lg">Loading...</div>;
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
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
            path="/employee" // Changed from "/employee-info" to "/employee"
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

          {/* ⭐ NEW: Add the routes for your new components */}
          <Route
            path="/inbox"
            element={
              <PrivateRoute allowedId={18} user={user}>
                <Inbox user={user} setUser={setUser} />
              </PrivateRoute>
            }
          />
          <Route
            path="/generate-demand"
            element={
              <PrivateRoute allowedId={18} user={user}>
                <GenerateDemand user={user} setUser={setUser} />
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