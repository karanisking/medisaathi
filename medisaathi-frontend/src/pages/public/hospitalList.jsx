import { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, SlidersHorizontal } from 'lucide-react';
import { hospitalService }  from '../../services/hospitalService.js';
import PageWrapper          from '../../components/layout/pageWrapper.jsx';
import HospitalCard         from '../../components/cards/hospitalCard.jsx';
import Spinner              from '../../components/ui/spinner.jsx';
import EmptyState           from '../../components/cards/emptyCard.jsx'

const STATES = [
  'All States','Maharashtra','Delhi','Karnataka','Tamil Nadu',
  'Gujarat','Rajasthan','Uttar Pradesh','West Bengal','Telangana',
];

const HospitalList = () => {
  const [hospitals, setHospitals]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [city, setCity]             = useState('');
  const [state, setState]           = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchHospitals = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 12 };
      if (search) params.search = search;
      if (city)   params.city   = city;
      if (state && state !== 'All States') params.state = state;

      const res = await hospitalService.getAll(params);
      setHospitals(res.data.hospitals);
      setPagination(res.data.pagination);
    } catch {
      setHospitals([]);
    } finally {
      setLoading(false);
    }
  }, [search, city, state]);

  useEffect(() => {
    const timer = setTimeout(() => fetchHospitals(1), 400);
    return () => clearTimeout(timer);
  }, [fetchHospitals]);

  return (
    <PageWrapper>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-1">Find a Hospital</h1>
        <p className="text-gray-500">Search hospitals and join their queue online</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-8">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search hospitals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
          </div>

          {/* City */}
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full sm:w-40 pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
            />
          </div>

          {/* State */}
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full sm:w-48 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
          >
            {STATES.map((s) => (
              <option key={s} value={s === 'All States' ? '' : s.toLowerCase()}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : hospitals.length === 0 ? (
        <EmptyState
          icon={<Search className="w-8 h-8" />}
          title="No hospitals found"
          description="Try a different search term or clear filters"
        />
      ) : (
        <>
          <p className="text-sm text-gray-400 mb-4">{pagination.total} hospital{pagination.total !== 1 ? 's' : ''} found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {hospitals.map((h) => (
              <HospitalCard key={h._id} hospital={h} />
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => fetchHospitals(p)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${
                    p === pagination.page
                      ? 'bg-brand-600 text-white'
                      : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </PageWrapper>
  );
};

export default HospitalList;