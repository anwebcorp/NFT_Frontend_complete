import React from "react";
import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children, allowedId, user }) {
  console.log("PrivateRoute Check - User ID:", user?.id);
  console.log("PrivateRoute - allowedId:", allowedId);
  console.log("PrivateRoute - user.isAdmin:", user?.isAdmin);
  console.log("PrivateRoute - user.isSupplier:", user?.isSupplier);
  console.log("PrivateRoute - user.isEmployee:", user?.isEmployee);

  // ⭐ IMPORTANT FIX: Check if the user state is still in its initial `undefined` loading state.
  // If it is, don't redirect yet. The App.jsx component will handle the loading screen.
  if (user === undefined) {
    return null; // Or return a loading indicator if you prefer.
  }

  // Now, check if the user is logged in (i.e., user is not null)
  if (!user || typeof user.id === "undefined") {
    console.warn("Redirecting: No user logged in.");
    return <Navigate to="/login" replace />;
  }

  const isUserActuallyAdmin = user?.isAdmin;
  const isUserActuallySupplier = user?.isSupplier;
  const isUserActuallyEmployee = user?.isEmployee;

  const isRouteForAdmin = allowedId === 18;
  const isRouteForSupplier = allowedId === 20;
  const isRouteForEmployee = allowedId === 0;

  // Allow Admin to access any admin route or accounts route
  if (isUserActuallyAdmin && (isRouteForAdmin || allowedId === 18)) {
    console.log("Access granted: User is admin");
    return children;
  }
  
  // Rule 2: Allow Supplier to access supplier routes
  if (isUserActuallySupplier && isRouteForSupplier) {
    return children;
  }
  
  // Rule 3: Allow Employee to access employee routes
  if (isUserActuallyEmployee && isRouteForEmployee) {
    return children;
  }

  // Default: If none of the above, redirect to the appropriate dashboard or login
  // For this app, let's redirect to login if the role doesn't match the route
  console.warn("Redirecting: User role does not match allowedId.");
  return <Navigate to="/login" replace />;
}
