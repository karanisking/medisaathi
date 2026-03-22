import { BrowserRouter } from 'react-router-dom';
import { AuthProvider }  from './context/authContext.jsx';
import { ToastProvider } from './context/toastContext.jsx';
import AppRoutes         from './routes/appRoutes.jsx';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;