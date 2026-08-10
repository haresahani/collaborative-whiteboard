import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { MailCheck, ArrowRight, AlertCircle, Loader2, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    verifyEmail,
    resendCode,
    pendingVerificationEmail,
    isAuthenticated,
    error,
    clearError,
  } = useAuthStore();

  const queryParams = new URLSearchParams(location.search);
  const emailFromUrl = queryParams.get("email");
  const targetEmail = pendingVerificationEmail || emailFromUrl || "";

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState("");
  const [validationError, setValidationError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    clearError();
  }, [clearError]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleDigitChange = (index: number, value: string) => {
    // Handle paste of 6-digit code
    if (value.length > 1) {
      const pastedDigits = value.replace(/\D/g, "").slice(0, 6).split("");
      if (pastedDigits.length > 0) {
        const newDigits = [...digits];
        pastedDigits.forEach((digit, idx) => {
          if (idx < 6) newDigits[idx] = digit;
        });
        setDigits(newDigits);
        const nextIndex = Math.min(pastedDigits.length, 5);
        inputRefs.current[nextIndex]?.focus();
      }
      return;
    }

    // Single digit input
    const cleanValue = value.replace(/\D/g, "");
    const newDigits = [...digits];
    newDigits[index] = cleanValue;
    setDigits(newDigits);

    // Auto-advance to next input
    if (cleanValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setValidationError("");
    setResendMessage("");

    const code = digits.join("");
    if (code.length < 6) {
      setValidationError("Please enter the full 6-digit verification code.");
      return;
    }

    if (!targetEmail) {
      setValidationError("Missing email address. Please sign up again.");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyEmail(targetEmail, code);
      navigate("/", { replace: true });
    } catch {
      // Handled by store error
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || !targetEmail) return;
    setIsResending(true);
    setValidationError("");
    setResendMessage("");

    try {
      await resendCode(targetEmail);
      setResendMessage("A new verification code has been sent!");
      setCooldown(30);
    } catch {
      // Error in store
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#090d16",
        backgroundImage:
          "radial-gradient(circle at 50% 20%, rgba(59, 130, 246, 0.15), transparent 45%), radial-gradient(circle at 80% 80%, rgba(139, 92, 246, 0.12), transparent 45%)",
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
              width: "54px",
              height: "54px",
              margin: "0 auto 1.2rem",
              borderRadius: "14px",
              background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)",
            }}
          >
            <MailCheck size={28} />
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
            Verify Your Email
          </h1>
          <p style={{ margin: 0, color: "#94a3b8", fontSize: "0.9rem", lineHeight: 1.5 }}>
            We've sent a 6-digit verification code to:
            <br />
            <strong style={{ color: "#60a5fa" }}>{targetEmail || "your email address"}</strong>
          </p>
        </div>


        {/* Error or Success Banners */}
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

        {resendMessage && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "0.8rem 1rem",
              marginBottom: "1.5rem",
              borderRadius: "0.6rem",
              backgroundColor: "rgba(16, 185, 129, 0.12)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              color: "#6ee7b7",
              fontSize: "0.85rem",
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{resendMessage}</span>
          </div>
        )}

        {/* OTP Input Fields */}
        <form onSubmit={handleVerify}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "8px",
              marginBottom: "1.75rem",
            }}
          >
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                maxLength={6}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                style={{
                  width: "48px",
                  height: "56px",
                  textAlign: "center",
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  backgroundColor: "#1e293b",
                  border: `1px solid ${digit ? "#3b82f6" : "#334155"}`,
                  borderRadius: "0.6rem",
                  color: "#ffffff",
                  outline: "none",
                  boxShadow: digit ? "0 0 10px rgba(59, 130, 246, 0.25)" : "none",
                  transition: "border-color 0.15s ease, box-shadow 0.15s ease",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.target.style.borderColor = digit ? "#3b82f6" : "#334155")}
              />
            ))}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              padding: "0.85rem 1.4rem",
              background: "linear-gradient(135deg, #10b981 0%, #3b82f6 100%)",
              color: "#ffffff",
              borderRadius: "0.6rem",
              fontWeight: 600,
              fontSize: "0.95rem",
              border: "none",
              cursor: isSubmitting ? "not-allowed" : "pointer",
              opacity: isSubmitting ? 0.7 : 1,
              boxShadow: "0 4px 16px rgba(16, 185, 129, 0.35)",
              transition: "transform 0.15s ease, opacity 0.15s ease",
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <>
                <span>Verify & Continue</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Resend and Navigation Footer */}
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
          Didn't receive the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            style={{
              background: "none",
              border: "none",
              color: cooldown > 0 ? "#64748b" : "#60a5fa",
              fontWeight: 600,
              cursor: cooldown > 0 || isResending ? "not-allowed" : "pointer",
              padding: 0,
              fontSize: "0.88rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            {isResending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Resending...</span>
              </>
            ) : cooldown > 0 ? (
              <span>Resend in {cooldown}s</span>
            ) : (
              <>
                <RefreshCw size={14} />
                <span>Resend Code</span>
              </>
            )}
          </button>

          <div style={{ marginTop: "1.2rem" }}>
            <Link
              to="/login"
              style={{
                color: "#64748b",
                fontSize: "0.82rem",
                textDecoration: "none",
              }}
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
