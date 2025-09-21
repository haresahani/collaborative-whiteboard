// import { useNavigate } from "react-router-dom";
// import { AuthDialog } from "@/components/auth/AuthDialog";

// export default function Login() {
//   const navigate = useNavigate();

//   return (
//     <AuthDialog
//       isOpen={true}
//       onClose={() => navigate(`/board/${crypto.randomUUID()}`)} // Updated: Redirect to new board on close/guest
//       onAuthenticated={(user) => {
//         console.log("✅ Logged in:", user);
//         navigate(`/board/${crypto.randomUUID()}`);
//       }}
//     />
//   );
// }

import { useNavigate } from "react-router-dom";
import { AuthDialog } from "@/components/auth/AuthDialog";

export default function Login() {
  const navigate = useNavigate();

  return (
    <AuthDialog
      isOpen={true}
      onClose={() => {}} // Empty function to prevent default navigation
      onAuthenticated={(user) => {
        console.log("✅ Logged in:", user);
        navigate(`/board/${crypto.randomUUID()}`);
      }}
    />
  );
}