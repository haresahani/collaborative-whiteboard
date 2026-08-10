import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary caught error]:", error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="wb-error-boundary-root" style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          backgroundColor: "#0f172a",
          color: "#f8fafc",
          fontFamily: "sans-serif",
          padding: "2rem",
          textAlign: "center",
        }}>
          <div style={{
            backgroundColor: "#1e293b",
            padding: "2.5rem",
            borderRadius: "1rem",
            boxShadow: "0 20px 25px -5px rgba(0,0,0,0.5)",
            maxWidth: "480px",
            border: "1px solid #334155",
          }}>
            <div style={{ display: "inline-block", padding: "12px", borderRadius: "50%", backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444", marginBottom: "1rem" }}>
              <AlertTriangle size={36} />
            </div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.5rem" }}>Something went wrong</h2>
            <p style={{ color: "#94a3b8", fontSize: "0.95rem", marginBottom: "1.5rem" }}>
              An uncaught engine error occurred while rendering the canvas state.
            </p>
            <div style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
            }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "0.6rem 1.2rem",
                  backgroundColor: "#3b82f6",
                  color: "#ffffff",
                  borderRadius: "0.5rem",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  transition: "background-color 0.2s",
                }}
              >
                <RefreshCw size={16} />
                Reset Canvas Engine
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
