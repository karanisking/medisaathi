const EmptyState = ({ icon, title, description, action }) => {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        {icon && (
          <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mb-4 text-brand-400">
            {icon}
          </div>
        )}
        <h3 className="text-lg font-semibold text-gray-700 mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-gray-400 max-w-xs mb-6">{description}</p>
        )}
        {action}
      </div>
    );
  };
  
  export default EmptyState;