import React from 'react';
import { Link } from 'react-router-dom';
import { MoveLeft } from 'lucide-react';

const NotFound = () => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0a0a0a] px-4 selection:bg-gray-200 dark:selection:bg-gray-800">
            <div className="text-center space-y-8 animate-in fade-in zoom-in duration-500">
                <h1 className="text-9xl font-thin tracking-tighter text-gray-200 dark:text-gray-800 select-none">
                    404
                </h1>
                <div className="space-y-3">
                    <h2 className="text-2xl font-light tracking-wide text-gray-900 dark:text-white uppercase font-sans">
                        Page Not Found
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-light max-w-sm mx-auto leading-relaxed">
                        The page you are looking for doesn't exist or has been moved.
                    </p>
                </div>

                <div className="pt-8">
                    <Link
                        to="/"
                        className="group inline-flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-200 hover:text-gray-600 dark:hover:text-gray-400 transition-all duration-300"
                    >
                        <MoveLeft size={16} className="group-hover:-translate-x-1 transition-transform duration-300" />
                        <span className="relative">
                            Return Home
                            <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-current transition-all duration-300 group-hover:w-full"></span>
                        </span>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
