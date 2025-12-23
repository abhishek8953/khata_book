import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Alert from '../components/Alert';
import { Button, Input } from '../components/FormElements';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/validation';

const Login = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!validateEmail(formData.email)) newErrors.email = t('invalidEmail');
    if (!formData.password) newErrors.password = t('fillAllFields');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(formData.email, formData.password);
      setAlert({ type: 'success', message: t('loginSuccess') });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || t('loginFailed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-blue-600 mb-2 text-center">KhataBook</h1>
        <p className="text-gray-600 text-center mb-6 text-sm sm:text-base">{t('login')}</p>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label={t('email')}
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            error={errors.email}
            placeholder={t('email')}
          />

          <Input
            label={t('password')}
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            error={errors.password}
            placeholder={t('password')}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? t('loading') : t('signIn')}
          </Button>
        </form>

        <p className="text-center text-gray-600 mt-4 text-xs sm:text-sm">
          {t('noAccount')} <Link to="/register" className="text-blue-600 hover:underline font-medium">{t('signUp')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
