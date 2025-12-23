import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  Eye,
  IndianRupee,
  Send,
} from 'lucide-react';

import Navbar from '../components/Navbar';
import { Card, Table } from '../components/Layout';
import Alert from '../components/Alert';
import { Button, Input, Textarea, Select } from '../components/FormElements';
import { customerAPI, transactionAPI } from '../utils/api';
import { validatePhone } from '../utils/validation';
import { useNavigate } from 'react-router-dom';

const Customers = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showTransactions, setShowTransactions] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    notes: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await customerAPI.getCustomers({ isActive: 'true' });
      
      setCustomers(response.data.customers);
    } catch (error) {
      setAlert({ type: 'error', message: t('somethingWentWrong') });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('fillAllFields');
    if (!validatePhone(formData.phone)) newErrors.phone = t('phoneInvalid');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingId) {
        await customerAPI.updateCustomer(editingId, formData);
        setAlert({ type: 'success', message: t('customerUpdated') });
      } else {
        await customerAPI.addCustomer(formData);
        setAlert({ type: 'success', message: t('customerAdded') });
      }
      resetForm();
      fetchCustomers();
    } catch (error) {
      setAlert({
        type: 'error',
        message: error.response?.data?.message || t('somethingWentWrong'),
      });
    }
  };

  const handleEdit = (customer) => {
    setFormData(customer);
    setEditingId(customer._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteConfirmation'))) return;
    try {
      await customerAPI.deleteCustomer(id);
      setAlert({ type: 'success', message: t('customerDeleted') });
      fetchCustomers();
    } catch (error) {
      setAlert({ type: 'error', message: t('somethingWentWrong') });
    }
  };

  const handleSendSMS = async (customerId) => {
    try {
      await transactionAPI.sendSMS(customerId);
      setAlert({ type: 'success', message: t('smsSent') });
    } catch (error) {
      setAlert({ type: 'error', message: t('somethingWentWrong') });
    }
  };

  const handleViewTransactions = async (customerId, customerName) => {
    setLoadingTransactions(true);
    try {
      const response = await transactionAPI.getTransactions({
        customerId,
        limit: 100,
      });
      setTransactions(response.data.transactions || []);
      setShowTransactions({ id: customerId, name: customerName });
    } catch (error) {
      setAlert({ type: 'error', message: t('somethingWentWrong') });
    } finally {
      setLoadingTransactions(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      notes: '',
    });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const getFilteredCustomers = () => {
    let filtered = customers;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(query) || c.phone.includes(query)
      );
    }

    if (filterType === 'hasOutstanding') {
      filtered = filtered.filter((c) => c.outstandingBalance > 0);
    } else if (filterType === 'noOutstanding') {
      filtered = filtered.filter((c) => c.outstandingBalance === 0);
    }

    return filtered;
  };

  const tableData = getFilteredCustomers().map((c) => ({
    name: c.name,
    phone: c.phone,
    balance: `₹${(parseFloat(c.outstandingBalance)+parseFloat(c.totalInterest)).toFixed(2)}`,
    purchase: `₹${parseFloat(c.totalPurchaseAmount).toFixed(2)}`,
    paid: `₹${parseFloat(c.totalPaidAmount).toFixed(2)}`,
    interest:`₹${parseFloat(c.totalInterest).toFixed(2)}`,
    customerId: c._id,
  }));

  return (
    <>
      <Navbar />

      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">
            {t('customers')}
          </h1>

          {!showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)}>
              <Plus size={18} />
              <span className="ml-1">{t('addCustomer')}</span>
            </Button>
          )}
        </div>

        {/* ALERT */}
        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* SEARCH + FILTER */}
        {!showForm && !showTransactions && (
          <Card className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* SEARCH */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {t('search')}
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* FILTER */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  {t('filter')} {t('balance')}
                </label>
                <Select
                  name="filterType"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  options={[
                    { value: 'all', label: 'All Customers' },
                    { value: 'hasOutstanding', label: 'With Outstanding Amount' },
                    { value: 'noOutstanding', label: 'No Outstanding Amount' },
                  ]}
                />
              </div>
            </div>
          </Card>
        )}

        {/* FORM */}
        {showForm && (
          <Card className="mb-8">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? t('editCustomer') : t('addCustomer')}
            </h2>

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <Input
                label={t('customerName')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />
              <Input
                label={t('customerPhone')}
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
              />
              <Input
                label={t('customerEmail')}
                name="email"
                value={formData.email}
                type="email"
                onChange={handleChange}
              />
              <Input
                label={t('customerAddress')}
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

              <Textarea
                label={t('notes')}
                name="notes"
                className="sm:col-span-2"
                value={formData.notes}
                onChange={handleChange}
              />

              <div className="flex flex-col sm:flex-row gap-3 sm:col-span-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:w-auto"
                >
                  {editingId ? t('update') : t('add')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  className="w-full sm:w-auto"
                >
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* LOADING */}
        {loading && (
          <p className="text-center text-gray-500 py-10">{t('loading')}</p>
        )}

        {/* TRANSACTIONS */}
        {!loading && showTransactions && (
          <Card>
            <Button
              variant="outline"
              onClick={() => setShowTransactions(null)}
              className="mb-5"
            >
              ← Back to customers
            </Button>

            <h2 className="text-xl font-bold mb-3">
              Transactions - {showTransactions.name}
            </h2>

            {loadingTransactions ? (
              <p className="text-center text-gray-500 py-10">{t('loading')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">Amount</th>
                      <th className="px-3 py-2 text-left">Balance</th>
                      <th className="px-3 py-2 text-left">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((txn) => (
                      <tr key={txn._id} className="border-b">
                        <td className="px-3 py-2 capitalize">{txn.type}</td>
                        <td className="px-3 py-2">₹{txn.amount}</td>
                        <td className="px-3 py-2">
                          ₹{txn.balanceAfterTransaction}
                        </td>
                        <td className="px-3 py-2">
                          {new Date(txn.date).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )}

        {/* CUSTOMER TABLE */}
        {!loading && !showForm && !showTransactions && (
          <Card>
            <div className="overflow-x-auto">
              <Table
                headers={[
                  t('customerName'),
                  t('customerPhone'),
                  t('balance'),
                  t('totalPurchase'),
                  t('totalPaid'),
                  t('interest'),
                  '',
                ]}
                data={tableData}
                actions={(row) => (
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        handleViewTransactions(row.customerId, row.name)
                      }
                      className="text-purple-600 p-1"
                    >
                      <Eye size={16} />
                    </button>

                    <button
                      onClick={() =>
                        handleEdit(
                          customers.find((c) => c._id === row.customerId)
                        )
                      }
                      className="text-blue-600 p-1"
                    >
                      <Edit2 size={16} />
                    </button>

                    <button
                      onClick={() => handleDelete(row.customerId)}
                      className="text-red-600 p-1"
                    >
                      <Trash2 size={16} />
                    </button>

                    <button
                      onClick={() => handleSendSMS(row.customerId)}
                      className="text-green-600 p-1"
                    >
                      <Send size={16} />
                    </button>

                    <button
                      onClick={() => navigate('/transactions')}
                      className="text-blue-600 p-1"
                    >
                      <IndianRupee size={16} />
                    </button>
                  </div>
                )}
              />
            </div>
          </Card>
        )}
      </div>
    </>
  );
};

export default Customers;
