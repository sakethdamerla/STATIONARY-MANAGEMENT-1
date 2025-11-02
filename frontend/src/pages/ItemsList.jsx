import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { apiUrl } from '../utils/api';

/**
 * @typedef {object} Product
 * @property {string} _id
 * @property {string} name
 * @property {string} [forCourse]
 * @property {number} [year]
 */

const ItemsList = ({ itemCategories, addItemCategory, setItemCategories, currentCourse, products = [], setProducts }) => {
  const [newItem, setNewItem] = useState('');
  const [editingIndex, setEditingIndex] = useState(-1);
  const [editingValue, setEditingValue] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(currentCourse || '');
  const [selectedYear, setSelectedYear] = useState('');
  const [config, setConfig] = useState(null);
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(apiUrl('/api/config/academic'));
        if (res.ok) {
          const data = await res.json();
          setConfig(data);
          if (!selectedCourse && data.courses?.[0]) {
            setSelectedCourse(data.courses[0].name);
            setSelectedYear(String(data.courses[0].years?.[0] || ''));
          }
        }
      } catch (_) {}
    })();
  }, []);

  // when the global products change, sync categories
  useEffect(() => {
    const cats = Array.from(new Set((products || []).map(p => p.name.toLowerCase().replace(/\s+/g, '_'))));
    setItemCategories && setItemCategories(cats);
  }, [products, setItemCategories]);

  const filteredProducts = useMemo(() => {
    return (products || []).filter(p => {
      if (selectedCourse && p.forCourse && p.forCourse !== selectedCourse) return false;
      if (selectedYear && p.year && String(p.year) !== String(selectedYear)) return false;
      return true;
    });
  }, [products, selectedCourse, selectedYear]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name = newItem.trim();
    if (!name) return;
    try {
      const response = await fetch(apiUrl('/api/products'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description: name, price: 0, category: 'Other', forCourse: selectedCourse || undefined, year: selectedYear ? Number(selectedYear) : undefined }),
      });
      if (!response.ok) throw new Error('Failed to create product');
      const created = await response.json();
      // update global products
      setProducts && setProducts(prev => [...(prev || []), created]);
      setStatusMsg('Created');
      setNewItem('');
    } catch (err) {
      console.error('Create failed:', err);
      setStatusMsg('Create failed: ' + (err.message || 'unknown'));
      console.error(err);
    }
  };

  const handleDelete = async (productId, productName) => {
    try {
      const res = await fetch(apiUrl(`/api/products/${productId}`), { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setProducts && setProducts(prev => (prev || []).filter(p => p._id !== productId));
      setItemCategories && setItemCategories(prev => prev.filter(i => i !== productName));
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const startEdit = (idx, val) => {
    setEditingIndex(idx);
    setEditingValue(val);
  };

  const saveEdit = async (oldVal) => {
    const newVal = editingValue.trim();
    if (!newVal) return;
    // find product by oldVal
    const product = (products || []).find(p => p.name.toLowerCase().replace(/\s+/g, '_') === oldVal);
    if (!product) return;
    try {
      const res = await fetch(apiUrl(`/api/products/${product._id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newVal }),
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      setProducts && setProducts(prev => (prev || []).map(p => p._id === updated._id ? updated : p));
      const normalizedNew = updated.name.toLowerCase().replace(/\s+/g, '_');
      setItemCategories(prev => prev.map(i => i === oldVal ? normalizedNew : i));
      setEditingIndex(-1);
      setEditingValue('');
    } catch (err) {
      console.error('Edit failed', err);
    }
  };

  /**
   * @param {{
   *  product: Product,
   *  idx: number
   * }} props
   */
  const ItemRow = ({ product, idx }) => {
    const isEditing = editingIndex === idx;
    const normalizedName = product.name.toLowerCase().replace(/\s+/g, '_');

    if (isEditing) {
      return (
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-blue-50">
          <input 
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={editingValue} 
            onChange={(e) => setEditingValue(e.target.value)} 
          />
          <div className="flex gap-2 ml-4">
            <button 
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              onClick={() => saveEdit(normalizedName)}
            >
              Save
            </button>
            <button 
              className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              onClick={() => setEditingIndex(-1)}
            >
              Cancel
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between p-4 border-b border-gray-200 hover:bg-gray-50 transition-colors">
        <span className="text-gray-900 font-medium">{product.name}</span>
        <div className="flex gap-2">
          <button 
            className="flex items-center gap-1 px-3 py-1 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            onClick={() => startEdit(idx, normalizedName)}
          >
            <Edit size={14} />
            Edit
          </button>
          <button 
            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            onClick={() => handleDelete(product._id, normalizedName)}
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div className="flex items-center gap-4 mb-4 lg:mb-0">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manage Items</h1>
              <p className="text-gray-600">Add, edit, or delete items available for students.</p>
            </div>
          </div>
        </div>

        {/* Controls Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Filters */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedCourse} 
                    onChange={(e) => setSelectedCourse(e.target.value)}
                  >
                    <option value="">All Courses</option>
                    {(config?.courses || []).map(c => (
                      <option key={c.name} value={c.name}>{c.displayName}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(e.target.value)}
                  >
                    <option value="">All Years</option>
                    {(config?.courses?.find(c => c.name === selectedCourse)?.years || []).map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Add Item Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Add New Item</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Enter item name..."
                  />
                  <button 
                    type="submit" 
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Status Message */}
        {statusMsg && (
          <div className={`mb-6 p-3 rounded-lg text-sm ${
            statusMsg.startsWith('Created') 
              ? 'bg-green-100 text-green-700 border border-green-200' 
              : 'bg-red-100 text-red-700 border border-red-200'
          }`}>
            {statusMsg}
          </div>
        )}

        {/* Items List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Current Items</h2>
              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
                {filteredProducts.length} items
              </span>
            </div>
          </div>
          
          <div>
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product, idx) => (
                <ItemRow key={product._id} product={product} idx={idx} />
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No items found for the selected filters.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemsList;