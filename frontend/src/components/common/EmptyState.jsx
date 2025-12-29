import React from 'react';

export default function EmptyState({ 
    title = "Nothing here yet", 
    message = "There are no items to display at the moment.", 
    actionLabel, 
    onAction, 
    icon = "📂" 
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white rounded-xl border border-gray-100 border-dashed">
      <div className="text-4xl mb-4 bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-gray-800 mb-1">{title}</h3>
      <p className="text-gray-500 max-w-sm mb-6">{message}</p>
      
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="bg-amber-600 text-white px-5 py-2 rounded-lg font-semibold hover:bg-amber-700 transition-colors shadow-sm hover:shadow-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
