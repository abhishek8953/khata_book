import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const Navbar = () => {
  const { t, i18n } = useTranslation();
  const { seller, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const navLinks = [
    { path: '/dashboard', label: t('dashboard') },
    { path: '/customers', label: t('customers') },
    { path: '/products', label: t('products') },
    { path: '/transactions', label: t('transactions') },
    { path: '/settings', label: t('settings') }
  ];

  return (
    <nav className="bg-blue-600 text-white shadow-lg">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Link to="/dashboard" className="flex items-center space-x-1 sm:space-x-2 font-bold text-lg sm:text-xl flex-shrink-0">
            <span className="text-lg sm:text-xl">📚</span>
            <span className="hidden sm:inline">KhataBook</span>
            <span className="sm:hidden text-sm">KB</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className="hover:bg-blue-700 px-2 lg:px-3 py-2 rounded text-sm lg:text-base transition">
                {link.label}
              </Link>
            ))}

            {/* Language Selector */}
            <div className="flex gap-1 ml-2 lg:ml-4">
              <button
                onClick={() => changeLanguage('en')}
                className={`px-2 py-1 rounded text-xs lg:text-sm transition ${i18n.language === 'en' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                EN
              </button>
              <button
                onClick={() => changeLanguage('hi')}
                className={`px-2 py-1 rounded text-xs lg:text-sm transition ${i18n.language === 'hi' ? 'bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'}`}
              >
                HI
              </button>
            </div>

            {seller && <span className="text-xs lg:text-sm ml-2 lg:ml-4 hidden lg:inline">{seller.name}</span>}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 px-2 lg:px-4 py-2 rounded flex items-center space-x-1 text-sm lg:text-base transition ml-2 lg:ml-4"
            >
              <LogOut size={16} className="lg:w-[18px] lg:h-[18px]" />
              <span className="hidden lg:inline">{t('logout')}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-white p-2 hover:bg-blue-700 rounded transition"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-blue-500 mt-2">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className="block hover:bg-blue-700 px-3 py-2 rounded text-sm transition"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            
            <div className="px-3 py-2 space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => changeLanguage('en')}
                  className={`flex-1 px-2 py-1 rounded text-sm transition ${i18n.language === 'en' ? 'bg-blue-700' : 'bg-blue-500'}`}
                >
                  EN
                </button>
                <button
                  onClick={() => changeLanguage('hi')}
                  className={`flex-1 px-2 py-1 rounded text-sm transition ${i18n.language === 'hi' ? 'bg-blue-700' : 'bg-blue-500'}`}
                >
                  HI
                </button>
              </div>
              {seller && <p className="text-xs text-blue-100 truncate">{seller.name}</p>}
            </div>

            <button
              onClick={() => {
                handleLogout();
                setIsMenuOpen(false);
              }}
              className="w-full text-left bg-red-500 hover:bg-red-600 px-3 py-2 rounded flex items-center space-x-1 text-sm transition"
            >
              <LogOut size={18} />
              <span>{t('logout')}</span>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
