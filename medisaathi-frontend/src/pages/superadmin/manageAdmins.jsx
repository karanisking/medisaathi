import { useState, useEffect }   from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm }               from 'react-hook-form';
import {
  ArrowLeft, Plus, Pencil, Trash2,
  Mail, Building2, X,
} from 'lucide-react';
import { superAdminService } from '../../services/superadminService.js';
import { useToast }          from '../../context/toastContext.jsx';
import DashboardLayout       from '../../components/layout/dashboardLayout.jsx';
import Card                  from '../../components/ui/card.jsx';
import Button                from '../../components/ui/button.jsx';
import Input                 from '../../components/ui/input.jsx';
import Badge                 from '../../components/ui/badge.jsx';
import Avatar                from '../../components/ui/avatar.jsx';
import Spinner               from '../../components/ui/spinner.jsx';
import EmptyState            from '../../components/cards/emptyCard.jsx';
import { ROLES }             from '../../utils/constants.js';

const ROLE_LABELS = {
  overall_admin: 'Overall Admin',
  branch_admin:  'Branch Admin',
};

const ManageAdmins = () => {
  const { hospitalId }     = useParams();
  const navigate           = useNavigate();
  const { success, error } = useToast();

  const [hospital, setHospital] = useState(null);
  const [admins, setAdmins]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModal]   = useState(false);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);
  const [removing, setRemoving] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    fetchAdmins();
  }, [hospitalId]);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await superAdminService.getHospitalAdmins(hospitalId);
      setHospital(res.data.hospital);
      setAdmins(res.data.admins);
    } catch (err) {
      error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (admin) => {
    setEditing(admin);
    reset({ name: admin.name, email: admin.email });
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
    setEditing(null);
    reset({});
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await superAdminService.updateAdmin(editing._id, {
        name:  data.name,
        email: data.email,
      });
      success('Admin updated');
      closeModal();
      fetchAdmins();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update admin');
    } finally {
      setSaving(false);
    }
  };

  const onInvalid = (errs) => {
    console.error('[ManageAdmins] validation errors:', errs);
  };

  const handleRemove = async (admin) => {
    if (!confirm(`Remove ${admin.name} as admin? They will be deactivated.`)) return;
    setRemoving(admin._id);
    try {
      await superAdminService.deleteAdmin(admin._id);
      setAdmins((prev) => prev.filter((a) => a._id !== admin._id));
      success('Admin removed');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to remove admin');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) return (
    <DashboardLayout title="Admins">
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout
      title={`Admins — ${hospital?.name || ''}`}
      subtitle="Manage hospital administrators"
    >
      {/* Back */}
      <button
        onClick={() => navigate('/superadmin/hospitals')}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to hospitals
      </button>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">
          {admins.length} admin{admins.length !== 1 ? 's' : ''}
        </p>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => navigate('/superadmin/hospitals')}
        >
          Add Admin
        </Button>
      </div>

      {/* List */}
      {admins.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-7 h-7" />}
          title="No admins yet"
          description="Add admins from the Manage Hospitals page"
        />
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-gray-50">
            {admins.map((admin) => (
              <div
                key={admin._id}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={admin.name} size="md" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-800">
                        {admin.name}
                      </p>
                      <Badge
                        variant={admin.role === ROLES.OVERALL_ADMIN ? 'brand' : 'purple'}
                        size="sm"
                      >
                        {ROLE_LABELS[admin.role]}
                      </Badge>
                      {!admin.isActive && (
                        <Badge variant="red" size="sm">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail className="w-3 h-3" />
                        {admin.email}
                      </span>
                      {admin.branch?.name && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Building2 className="w-3 h-3" />
                          {admin.branch.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Pencil className="w-3.5 h-3.5" />}
                    onClick={() => openEdit(admin)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={removing === admin._id}
                    onClick={() => handleRemove(admin)}
                    className="text-red-400 hover:text-red-600 hover:bg-red-50"
                    icon={<Trash2 className="w-3.5 h-3.5" />}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
          <div className="flex min-h-full items-center justify-center py-[5%] px-4">
            <div
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Edit Admin</h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit, onInvalid)} noValidate>
                <div className="px-6 py-5 space-y-4">
                  <Input
                    label="Full name"
                    required
                    error={errors.name?.message}
                    {...register('name', { required: 'Name is required' })}
                  />
                  <Input
                    label="Email address"
                    type="email"
                    required
                    error={errors.email?.message}
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value:   /^\S+@\S+\.\S+$/,
                        message: 'Enter a valid email',
                      },
                    })}
                  />
                </div>

                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                  <Button type="button" variant="secondary" onClick={closeModal}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={saving}>
                    Save Changes
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ManageAdmins;