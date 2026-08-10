import { useEffect, useRef } from "react";
import { useAuthStore } from "../../store/authStore";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_blue" | "filled_black";
              size?: "large" | "medium" | "small";
              width?: number;
              shape?: "rectangular" | "pill";
            },
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface GoogleSignInButtonProps {
  onSuccess?: () => void;
  label?: string;
}

export function GoogleSignInButton({ onSuccess, label = "Continue with Google" }: GoogleSignInButtonProps) {
  const { loginWithGoogle } = useAuthStore();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "mock_google_client_id_for_dev";

  useEffect(() => {
    // Dynamically load Google Identity Services SDK if not loaded
    if (!window.google) {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleSDK();
      document.body.appendChild(script);
    } else {
      initGoogleSDK();
    }

    function initGoogleSDK() {
      if (window.google?.accounts?.id && clientId && !clientId.startsWith("mock_")) {
        try {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response) => {
              if (response.credential) {
                await loginWithGoogle(response.credential);
                if (onSuccess) onSuccess();
              }
            },
          });

          if (googleBtnRef.current) {
            window.google.accounts.id.renderButton(googleBtnRef.current, {
              theme: "filled_blue",
              size: "large",
              shape: "rectangular",
            });
          }
        } catch {
          // Ignore initialization error in mock environment
        }
      }
    }
  }, [clientId, loginWithGoogle, onSuccess]);

  const handleCustomGoogleClick = async () => {
    // If dev or custom click, generate dev mock credential or trigger sign-in
    const mockId = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      await loginWithGoogle(`mock_google_${mockId}`);
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Google login failed:", err);
    }
  };

  return (
    <div style={{ width: "100%", marginTop: "0.5rem" }}>
      {/* Container for Official Google SDK Button */}
      <div ref={googleBtnRef} style={{ display: "none" }} />

      {/* Styled Custom Google Sign-In Button */}
      <button
        type="button"
        onClick={handleCustomGoogleClick}
        style={{
          width: "100%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          padding: "0.75rem 1.4rem",
          backgroundColor: "#ffffff",
          color: "#1f2937",
          border: "1px solid #e5e7eb",
          borderRadius: "0.6rem",
          fontWeight: 600,
          fontSize: "0.92rem",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
          transition: "background-color 0.15s ease, transform 0.15s ease",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f9fafb")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#ffffff")}
      >
        {/* Official Multicolor Google G Logo */}
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"
          />
        </svg>
        <span>{label}</span>
      </button>
    </div>
  );
}
