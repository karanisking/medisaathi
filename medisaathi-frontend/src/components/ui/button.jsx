import Spinner from './spinner.jsx';

const variants = {
  primary:   'bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800',
  secondary: 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200',
  danger:    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  ghost:     'bg-transparent text-brand-600 hover:bg-brand-50',
  success:   'bg-accent text-white hover:bg-accent-dark',
};

const sizes = {
  sm:   'px-3 py-1.5 text-sm',
  md:   'px-5 py-2.5 text-sm',
  lg:   'px-6 py-3 text-base',
  full: 'w-full px-5 py-3 text-base',
};

const Button = ({
  children,
  variant  = 'primary',
  size     = 'md',
  loading  = false,
  disabled = false,
  icon,
  onClick,
  type     = 'button',
  className = '',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium rounded-xl
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading ? (
        <Spinner size="sm" />
      ) : icon ? (
        <span className="w-4 h-4">{icon}</span>
      ) : null}
      {children}
    </button>
  );
};

export default Button;