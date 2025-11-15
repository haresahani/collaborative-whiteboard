import { useNavigate } from "react-router-dom";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { generateUUID } from "@/lib/utils";

export default function Login() {
  const navigate = useNavigate();

  return (
    <AuthDialog
      isOpen={true}
      onClose={() => {}} // Empty function to prevent default navigation
      onAuthenticated={(user) => {
        console.log("✅ Logged in:", user);
        navigate(`/board/${generateUUID()}`);
      }}
    />
  );
}
