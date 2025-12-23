import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Package, TrendingUp, Wallet } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Card, StatCard } from '../components/Layout';
import Alert from '../components/Alert';
import { transactionAPI } from '../utils/api';

const Dashboard = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await transactionAPI.getDashboardStats();
      console.log(response.data.stats);
      setStats(response.data.stats);
    } catch (error) {
      setAlert({ type: 'error', message: t('somethingWentWrong') });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-500 text-sm sm:text-base">{t('loading')}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 mb-6 sm:mb-8">{t('dashboard')}</h1>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <StatCard
            title={t('totalCustomers')}
            value={stats?.totalCustomers || 0}
            icon={Users}
            color="blue"
          />
          <StatCard
            title={t('activeCustomers')}
            value={stats?.totalActiveCustomers || 0}
            icon={Users}
            color="green"
          />
          <StatCard
            title={t('totalProducts')}
            value={stats?.totalProducts || 0}
            icon={Package}
            color="yellow"
          />
          <StatCard
            title={t('totalOutstanding')}
            value={`₹${parseFloat(stats?.totalOutstanding || 0).toFixed(2)}`}
            icon={Wallet}
            color="red"
          />
         
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <TrendingUp className="text-green-600 w-5 h-5 sm:w-6 sm:h-6" />
              <span className="line-clamp-1">{t('totalPurchases')}</span>
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-green-600 break-words">₹{parseFloat(stats?.totalPurchases || 0).toFixed(2)}</p>
          </Card>

          <Card>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <Wallet className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6" />
              <span className="line-clamp-1">{t('totalPayments')}</span>
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-blue-600 break-words">₹{parseFloat(stats?.totalPayments || 0).toFixed(2)}</p>
          </Card>

          <Card>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <TrendingUp className="text-red-600 w-5 h-5 sm:w-6 sm:h-6" />
              <span className="line-clamp-1">{t('totalOutstanding')}</span>
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-red-600 break-words">₹{(parseFloat(stats?.totalOutstanding || 0)+parseFloat(stats?.totalInterest || 0)).toFixed(2)}</p>
          </Card>

          <Card>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-2 flex items-center space-x-2">
              <TrendingUp className="text-red-300 w-5 h-5 sm:w-6 sm:h-6" />
              <span className="line-clamp-1">{t('Total Interest')}</span>
            </h3>
            <p className="text-2xl sm:text-3xl font-bold text-red-600 break-words">{`₹${parseFloat(stats?.totalInterest || 0).toFixed(2)}`}</p>
          </Card>

         
        </div>

        {/* Additional Info */}
        <Card>
          <h3 className="text-base sm:text-lg font-semibold text-gray-700 mb-4">{t('recentTransactions')}</h3>
          <p className="text-gray-500 text-sm sm:text-base">Total transactions: {stats?.totalTransactions || 0}</p>
        </Card>
      </div>
    </>
  );
};

export default Dashboard;
