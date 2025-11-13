// tests/pages/Whiteboard.test.tsx
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import Whiteboard from "@/pages/Whiteboard";
import { WhiteboardProvider } from "@/contexts/WhiteboardContext";

test("renders Whiteboard", () => {
  render(
    <BrowserRouter>
      <WhiteboardProvider boardId="demo-board">
        <Whiteboard />
      </WhiteboardProvider>
    </BrowserRouter>,
  );
});
