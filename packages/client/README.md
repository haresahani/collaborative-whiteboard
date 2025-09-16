# Collaborative Whiteboard

A production-ready, FAANG-level collaborative whiteboard application built with React, TypeScript, and modern web technologies. Features real-time collaboration, professional UI/UX, and scalable architecture.

![Whiteboard Preview](https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=600&fit=crop&auto=format)

## ✨ Features

### Core Functionality
- **Real-time Collaboration** - Multiple users can draw and interact simultaneously
- **Drawing Tools** - Pen, line, rectangle, circle, text, sticky notes, and eraser
- **Selection & Manipulation** - Select, move, resize, and rotate elements
- **Undo/Redo** - Full history management with keyboard shortcuts
- **Zoom & Pan** - Smooth viewport navigation and scaling

### Professional UI/UX
- **Modern Design** - Clean, minimalistic interface inspired by Figma and Miro
- **Responsive Layout** - Works seamlessly on desktop, tablet, and mobile
- **Dark/Light Mode** - Automatic theme switching with user preference
- **Smooth Animations** - Framer Motion powered transitions and interactions
- **Keyboard Shortcuts** - Complete shortcut support for power users

### Collaboration Features
- **Presence Indicators** - See other users' cursors and selections in real-time
- **User Management** - Online user list with avatars and status
- **Live Chat** - Built-in messaging for team communication
- **Board Sharing** - Easy link sharing for collaboration

### Technical Excellence
- **TypeScript** - Fully typed for reliability and developer experience
- **Modular Architecture** - Clean separation of concerns and reusable components
- **State Management** - Context-based state with optimistic updates
- **WebSocket Ready** - Built-in integration points for real-time features
- **Authentication** - JWT-ready auth system with Google OAuth support

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- Modern web browser with HTML5 Canvas support

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd whiteboard-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   Navigate to `http://localhost:8080`

## Technology Stack

### Frontend Core
- **React 18** - Modern React with hooks and concurrent features
- **TypeScript** - Type safety and enhanced developer experience
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework

### UI Components
- **shadcn/ui** - High-quality, accessible component library
- **Radix UI** - Unstyled, accessible primitives
- **Lucide React** - Beautiful, customizable icons
- **Framer Motion** - Production-ready motion library

### State & Data
- **React Context** - Global state management
- **TanStack Query** - Server state management
- **Zustand** - Lightweight state management (ready for use)

### Real-time Features
- **Socket.IO Client** - WebSocket communication
- **Presence System** - Live user indicators and cursors

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Basic UI components (shadcn/ui)
│   ├── layout/         # Layout components (navigation, toolbars)
│   ├── canvas/         # Canvas and drawing components
│   └── auth/           # Authentication components
├── contexts/           # React contexts for global state
├── hooks/              # Custom React hooks
├── pages/              # Page components
├── types/              # TypeScript type definitions
└── lib/                # Utility functions and helpers
```

## Design System

The application uses a comprehensive design system with:

- **Color Palette** - Professional blue/purple gradient with semantic colors
- **Typography** - Consistent font scales and weights
- **Spacing** - 8px grid-based spacing system
- **Shadows** - Subtle elevation with CSS custom properties
- **Animations** - Smooth transitions and micro-interactions

## Keyboard Shortcuts

### Tools
- `V` - Select tool
- `P` - Pen tool
- `L` - Line tool
- `R` - Rectangle tool
- `O` - Circle tool
- `T` - Text tool
- `S` - Sticky note tool
- `E` - Eraser tool
- `H` - Hand tool

### Actions
- `Ctrl/Cmd + Z` - Undo
- `Ctrl/Cmd + Shift + Z` - Redo
- `Ctrl/Cmd + C` - Copy
- `Ctrl/Cmd + V` - Paste
- `Ctrl/Cmd + A` - Select all
- `Ctrl/Cmd + D` - Duplicate
- `Delete/Backspace` - Delete selected

### Navigation
- `Ctrl/Cmd + +` - Zoom in
- `Ctrl/Cmd + -` - Zoom out
- `Ctrl/Cmd + 0` - Reset zoom

## Configuration

### Environment Variables
Create a `.env.local` file for environment-specific configuration:

```env
VITE_WEBSOCKET_URL=ws://localhost:3001
VITE_API_URL=http://localhost:3001/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### Theme Customization
Modify `src/index.css` to customize the design system:

```css
:root {
  --primary: 245 58% 51%;        /* Brand color */
  --secondary: 210 16% 93%;      /* Secondary actions */
  --accent-blue: 213 94% 68%;    /* Tool accent colors */
  /* ... more theme variables */
}
```

## WebSocket Integration

The application is designed to work with a WebSocket server for real-time features:

```typescript
// Mock WebSocket events
interface WhiteboardEvent {
  type: 'element-created' | 'element-updated' | 'element-deleted' | 'cursor-moved';
  userId: string;
  timestamp: number;
  data: any;
}
```

### Integration Points
- `src/hooks/useWebSocket.ts` - WebSocket connection management
- `src/contexts/WhiteboardContext.tsx` - State synchronization
- `src/components/canvas/PresenceCursors.tsx` - Live cursor rendering

## Mobile Support

The application is fully responsive and includes:

- **Touch Support** - Native touch events for drawing
- **Mobile Navigation** - Collapsible sidebars and floating actions
- **Gesture Controls** - Pinch to zoom, pan to navigate
- **Adaptive UI** - Different layouts for different screen sizes

## Authentication System

Built-in authentication with multiple options:

- **Email/Password** - Traditional authentication
- **Google OAuth** - One-click sign-in
- **Guest Access** - No registration required
- **JWT Ready** - Token-based authentication support

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to Netlify
```bash
npm run build
# Upload dist/ folder to Netlify
```

## Testing

```bash
# Run type checking
npm run type-check

# Run linting
npm run lint

# Build check
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the excellent component library
- [Lucide](https://lucide.dev/) for beautiful icons
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework

---