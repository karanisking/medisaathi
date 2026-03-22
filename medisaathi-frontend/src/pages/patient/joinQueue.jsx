import { useState, useEffect }    from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm }                from 'react-hook-form';
import { Eye, Ear, Heart, Bone, Smile, MoreHorizontal, ArrowLeft } from 'lucide-react';
import { branchService }  from '../../services/branchService.js';
import { tokenService }   from '../../services/tokenService.js';
import { useToast }       from '../../context/toastContext.jsx';
import PageWrapper        from '../../components/layout/pageWrapper.jsx';
import Button             from '../../components/ui/button.jsx';
import Spinner            from '../../components/ui/spinner.jsx';
import { PROBLEM_TYPES }  from '../../utils/constants.js';

const ICONS = {
  eye:     <Eye className="w-5 h-5" />,
  ent:     <Ear className="w-5 h-5" />,
  general: <Heart className="w-5 h-5" />,
  ortho:   <Bone className="w-5 h-5" />,
  dental:  <Smile className="w-5 h-5" />,
  other:   <MoreHorizontal className="w-5 h-5" />,
};

const JoinQueue = () => {
  const { branchId }       = useParams();
  const navigate           = useNavigate();
  const { success, error } = useToast();

  const [branch, setBranch]     = useState(null);
  const [loading, setLoading]   = useState(true);
  const [joining, setJoining]   = useState(false);
  const [selected, setSelected] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await branchService.getById(branchId);
        setBranch(res.data.branch);
      } catch {
        navigate('/hospitals');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [branchId]);

  const onSubmit = async (data) => {
    if (!selected) return;
    setJoining(true);
    try {
      await tokenService.join({
        branchId,
        problemType: selected,
        problemNote: data.problemNote || '',
      });
      success('Joined queue successfully!');
      navigate('/my-token');
    } catch (err) {
      error(err.response?.data?.message || 'Failed to join queue');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return (
    <PageWrapper>
      <div className="flex justify-center py-20"><Spinner size="lg" /></div>
    </PageWrapper>
  );

  const categories = branch?.problemCategories || PROBLEM_TYPES.map((p) => p.value);

  return (
    <PageWrapper>
      {/* 5% top/bottom padding, scrollable */}
      <div className="py-[2%] px-0">
        <div className="max-w-lg mx-auto">

          {/* Back button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-brand-600 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
            <h1 className="text-xl font-bold text-gray-800 mb-1">Join Queue</h1>
            <p className="text-sm text-gray-400 mb-6">
              {branch?.name} — select your problem type to join
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Problem type selection */}
              <p className="text-sm font-medium text-gray-700 mb-3">
                What brings you in today?{' '}
                <span className="text-red-500">*</span>
              </p>

              <div className="grid grid-cols-2 gap-3 mb-5">
                {PROBLEM_TYPES.filter((p) => categories.includes(p.value)).map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelected(type.value)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-xl border-2
                      text-left transition-all duration-150
                      ${selected === type.value
                        ? 'border-brand-500 bg-brand-50 text-brand-700'
                        : 'border-gray-200 hover:border-brand-200 text-gray-600'
                      }
                    `}
                  >
                    <span className={selected === type.value ? 'text-brand-600' : 'text-gray-400'}>
                      {ICONS[type.value]}
                    </span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </button>
                ))}
              </div>

              {/* Problem note — only for Other */}
              {selected === 'other' && (
                <div className="mb-5">
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">
                    Describe your problem{' '}
                    <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    placeholder="Please describe your issue..."
                    rows={3}
                    className={`
                      w-full px-4 py-2.5 text-sm border rounded-xl resize-none
                      focus:outline-none focus:ring-2 focus:ring-brand-400
                      focus:border-transparent
                      ${errors.problemNote ? 'border-red-400' : 'border-gray-200'}
                    `}
                    {...register('problemNote', {
                      required:  selected === 'other' ? 'Please describe your problem' : false,
                      maxLength: { value: 300, message: 'Max 300 characters' },
                    })}
                  />
                  {errors.problemNote && (
                    <p className="text-xs text-red-500 mt-1">
                      {errors.problemNote.message}
                    </p>
                  )}
                </div>
              )}

              {!selected && (
                <p className="text-xs text-red-400 mb-4">
                  Please select a problem type to continue
                </p>
              )}

              <div className="flex gap-3 mt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => navigate(-1)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="md"
                  loading={joining}
                  disabled={!selected}
                  className="flex-1"
                >
                  Join Queue
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default JoinQueue;