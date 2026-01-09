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
  const [showProductModal, setShowProductModal] = useState(null);
  const [showDescriptionModal, setShowDescriptionModal] = useState(null);

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

  console.log("productdd",transactions);

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
            ) : transactions.length === 0 ? (
              <p className="text-center text-gray-400 py-10">No transactions found</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((txn) => (
                  <div
                    key={txn._id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition bg-white"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                      {/* Type Badge */}
                      <div className="flex items-center">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-600 font-medium">Type</span>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold w-fit ${
                              txn.type === "purchase"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {txn.type === "purchase" ? "🛒 Purchase" : "💰 Payment"}
                          </span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-600 font-medium mb-1">Amount</span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-gray-800">
                            ₹{parseFloat(txn.amount).toFixed(2)}
                          </span>
                          {txn.interest > 0 && (
                            <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded">
                              +₹{parseFloat(txn.interest).toFixed(2)} interest
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Balance After Transaction */}
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-600 font-medium mb-1">Balance</span>
                        <span
                          className={`text-lg font-bold ${
                            txn.balanceAfterTransaction > 0
                              ? "text-red-600"
                              : "text-green-600"
                          }`}
                        >
                          ₹{parseFloat(txn.balanceAfterTransaction).toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {txn.balanceAfterTransaction > 0
                            ? "Outstanding"
                            : "Settled"}
                        </span>
                      </div>

                      {/* Date */}
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-600 font-medium mb-1">Date</span>
                        <span className="text-sm font-medium text-gray-700">
                          {new Date(txn.date).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(txn.date).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col justify-start gap-2">
                        <span className="text-xs text-gray-600 font-medium">Actions</span>
                        <div className="flex flex-wrap gap-2">
                          {txn.productId && txn.productId.length > 0 && (
                            <button
                              onClick={() => setShowProductModal(txn)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 text-xs bg-blue-50 px-3 rounded-lg font-medium transition"
                              title="View products"
                            >
                              📦 ({txn.productId.length})
                            </button>
                          )}
                          {txn.description && (
                            <button
                              onClick={() => setShowDescriptionModal(txn)}
                              className="text-amber-600 hover:text-amber-800 hover:bg-amber-50 p-2 text-xs bg-amber-50 px-3 rounded-lg font-medium transition"
                              title="View description"
                            >
                              📝
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payment Details (if applicable) */}
                    {txn.type === "purchase" && txn.initialPayment > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div className="bg-green-50 p-2 rounded">
                            <p className="text-gray-600">Initial Paid</p>
                            <p className="font-bold text-green-700">
                              ₹{parseFloat(txn.initialPayment).toFixed(2)}
                            </p>
                          </div>
                          <div className="bg-red-50 p-2 rounded">
                            <p className="text-gray-600">Remaining</p>
                            <p className="font-bold text-red-700">
                              ₹{(
                                parseFloat(txn.amount) +
                                parseFloat(txn.interest || 0) -
                                parseFloat(txn.initialPayment)
                              ).toFixed(2)}
                            </p>
                          </div>
                          {txn.interest > 0 && (
                            <>
                              <div className="bg-orange-50 p-2 rounded">
                                <p className="text-gray-600">Interest Rate</p>
                                <p className="font-bold text-orange-700">
                                  {txn.interestRate}%
                                </p>
                              </div>
                              <div className="bg-purple-50 p-2 rounded">
                                <p className="text-gray-600">Duration</p>
                                <p className="font-bold text-purple-700">
                                  {txn.interestDuration} {txn.interestTimeUnit}
                                </p>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* PRODUCT MODAL */}
        {showProductModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-96 overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  Transaction Products
                </h3>
                <button
                  onClick={() => setShowProductModal(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                {showProductModal.productId.map((product, index) => (
                  <div
                    key={index}
                    className="p-3 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-gray-600">Product Name</p>
                        <p className="font-semibold text-gray-800">
                          {product.product?.name || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Unit</p>
                        <p className="font-semibold text-gray-800">
                          {product.product?.unit || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Quantity</p>
                        <p className="font-semibold text-gray-800">
                          {product.quantity || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Price Per Unit</p>
                        <p className="font-semibold text-blue-600">
                          ₹{parseFloat(product.pricePerUnit || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total</p>
                        <p className="font-semibold text-green-600">
                          ₹
                          {parseFloat(
                            (product.quantity || 0) *
                              (product.pricePerUnit || 0)
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm font-semibold text-blue-800">
                    Total Transaction Amount:
                  </p>
                  <p className="text-xl font-bold text-blue-600">
                    ₹{parseFloat(showProductModal.amount).toFixed(2)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowProductModal(null)}
                className="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
              >
                Close
              </button>
            </Card>
          </div>
        )}

        {/* DESCRIPTION MODAL */}
        {showDescriptionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">
                  Transaction Description
                </h3>
                <button
                  onClick={() => setShowDescriptionModal(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 min-h-24">
                  <p className="text-sm text-gray-600 mb-2">Description:</p>
                  <p className="text-gray-800 whitespace-pre-wrap">
                    {showDescriptionModal.description || "No description provided"}
                  </p>
                </div>

                {showDescriptionModal.notes && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <p className="text-sm text-gray-600 mb-2">Notes:</p>
                    <p className="text-gray-800 whitespace-pre-wrap">
                      {showDescriptionModal.notes}
                    </p>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-2 border-t">
                  <p>
                    Transaction ID:{" "}
                    <span className="font-mono">{showDescriptionModal._id}</span>
                  </p>
                  <p>
                    Date:{" "}
                    {new Date(showDescriptionModal.date).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDescriptionModal(null)}
                className="w-full mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg font-medium transition"
              >
                Close
              </button>
            </Card>
          </div>
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
