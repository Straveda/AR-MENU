import React from 'react';
import Toast from './Toast';

const ToastContainer = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 sm:bottom-4 sm:left-auto sm:right-4 z-50 flex flex-col gap-2 pointer-events-none p-4 w-full sm:w-auto items-stretch sm:items-end">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          {...toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
