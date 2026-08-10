import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup, isAuthenticated, error, clearError } = useAuthStore();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError("");

    if (!displayName.trim() || !email.trim() || !password.trim()) {
      setValidationError("All fields are required.");
      return;
    }

    if (displayName.trim().length < 2) {
      setValidationError("Name must be at least 2 characters.");
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError("Please enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setValidationError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setValidationError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await signup({
        displayName: displayName.trim(),
        email: email.trim(),
        password,
      });
      navigate(`/verify-email?email=${encodeURIComponent(email.trim())}`);
    } catch {
      // Error is caught by auth store state
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#090d16",
        backgroundImage:
          "radial-gradient(circle at 85% 15%, rgba(139, 92, 246, 0.12), transparent 40%), radial-gradient(circle at 15% 85%, rgba(59, 130, 246, 0.12), transparent 40%)",
        color: "#f8fafc",
        fontFamily: "Inter, system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "440px",
          backgroundColor: "#0f172a",
          border: "1px solid #1e293b",
          borderRadius: "1.25rem",
          padding: "2.5rem 2rem",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(16px)",
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              margin: "0 auto 1rem",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 8px 20px rgba(139, 92, 246, 0.35)",
            }}
          >
            <Sparkles size={26} />
          </div>

          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              margin: "0 0 0.4rem 0",
              letterSpacing: "-0.03em",
              color: "#ffffff",
            }}
          >
            Create Your Account
          </h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem" }}>
            Join Collaboard to create and share real-time whiteboards
          </p>
        </div>

        {/* Error Banners */}
        {(error || validationError) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "0.8rem 1rem",
              marginBottom: "1.5rem",
              borderRadius: "0.6rem",
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
              color: "#fca5a5",
              fontSize: "0.85rem",
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{validationError || error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.15rem" }}>
          {/* Display Name Field */}
          <div>
            <label
              htmlFor="displayName"
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#cbd5e1",
              }}
            >
              Full Name / Display Name
            </label>
            <div style={{ position: "relative" }}>
              <User
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                }}
              />
              <input
                id="displayName"
                type="text"
                placeholder="Alex Morgan"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.6rem",
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "0.6rem",
                  color: "#ffffff",
                  fontSize: "0.92rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
                onBlur={(e) => (e.target.style.borderColor = "#334155")}
              />
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#cbd5e1",
              }}
            >
              Email Address
            </label>
            <div style={{ position: "relative" }}>
              <Mail
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                }}
              />
              <input
                id="email"
                type="email"
                placeholder="alex@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.6rem",
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "0.6rem",
                  color: "#ffffff",
                  fontSize: "0.92rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
                onBlur={(e) => (e.target.style.borderColor = "#334155")}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#cbd5e1",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <Lock
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                }}
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "0.75rem 2.6rem 0.75rem 2.6rem",
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "0.6rem",
                  color: "#ffffff",
                  fontSize: "0.92rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
                onBlur={(e) => (e.target.style.borderColor = "#334155")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#64748b",
                  cursor: "pointer",
                  padding: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Confirm Password Field */}
          <div>
            <label
              htmlFor="confirmPassword"
              style={{
                display: "block",
                marginBottom: "0.4rem",
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#cbd5e1",
              }}
            >
              Confirm Password
            </label>
            <div style={{ position: "relative" }}>
              <CheckCircle2
                size={18}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                }}
              />
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem 0.75rem 2.6rem",
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "0.6rem",
                  color: "#ffffff",
                  fontSize: "0.92rem",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#8b5cf6")}
                onBlur={(e) => (e.target.style.borderColor = "#334155")}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              marginTop: "0.5rem",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "0.85rem 1.4rem",
              background: "linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%)",
              color: "#ffffff",
              borderRadius: "0.6rem",
              fontWeight: 600,
              fontSize: "0.95rem",
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
              boxShadow: "0 4px 16px rgba(139, 92, 246, 0.4)",
              transition: "transform 0.15s ease, opacity 0.15s ease",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div
          style={{
            marginTop: "2rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid #1e293b",
            textAlign: "center",
            fontSize: "0.88rem",
            color: "#94a3b8",
          }}
        >
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#a78bfa",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>

          <div style={{ marginTop: "1rem" }}>
            <Link
              to="/"
              style={{
                color: "#64748b",
                fontSize: "0.82rem",
                textDecoration: "none",
              }}
            >
              ← Back to main dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
