import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X, AlertTriangle } from 'lucide-react';

const ICONS = {
  success: <CheckCircle className="w-5 h-5 text-green-500" />,
  error:   <XCircle    className="w-5 h-5 text-red-500"   />,
  info:    <Info       className="w-5 h-5 text-blue-500"  />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500" />,
};

const STYLES = {
  success: 'border-green-200  bg-green-50',
  error:   'border-red-200    bg-red-50',
  info:    'border-blue-200   bg-blue-50',
  warning: 'border-yellow-200 bg-yellow-50',
};

// Single toast item — used internally by ToastContainer
export const ToastItem = ({ id, type = 'info', message, onRemove }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const show = setTimeout(() => setVisible(true), 10);
    // Auto-dismiss
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(id), 300);
    }, 4000);
    return () => { clearTimeout(show); clearTimeout(hide); };
  }, [id, onRemove]);

  return (
    <div className={`
      flex items-start gap-3 w-full max-w-sm px-4 py-3
      bg-white border rounded-2xl shadow-lg
      transition-all duration-300
      ${STYLES[type]}
      ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}
    `}>
      <span className="shrink-0 mt-0.5">{ICONS[type]}</span>
      <p className="text-sm text-gray-700 flex-1 leading-snug">{message}</p>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onRemove(id), 300); }}
        className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Container that renders all toasts — mount once in App.jsx if not using react-hot-toast
export const ToastContainer = ({ toasts = [], onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-100 flex flex-col gap-2">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onRemove={onRemove} />
      ))}
    </div>
  );
};

export default ToastItem;