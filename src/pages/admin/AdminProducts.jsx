import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminProducts, deleteAdminProduct } from '../../services/adminService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { ProductEditModal } from './ProductEditModal';
import { ProductCreateModal } from './ProductCreateModal';
import { 
  Layers, 
  Search, 
  RefreshCw, 
  Edit3, 
  Trash2,
  Plus,
  Star, 
  Eye, 
  EyeOff, 
  Database,
  Tag,
  CheckCircle2,
  Package,
  Image as ImageIcon
} from 'lucide-react';

export const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetchAdminProducts();
      setIsOffline(Boolean(res.isOffline));
      setProducts(res.products || []);
    } catch (err) {
      console.error('[AdminProducts] Error loading products:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();

    // Listen for catalog updates from other tabs / actions
    const handleCatalogUpdate = () => {
      loadProducts();
    };
    window.addEventListener('loozars_catalog_updated', handleCatalogUpdate);
    return () => {
      window.removeEventListener('loozars_catalog_updated', handleCatalogUpdate);
    };
  }, [loadProducts]);

  const { executeAction } = useAdminFeedback();

  const handleProductCreated = (newProduct) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleProductUpdated = (updated) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
  };

  const handleProductDeleted = (deletedId) => {
    setProducts(prev => prev.filter(p => p.id !== deletedId));
  };

  const handleDirectDelete = async (productId) => {
    setDeletingProductId(productId);
    const targetProduct = products.find(p => p.id === productId);

    await executeAction(
      `product_delete_${productId}`,
      async () => {
        const res = await deleteAdminProduct(productId);
        if (!res.success) {
          throw new Error(res.error || 'Failed to delete product.');
        }
        handleProductDeleted(productId);
        return res;
      },
      {
        label: 'Deleting product...',
        successTitle: 'Product deleted successfully',
        errorTitle: 'Product could not be deleted',
        entityType: 'product',
        entityId: productId,
        detail: targetProduct ? `Deleted SKU: ${targetProduct.sku} ("${targetProduct.name}")` : `Deleted Product ID: ${productId}`
      }
    );

    setDeletingProductId(null);
    setDeleteConfirmId(null);
  };

  const filteredProducts = products.filter(p => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-semibold text-white tracking-tight">
            Products & Catalog
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage product titles, photos, descriptions, pricing tiers, and storefront visibility
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadProducts}
            className="px-3.5 py-2 bg-[#141414] hover:bg-[#1f1f1f] text-zinc-300 hover:text-white border border-[#262626] text-xs font-medium rounded-xl transition-colors flex items-center gap-2"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-white hover:bg-zinc-200 text-black text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Plus size={14} />
            <span>Add New Product</span>
          </button>
        </div>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl text-xs text-amber-300 flex items-center gap-3">
          <Database size={16} className="shrink-0 text-amber-400" />
          <span>Database offline: Live product catalog updates require an active Supabase connection.</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search products by title, SKU, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#121212] border border-[#242424] focus:border-zinc-500 text-white placeholder-zinc-500 pl-11 pr-4 py-2.5 text-xs rounded-xl outline-none transition-colors"
        />
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="py-24 flex flex-col items-center justify-center text-xs text-zinc-500 gap-3">
          <RefreshCw size={20} className="animate-spin text-zinc-400" />
          <span>Loading products catalogue...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center text-xs text-zinc-500 bg-[#121212] border border-[#222222] rounded-2xl p-8 space-y-3">
          <Package size={32} className="mx-auto text-zinc-600" />
          <p className="font-semibold text-zinc-300 text-sm">No products found</p>
          <p className="text-[11px] text-zinc-500 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search query.' : 'Click "Add New Product" above to create your first product.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-2 px-4 py-2 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-colors inline-flex items-center gap-1.5"
            >
              <Plus size={13} />
              <span>Create Product</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((product) => {
            const variants = product.product_variants || product.variants || [];
            const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity ?? v.stockQuantity ?? 0), 0);
            const coverImage = Array.isArray(product.images) && product.images.length > 0 
              ? product.images[0] 
              : (typeof product.images === 'string' ? product.images : null);

            return (
              <div 
                key={product.id}
                className="bg-[#121212] border border-[#222222] hover:border-[#333333] p-5 rounded-2xl transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Top Bar: SKU & Badges */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300 bg-[#1a1a1a] border border-[#2a2a2a] px-2.5 py-0.5 rounded-lg font-mono">
                      {product.sku}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {product.is_featured && (
                        <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full text-[10px] font-medium flex items-center gap-1">
                          <Star size={10} className="fill-amber-400/30" /> Featured
                        </span>
                      )}
                      <span className={`px-2.5 py-0.5 border rounded-full text-[10px] font-medium flex items-center gap-1 ${
                        product.is_active !== false 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}>
                        {product.is_active !== false ? <Eye size={10} /> : <EyeOff size={10} />}
                        {product.is_active !== false ? 'Active' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Product Title + Thumbnail Header */}
                  <div className="flex items-start gap-3.5">
                    {coverImage ? (
                      <img 
                        src={coverImage} 
                        alt={product.name} 
                        className="w-14 h-16 object-cover rounded-xl bg-[#181818] border border-[#242424] shrink-0" 
                      />
                    ) : (
                      <div className="w-14 h-16 rounded-xl bg-[#181818] border border-[#242424] flex items-center justify-center shrink-0 text-zinc-600">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-white truncate">{product.name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">{product.drop || 'Drop 01 — Racing Division'}</p>
                      {product.subtitle && (
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{product.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Stock Summary */}
                  <div className="p-3 bg-[#0c0c0c] border border-[#1e1e1e] rounded-xl grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-medium block">Base Price</span>
                      <span className="text-sm font-bold text-white font-mono">₹{product.base_price}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-medium block">Sale Price</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {product.sale_price ? `₹${product.sale_price}` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-medium block">Total Stock</span>
                      <span className="text-sm font-bold text-white font-mono">{totalStock}</span>
                    </div>
                  </div>

                  {/* Variant Matrix Overview */}
                  {variants.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block">Sizes & Availability</span>
                      <div className="flex flex-wrap gap-1.5">
                        {variants.map((v, idx) => {
                          const stock = v.stock_quantity ?? v.stockQuantity ?? 0;
                          return (
                            <span 
                              key={v.id || idx} 
                              className={`px-2.5 py-1 border rounded-lg text-xs font-mono ${
                                stock === 0
                                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                  : stock <= 5
                                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                    : 'bg-[#181818] text-zinc-200 border-[#262626]'
                              }`}
                            >
                              <span className="font-sans mr-1 text-zinc-400">{v.size}:</span>
                              <span className="font-bold">{stock}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions: Edit & Direct Delete */}
                <div className="pt-3 border-t border-[#1e1e1e] flex items-center justify-between">
                  {deleteConfirmId === product.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-rose-400 font-medium">Delete item?</span>
                      <button
                        onClick={() => handleDirectDelete(product.id)}
                        disabled={deletingProductId === product.id}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                      >
                        {deletingProductId === product.id ? <RefreshCw size={10} className="animate-spin" /> : null}
                        <span>Yes, Delete</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 bg-[#1a1a1a] hover:bg-[#222222] text-zinc-400 text-[11px] rounded-lg border border-[#2a2a2a]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(product.id)}
                      className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors text-xs"
                      title="Delete Product"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => setEditingProduct(product)}
                    className="px-3.5 py-1.5 bg-[#1c1c1c] hover:bg-white hover:text-black text-zinc-200 border border-[#2d2d2d] rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Edit3 size={13} />
                    <span>Edit Product</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Product Edit Modal */}
      {editingProduct && (
        <ProductEditModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onProductUpdated={handleProductUpdated}
          onProductDeleted={handleProductDeleted}
        />
      )}

      {/* Product Create Modal */}
      {isCreateModalOpen && (
        <ProductCreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onProductCreated={(newProd) => {
            handleProductCreated(newProd);
          }}
        />
      )}
    </div>
  );
};
