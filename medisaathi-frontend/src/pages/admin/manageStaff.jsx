import { useState, useEffect } from 'react';
import { useForm }             from 'react-hook-form';
import { Plus, Trash2, Users, Mail, Building2 } from 'lucide-react';
import { adminService }    from '../../services/adminService.js';
import { useAuth }         from '../../context/authContext.jsx';
import { useToast }        from '../../context/toastContext.jsx';
import DashboardLayout     from '../../components/layout/dashboardLayout.jsx';
import Card                from '../../components/ui/card.jsx';
import Button              from '../../components/ui/button.jsx';
import Input               from '../../components/ui/input.jsx';
import Modal               from '../../components/ui/modal.jsx';
import Avatar              from '../../components/ui/avatar.jsx';
import Spinner             from '../../components/ui/spinner.jsx';
import EmptyState          from '../../components/cards/emptyCard.jsx';

const ManageStaff = () => {
  const { user }           = useAuth();
  const { success, error } = useToast();

  const [staff, setStaff]       = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modalOpen, setModal]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [removing, setRemoving] = useState(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  useEffect(() => {
    const fetch = async () => {
      try {
        const [sRes, bRes] = await Promise.all([
          adminService.getStaff(),
          adminService.getBranches(),
        ]);
        setStaff(sRes.data.staff);
        setBranches(bRes.data.branches);
      } catch {
        error('Failed to load staff');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await adminService.createStaff(data);
      success('Staff member created');
      setModal(false);
      reset();
      const res = await adminService.getStaff();
      setStaff(res.data.staff);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create staff');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (staffId) => {
    if (!confirm('Remove this staff member?')) return;
    setRemoving(staffId);
    try {
      await adminService.removeStaff(staffId);
      setStaff((prev) => prev.filter((s) => s._id !== staffId));
      success('Staff removed');
    } catch {
      error('Failed to remove staff');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) return (
    <DashboardLayout title="Staff">
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </DashboardLayout>
  );

  return (
    <DashboardLayout title="Manage Staff" subtitle="Add and manage counter staff">

      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">{staff.length} staff member{staff.length !== 1 ? 's' : ''}</p>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => { reset(); setModal(true); }}>
          Add Staff
        </Button>
      </div>

      {staff.length === 0 ? (
        <EmptyState
          icon={<Users className="w-7 h-7" />}
          title="No staff yet"
          description="Add staff members to manage your queues"
          action={
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setModal(true)}>
              Add Staff
            </Button>
          }
        />
      ) : (
        <Card padding={false}>
          <div className="divide-y divide-gray-50">
            {staff.map((member) => (
              <div key={member._id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} size="md" />
                  <div>
                    <p className="text-sm font-medium text-gray-800">{member.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </span>
                      {member.branch?.name && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Building2 className="w-3 h-3" />
                          {member.branch.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  loading={removing === member._id}
                  onClick={() => handleRemove(member._id)}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50"
                  icon={<Trash2 className="w-4 h-4" />}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Add staff modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModal(false)}
        title="Add Staff Member"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
            })}
          />
          <Input
            label="Password"
            type="password"
            required
            error={errors.password?.message}
            {...register('password', {
              required:  'Password is required',
              minLength: { value: 6, message: 'Min 6 characters' },
            })}
          />

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Assign to branch <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-400 bg-white"
              {...register('branchId', { required: 'Branch is required' })}
            >
              <option value="">Select branch</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
            {errors.branchId && (
              <p className="text-xs text-red-500">{errors.branchId.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Create Staff
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  );
};

export default ManageStaff;