// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "@tanstack/react-router";
import { AuthProvider, useSession, getSessionToken } from "@descope/react-sdk";
import { ConvexReactClient, ConvexProviderWithAuth } from "convex/react";
import { router } from "./router"; // wherever you create your TanStack router

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL);

// Bridge Descope → Convex
function useDescopeAuth() {
  const { isAuthenticated, isSessionLoading } = useSession();
  return {
    isAuthenticated,
    isLoading: isSessionLoading,
    getToken: async () => getSessionToken(), // returns the Descope JWT for Convex
  };
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider projectId={import.meta.env.VITE_DESCOPE_PROJECT_ID}>
      <ConvexProviderWithAuth client={convex} useAuth={useDescopeAuth}>
        <RouterProvider router={router} />
      </ConvexProviderWithAuth>
    </AuthProvider>
  </React.StrictMode>
);
