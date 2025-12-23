import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { Card, Table } from '../components/Layout';
import Alert from '../components/Alert';
import { Button, Input, Select } from '../components/FormElements';
import { productAPI } from '../utils/api';

const Products = () => {
  const { t } = useTranslation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    unit: 'kg',
    description: ''
  });

  const unitOptions = [
    { value: 'kg', label: t('kg') },
    { value: 'liter', label: t('liter') },
    { value: 'piece', label: t('piece') },
    { value: 'gram', label: t('gram') },
    { value: 'ml', label: t('ml') }
  ];

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productAPI.getProducts({ isActive: 'true' });
      setProducts(response.data.products);
    } catch (error) {
      setAlert({ type: 'error', message: t('somethingWentWrong') });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = t('fillAllFields');
    if (!formData.unit) newErrors.unit = t('fillAllFields');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (editingId) {
        await productAPI.updateProduct(editingId, formData);
        setAlert({ type: 'success', message: t('productUpdated') });
      } else {
        await productAPI.addProduct(formData);
        setAlert({ type: 'success', message: t('productAdded') });
      }
      resetForm();
      fetchProducts();
    } catch (error) {
      setAlert({ type: 'error', message: error.response?.data?.message || t('somethingWentWrong') });
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('deleteConfirmation'))) return;
    try {
      await productAPI.deleteProduct(id);
      setAlert({ type: 'success', message: t('productDeleted') });
      fetchProducts();
    } catch (error) {
      setAlert({ type: 'error', message: t('somethingWentWrong') });
    }
  };

  const resetForm = () => {
    setFormData({ name: '', unit: 'kg', description: '' });
    setEditingId(null);
    setShowForm(false);
    setErrors({});
  };

  const tableData = products.map(p => ({
    name: p.name,
    unit: p.unit,
    description: p.description || '-',
    productId: p._id
  }));

  return (
    <>
      <Navbar />
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800">{t('products')}</h1>
          {!showForm && (
            <Button variant="primary" onClick={() => setShowForm(true)} size="md">
              <Plus size={18} />
              <span className="hidden sm:inline">{t('addProduct')}</span>
              <span className="sm:hidden">{t('add')}</span>
            </Button>
          )}
        </div>

        {alert && <Alert type={alert.type} message={alert.message} onClose={() => setAlert(null)} />}

        {showForm && (
          <Card className="mb-6 sm:mb-8">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">{editingId ? t('editProduct') : t('addProduct')}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label={t('productName')}
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
              />
              <Select
                label={t('unit')}
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                error={errors.unit}
                options={unitOptions}
              />
              <Input
                label={t('description')}
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button type="submit" variant="primary" className="w-full sm:flex-1">
                  {editingId ? t('update') : t('add')}
                </Button>
                <Button type="button" variant="outline" className="w-full sm:flex-1" onClick={resetForm}>
                  {t('cancel')}
                </Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <p className="text-gray-500 text-center py-8 text-sm sm:text-base">{t('loading')}</p>
        ) : (
          <Card>
            <Table
              headers={[t('productName'), t('unit'), t('description'), '']}
              data={tableData}
              actions={(row) => (
                <div className="flex flex-wrap gap-1 sm:gap-2">
                  <button
                    onClick={() => handleEdit(products.find(p => p._id === row.productId))}
                    className="text-blue-600 hover:text-blue-800 transition p-1"
                    title={t('edit')}
                  >
                    <Edit2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                  <button
                    onClick={() => handleDelete(row.productId)}
                    className="text-red-600 hover:text-red-800 transition p-1"
                    title={t('delete')}
                  >
                    <Trash2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                  </button>
                </div>
              )}
            />
          </Card>
        )}
      </div>
    </>
  );
};

export default Products;
