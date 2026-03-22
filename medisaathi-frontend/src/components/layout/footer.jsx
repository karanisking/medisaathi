import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Heart } from 'lucide-react';
import logo from '../../assets/logo.png';

const Footer = () => {
  return (
    <footer className="bg-brand-900 text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src={logo} alt="MediSaathi" className="w-9 h-9 object-contain" />
              <span className="text-xl font-bold">MediSaathi</span>
            </div>
            <p className="text-brand-200 text-sm leading-relaxed max-w-xs">
              Smart queues for smarter hospitals. Skip the wait, not the care.
              Join queues from anywhere and get notified when your turn is near.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-brand-300 mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2.5 text-sm text-brand-200">
              <li><Link to="/"          className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/hospitals" className="hover:text-white transition-colors">Find Hospitals</Link></li>
              <li><Link to="/login"     className="hover:text-white transition-colors">Login</Link></li>
              <li><Link to="/register"  className="hover:text-white transition-colors">Register</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm uppercase tracking-wider text-brand-300 mb-4">
              Contact
            </h4>
            <ul className="space-y-2.5 text-sm text-brand-200">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-brand-400" />
                support@medisaathi.in
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-brand-400" />
                +91 98765 43210
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-400" />
                India
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-brand-800 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-brand-400">
            © {new Date().getFullYear()} MediSaathi. All rights reserved.
          </p>
          <p className="text-xs text-brand-400 flex items-center gap-1">
            Made with <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400" /> in India
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;