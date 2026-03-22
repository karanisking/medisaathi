import { useNavigate } from 'react-router-dom';
import { Clock, Bell, Smartphone, ArrowRight, CheckCircle } from 'lucide-react';
import { useAuth }     from '../../context/authContext.jsx';
import PageWrapper     from '../../components/layout/pageWrapper.jsx';
import Button          from '../../components/ui/button.jsx';

const FEATURES = [
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'No More Waiting',
    desc:  'Join the queue from your phone. Come to the hospital only when your turn is near.',
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: 'Live Notifications',
    desc:  'Get notified when your turn is just 2–3 patients away.',
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: 'Works on Any Device',
    desc:  'No app download needed. Works directly in your browser on any phone.',
  },
];

const getDashboard = (role) => {
  const map = {
    super_admin:   '/superadmin',
    overall_admin: '/admin',
    branch_admin:  '/admin',
    staff:         '/staff',
    patient:       '/my-token',
  };
  return map[role] || '/hospitals';
};

const Home = () => {
  const navigate              = useNavigate();
  const { isAuthenticated, user } = useAuth();

  return (
    // PageWrapper includes the real Navbar which is auth-aware
    <PageWrapper>

      {/* Hero */}
      <section className="bg-linear-to-br from-brand-600 via-brand-700 to-brand-900 text-white py-20 px-6 rounded-3xl mb-10 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6 text-sm">
          <CheckCircle className="w-4 h-4 text-green-300" />
          Smart queues for smarter hospitals
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
          Skip the wait.<br />
          <span className="text-brand-200">Not the care.</span>
        </h1>

        <p className="text-brand-100 text-lg sm:text-xl max-w-2xl mx-auto mb-10">
          Join hospital queues from your phone. Get live updates, see your
          estimated wait time, and walk in only when your turn is near.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            variant="success"
            icon={<ArrowRight className="w-5 h-5" />}
            onClick={() => navigate('/hospitals')}
          >
            Find a Hospital
          </Button>

          {/* Show different CTA based on auth state */}
          {isAuthenticated ? (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(getDashboard(user?.role))}
            >
              Go to Dashboard
            </Button>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/register')}
            >
              Create Free Account
            </Button>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-10 mb-10">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-4">
          Why MediSaathi?
        </h2>
        <p className="text-center text-gray-500 mb-12 max-w-xl mx-auto">
          We built MediSaathi to solve the real problem of 2–4 hour waits
          at hospitals across India.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center"
            >
              <div className="w-12 h-12 bg-brand-50 rounded-xl flex items-center justify-center text-brand-600 mx-auto mb-4">
                {f.icon}
              </div>
              <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA — changes based on auth */}
      <section className="bg-brand-600 text-white text-center py-16 px-4 rounded-3xl mb-6">
        <h2 className="text-3xl font-bold mb-4">
          {isAuthenticated ? `Welcome back, ${user?.name}!` : 'Ready to skip the queue?'}
        </h2>
        <p className="text-brand-100 mb-8">
          {isAuthenticated
            ? 'Find a hospital near you and join the queue in seconds.'
            : 'Find your nearest hospital and join the queue in under 30 seconds.'
          }
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            size="lg"
            onClick={() => navigate('/hospitals')}
            className=" bg-brand-800 text-brand-600 hover:bg-brand-50"
          >
            Browse Hospitals
          </Button>
          {isAuthenticated && (
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate(getDashboard(user?.role))}
              className="border-white bg-brand-800 text-white hover:bg-white/10"
            >
              My Dashboard
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 text-center border-t border-gray-100">
        <p className="text-xs text-gray-400">
          © {new Date().getFullYear()} MediSaathi. All rights reserved. Smart queues for smarter hospitals.
        </p>
      </footer>

    </PageWrapper>
  );
};

export default Home;