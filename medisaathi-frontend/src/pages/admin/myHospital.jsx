import { useState, useEffect }  from 'react';
import { useNavigate }          from 'react-router-dom';
import {
  MapPin, Phone, Globe, Mail,
  Building2, Clock, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { adminService }    from '../../services/adminService.js';
import { useAuth }         from '../../context/authContext.jsx';
import { useToast }        from '../../context/toastContext.jsx';
import DashboardLayout     from '../../components/layout/dashboardLayout.jsx';
import Card                from '../../components/ui/card.jsx';
import Badge               from '../../components/ui/badge.jsx';
import Button              from '../../components/ui/button.jsx';
import Spinner             from '../../components/ui/spinner.jsx';
import QueueStatusBar      from '../../components/cards/queueCard.jsx';
import { ROLES }           from '../../utils/constants.js';
import { branchService }   from '../../services/branchService.js';

const MyHospital = () => {
  const { user }           = useAuth();
  const { success, error } = useToast();
  const navigate           = useNavigate();

  const [branches, setBranches]   = useState([]);
  const [hospital, setHospital]   = useState(null);
  const [queueMap, setQueueMap]   = useState({}); // branchId → queueStatus
  const [loading, setLoading]     = useState(true);
  const [toggling, setToggling]   = useState(null);

  const isBranchScoped =
    user?.role === ROLES.BRANCH_ADMIN ||
    user?.role === ROLES.STAFF;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const bRes = await adminService.getBranches();
      const branchList = bRes.data.branches || [];
      setBranches(branchList);

      // Fetch queue status for each branch in parallel
      const queueResults = await Promise.allSettled(
        branchList.map((b) => branchService.getQueueStatus(b._id))
      );

      const map = {};
      branchList.forEach((b, i) => {
        if (queueResults[i].status === 'fulfilled') {
          map[b._id] = queueResults[i].value.data;
        }
      });
      setQueueMap(map);

      // Extract hospital info from first branch
      if (branchList.length > 0 && branchList[0].hospital) {
        setHospital(branchList[0].hospital);
      }
    } catch (err) {
      error('Failed to load hospital data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (branch) => {
    setToggling(branch._id);
    try {
      const res = await adminService.toggleQueue(branch._id);
      setBranches((prev) =>
        prev.map((b) =>
          b._id === branch._id
            ? { ...b, queueEnabled: res.data.queueEnabled }
            : b
        )
      );
      success(res.data.queueEnabled ? 'Queue enabled' : 'Queue disabled');
    } catch {
      error('Failed to toggle queue');
    } finally {
      setToggling(null);
    }
  };

  if (loading) return (
    <DashboardLayout title="My Hospital">
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout
      title="My Hospital"
      subtitle={isBranchScoped ? 'Your assigned branch' : 'All branches'}
    >

      {/* Hospital info card */}
      {hospital && (
        <Card className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            {/* Image or initial */}
            <div className="w-16 h-16 rounded-2xl bg-brand-100 flex items-center justify-center shrink-0">
              {hospital.images?.[0]?.url ? (
                <img
                  src={hospital.images[0].url}
                  alt={hospital.name}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                <span className="text-2xl font-bold text-brand-500">
                  {hospital.name?.charAt(0)?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-800 mb-3">
                {hospital.name}
              </h2>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-gray-500">
                {hospital.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-brand-400" />
                    <span className="capitalize">{hospital.city}, {hospital.state}</span>
                  </span>
                )}
                {hospital.contactPhone && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-4 h-4 text-brand-400" />
                    {hospital.contactPhone}
                  </span>
                )}
                {hospital.contactEmail && (
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-4 h-4 text-brand-400" />
                    {hospital.contactEmail}
                  </span>
                )}
                {hospital.website && (
                 <a 
                    href={hospital.website}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-brand-600 hover:underline"
                  >
                    <Globe className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>
              {hospital.description && (
                <p className="text-sm text-gray-400 mt-2 leading-relaxed">
                  {hospital.description}
                </p>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Branches */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-700">
          {isBranchScoped ? 'Your Branch' : `Branches (${branches.length})`}
        </h3>
        {user?.role === ROLES.OVERALL_ADMIN && (
          <Button
            variant="secondary"
            size="sm"
            icon={<Building2 className="w-4 h-4" />}
            onClick={() => navigate('/admin/branches')}
          >
            Manage Branches
          </Button>
        )}
      </div>

      {branches.length === 0 ? (
        <Card>
          <p className="text-sm text-gray-400 text-center py-8">
            No branches found
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {branches.map((branch) => (
            <Card key={branch._id} padding={false} className="overflow-hidden">

              {/* Branch image */}
              <div className="h-36 bg-linear-to-br from-brand-100 to-brand-200 flex items-center justify-center overflow-hidden">
                {branch.images?.[0]?.url ? (
                  <img
                    src={branch.images[0].url}
                    alt={branch.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-brand-400">
                    {branch.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="p-4">
                {/* Name + status */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h4 className="font-semibold text-gray-800">{branch.name}</h4>
                  <Badge
                    variant={branch.queueEnabled ? 'green' : 'gray'}
                    dot
                    size="sm"
                  >
                    {branch.queueEnabled ? 'Queue Open' : 'Queue Closed'}
                  </Badge>
                </div>

                {/* Branch details */}
                <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span className="capitalize line-clamp-1">
                      {branch.address || `${branch.city}, ${branch.state}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                    <span>{branch.openTime} – {branch.closeTime}</span>
                  </div>
                  {branch.contactPhone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                      <span>{branch.contactPhone}</span>
                    </div>
                  )}
                </div>

                {/* Problem categories */}
                {branch.problemCategories?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {branch.problemCategories.map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 bg-brand-50 text-brand-600 rounded-full text-xs font-medium capitalize"
                      >
                        {cat === 'ent' ? 'ENT' : cat}
                      </span>
                    ))}
                  </div>
                )}

                {/* Live queue status */}
                {queueMap[branch._id] && (
                  <div className="mb-4">
                    <QueueStatusBar
                      queueStatus={queueMap[branch._id]}
                      compact
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {/* Toggle queue — not for staff */}
                  {user?.role !== ROLES.STAFF && (
                    <button
                      onClick={() => handleToggle(branch)}
                      disabled={toggling === branch._id}
                      className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-brand-600 transition-colors disabled:opacity-50"
                    >
                      {toggling === branch._id ? (
                        <Spinner size="sm" />
                      ) : branch.queueEnabled ? (
                        <ToggleRight className="w-5 h-5 text-green-500" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                      {branch.queueEnabled ? 'Disable Queue' : 'Enable Queue'}
                    </button>
                  )}

                  {/* Staff goes to their dashboard */}
                  {user?.role === ROLES.STAFF && (
                    <Button
                      size="sm"
                      onClick={() => navigate('/staff')}
                      className="flex-1"
                    >
                      Go to Queue Dashboard
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default MyHospital;