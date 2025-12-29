import React from 'react';

export default function Loading({ message = "Loading..." }) {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-100 border-t-amber-600 mb-4"></div>
      <p className="text-gray-500 font-medium animate-pulse">{message}</p>
    </div>
  );
}
