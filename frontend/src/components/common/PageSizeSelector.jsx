import React from 'react';

export default function PageSizeSelector({ limit, onLimitChange }) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-500">Rows per page</span>
      <select
        value={limit}
        onChange={(e) => onLimitChange(Number(e.target.value))}
        className="block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm sm:leading-6"
      >
        <option value={10}>10</option>
        <option value={25}>25</option>
        <option value={50}>50</option>
      </select>
    </div>
  );
}
