import { useToolStore } from "../../store/toolStore";
import { useBoardStore } from "../../store/boardStore";

export default function Toolbar() {
  const tool = useToolStore((s) => s.tool);
  const setTool = useToolStore((s) => s.setTool);

  const color = useToolStore((s) => s.color);
  const setColor = useToolStore((s) => s.setColor);

  const width = useToolStore((s) => s.width);
  const setWidth = useToolStore((s) => s.setWidth);

  const setElements = useBoardStore((s) => s.setElements);

  return (
    <div className="flex gap-3 bg-gray-800 text-white p-3 rounded">
      {/* Select */}
      <button
        onClick={() => setTool("select")}
        className={
          tool === "select" ? "bg-blue-500 px-3 py-1 rounded" : "px-3 py-1"
        }
      >
        Select
      </button>

      {/* Pen */}
      <button
        onClick={() => setTool("pen")}
        className={
          tool === "pen" ? "bg-blue-500 px-3 py-1 rounded" : "px-3 py-1"
        }
      >
        Pen
      </button>

      <button
        onClick={() => setTool("rectangle")}
        className={
          tool === "rectangle" ? "bg-blue-500 px-3 py-1 rounded" : "px-3 py-1"
        }
      >
        Rectangle
      </button>

      {/* Arrow */}
      <button
        onClick={() => setTool("arrow")}
        className={
          tool === "arrow" ? "bg-blue-500 px-3 py-1 rounded" : "px-3 py-1"
        }
      >
        Arrow
      </button>

      {/* Text */}
      <button
        onClick={() => setTool("text")}
        className={
          tool === "text" ? "bg-blue-500 px-3 py-1 rounded" : "px-3 py-1"
        }
      >
        Text
      </button>

      {/* Eraser */}
      <button
        onClick={() => setTool("eraser")}
        className={
          tool === "eraser" ? "bg-blue-500 px-3 py-1 rounded" : "px-3 py-1"
        }
      >
        Eraser
      </button>

      {/* Color */}
      <input
        type="color"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />

      {/* Width */}
      <input
        type="range"
        min="1"
        max="10"
        value={width}
        onChange={(e) => setWidth(Number(e.target.value))}
      />

      {/* Clear */}
      <button
        onClick={() => setElements([])}
        className="bg-red-500 px-3 py-1 rounded"
      >
        Clear
      </button>
    </div>
  );
}
