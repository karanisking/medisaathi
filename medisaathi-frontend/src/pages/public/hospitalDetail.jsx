import { useState, useEffect }   from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Globe, ArrowLeft } from 'lucide-react';
import { hospitalService }  from '../../services/hospitalService.js';
import PageWrapper          from '../../components/layout/pageWrapper.jsx';
import BranchCard           from '../../components/cards/branchCard.jsx';
import Spinner              from '../../components/ui/spinner.jsx';
import Button               from '../../components/ui/button.jsx';

const HospitalDetail = () => {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await hospitalService.getById(id);
        setData(res.data);
      } catch {
        navigate('/hospitals');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  if (loading) return (
    <PageWrapper>
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </PageWrapper>
  );

  if (!data) return null;

  const { hospital, branches } = data;

  return (
    <PageWrapper>
      {/* Back */}
      <button
        onClick={() => navigate('/hospitals')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to hospitals
      </button>

      {/* Hospital header */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-8">
        {hospital.images?.[0]?.url && (
          <div className="h-56 overflow-hidden">
            <img
              src={hospital.images[0].url}
              alt={hospital.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-3">{hospital.name}</h1>

          <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-brand-500" />
              <span className="capitalize">{hospital.city}, {hospital.state}</span>
            </div>
            {hospital.contactPhone && (
              <div className="flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-brand-500" />
                <span>{hospital.contactPhone}</span>
              </div>
            )}
            {hospital.website && (
              <a
                href={hospital.website}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-brand-600 hover:underline"
              >
                <Globe className="w-4 h-4" />
                <span>Website</span>
              </a>
            )}
          </div>

          {hospital.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{hospital.description}</p>
          )}
        </div>
      </div>

      {/* Branches */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-5">
          Branches ({branches.length})
        </h2>
        {branches.length === 0 ? (
          <p className="text-gray-400 text-sm">No branches available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {branches.map((b) => (
              <BranchCard key={b._id} branch={b} hospitalName={hospital.name} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};

export default HospitalDetail;