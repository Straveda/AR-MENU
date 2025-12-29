import React from 'react';
import { PERMISSION_GROUPS_UI } from '../../constants/permissions';

const PermissionMatrix = ({ selectedPermissions = [], onChange, disabled = false }) => {

  const handleToggle = (perm) => {
    if (disabled) return;
    
    if (selectedPermissions.includes(perm)) {
      onChange(selectedPermissions.filter(p => p !== perm));
    } else {
      onChange([...selectedPermissions, perm]);
    }
  };

  const handleGroupToggle = (groupPerms) => {
      if (disabled) return;
      
      const allSelected = groupPerms.every(p => selectedPermissions.includes(p));
      
      if (allSelected) {
          // Deselect all
          onChange(selectedPermissions.filter(p => !groupPerms.includes(p)));
      } else {
          // Select all
          // additive merge
          const newSet = new Set([...selectedPermissions, ...groupPerms]);
          onChange(Array.from(newSet));
      }
  };

  return (
    <div className="space-y-6">
      {Object.entries(PERMISSION_GROUPS_UI).map(([groupName, permissions]) => (
        <div key={groupName} className="bg-white border rounded-lg overflow-hidden shadow-sm">
          <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
            <h3 className="font-medium text-slate-700">{groupName}</h3>
            <button
                type="button"
                onClick={() => handleGroupToggle(permissions)}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
                disabled={disabled}
            >
                {permissions.every(p => selectedPermissions.includes(p)) ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {permissions.map((perm) => (
              <div 
                key={perm} 
                className={`flex items-center space-x-3 p-2 rounded transition-colors ${
                  selectedPermissions.includes(perm) ? 'bg-indigo-50 border border-indigo-100' : 'hover:bg-slate-50 border border-transparent'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
                onClick={() => !disabled && handleToggle(perm)}
              >
                <button
                  type="button"
                  role="switch"
                  aria-checked={selectedPermissions.includes(perm)}
                  onClick={(e) => { e.stopPropagation(); handleToggle(perm); }}  disabled={disabled}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                    selectedPermissions.includes(perm) ? 'bg-indigo-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      selectedPermissions.includes(perm) ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
                
                <span className="text-sm text-gray-700 font-medium">
                  {perm.replace(/:/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PermissionMatrix;
