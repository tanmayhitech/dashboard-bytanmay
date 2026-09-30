import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  fetchAdminProducts, 
  deleteAdminProduct,
  fetchProductReviews,
  moderateProductReview
} from '../../services/adminService';
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
  Image as ImageIcon,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ShieldCheck,
  Tag
} from 'lucide-react';

export const AdminProducts = () => {
  const [activeSubTab, setActiveSubTab] = useState('catalog'); // 'catalog' | 'reviews'

  // Catalog State
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewSearchQuery, setReviewSearchQuery] = useState('');
  const [reviewStatusFilter, setReviewStatusFilter] = useState('all');

  const { executeAction, showToast } = useAdminFeedback();

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

  const loadReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const res = await fetchProductReviews({ status: reviewStatusFilter });
      setReviews(res.reviews || []);
    } catch (err) {
      console.error('[AdminProducts] Error loading reviews:', err);
    } finally {
      setReviewsLoading(false);
    }
  }, [reviewStatusFilter]);

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

  useEffect(() => {
    if (activeSubTab === 'reviews') {
      loadReviews();
    }
  }, [activeSubTab, loadReviews]);

  useEffect(() => {
    const handleReviewsUpdate = () => {
      loadReviews();
    };
    window.addEventListener('loozars_reviews_updated', handleReviewsUpdate);
    return () => {
      window.removeEventListener('loozars_reviews_updated', handleReviewsUpdate);
    };
  }, [loadReviews]);

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

  const handleModerate = async (reviewId, newStatus) => {
    try {
      const res = await moderateProductReview({ reviewId, status: newStatus });
      if (res.success) {
        setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
        showToast('Review Moderated', `Review status set to ${newStatus}.`, 'success');
      } else {
        showToast('Error', res.error || 'Failed to moderate review', 'error');
      }
    } catch (err) {
      showToast('Error', err.message || 'Moderation failed', 'error');
    }
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

  // Reviews Metrics & Filtering
  const reviewsMetrics = useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const approved = reviews.filter(r => r.status === 'approved').length;
    const avgRating = total > 0 
      ? (reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / total).toFixed(1)
      : '5.0';
    const verifiedCount = reviews.filter(r => r.is_verified_buyer).length;

    return { total, pending, approved, avgRating, verifiedCount };
  }, [reviews]);

  const filteredReviews = useMemo(() => {
    let result = [...reviews];
    if (reviewSearchQuery.trim()) {
      const q = reviewSearchQuery.toLowerCase().trim();
      result = result.filter(r => 
        (r.customer_name || '').toLowerCase().includes(q) ||
        (r.product_name || '').toLowerCase().includes(q) ||
        (r.review_title || '').toLowerCase().includes(q) ||
        (r.review_text || '').toLowerCase().includes(q)
      );
    }
    if (reviewStatusFilter !== 'all') {
      result = result.filter(r => r.status === reviewStatusFilter);
    }
    return result;
  }, [reviews, reviewSearchQuery, reviewStatusFilter]);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Sub-Navigation Selector */}
      <div className="flex items-center gap-1.5 p-1 bg-[#121216] border border-[#22222C] rounded-2xl w-fit shadow-xs">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'catalog'
              ? 'bg-[#22222C] text-white border border-[#3A3A4C] shadow-xs font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Package size={14} className={activeSubTab === 'catalog' ? 'text-zinc-200' : 'text-zinc-500'} />
          <span>Product Catalog</span>
          <span className="px-1.5 py-0.5 rounded-full bg-[#181820] text-[10px] text-zinc-400 font-mono">
            {products.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('reviews')}
          className={`px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
            activeSubTab === 'reviews'
              ? 'bg-[#22222C] text-white border border-[#3A3A4C] shadow-xs font-semibold'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <Star size={14} className={activeSubTab === 'reviews' ? 'text-amber-400' : 'text-zinc-500'} />
          <span>Reviews & Ratings</span>
          {reviewsMetrics.pending > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/60 text-[10px] font-mono font-semibold">
              {reviewsMetrics.pending} pending
            </span>
          )}
        </button>
      </div>

      {activeSubTab === 'catalog' ? (
        <>
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
                className="px-3 py-1.5 bg-[#16161A] hover:bg-[#1D1D22] text-zinc-200 border border-[#24242A] text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
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
              placeholder="Search products by title, SKU, slug, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#16161A] border border-[#24242A] focus:border-zinc-500 text-zinc-100 pl-9 pr-4 py-2.5 text-xs rounded-xl outline-none transition-colors placeholder-zinc-600 shadow-xs"
            />
          </div>

          {/* Products Grid */}
          {isLoading ? (
            <div className="py-20 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw size={20} className="animate-spin text-zinc-500" />
              <span className="text-xs">Loading catalog...</span>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 bg-[#16161A] border border-[#24242A] rounded-2xl">
              <Package size={28} className="mx-auto text-zinc-600 mb-2" />
              <p className="font-semibold text-zinc-300 text-sm">No Products Found</p>
              <p className="text-xs text-zinc-500 mt-1">Try adjusting your search criteria or add a new piece.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const variants = product.product_variants || product.variants || [];
                const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity ?? v.stockQuantity ?? 0), 0);
                const coverImage = Array.isArray(product.images) && product.images.length > 0 
                  ? product.images[0] 
                  : (typeof product.images === 'string' ? product.images : null);

                return (
                  <div 
                    key={product.id}
                    className="bg-[#16161A] border border-[#24242A] hover:border-[#383844] rounded-2xl p-4 sm:p-5 flex flex-col justify-between space-y-4 transition-all shadow-xs"
                  >
                    <div className="space-y-3.5">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono text-zinc-400 font-semibold px-2 py-0.5 bg-[#121215] rounded-md border border-[#24242A]">
                          {product.sku || 'SKU-PENDING'}
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
                        className="px-3.5 py-1.5 bg-[#1E1E24] hover:bg-[#26262E] text-zinc-200 border border-[#2B2B33] rounded-xl transition-colors text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
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
        </>
      ) : (
        /* REVIEWS & RATINGS MODERATION SUB-TAB */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
            <div>
              <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Review & Rating Moderation</h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Verify authentic buyer feedback, approve verified drop reviews, and maintain atelier reputation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadReviews}
                className="px-3.5 py-1.5 bg-[#16161A] hover:bg-[#202028] text-zinc-300 border border-[#262630] text-xs font-medium rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <RefreshCw size={13} className={reviewsLoading ? 'animate-spin text-zinc-400' : 'text-zinc-400'} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* Review KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
            <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="font-medium text-zinc-300">Average Rating</span>
                <Star size={15} className="text-amber-400 fill-amber-400" />
              </div>
              <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">{reviewsMetrics.avgRating} / 5.0</div>
              <div className="text-[11px] text-zinc-500 mt-1.5">Across {reviewsMetrics.total} submissions</div>
            </div>

            <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="font-medium text-zinc-300">Pending Moderation</span>
                <AlertCircle size={15} className="text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-300 tracking-tight font-mono">{reviewsMetrics.pending}</div>
              <div className="text-[11px] text-zinc-500 mt-1.5">Awaiting atelier approval</div>
            </div>

            <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="font-medium text-zinc-300">Approved Reviews</span>
                <CheckCircle2 size={15} className="text-emerald-400" />
              </div>
              <div className="text-2xl font-bold text-emerald-400 tracking-tight font-mono">{reviewsMetrics.approved}</div>
              <div className="text-[11px] text-zinc-500 mt-1.5">Live on storefront</div>
            </div>

            <div className="bg-[#141418] border border-[#22222C] p-5 rounded-2xl shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between text-zinc-400 mb-1.5">
                <span className="font-medium text-zinc-300">Verified Patrons</span>
                <ShieldCheck size={15} className="text-violet-400" />
              </div>
              <div className="text-2xl font-bold text-[#EDEDF0] tracking-tight font-mono">{reviewsMetrics.verifiedCount}</div>
              <div className="text-[11px] text-zinc-500 mt-1.5">Order verified submissions</div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div className="md:col-span-7 relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search reviews by customer, silhouette name, or feedback text..."
                value={reviewSearchQuery}
                onChange={(e) => setReviewSearchQuery(e.target.value)}
                className="w-full bg-[#16161A] border border-[#262632] focus:border-zinc-500 text-zinc-100 pl-9 pr-4 py-2.5 text-xs rounded-xl outline-none transition-colors placeholder-zinc-600 shadow-xs"
              />
            </div>

            <div className="md:col-span-5 flex items-center gap-1 bg-[#121216] p-1 rounded-xl border border-[#22222C] text-xs overflow-x-auto">
              {[
                { id: 'all', label: 'All Reviews' },
                { id: 'pending', label: 'Pending' },
                { id: 'approved', label: 'Approved' },
                { id: 'hidden', label: 'Hidden' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setReviewStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                    reviewStatusFilter === tab.id
                      ? 'bg-[#22222C] text-white border border-[#3A3A4C] shadow-xs font-semibold'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          <div className="bg-[#16161A] border border-[#24242E] rounded-2xl shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#121216] text-zinc-400 font-semibold border-b border-[#24242E]">
                  <tr>
                    <th className="py-3 px-4">Patron</th>
                    <th className="py-3 px-4">Silhouette</th>
                    <th className="py-3 px-4">Rating & Review</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202028]">
                  {reviewsLoading ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-500">
                        <RefreshCw size={20} className="animate-spin mx-auto text-zinc-500 mb-2" />
                        <span>Loading product reviews...</span>
                      </td>
                    </tr>
                  ) : filteredReviews.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-16 text-center text-zinc-500">
                        <Star size={24} className="mx-auto text-zinc-600 mb-2" />
                        <p className="font-semibold text-zinc-300 text-sm">No Reviews Found</p>
                        <p className="text-xs text-zinc-500 mt-1">No reviews match the selected filter criteria.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredReviews.map((r) => (
                      <tr key={r.id} className="hover:bg-[#1A1A22] transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-[#EDEDF0] flex items-center gap-1.5">
                            <span>{r.customer_name || 'Anonymous Patron'}</span>
                            {r.is_verified_buyer && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 text-[9px] font-mono">
                                <ShieldCheck size={10} /> Verified
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-zinc-500">{r.customer_email || '—'}</div>
                        </td>

                        <td className="py-3.5 px-4 font-medium text-zinc-200">
                          {r.product_name || 'LOOZARS Silhouette'}
                        </td>

                        <td className="py-3.5 px-4 max-w-sm">
                          <div className="flex items-center gap-1 mb-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={11}
                                className={star <= (r.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}
                              />
                            ))}
                            <span className="font-mono text-zinc-400 font-bold ml-1 text-[10px]">{r.rating}.0</span>
                          </div>
                          {r.review_title && (
                            <div className="font-semibold text-zinc-200 text-xs">{r.review_title}</div>
                          )}
                          <p className="text-zinc-400 text-[11px] mt-0.5 line-clamp-2">{r.review_text}</p>
                        </td>

                        <td className="py-3.5 px-4 text-zinc-400 text-xs font-mono">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {r.status === 'approved' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                              <CheckCircle2 size={10} /> Approved
                            </span>
                          ) : r.status === 'hidden' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60">
                              <XCircle size={10} /> Hidden
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                              <AlertCircle size={10} /> Pending
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {r.status !== 'approved' && (
                              <button
                                onClick={() => handleModerate(r.id, 'approved')}
                                className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Approve
                              </button>
                            )}
                            {r.status !== 'hidden' && (
                              <button
                                onClick={() => handleModerate(r.id, 'hidden')}
                                className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-rose-950/60 text-zinc-400 hover:text-rose-300 border border-zinc-800 hover:border-rose-800/60 text-[11px] font-medium transition-colors cursor-pointer"
                              >
                                Hide
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
