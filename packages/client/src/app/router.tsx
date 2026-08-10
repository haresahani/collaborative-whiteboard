import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import IndexPage from "../pages/Index";
import LoginPage from "../pages/Login";
import SignupPage from "../pages/Signup";
import VerifyEmailPage from "../pages/VerifyEmail";
import WhiteboardPage from "../features/whiteboard/components/WhiteboardPage";
import { ErrorBoundary } from "./ErrorBoundary";
import { useAuthStore } from "../store/authStore";

export function AppRouter() {
  const initAuth = useAuthStore((state) => state.initAuth);

  useEffect(() => {
    void initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IndexPage />} />
        <Route path="/dashboard" element={<IndexPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/board" element={<IndexPage />} />

        {/* Backward compatible route */}
        <Route
          path="/board/:id"
          element={
            <ErrorBoundary>
              <WhiteboardPage />
            </ErrorBoundary>
          }
        />

        {/* Direct clean board route: example.com/my-board-id */}
        <Route
          path="/:id"
          element={
            <ErrorBoundary>
              <WhiteboardPage />
            </ErrorBoundary>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
