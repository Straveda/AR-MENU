import React from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen w-screen bg-slate-50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 relative overflow-hidden flex flex-col">
      {}
      <div className="absolute inset-0 pointer-events-none">
        {}
        <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
        
        {}
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-indigo-50/40 blur-[120px]"></div>
        <div className="absolute top-[10%] -right-[10%] w-[50vw] h-[50vw] rounded-full bg-blue-50/30 blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40vw] h-[40vw] rounded-full bg-slate-100/50 blur-[80px]"></div>
      </div>

      {}
      <main className="relative z-10 flex-grow flex flex-col items-center justify-center px-6 sm:px-8 lg:px-12 max-h-screen">
        
        {}
        <div className="text-center max-w-4xl mb-8 md:mb-12 space-y-4 md:space-y-6">
          <div className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/50 backdrop-blur-md border border-slate-200 text-slate-600 text-[10px] md:text-xs font-semibold shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
            <span className="flex h-1.5 w-1.5 rounded-full bg-indigo-500 mr-2"></span>
            Enterprise Restaurant Infrastructure
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-tight md:leading-[1.1] animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Restaurant-AR SaaS
          </h1>
          
          <p className="text-base md:text-lg lg:text-xl text-slate-600/80 leading-relaxed max-w-xl mx-auto animate-in fade-in slide-in-from-bottom-12 duration-1000">
            Manage restaurants, menus, staff, and immersive AR dining experiences through a unified enterprise control center.
          </p>
        </div>

        {}
        <div className="grid md:grid-cols-2 gap-4 lg:gap-8 w-full max-w-5xl mb-8 md:mb-12">
          {}
          <div className="group bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] transition-all duration-500 flex flex-col items-start hover:-translate-y-1">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4 md:mb-6 border border-indigo-100/50 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 md:mb-3 tracking-tight">For Platform Owners</h2>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              Super Admins oversee the entire SaaS platform — restaurants, subscriptions, analytics, and system-wide configurations.
            </p>
          </div>

          {}
          <div className="group bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_15px_40px_rgb(0,0,0,0.08)] transition-all duration-500 flex flex-col items-start hover:-translate-y-1">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4 md:mb-6 border border-blue-100/50 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 md:mb-3 tracking-tight">For Restaurant Owners</h2>
            <p className="text-slate-600 text-sm md:text-base leading-relaxed">
              Restaurant Admins manage daily restaurant operations — menus, AR dishes, staff roles, and order workflows.
            </p>
          </div>
        </div>

        {}
        <div className="text-center space-y-4 md:space-y-6">
          <button
            onClick={() => navigate('/login')}
            className="group relative inline-flex items-center justify-center px-8 md:px-10 py-3.5 md:py-4 bg-slate-900 text-white font-bold rounded-xl md:rounded-2xl hover:bg-slate-800 transition-all duration-300 shadow-xl shadow-slate-900/20 active:scale-[0.98] text-sm md:text-base"
          >
            Proceed to Login
            <span className="ml-2.5 md:ml-3 group-hover:translate-x-1 transition-transform duration-300">→</span>
          </button>
          <p className="text-xs md:text-sm text-slate-500 font-medium pb-4">
            Access is role-based and determined after login.
          </p>
        </div>
      </main>

      {}
      <footer className="relative z-10 py-6 md:py-8 border-t border-slate-200 bg-white/30 backdrop-blur-sm mt-auto">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 text-[10px] md:text-xs">
            <div className="flex items-center space-x-3 md:space-x-4">
              <span className="text-slate-900 font-bold tracking-tight">Restaurant-AR SaaS</span>
              <span className="h-3 md:h-4 w-[1px] bg-slate-300 hidden md:block"></span>
              <span className="text-slate-500">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center space-x-6 md:space-x-10 text-slate-500 font-medium">
              <a href="#" className="hover:text-slate-900 transition-colors">Documentation</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Security</a>
              <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
