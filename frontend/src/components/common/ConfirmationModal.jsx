import Modal from "./Modal";

export default function ConfirmationModal({ 
  isOpen, 
  title, 
  message, 
  confirmLabel = "Confirm", 
  cancelLabel = "Cancel", 
  onConfirm, 
  onCancel, 
  isDangerous = false,
  isLoading = false
}) {
  if (!isOpen) return null;

  return (
    <Modal title={title} onClose={onCancel} size="sm">
      <div className="sm:flex sm:items-start">
        <div className={`mx-auto flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${isDangerous ? 'bg-red-100' : 'bg-amber-100'} sm:mx-0 sm:h-10 sm:w-10`}>
          {isDangerous ? (
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          ) : (
            <svg className="h-6 w-6 text-amber-600" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          )}
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <div className="text-sm text-gray-500">
            {message}
          </div>
        </div>
      </div>
      <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
        <button
          type="button"
          className="inline-flex w-full justify-center rounded-lg bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto"
          onClick={onCancel}
          disabled={isLoading}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          className={`inline-flex w-full justify-center rounded-lg px-3 py-2 text-sm font-semibold text-white shadow-sm sm:w-auto items-center gap-2 ${
            isDangerous 
              ? 'bg-red-600 hover:bg-red-500' 
              : 'bg-indigo-600 hover:bg-indigo-500'
          } disabled:opacity-70 disabled:cursor-not-allowed`}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {isLoading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
