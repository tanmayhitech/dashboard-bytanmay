import React, { useState, useEffect, useCallback } from 'react';
import { fetchAdminProducts, deleteAdminProduct } from '../../services/adminService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { ProductEditModal } from './ProductEditModal';
import { ProductCreateModal } from './ProductCreateModal';
import { 
  Search, 
  RefreshCw, 
  Edit3, 
  Trash2,
  Plus,
  Star, 
  Eye, 
  EyeOff, 
  Database,
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
        detail: targetProduct ? `SKU: ${targetProduct.sku}` : `ID: ${productId}`
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Product Catalog</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage product titles, prices, descriptions, size variants, and store visibility
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadProducts}
            className="px-3 py-1.5 bg-[#16161A] hover:bg-[#1D1D22] text-zinc-200 border border-[#24242A] text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin text-zinc-400' : 'text-zinc-500'} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-1.5 bg-white hover:bg-zinc-200 text-black text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {/* Offline Alert */}
      {isOffline && (
        <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-xl text-xs text-amber-300 flex items-center gap-2.5">
          <Database size={15} className="shrink-0 text-amber-400" />
          <span>Database offline: Product updates require Supabase connection.</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          placeholder="Search products by name, SKU, or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-[#16161A] border border-[#24242A] focus:border-zinc-500 text-zinc-100 placeholder-zinc-500 pl-9 pr-4 py-2 text-xs rounded-xl outline-none transition-colors shadow-xs"
        />
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-xs text-zinc-500 gap-2">
          <RefreshCw size={20} className="animate-spin text-zinc-500" />
          <span>Loading products...</span>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center text-xs text-zinc-500 bg-[#16161A] border border-[#24242A] rounded-2xl p-8 space-y-3 shadow-xs">
          <Package size={32} className="mx-auto text-zinc-600" />
          <p className="font-semibold text-zinc-300 text-sm">No Products Found</p>
          <p className="text-zinc-500 max-w-sm mx-auto">
            {searchQuery ? 'Try adjusting your search query.' : 'Add your first product to get started.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-2 px-3.5 py-1.5 bg-white hover:bg-zinc-200 text-black font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus size={13} />
              <span>Add Product</span>
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
                className="bg-[#16161A] border border-[#24242A] hover:border-zinc-700 p-5 rounded-2xl shadow-xs transition-colors flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3.5">
                  {/* Top Bar: SKU & Badges */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-zinc-300 bg-[#121215] border border-[#24242A] px-2 py-0.5 rounded-lg font-mono">
                      {product.sku}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {product.is_featured && (
                        <span className="px-2 py-0.5 bg-[#1C1C24] text-zinc-200 border border-[#2E2E3C] rounded-full text-[10px] font-semibold flex items-center gap-1">
                          <Star size={10} className="fill-zinc-300 text-zinc-300" /> Featured
                        </span>
                      )}
                      <span className={`px-2 py-0.5 border rounded-full text-[10px] font-semibold flex items-center gap-1 ${
                        product.is_active !== false 
                          ? 'bg-emerald-950/50 text-emerald-300 border-emerald-800/60' 
                          : 'bg-[#121215] text-zinc-400 border-[#24242A]'
                      }`}>
                        {product.is_active !== false ? <Eye size={10} /> : <EyeOff size={10} />}
                        {product.is_active !== false ? 'Active' : 'Draft'}
                      </span>
                    </div>
                  </div>

                  {/* Title & Thumbnail */}
                  <div className="flex items-start gap-3.5">
                    {coverImage ? (
                      <img 
                        src={coverImage} 
                        alt={product.name} 
                        className="w-14 h-16 object-cover rounded-xl bg-[#121215] border border-[#24242A] shrink-0" 
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-14 h-16 rounded-xl bg-[#121215] border border-[#24242A] flex items-center justify-center shrink-0 text-zinc-600">
                        <ImageIcon size={20} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm sm:text-base font-bold text-zinc-100 truncate">{product.name}</h3>
                      <p className="text-xs text-zinc-400 mt-0.5 truncate">{product.drop || 'Standard Collection'}</p>
                      {product.subtitle && (
                        <p className="text-[11px] text-zinc-500 mt-0.5 truncate">{product.subtitle}</p>
                      )}
                    </div>
                  </div>

                  {/* Price & Stock Stats */}
                  <div className="p-3 bg-[#121215] border border-[#24242A] rounded-xl grid grid-cols-3 gap-2 text-center">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-medium block font-mono">Base Price</span>
                      <span className="text-sm font-bold text-zinc-100 font-mono">₹{product.base_price}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-medium block font-mono">Sale Price</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono">
                        {product.sale_price ? `₹${product.sale_price}` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-medium block font-mono">Total Stock</span>
                      <span className="text-sm font-bold text-zinc-100 font-mono">{totalStock}</span>
                    </div>
                  </div>

                  {/* Variants Preview */}
                  {variants.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block font-mono">Sizes & Stock Matrix</span>
                      <div className="flex flex-wrap gap-1.5">
                        {variants.map((v, idx) => {
                          const stock = v.stock_quantity ?? v.stockQuantity ?? 0;
                          return (
                            <span 
                              key={v.id || idx} 
                              className={`px-2 py-0.5 border rounded-lg text-xs font-mono flex items-center gap-1 ${
                                stock === 0
                                  ? 'bg-rose-950/40 text-rose-300 border-rose-800/50'
                                  : stock <= 5
                                    ? 'bg-rose-950/30 text-rose-300 border-rose-800/40'
                                    : 'bg-[#121215] text-zinc-300 border-[#24242A]'
                              }`}
                            >
                              <span className="font-sans text-zinc-500 text-[11px]">{v.size}:</span>
                              <span className="font-bold">{stock}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-[#1F1F24] flex items-center justify-between">
                  {deleteConfirmId === product.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-rose-400 font-medium">Delete item?</span>
                      <button
                        onClick={() => handleDirectDelete(product.id)}
                        disabled={deletingProductId === product.id}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        {deletingProductId === product.id ? <RefreshCw size={10} className="animate-spin" /> : null}
                        <span>Delete</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(null)}
                        className="px-2 py-1 bg-[#1E1E24] text-zinc-400 text-xs rounded-lg border border-[#2B2B33]"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirmId(product.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors text-xs"
                      title="Delete Product"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <button
                    onClick={() => setEditingProduct(product)}
                    className="px-3.5 py-1.5 bg-[#1E1E24] hover:bg-[#26262E] text-zinc-200 border border-[#2B2B33] rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs"
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
          onProductCreated={handleProductCreated}
        />
      )}
    </div>
  );
};
