import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * PHANTOM SHIM
 * This file exists only to silence IDE errors for a deleted directory.
 * The actual app is now in the root /src/app/ directory.
 */
export default function App() {
  return <Navigate to="/app" replace />;
}
