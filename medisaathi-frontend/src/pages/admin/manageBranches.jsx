import { useState, useEffect } from 'react';
import { useForm }             from 'react-hook-form';
import { Plus, Pencil, Building2, MapPin, Clock } from 'lucide-react';
import { adminService }    from '../../services/adminService.js';
import { useAuth }         from '../../context/authContext.jsx';
import { useToast }        from '../../context/toastContext.jsx';
import DashboardLayout     from '../../components/layout/dashboardLayout.jsx';
import Card                from '../../components/ui/card.jsx';
import Button              from '../../components/ui/button.jsx';
import Input               from '../../components/ui/input.jsx';
import Badge               from '../../components/ui/badge.jsx';
import Modal               from '../../components/ui/modal.jsx';
import Spinner             from '../../components/ui/spinner.jsx';
import EmptyState          from '../../components/cards/emptyCard.jsx';
import { ROLES }           from '../../utils/constants.js';

const ManageBranches = () => {
  const { user }           = useAuth();
  const { success, error } = useToast();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModal]   = useState(false);
  const [editing, setEditing]   = useState(null);
  const [saving, setSaving]     = useState(false);

  const isOverall = user?.role === ROLES.OVERALL_ADMIN;

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => { fetchBranches(); }, []);

  const fetchBranches = async () => {
    try {
      const res = await adminService.getBranches();
      setBranches(res.data.branches);
    } catch {
      error('Failed to load branches');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditing(null);
    reset({});
    setModal(true);
  };

  const openEdit = (branch) => {
    setEditing(branch);
    reset({
      name:         branch.name,
      city:         branch.city,
      state:        branch.state,
      address:      branch.address,
      contactPhone: branch.contactPhone,
      contactEmail: branch.contactEmail,
      openTime:     branch.openTime,
      closeTime:    branch.closeTime,
      skipTimeoutSec: branch.skipTimeoutSec,
    });
    setModal(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editing) {
        await adminService.updateBranch(editing._id, data);
        success('Branch updated');
      } else {
        await adminService.createBranch(data);
        success('Branch created');
      }
      setModal(false);
      fetchBranches();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save branch');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (branch) => {
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
    }
  };

  if (loading) return (
    <DashboardLayout title="Branches">
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Manage Branches" subtitle="View and configure your branches">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">{branches.length} branch{branches.length !== 1 ? 'es' : ''}</p>
        {isOverall && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
            Add Branch
          </Button>
        )}
      </div>

      {/* Branch list */}
      {branches.length === 0 ? (
        <EmptyState
          icon={<Building2 className="w-7 h-7" />}
          title="No branches yet"
          description="Add your first branch to get started"
          action={isOverall && (
            <Button icon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              Add Branch
            </Button>
          )}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {branches.map((branch) => (
            <Card key={branch._id} padding={false} className="overflow-hidden">
              {/* Color header */}
              <div className="h-2 bg-linear-to-r from-brand-500 to-brand-600" />

              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-gray-800">{branch.name}</h3>
                  <Badge
                    variant={branch.queueEnabled ? 'green' : 'gray'}
                    dot size="sm"
                  >
                    {branch.queueEnabled ? 'Open' : 'Closed'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-xs text-gray-500 mb-4">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-brand-400" />
                    <span className="capitalize">{branch.city}, {branch.state}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-brand-400" />
                    <span>{branch.openTime} – {branch.closeTime}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<Pencil className="w-3.5 h-3.5" />}
                    onClick={() => openEdit(branch)}
                    className="flex-1"
                  >
                    Edit
                  </Button>
                  <Button
                    variant={branch.queueEnabled ? 'danger' : 'success'}
                    size="sm"
                    onClick={() => handleToggle(branch)}
                    className="flex-1"
                  >
                    {branch.queueEnabled ? 'Disable' : 'Enable'} Queue
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModal(false)}
        title={editing ? 'Edit Branch' : 'Add Branch'}
        size="lg"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Branch name"
              required
              error={errors.name?.message}
              {...register('name', { required: 'Branch name is required' })}
            />
            <Input
              label="City"
              required
              error={errors.city?.message}
              {...register('city', { required: 'City is required' })}
            />
            <Input
              label="State"
              required
              error={errors.state?.message}
              {...register('state', { required: 'State is required' })}
            />
            <Input
            required
              label="Address"
              {...register('address')}
            />
            <Input
            required
              label="Contact phone"
              {...register('contactPhone')}
            />
            <Input
            required
              label="Contact email"
              type="email"
              {...register('contactEmail')}
            />
            <Input
            required
              label="Open time (HH:MM)"
              placeholder="09:00"
              {...register('openTime')}
            />
            <Input
            required
              label="Close time (HH:MM)"
              placeholder="17:00"
              {...register('closeTime')}
            />
            <Input
            required
              label="Skip timeout (seconds)"
              type="number"
              placeholder="25"
              {...register('skipTimeoutSec', { min: 10, max: 120 })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {editing ? 'Save Changes' : 'Create Branch'}
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default ManageBranches;