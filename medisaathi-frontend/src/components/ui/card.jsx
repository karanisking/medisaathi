const Card = ({
    children,
    className = '',
    padding   = true,
    hover     = false,
    onClick,
  }) => {
    return (
      <div
        onClick={onClick}
        className={`
          bg-white rounded-2xl border border-gray-100 shadow-sm
          ${padding ? 'p-5' : ''}
          ${hover ? 'hover:shadow-md hover:border-brand-200 transition-all duration-200 cursor-pointer' : ''}
          ${className}
        `}
      >
        {children}
      </div>
    );
  };
  
  export default Card;