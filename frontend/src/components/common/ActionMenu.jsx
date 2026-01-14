import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';


export default function ActionMenu({ actions = [], align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const scrollY = window.scrollY;
      const scrollX = window.scrollX;
      
      
      
      let top = rect.bottom + scrollY + 8; 
      let left = align === 'right' 
        ? rect.right + scrollX - 192 
        : rect.left + scrollX;

      
      if (left < 10) left = 10;
      if (left + 192 > window.innerWidth) left = window.innerWidth - 202;

      setPosition({ top, left });
    }
  }, [isOpen, align]);

  
  useEffect(() => {
    function handleClickOutside(event) {
      const isClickInsideButton = buttonRef.current && buttonRef.current.contains(event.target);
      const isClickInsideMenu = menuRef.current && menuRef.current.contains(event.target);

      if (!isClickInsideButton && !isClickInsideMenu) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("scroll", () => setIsOpen(false)); 
        window.addEventListener("resize", () => setIsOpen(false));
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", () => setIsOpen(false));
      window.removeEventListener("resize", () => setIsOpen(false));
    };
  }, [isOpen]);

  if (!actions.length) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-lg transition-colors text-slate-400 hover:text-slate-600 hover:bg-slate-100 ${isOpen ? 'bg-slate-100 text-slate-600' : ''}`}
        title="Actions"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div 
            ref={menuRef}
            style={{ 
                position: 'absolute',
                top: `${position.top}px`, 
                left: `${position.left}px`,
                zIndex: 9999 
            }}
            className="w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-1 animate-fade-in-up"
        >
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              disabled={action.disabled}
              className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 hover:bg-slate-50 transition-colors ${action.className || 'text-slate-600'} ${action.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {action.icon && <span className="w-4 h-4">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  );
}
