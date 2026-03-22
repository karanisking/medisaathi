const Input = ({
    label,
    error,
    icon,
    type        = 'text',
    placeholder = '',
    className   = '',
    required    = false,
    ...props
  }) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4">
              {icon}
            </div>
          )}
          <input
            type={type}
            placeholder={placeholder}
            className={`
              w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-800
              placeholder:text-gray-400
              focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent
              transition-all duration-200
              ${icon ? 'pl-10' : ''}
              ${error
                ? 'border-red-400 focus:ring-red-400'
                : 'border-gray-200 hover:border-brand-300'
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    );
  };
  
  export default Input;