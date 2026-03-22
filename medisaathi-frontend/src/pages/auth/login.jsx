import { useState }              from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm }               from 'react-hook-form';
import { Mail, Lock }            from 'lucide-react';
import { useAuth }               from '../../context/authContext.jsx';
import { useToast }              from '../../context/toastContext.jsx';
import { authService }           from '../../services/authService.js';
import Input   from '../../components/ui/input.jsx';
import Button  from '../../components/ui/button.jsx';
import logo    from '../../assets/logo.png';

const Login = () => {
  const { saveAuth }       = useAuth();
  const { success, error } = useToast();
  const navigate           = useNavigate();
  const location           = useLocation();
  const [loading, setLoading] = useState(false);

  const from = location.state?.from?.pathname || null;

  const { register, handleSubmit, formState: { errors } } = useForm();

  const getDashboard = (role) => {
    if (from) return from;
    const map = {
      super_admin:   '/superadmin',
      overall_admin: '/admin',
      branch_admin:  '/admin',
      staff:         '/staff',
      patient:       '/my-token',
    };
    return map[role] || '/';
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.login(data);
      saveAuth(res.data.accessToken, res.data.user);
      success(`Welcome back, ${res.data.user.name}!`);
      navigate(getDashboard(res.data.user.role), { replace: true });
    } catch (err) {
      error(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-brand-50 to-blue-100 overflow-y-auto">
      <div className="min-h-screen flex flex-col justify-center py-[5%] px-4">
        <div className="w-full max-w-md mx-auto">

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">

            {/* Logo + Title */}
            <div className="flex flex-col items-center mb-7">
              <img src={logo} alt="MediSaathi" className="w-16 h-16 object-contain mb-3" />
              <h1 className="text-2xl font-bold text-gray-800">Welcome back</h1>
              <p className="text-sm text-gray-400 mt-1 text-center">
                Sign in to your MediSaathi account
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
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
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                required
                error={errors.password?.message}
                {...register('password', {
                  required:  'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' },
                })}
              />

              <Button
                type="submit"
                size="full"
                loading={loading}
                className="mt-2"
              >
                Sign In
              </Button>
            </form>

            {/* Footer */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Don't have an account?{' '}
              <Link to="/register" className="text-brand-600 font-medium hover:underline">
                Register here
              </Link>
            </p>
          </div>

        
        </div>
      </div>
    </div>
  );
};

export default Login;