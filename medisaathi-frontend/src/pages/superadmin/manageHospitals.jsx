import { useState, useEffect }  from 'react';
import { useForm }              from 'react-hook-form';
import {
  Plus, Pencil, Hospital, MapPin,
  UserPlus, Users, X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { superAdminService } from '../../services/superadminService.js';
import { useToast }          from '../../context/toastContext.jsx';
import DashboardLayout       from '../../components/layout/dashboardLayout.jsx';
import Card                  from '../../components/ui/card.jsx';
import Button                from '../../components/ui/button.jsx';
import Input                 from '../../components/ui/input.jsx';
import Badge                 from '../../components/ui/badge.jsx';
import Spinner               from '../../components/ui/spinner.jsx';
import EmptyState            from '../../components/cards/emptyCard.jsx';
import { ROLES }             from '../../utils/constants.js';

const ManageHospitals = () => {
  const { success, error } = useToast();

  const [hospitals, setHospitals]   = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading]       = useState(true);
  const [modalType, setModalType]   = useState(null);
  const [editing, setEditing]       = useState(null);
  const [saving, setSaving]         = useState(false);
  const [toggling, setToggling]     = useState(null);
  const [selectedHospital, setSelectedHospital] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    watch,
  } = useForm({ mode: 'onChange' });

  // Debug — watch all form values live
  const formValues = watch();
  console.log('[Form] current values:', formValues);
  console.log('[Form] current errors:', errors);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async (page = 1) => {
    console.log('[fetchHospitals] fetching page', page);
    setLoading(true);
    try {
      const res = await superAdminService.getHospitals({ page, limit: 12 });
      console.log('[fetchHospitals] response:', res.data);
      setHospitals(res.data.hospitals || []);
      setPagination(res.data.pagination || {});
    } catch (err) {
      console.error('[fetchHospitals] error:', err);
      error(err.response?.data?.message || 'Failed to load hospitals');
    } finally {
      setLoading(false);
    }
  };

  // ── Modal openers ────────────────────────────────────────────────────────────

  const openCreate = () => {
    console.log('[openCreate] opening create modal');
    setEditing(null);
    setModalType(null); // reset first to force re-render
    setTimeout(() => {
      reset({
        name:         '',
        city:         '',
        state:        '',
        description:  '',
        contactEmail: '',
        contactPhone: '',
        website:      '',
      });
      setModalType('hospital');
    }, 50);
  };

  const openEdit = (hospital) => {
    console.log('[openEdit] editing hospital:', hospital._id);
    setEditing(hospital);
    setModalType(null);
    setTimeout(() => {
      reset({
        name:         hospital.name         || '',
        city:         hospital.city         || '',
        state:        hospital.state        || '',
        description:  hospital.description  || '',
        contactEmail: hospital.contactEmail || '',
        contactPhone: hospital.contactPhone || '',
        website:      hospital.website      || '',
      });
      setModalType('hospital');
    }, 50);
  };

  const openAddAdmin = (hospital) => {
    console.log('[openAddAdmin] for hospital:', hospital._id);
    setSelectedHospital(hospital);
    setModalType(null);
    setTimeout(() => {
      reset({ name: '', email: '', password: '', role: '' });
      setModalType('admin');
    }, 50);
  };

  const closeModal = () => {
    console.log('[closeModal] closing');
    setModalType(null);
    setEditing(null);
    setSelectedHospital(null);
    reset({});
  };

  // ── Submit handlers ──────────────────────────────────────────────────────────

  const onSubmitHospital = async (data) => {
    console.log('[onSubmitHospital] CALLED with data:', data);

    if (!data.name || !data.city || !data.state) {
      console.error('[onSubmitHospital] Missing required fields');
      error('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name:         data.name.trim(),
        city:         data.city.trim(),
        state:        data.state.trim(),
        description:  data.description?.trim()  || '',
        contactEmail: data.contactEmail?.trim() || '',
        contactPhone: data.contactPhone?.trim() || '',
        website:      data.website?.trim()      || '',
      };

      console.log('[onSubmitHospital] sending payload:', payload);

      let res;
      if (editing) {
        res = await superAdminService.updateHospital(editing._id, payload);
        console.log('[onSubmitHospital] update response:', res);
        success('Hospital updated successfully');
      } else {
        res = await superAdminService.createHospital(payload);
        console.log('[onSubmitHospital] create response:', res);
        success('Hospital created successfully');
      }

      closeModal();
      fetchHospitals();
    } catch (err) {
      console.error('[onSubmitHospital] API error:', err);
      console.error('[onSubmitHospital] error response:', err.response?.data);
      error(err.response?.data?.message || 'Failed to save hospital');
    } finally {
      setSaving(false);
    }
  };

  const onSubmitAdmin = async (data) => {
    console.log('[onSubmitAdmin] CALLED with data:', data);
    setSaving(true);
    try {
      const payload = {
        name:       data.name,
        email:      data.email,
        password:   data.password,
        role:       data.role,
        hospitalId: selectedHospital._id,
      };
      console.log('[onSubmitAdmin] sending payload:', payload);
      const res = await superAdminService.createAdmin(payload);
      console.log('[onSubmitAdmin] response:', res);
      success('Admin created successfully');
      closeModal();
    } catch (err) {
      console.error('[onSubmitAdmin] error:', err.response?.data);
      error(err.response?.data?.message || 'Failed to create admin');
    } finally {
      setSaving(false);
    }
  };

  // Called when handleSubmit validation FAILS
  const onInvalid = (errs) => {
    console.error('[onInvalid] Validation failed — these fields have errors:', errs);
    Object.entries(errs).forEach(([field, err]) => {
      console.error(`  Field "${field}": ${err.message}`);
    });
  };

  const handleToggleActive = async (hospital) => {
    setToggling(hospital._id);
    try {
      await superAdminService.updateHospital(hospital._id, {
        isActive: !hospital.isActive,
      });
      setHospitals((prev) =>
        prev.map((h) =>
          h._id === hospital._id ? { ...h, isActive: !h.isActive } : h
        )
      );
      success(hospital.isActive ? 'Hospital deactivated' : 'Hospital activated');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update');
    } finally {
      setToggling(null);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout title="Manage Hospitals" subtitle="Onboard and manage hospital accounts">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">
          {pagination.total ?? hospitals.length} hospital{(pagination.total ?? hospitals.length) !== 1 ? 's' : ''}
        </p>
        <Button
          icon={<Plus className="w-4 h-4" />}
          onClick={() => {
            console.log('[Button] Add Hospital clicked');
            openCreate();
          }}
        >
          Add Hospital
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size="lg" />
        </div>
      ) : hospitals.length === 0 ? (
        <EmptyState
          icon={<Hospital className="w-7 h-7" />}
          title="No hospitals yet"
          description="Add your first hospital to get started"
          action={
            <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              Add Hospital
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {hospitals.map((hospital) => (
            <Card key={hospital._id} padding={false} className="overflow-hidden">
              <div className="h-32 bg-linear-to-br from-brand-100 to-brand-200 flex items-center justify-center overflow-hidden">
                {hospital.images?.[0]?.url ? (
                  <img
                    src={hospital.images[0].url}
                    alt={hospital.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-brand-400">
                    {hospital.name?.charAt(0)?.toUpperCase()}
                  </span>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-gray-800 text-sm line-clamp-2">
                    {hospital.name}
                  </h3>
                  <Badge variant={hospital.isActive ? 'green' : 'red'} size="sm">
                    {hospital.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="capitalize">{hospital.city}, {hospital.state}</span>
                </div>

                <p className="text-xs text-gray-400 mb-4">
                  {hospital.branchCount ?? 0} branch{(hospital.branchCount ?? 0) !== 1 ? 'es' : ''}
                </p>

                // Replace the existing grid grid-cols-3 div inside each hospital card
<div className="grid grid-cols-2 gap-1.5 mt-3">
  <Button
    variant="secondary"
    size="sm"
    icon={<Pencil className="w-3 h-3" />}
    onClick={() => openEdit(hospital)}
  >
    Edit
  </Button>
  <Button
    variant="secondary"
    size="sm"
    icon={<UserPlus className="w-3 h-3" />}
    onClick={() => openAddAdmin(hospital)}
  >
    Add Admin
  </Button>
  <Button
    variant="secondary"
    size="sm"
    icon={<Users className="w-3 h-3" />}
    onClick={() => navigate(`/superadmin/hospitals/${hospital._id}/admins`)}
  >
    View Admins
  </Button>
  <Button
    variant={hospital.isActive ? 'danger' : 'success'}
    size="sm"
    loading={toggling === hospital._id}
    onClick={() => handleToggleActive(hospital)}
  >
    {hospital.isActive ? 'Disable' : 'Enable'}
  </Button>
</div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Hospital Modal ─────────────────────────────────────────────────────── */}
      {modalType === 'hospital' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
          <div className="flex min-h-full items-center justify-center py-[5%] px-4">
            <div
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">
                  {editing ? 'Edit Hospital' : 'Add Hospital'}
                </h2>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body — the form is INSIDE here, button too */}
              <form
                onSubmit={handleSubmit(onSubmitHospital, onInvalid)}
                noValidate
              >
                <div className="px-6 py-5 overflow-y-auto max-h-[60vh] space-y-4">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                    <div className="sm:col-span-2">
                      <Input
                        label="Hospital name"
                        placeholder="e.g. City General Hospital"
                        required
                        error={errors.name?.message}
                        {...register('name', {
                          required: 'Hospital name is required',
                        })}
                      />
                    </div>

                    <Input
                      label="City"
                      placeholder="e.g. Pune"
                      required
                      error={errors.city?.message}
                      {...register('city', {
                        required: 'City is required',
                      })}
                    />

                    <Input
                      label="State"
                      placeholder="e.g. Maharashtra"
                      required
                      error={errors.state?.message}
                      {...register('state', {
                        required: 'State is required',
                      })}
                    />

                    <Input
                      label="Contact phone"
                      required
                      placeholder="+91 98765 43210"
                      {...register('contactPhone')}
                    />

                    <Input
                      label="Contact email"
                      type="email"
                      required
                      placeholder="info@hospital.com"
                      error={errors.contactEmail?.message}
                      {...register('contactEmail', {
                        pattern: {
                          value:   /^\S+@\S+\.\S+$/,
                          message: 'Enter a valid email',
                        },
                      })}
                    />

                    <div className="sm:col-span-2">
                      <Input
                        label="Website"
                        placeholder="https://www.hospital.com"
                        {...register('website')}
                      />
                    </div>

                    <div className="sm:col-span-2 flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Brief description..."
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-400"
                        {...register('description')}
                      />
                    </div>

                  </div>
                </div>

                {/* Footer — button is INSIDE the form */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={saving}
                    disabled={saving}
                  >
                    {saving
                      ? (editing ? 'Saving...' : 'Creating...')
                      : (editing ? 'Save Changes' : 'Create Hospital')
                    }
                  </Button>
                </div>
              </form>

            </div>
          </div>
        </div>
      )}

      {/* ── Admin Modal ────────────────────────────────────────────────────────── */}
      {modalType === 'admin' && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black/40" onClick={closeModal} />
          <div className="flex min-h-full items-center justify-center py-[5%] px-4">
            <div
              className="relative w-full max-w-md bg-white rounded-2xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Add Admin</h2>
                  <p className="text-xs text-gray-400 mt-0.5">{selectedHospital?.name}</p>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form — button INSIDE form */}
              <form onSubmit={handleSubmit(onSubmitAdmin, onInvalid)} noValidate>
                <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[60vh]">

                  <Input
                    label="Full name"
                    placeholder="Admin's full name"
                    required
                    error={errors.name?.message}
                    {...register('name', { required: 'Name is required' })}
                  />

                  <Input
                    label="Email address"
                    type="email"
                    placeholder="admin@hospital.com"
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

                  <Input
                    label="Password"
                    type="password"
                    placeholder="Min. 6 characters"
                    required
                    error={errors.password?.message}
                    {...register('password', {
                      required:  'Password is required',
                      minLength: { value: 6, message: 'Min 6 characters' },
                    })}
                  />

                  <div className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-gray-700">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      className={`
                        w-full px-4 py-2.5 text-sm border rounded-xl bg-white
                        focus:outline-none focus:ring-2 focus:ring-brand-400
                        ${errors.role ? 'border-red-400' : 'border-gray-200'}
                      `}
                      {...register('role', { required: 'Role is required' })}
                    >
                      <option value="">Select a role</option>
                      <option value={ROLES.OVERALL_ADMIN}>Overall Admin</option>
                    </select>
                    {errors.role && (
                      <p className="text-xs text-red-500">{errors.role.message}</p>
                    )}
                  </div>

                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    loading={saving}
                    disabled={saving}
                  >
                    {saving ? 'Creating...' : 'Create Admin'}
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

export default ManageHospitals;
