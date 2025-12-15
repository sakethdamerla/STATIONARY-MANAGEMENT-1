import { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Building2, Archive, List, Lock } from 'lucide-react';
import AddProduct from './stock/AddProduct';
import AddStock from './stock/AddStock';
import VendorManagement from './stock/VendorManagement';
import StockEntries from './stock/StockEntries';
import { hasViewAccess } from '../utils/permissions';

const ManageStock = ({ itemCategories, addItemCategory, setItemCategories, currentCourse, products = [], setProducts, currentUser }) => {
  // Check access level
  const isSuperAdmin = currentUser?.role === 'Administrator';
  const permissions = currentUser?.permissions || [];
  
  // Check for legacy manage-stock permission (without access level)
  const hasLegacyPermission = permissions.some(p => {
    if (typeof p !== 'string') return false;
    return p === 'manage-stock' || p.startsWith('manage-stock:');
  });
  
  // Check permissions for each tab
  const canAccessProducts = isSuperAdmin || hasLegacyPermission || hasViewAccess(permissions, 'stock-products');
  const canAccessStock = isSuperAdmin || hasLegacyPermission || hasViewAccess(permissions, 'stock-add');
  const canAccessEntries = isSuperAdmin || hasLegacyPermission || hasViewAccess(permissions, 'stock-entries');
  const canAccessVendors = isSuperAdmin || hasLegacyPermission || hasViewAccess(permissions, 'stock-vendors');

  // Define all tabs with their permissions
  const allTabs = useMemo(() => [
    { id: 'products', label: 'Add Product', icon: Package, canAccess: canAccessProducts },
    { id: 'stock', label: 'Add Stock', icon: Plus, canAccess: canAccessStock },
    { id: 'entries', label: 'Stock Entries', icon: List, canAccess: canAccessEntries },
    { id: 'vendors', label: 'Vendor Management', icon: Building2, canAccess: canAccessVendors },
  ], [canAccessProducts, canAccessStock, canAccessEntries, canAccessVendors]);

  // Filter tabs based on permissions
  const tabs = useMemo(() => allTabs.filter(tab => tab.canAccess), [allTabs]);

  // Set initial active tab to first available tab
  const [activeTab, setActiveTab] = useState(() => {
    const firstAvailableTab = allTabs.find(tab => tab.canAccess);
    return firstAvailableTab ? firstAvailableTab.id : null;
  });

  // Update active tab if current tab becomes unavailable
  useEffect(() => {
    const currentTab = allTabs.find(tab => tab.id === activeTab);
    if (currentTab && !currentTab.canAccess) {
      const firstAvailableTab = tabs.find(tab => tab.canAccess);
      if (firstAvailableTab) {
        setActiveTab(firstAvailableTab.id);
      } else {
        setActiveTab(null);
      }
    }
  }, [activeTab, allTabs, tabs]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto">
        {/* Header Section with Tabs */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Archive className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Manage Stock</h1>
                <p className="text-gray-600 mt-1 text-sm">Manage products, stock entries, and vendors</p>
              </div>
            </div>

            {tabs.length > 0 && (
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                {allTabs.map((tab) => {
                  const IconComponent = tab.icon;
                  const isActive = activeTab === tab.id;
                  const hasAccess = tab.canAccess;
                  
                  if (!hasAccess) {
                    return (
                      <button
                        key={tab.id}
                        disabled
                        className="flex-1 min-w-[140px] md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all opacity-60 cursor-not-allowed bg-gray-100 text-gray-400"
                        title="You do not have permission to access this tab"
                      >
                        <Lock size={16} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  }
                  
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex-1 min-w-[140px] md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <IconComponent size={16} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {tabs.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Lock className="text-gray-400" size={32} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Access</h3>
                <p className="text-sm text-gray-600">You do not have permission to access any stock management features.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {tabs.length > 0 && activeTab && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            {activeTab === 'products' && canAccessProducts && (
              <AddProduct
                itemCategories={itemCategories}
                addItemCategory={addItemCategory}
                setItemCategories={setItemCategories}
                currentCourse={currentCourse}
                products={products}
                setProducts={setProducts}
                currentUser={currentUser}
              />
            )}
            {activeTab === 'stock' && canAccessStock && (
              <AddStock products={products} setProducts={setProducts} currentUser={currentUser} />
            )}
            {activeTab === 'entries' && canAccessEntries && <StockEntries currentUser={currentUser} />}
            {activeTab === 'vendors' && canAccessVendors && <VendorManagement currentUser={currentUser} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageStock;
