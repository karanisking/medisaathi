import { useNavigate }         from 'react-router-dom';
import { MapPin, Phone, ArrowRight } from 'lucide-react';
import Card   from '../ui/card.jsx';
import Badge  from '../ui/badge.jsx';

const HospitalCard = ({ hospital }) => {
  const navigate = useNavigate();

  return (
    <Card
      hover
      padding={false}
      onClick={() => navigate(`/hospitals/${hospital._id}`)}
      className="overflow-hidden"
    >
      {/* Image */}
      <div className="h-44 bg-brand-100 overflow-hidden">
        {hospital.images?.[0]?.url ? (
          <img
            src={hospital.images[0].url}
            alt={hospital.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl font-bold text-brand-300">
              {hospital.name?.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-800 text-base leading-snug">
            {hospital.name}
          </h3>
          <Badge variant="brand" size="sm">
            {hospital.branchCount ?? 0} branches
          </Badge>
        </div>

        <div className="flex items-center gap-1 text-gray-400 text-xs mb-1">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="capitalize">{hospital.city}, {hospital.state}</span>
        </div>

        {hospital.contactPhone && (
          <div className="flex items-center gap-1 text-gray-400 text-xs mb-3">
            <Phone className="w-3.5 h-3.5 shrink-0" />
            <span>{hospital.contactPhone}</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
          <p className="text-xs text-gray-400 line-clamp-1">
            {hospital.description || 'View branches and join queue'}
          </p>
          <ArrowRight className="w-4 h-4 text-brand-500 shrink-0" />
        </div>
      </div>
    </Card>
  );
};

export default HospitalCard;