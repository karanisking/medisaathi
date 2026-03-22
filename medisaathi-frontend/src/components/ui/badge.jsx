const variants = {
    blue:    'bg-blue-100 text-blue-700',
    green:   'bg-green-100 text-green-700',
    yellow:  'bg-yellow-100 text-yellow-700',
    red:     'bg-red-100 text-red-700',
    purple:  'bg-purple-100 text-purple-700',
    gray:    'bg-gray-100 text-gray-600',
    brand:   'bg-brand-100 text-brand-700',
  };
  
  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
  };
  
  const Badge = ({
    children,
    variant   = 'brand',
    size      = 'sm',
    dot       = false,
    className = '',
  }) => {
    return (
      <span className={`
        inline-flex items-center gap-1.5 font-medium rounded-full
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}>
        {dot && (
          <span className={`w-1.5 h-1.5 rounded-full ${
            variant === 'green'  ? 'bg-green-500'  :
            variant === 'red'    ? 'bg-red-500'    :
            variant === 'yellow' ? 'bg-yellow-500' :
            'bg-current'
          }`} />
        )}
        {children}
      </span>
    );
  };
  
  export default Badge;