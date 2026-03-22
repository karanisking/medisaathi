const StatsCard = ({ label, value, icon, color = 'brand', sub }) => {
    const colors = {
      brand:  'bg-brand-50 text-brand-600',
      green:  'bg-green-50 text-green-600',
      yellow: 'bg-yellow-50 text-yellow-600',
      red:    'bg-red-50 text-red-600',
      purple: 'bg-purple-50 text-purple-600',
    };
  
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-gray-500 mb-1">{label}</p>
            <p className="text-3xl font-bold text-gray-800">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
          </div>
          {icon && (
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}>
              {icon}
            </div>
          )}
        </div>
      </div>
    );
  };
  
  export default StatsCard;