import { createContext, useContext } from 'react';
import toast, { Toaster } from 'react-hot-toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const success = (msg) => toast.success(msg, { duration: 3000 });
  const error   = (msg) => toast.error(msg,   { duration: 4000 });
  const info    = (msg) => toast(msg,          { duration: 3000 });
  const loading = (msg) => toast.loading(msg);
  const dismiss = (id)  => toast.dismiss(id);

  return (
    <ToastContext.Provider value={{ success, error, info, loading, dismiss }}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            borderRadius: '10px',
            fontFamily:   'Inter, sans-serif',
            fontSize:     '14px',
          },
          success: {
            iconTheme: { primary: '#5DB83A', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};