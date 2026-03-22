import { useEffect } from 'react';
import { X }         from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size      = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    // Full screen overlay — scrollable
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Centering wrapper with top/bottom padding */}
      <div className="flex min-h-full items-center justify-center py-[5%] px-4">

        {/* Modal box */}
        <div className={`
          relative w-full ${sizes[size]} bg-white rounded-2xl shadow-xl
          ${className}
        `}>

          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body — scrollable if content is tall */}
          <div className="p-5 overflow-y-auto max-h-[74vh]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;