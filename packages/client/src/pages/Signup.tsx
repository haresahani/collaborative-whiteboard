import { useNavigate } from "react-router-dom";
import { AuthDialog } from "@/components/auth/AuthDialog";
import { generateUUID } from "@/lib/utils";

export default function Signup() {
  const navigate = useNavigate();

  return (
    <AuthDialog
      isOpen={true}
      onClose={() => {}} // Empty function to prevent default navigation
      onAuthenticated={(user) => {
        console.log("✅ Signed up:", user);
        navigate(`/board/${generateUUID()}`);
      }}
      initialView="signup"
    />
  );
}
