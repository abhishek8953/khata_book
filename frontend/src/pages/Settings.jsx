import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import { Card } from '../components/Layout';
import Alert from '../components/Alert';
import { Button, Input } from '../components/FormElements';
import { authAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { seller } = useAuth();
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    smsNotificationEnabled: true,
    language: 'en'
  });

  useEffect(() => {
    if (seller) {
      setFormData({
        name: seller.name || '',
        email: seller.email || '',
        phone: seller.phone || '',
        businessName: seller.businessName || '',
        address: seller.address || '',
        city: seller.city || '',
        state: seller.state || '',
        pincode: seller.pincode || '',
        smsNotificationEnabled: seller.smsNotificationEnabled !== false,
        language: seller.language || 'en'
      });
    }
  }, [seller]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleLanguageChange = (lng) => {
    setFormData(prev => ({ ...prev, language: lng }));
    i18n.changeLanguage(lng);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.updateSeller(formData);
      setAlert({ type: 'success', message: t('settingsSaved') });
    } catch (error) {
      setAlert({ type: 'error', message: t('somethingWentWrong') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-6 sm:mb-8">{t('settings')}</h1>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        <Card>
          <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{t('businessName')}</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                label={t('name')}
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
              <Input
                label={t('email')}
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
              />
              <Input
                label={t('phone')}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
              />
              <Input
                label={t('businessName')}
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
              />
              <Input
                label={t('address')}
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
              <Input
                label={t('city')}
                name="city"
                value={formData.city}
                onChange={handleChange}
              />
              <Input
                label={t('state')}
                name="state"
                value={formData.state}
                onChange={handleChange}
              />
              <Input
                label={t('pincode')}
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
              />
            </div>

            <hr className="my-6" />

            {/* Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">{t('settings')}</h3>

              {/* Language Selection */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-3">{t('languagePreference')}</label>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="language"
                      value="en"
                      checked={formData.language === 'en'}
                      onChange={() => handleLanguageChange('en')}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="text-sm sm:text-base">English</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="language"
                      value="hi"
                      checked={formData.language === 'hi'}
                      onChange={() => handleLanguageChange('hi')}
                      className="mr-2 w-4 h-4"
                    />
                    <span className="text-sm sm:text-base">हिन्दी</span>
                  </label>
                </div>
              </div>

              {/* SMS Notifications */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    name="smsNotificationEnabled"
                    checked={formData.smsNotificationEnabled}
                    onChange={handleChange}
                    className="mr-3 w-4 h-4 sm:w-5 sm:h-5 text-blue-600"
                  />
                  <span className="font-medium text-gray-700 text-sm sm:text-base">{t('smsNotifications')}</span>
                </label>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 ml-7">
                  {t('enableSMSNotifications')}
                </p>
              </div>
            </div>

            <hr className="my-6" />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? t('loading') : t('saveSettings')}
            </Button>
          </form>
        </Card>
      </div>
    </>
  );
};

export default Settings;
