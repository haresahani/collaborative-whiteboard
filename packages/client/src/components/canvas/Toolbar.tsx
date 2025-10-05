// // components/canvas/Toolbar.tsx
// import React from 'react';
// import { useWhiteboardStore } from '@/store/whiteboardStore';
// import { Button } from '@/components/ui/button';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// import { cn } from '@/lib/utils';
// import { DrawingTool } from '@/types/whiteboard';
// import {
//   MousePointer2,
//   Pencil,
//   Minus,
//   Plus,
//   Trash2,
//   Undo2,
//   Redo2,
//   Square,
//   Circle,
//   StickyNote,
//   Type,
//   Hand,
//   Eraser,
//   ZoomOut, // Add if needed
// } from 'lucide-react';

// interface ToolbarProps {
//   className?: string;
// }

// const Toolbar: React.FC<ToolbarProps> = ({ className }) => {
//   const {
//     tool,
//     setTool,
//     viewport,
//     setViewport,
//     undo,
//     redo,
//     clearWhiteboard,
//     history,
//     elements,
//     currentUser,
//   } = useWhiteboardStore();

//   const tools: { id: DrawingTool; icon: React.ReactNode; label: string }[] = [
//     { id: 'select', icon: <MousePointer2 className="h-5 w-5" />, label: 'Select' },
//     { id: 'pen', icon: <Pencil className="h-5 w-5" />, label: 'Pen' },
//     { id: 'line', icon: <Minus className="h-5 w-5" />, label: 'Line' },
//     { id: 'rectangle', icon: <Square className="h-5 w-5" />, label: 'Rectangle' },
//     { id: 'circle', icon: <Circle className="h-5 w-5" />, label: 'Circle' },
//     { id: 'text', icon: <Type className="h-5 w-5" />, label: 'Text' },
//     { id: 'sticky-note', icon: <StickyNote className="h-5 w-5" />, label: 'Sticky Note' },
//     { id: 'eraser', icon: <Eraser className="h-5 w-5" />, label: 'Eraser' },
//     { id: 'hand', icon: <Hand className="h-5 w-5" />, label: 'Pan' },
//   ];

//   const handleZoom = (delta: number) => {
//     setViewport({ zoom: Math.max(0.1, Math.min(5, viewport.zoom + delta)) });
//   };

//   const resetZoom = () => setViewport({ zoom: 1 });

//   const isUndoDisabled = history.past.length === 0 || !currentUser;
//   const isRedoDisabled = history.future.length === 0 || !currentUser;
//   const isClearDisabled = elements.length === 0 || !currentUser; // Fixed: Use elements.length

//   return (
//     <TooltipProvider>
//       <div className={cn('flex items-center gap-2 p-2 bg-background border rounded-md shadow-sm', className)}>
//         {tools.map(({ id, icon, label }) => (
//           <Tooltip key={id}>
//             <TooltipTrigger asChild>
//               <Button
//                 variant={tool === id ? 'default' : 'outline'}
//                 size="icon"
//                 onClick={() => setTool(id)}
//                 disabled={!currentUser}
//                 aria-label={label}
//               >
//                 {icon}
//               </Button>
//             </TooltipTrigger>
//             <TooltipContent>
//               <p>{label}</p>
//             </TooltipContent>
//           </Tooltip>
//         ))}
//         <div className="h-6 w-px bg-border mx-2" />
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button
//               variant="outline"
//               size="icon"
//               onClick={() => handleZoom(-0.1)}
//               disabled={viewport.zoom <= 0.1 || !currentUser}
//               aria-label="Zoom Out"
//             >
//               <Minus className="h-5 w-5" />
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent>
//             <p>Zoom Out</p>
//           </TooltipContent>
//         </Tooltip>
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button
//               variant="outline"
//               size="icon"
//               onClick={() => handleZoom(0.1)}
//               disabled={viewport.zoom >= 5 || !currentUser}
//               aria-label="Zoom In"
//             >
//               <Plus className="h-5 w-5" />
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent>
//             <p>Zoom In</p>
//           </TooltipContent>
//         </Tooltip>
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button
//               variant="outline"
//               size="icon"
//               onClick={resetZoom}
//               disabled={viewport.zoom === 1 || !currentUser}
//               aria-label="Reset Zoom"
//             >
//               <ZoomOut className="h-5 w-5" /> {/* Adjust icon */}
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent>
//             <p>Reset Zoom</p>
//           </TooltipContent>
//         </Tooltip>
//         <div className="h-6 w-px bg-border mx-2" />
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button
//               variant="outline"
//               size="icon"
//               onClick={undo}
//               disabled={isUndoDisabled}
//               aria-label="Undo"
//             >
//               <Undo2 className="h-5 w-5" />
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent>
//             <p>Undo</p>
//           </TooltipContent>
//         </Tooltip>
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button
//               variant="outline"
//               size="icon"
//               onClick={redo}
//               disabled={isRedoDisabled}
//               aria-label="Redo"
//             >
//               <Redo2 className="h-5 w-5" />
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent>
//             <p>Redo</p>
//           </TooltipContent>
//         </Tooltip>
//         <Tooltip>
//           <TooltipTrigger asChild>
//             <Button
//               variant="outline"
//               size="icon"
//               onClick={clearWhiteboard}
//               disabled={isClearDisabled}
//               aria-label="Clear Whiteboard"
//             >
//               <Trash2 className="h-5 w-5" />
//             </Button>
//           </TooltipTrigger>
//           <TooltipContent>
//             <p>Clear Whiteboard</p>
//           </TooltipContent>
//         </Tooltip>
//       </div>
//     </TooltipProvider>
//   );
// };

// export default Toolbar;
