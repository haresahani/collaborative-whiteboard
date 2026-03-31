import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
// import IndexPage from "../pages/Index";
// import Login from "../pages/Login";
// import Signup from "../pages/Signup";
// import NotFound from "../pages/NotFound";
import WhiteboardPage from "../features/whiteboard/components/WhiteboardPage";

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/" element={<IndexPage />} />

        <Route path="/login" element={<Login />} />

        <Route path="/signup" element={<Signup />} /> */}

        <Route path="/board/:id" element={<WhiteboardPage />} />

        {/* <Route path="*" element={<NotFound />} /> */}
      </Routes>
    </BrowserRouter>
  );
}
