import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Alert from '../components/Alert';
import { Button, Input } from '../components/FormElements';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePhone, validatePassword } from '../utils/validation';

const Register = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    licenseKey:'',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    businessName: '',
    address: '',
    city: '',
    state: '',
    pincode: ''
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
  
    if (!formData.name.trim()) newErrors.name = t('fillAllFields');
    if (!validateEmail(formData.email)) newErrors.email = t('invalidEmail');
    if (!validatePassword(formData.password)) newErrors.password = t('passwordMinLength');
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = t('passwordMismatch');
    if (!validatePhone(formData.phone)) newErrors.phone = t('phoneInvalid');
    if (!formData.businessName.trim()) newErrors.businessName = t('fillAllFields');
    if (!formData.licenseKey.trim()) newErrors.licenseKey = t('give licence key');
  
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await register({
        licenseKey:formData.licenseKey,
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        businessName: formData.businessName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode
      });
      setAlert({ type: 'success', message: t('registerSuccess') });
      setTimeout(() => navigate('/dashboard'), 1500);
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || t('registerFailed') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        <h1 className="text-3xl font-bold text-blue-600 mb-2 text-center">KhataBook</h1>
        <p className="text-gray-600 text-center mb-6">{t('register')}</p>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <form onSubmit={handleSubmit} className="space-y-4">
           <Input
            label={t('licenseKey')}
            name="licenseKey"
            type="licenseKey"
            value={formData.licenseKey}
            onChange={handleChange}
            error={errors.licenseKey}
            placeholder={t('licenceKey')}
          />
          <Input
            label={t('name')}
            name="name"
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder={t('name')}
          />

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
            label={t('phone')}
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            error={errors.phone}
            placeholder="10-digit phone number"
          />

          <Input
            label={t('businessName')}
            name="businessName"
            value={formData.businessName}
            onChange={handleChange}
            error={errors.businessName}
            placeholder={t('businessName')}
          />

          <Input
            label={t('address')}
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder={t('address')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t('city')}
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder={t('city')}
            />
            <Input
              label={t('state')}
              name="state"
              value={formData.state}
              onChange={handleChange}
              placeholder={t('state')}
            />
          </div>

          <Input
            label={t('pincode')}
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder={t('pincode')}
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

          <Input
            label={t('confirmPassword')}
            name="confirmPassword"
            type="password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder={t('confirmPassword')}
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? t('loading') : t('signUp')}
          </Button>
        </form>

        <p className="text-center text-gray-600 mt-4">
          {t('haveAccount')} <Link to="/login" className="text-blue-600 hover:underline">{t('signIn')}</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
