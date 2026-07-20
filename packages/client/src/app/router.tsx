import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Pages
// import IndexPage from "../pages/Index";
// import Login from "../pages/Login";
// import Signup from "../pages/Signup";
// import NotFound from "../pages/NotFound";
import WhiteboardPage from "../features/whiteboard/components/WhiteboardPage";

export function AppRouter() {
  const defaultBoardRoute = "/board/local-board";

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={defaultBoardRoute} replace />} />

        <Route
          path="/board"
          element={<Navigate to={defaultBoardRoute} replace />}
        />

        <Route path="/board/:id" element={<WhiteboardPage />} />

        <Route path="*" element={<Navigate to={defaultBoardRoute} replace />} />
      </Routes>
    </BrowserRouter>
  );
}
