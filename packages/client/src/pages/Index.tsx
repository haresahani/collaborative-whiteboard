// pages/Index.tsx
import React, { useState } from 'react';
import { Menu, X, ArrowRight, Palette, Users, Zap } from 'lucide-react';

// Main App component containing all logic and sub-components.
// All components are defined within this single file to adhere to the project's single-file mandate.
const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <div className="relative font-sans bg-slate-50 text-slate-800 min-h-screen">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-white bg-opacity-80 backdrop-blur-lg border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 py-4 md:py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">W</span>
            </div>
            <span className="text-2xl font-bold text-slate-800 hidden sm:block">Whiteboard</span>
          </div>

          <div className="hidden md:flex items-center space-x-6">
            <a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#" className="text-slate-600 hover:text-indigo-600 transition-colors">About</a>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button onClick={handleMenuToggle} className="text-slate-600">
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="flex flex-col items-center py-4 border-t border-slate-200">
            <a href="#" className="py-2 px-4 text-slate-600 hover:text-indigo-600 transition-colors">Features</a>
            <a href="#" className="py-2 px-4 text-slate-600 hover:text-indigo-600 transition-colors">Pricing</a>
            <a href="#" className="py-2 px-4 text-slate-600 hover:text-indigo-600 transition-colors">About</a>
          </div>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <div className="container mx-auto px-4 py-16 md:py-24 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Collaborate on <span className="text-indigo-600">Ideas,</span>
            <br />
            in Real Time.
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto">
            Whiteboard is the digital canvas for teams to brainstorm, design, and share ideas. Our powerful, real-time collaboration tools make teamwork seamless and intuitive.
          </p>
          <div className="mt-8 flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-4">
            {/* The "Sign Up" button now navigates to the /signup page. */}
            <a
              href={`/signup`}
              className="py-3.5 px-8 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-700 transition-colors shadow-lg shadow-slate-300"
            >
              Sign Up
            </a>
            {/* The "Login" button now navigates to the /login page. */}
            <a
              href={`/login`}
              className="py-3.5 px-8 bg-white text-slate-900 font-semibold rounded-xl border border-slate-300 hover:bg-slate-100 transition-colors shadow-lg shadow-slate-100"
            >
              Login
            </a>
            {/* The "Continue as Guest" button now directly navigates to a new board */}
            <a
              href={`/board/${crypto.randomUUID()}`}
              className="py-3.5 px-8 text-slate-600 font-semibold rounded-xl hover:text-slate-800 transition-colors flex items-center space-x-2"
            >
              <span>Continue as Guest</span>
              <ArrowRight size={20} className="mt-0.5" />
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-800">Designed for Seamless Collaboration</h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">Our features are built to enhance your workflow and bring your team closer together, no matter where they are.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <Palette size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Infinite Canvas</h3>
              <p className="text-slate-600">Never run out of space. Our canvas expands as you do, allowing for limitless brainstorming and planning.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">Real-Time Sync</h3>
              <p className="text-slate-600">See changes from your team members instantly, as if you were in the same room.</p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
                <Zap size={32} />
              </div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">High Performance</h3>
              <p className="text-slate-600">Our powerful engine ensures a smooth and lag-free experience, even with complex boards and many users.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-400 py-8">
        <div className="container mx-auto px-4 text-center">
          <p>&copy; {new Date().getFullYear()} Whiteboard. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;