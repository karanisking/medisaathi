import { useState }          from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm }           from 'react-hook-form';
import { User, Mail, Lock }  from 'lucide-react';
import { useAuth }           from '../../context/authContext.jsx';
import { useToast }          from '../../context/toastContext.jsx';
import { authService }       from '../../services/authService.js';
import Input  from '../../components/ui/input.jsx';
import Button from '../../components/ui/button.jsx';
import logo   from '../../assets/logo.png';

const Register = () => {
  const { saveAuth }       = useAuth();
  const { success, error } = useToast();
  const navigate           = useNavigate();
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await authService.register({
        name:     data.name,
        email:    data.email,
        password: data.password,
      });
      saveAuth(res.data.accessToken, res.data.user);
      success('Account created successfully!');
      navigate('/hospitals', { replace: true });
    } catch (err) {
      error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-brand-50 to-blue-100 overflow-y-auto">
      <div className="min-h-screen flex flex-col justify-center py-[5%] px-4">
        <div className="w-full max-w-md mx-auto">

          <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-8">

            {/* Logo + Title */}
            <div className="flex flex-col items-center mb-7">
              <img src={logo} alt="MediSaathi" className="w-16 h-16 object-contain mb-3" />
              <h1 className="text-2xl font-bold text-gray-800">Create account</h1>
              <p className="text-sm text-gray-400 mt-1 text-center">
                Join MediSaathi and skip the wait
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Input
                label="Full name"
                placeholder="John Doe"
                icon={<User className="w-4 h-4" />}
                required
                error={errors.name?.message}
                {...register('name', {
                  required:  'Name is required',
                  minLength: { value: 2, message: 'Minimum 2 characters' },
                })}
              />

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
                placeholder="Min. 6 characters"
                icon={<Lock className="w-4 h-4" />}
                required
                error={errors.password?.message}
                {...register('password', {
                  required:  'Password is required',
                  minLength: { value: 6, message: 'Minimum 6 characters' },
                  pattern: {
                    value:   /\d/,
                    message: 'Must contain at least one number',
                  },
                })}
              />

              <Input
                label="Confirm password"
                type="password"
                placeholder="Re-enter password"
                icon={<Lock className="w-4 h-4" />}
                required
                error={errors.confirmPassword?.message}
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: (val) =>
                    val === watch('password') || 'Passwords do not match',
                })}
              />

              <Button
                type="submit"
                size="full"
                loading={loading}
                className="mt-2"
              >
                Create Account
              </Button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-brand-600 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>

         
        </div>
      </div>
    </div>
  );
};

export default Register;