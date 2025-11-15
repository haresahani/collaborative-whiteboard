// pages/Index.tsx
import React, { useState } from "react";
import { Menu, X, ArrowRight, Palette, Users, Zap } from "lucide-react";
import { generateUUID } from "@/lib/utils";

// Main App component containing all logic and sub-components.
// All components are defined within this single file to adhere to the project's single-file mandate.
const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const customStyles: Record<string, string> = {
    "--background": "0 0% 3.9%",
    "--foreground": "0 0% 98%",
    "--canvas": "210 11% 9%",
    "--canvas-grid": "210 20% 15%",
    "--surface": "210 11% 11%",
    "--surface-elevated": "210 11% 13%",
    "--primary": "0 0% 98%",
    "--primary-foreground": "0 0% 9%",
    "--primary-hover": "245 58% 56%",
    "--primary-active": "245 58% 51%",
    "--secondary": "0 0% 14.9%",
    "--secondary-foreground": "0 0% 98%",
    "--secondary-hover": "210 11% 18%",
    "--muted": "0 0% 14.9%",
    "--muted-foreground": "0 0% 63.9%",
    "--subtle": "210 11% 13%",
    "--success": "142 69% 48%",
    "--success-foreground": "0 0% 100%",
    "--warning": "38 92% 60%",
    "--warning-foreground": "0 0% 100%",
    "--destructive": "0 62.8% 30.6%",
    "--destructive-foreground": "0 0% 98%",
    "--border": "0 0% 14.9%",
    "--border-subtle": "210 11% 15%",
    "--input": "0 0% 14.9%",
    "--ring": "0 0% 83.1%",
    "--card": "0 0% 3.9%",
    "--card-foreground": "0 0% 98%",
    "--popover": "0 0% 3.9%",
    "--popover-foreground": "0 0% 98%",
    "--gradient-primary":
      "linear-gradient(135deg, hsl(245 58% 61%), hsl(263 85% 75%))",
    "--gradient-surface":
      "linear-gradient(180deg, hsl(210 11% 11%), hsl(210 11% 9%))",
    "--accent": "0 0% 14.9%",
    "--accent-foreground": "0 0% 98%",
    "--chart-1": "220 70% 50%",
    "--chart-2": "160 60% 45%",
    "--chart-3": "30 80% 55%",
    "--chart-4": "280 65% 60%",
    "--chart-5": "340 75% 55%",
  };

  return (
    <div
      className="relative font-sans bg-[hsl(var(--background))] text-[hsl(var(--foreground))] min-h-screen"
      style={customStyles}
    >
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-[hsl(var(--card))] bg-opacity-80 backdrop-blur-lg border-b border-[hsl(var(--border))] shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">W</span>
            </div>
            <span className="text-2xl font-bold text-[hsl(var(--foreground))] hidden sm:block">
              Whiteboard
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <a
              href="#"
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary-hover))] transition-colors"
            >
              Features
            </a>
            <a
              href="#"
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary-hover))] transition-colors"
            >
              Pricing
            </a>
            <a
              href="#"
              className="text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary-hover))] transition-colors"
            >
              About
            </a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={handleMenuToggle}
              className="text-[hsl(var(--muted-foreground))]"
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}
        >
          <div className="flex flex-col items-center py-4 border-t border-[hsl(var(--border-subtle))]">
            <a
              href="#"
              className="py-2 px-4 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary-hover))] transition-colors"
            >
              Features
            </a>
            <a
              href="#"
              className="py-2 px-4 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary-hover))] transition-colors"
            >
              Pricing
            </a>
            <a
              href="#"
              className="py-2 px-4 text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--primary-hover))] transition-colors"
            >
              About
            </a>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-[hsl(var(--foreground))] leading-tight">
            Collaborate on{" "}
            <span className="text-[hsl(var(--primary-hover))]">Ideas,</span>
            <br />
            in Real Time.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-[hsl(var(--muted-foreground))] max-w-3xl mx-auto">
            Whiteboard is the digital canvas for teams to brainstorm, design,
            and share ideas. Our powerful, real-time collaboration tools make
            teamwork seamless and intuitive.
          </p>
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
            {/* The "Sign Up" button now navigates to the /signup page. */}
            <a
              href={`/signup`}
              className="py-3.5 px-8 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] font-semibold rounded-xl hover:bg-[hsl(var(--primary-hover))] transition-colors shadow-lg shadow-[hsl(var(--border-subtle))]"
            >
              Sign Up
            </a>
            {/* The "Login" button now navigates to the /login page. */}
            <a
              href={`/login`}
              className="py-3.5 px-8 bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] font-semibold rounded-xl border border-[hsl(var(--border))] hover:bg-[hsl(var(--secondary-hover))] transition-colors shadow-lg shadow-[hsl(var(--border-subtle))]"
            >
              Login
            </a>
            {/* The "Continue as Guest" button now directly navigates to a new board */}
            <a
              href={`/board/${generateUUID()}`}
              className="py-3.5 px-8 text-[hsl(var(--muted-foreground))] font-semibold rounded-xl hover:text-[hsl(var(--primary-hover))] transition-colors flex items-center space-x-2"
            >
              <span>Continue as Guest</span>
              <ArrowRight size={20} className="mt-0.5" />
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--foreground))]">
              Designed for Seamless Collaboration
            </h2>
            <p className="mt-4 text-[hsl(var(--muted-foreground))] max-w-2xl mx-auto">
              Our features are built to enhance your workflow and bring your
              team closer together, no matter where they are.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[hsl(var(--surface))] p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary-hover)/0.1)] text-[hsl(var(--primary-hover))] flex items-center justify-center mb-4">
                <Palette size={32} />
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                Infinite Canvas
              </h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                Never run out of space. Our canvas expands as you do, allowing
                for limitless brainstorming and planning.
              </p>
            </div>
            <div className="bg-[hsl(var(--surface))] p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] flex items-center justify-center mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                Real-Time Sync
              </h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                See changes from your team members instantly, as if you were in
                the same room.
              </p>
            </div>
            <div className="bg-[hsl(var(--surface))] p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-[hsl(var(--warning)/0.1)] text-[hsl(var(--warning))] flex items-center justify-center mb-4">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--foreground))] mb-2">
                High Performance
              </h3>
              <p className="text-[hsl(var(--muted-foreground))]">
                Our powerful engine ensures a smooth and lag-free experience,
                even with complex boards and many users.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[hsl(var(--surface))] text-[hsl(var(--muted-foreground))] py-8">
        <div className="container mx-auto px-4 text-center">
          <p>
            &copy; {new Date().getFullYear()} Whiteboard. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
