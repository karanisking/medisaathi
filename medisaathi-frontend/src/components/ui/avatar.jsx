const colors = [
    'bg-blue-500', 'bg-purple-500', 'bg-green-500',
    'bg-orange-500', 'bg-pink-500', 'bg-teal-500',
  ];
  
  const Avatar = ({ name = '', size = 'md', className = '' }) => {
    const sizes = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-10 h-10 text-sm',
      lg: 'w-14 h-14 text-lg',
    };
  
    const initials = name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  
    const colorIndex = name.charCodeAt(0) % colors.length;
  
    return (
      <div className={`
        ${sizes[size]} ${colors[colorIndex]}
        rounded-full flex items-center justify-center
        text-white font-semibold shrink-0
        ${className}
      `}>
        {initials}
      </div>
    );
  };
  
  export default Avatar;