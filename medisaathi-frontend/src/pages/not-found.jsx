import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-50 px-4">
      <p className="text-8xl font-bold text-brand-600 mb-4">404</p>
      <h1 className="text-2xl font-semibold text-gray-800 mb-2">Page not found</h1>
      <p className="text-gray-500 mb-8 text-center">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-6 py-3 bg-brand-600 text-white rounded-xl font-medium hover:bg-brand-700 transition-colors"
      >
        Back to Home
      </button>
    </div>
  );
};

export default NotFound;