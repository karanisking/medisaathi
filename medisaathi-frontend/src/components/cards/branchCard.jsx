import { useNavigate }              from 'react-router-dom';
import { MapPin, Clock, Users }     from 'lucide-react';
import Card   from '../ui/card.jsx';
import Badge  from '../ui/badge.jsx';

const BranchCard = ({ branch, hospitalName }) => {
  const navigate = useNavigate();

  return (
    <Card
      hover
      padding={false}
      onClick={() => navigate(`/branches/${branch._id}`)}
      className="overflow-hidden"
    >
      {/* Image */}
      <div className="h-36 bg-brand-50 overflow-hidden">
        {branch.images?.[0]?.url ? (
          <img
            src={branch.images[0].url}
            alt={branch.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-brand-100 to-brand-200">
            <span className="text-4xl font-bold text-brand-400">
              {branch.name?.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">{branch.name}</h3>
            {hospitalName && (
              <p className="text-xs text-gray-400">{hospitalName}</p>
            )}
          </div>
          <Badge
            variant={branch.queueEnabled ? 'green' : 'gray'}
            dot
            size="sm"
          >
            {branch.queueEnabled ? 'Queue Open' : 'Closed'}
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
          <MapPin className="w-3.5 h-3.5" />
          <span className="capitalize line-clamp-1">{branch.address || `${branch.city}, ${branch.state}`}</span>
        </div>

        <div className="flex items-center gap-1 text-gray-400 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{branch.openTime} – {branch.closeTime}</span>
        </div>
      </div>
    </Card>
  );
};

export default BranchCard;