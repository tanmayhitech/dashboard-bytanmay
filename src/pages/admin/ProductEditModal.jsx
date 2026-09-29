import React, { useState, useRef } from 'react';
import { updateAdminProduct, deleteAdminProduct, adjustVariantStock } from '../../services/adminService';
import { uploadProductImage } from '../../services/imageService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  X, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Package,
  Star,
  Eye,
  EyeOff,
  AlertTriangle
} from 'lucide-react';

export const ProductEditModal = ({ product, onClose, onProductUpdated, onProductDeleted }) => {
  const [name, setName] = useState(product.name || '');
  const [subtitle, setSubtitle] = useState(product.subtitle || '');
  const [basePrice, setBasePrice] = useState(product.base_price?.toString() || '899');
  const [salePrice, setSalePrice] = useState(product.sale_price !== null && product.sale_price !== undefined ? product.sale_price.toString() : '');
  const [isActive, setIsActive] = useState(product.is_active !== false);
  const [isFeatured, setIsFeatured] = useState(Boolean(product.is_featured));
  const [category, setCategory] = useState(product.category || 'tees');
  const [drop, setDrop] = useState(product.drop || 'Drop 01');
  const [description, setDescription] = useState(product.description || '');
  const [fit, setFit] = useState(product.fit || 'Boxy oversized fit');
  
  const initialDetails = Array.isArray(product.details) 
    ? product.details.join('\n') 
    : typeof product.details === 'string' 
      ? product.details 
      : '';
  const [detailsText, setDetailsText] = useState(initialDetails);

  const initialImages = Array.isArray(product.images) ? product.images : (product.images ? [product.images] : []);
  const [images, setImages] = useState(initialImages);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const initialVariants = (product.product_variants || product.variants || []).map(v => ({
    id: v.id,
    size: v.size,
    sku: v.sku,
    stock: v.stock_quantity ?? v.stockQuantity ?? 0,
    originalStock: v.stock_quantity ?? v.stockQuantity ?? 0
  }));
  const [variants, setVariants] = useState(initialVariants);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const { executeAction } = useAdminFeedback();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!product) return null;

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingImage(true);
    setErrorMessage(null);

    try {
      const uploadedUrls = [];
      for (const file of files) {
        const res = await uploadProductImage(file, product.sku || 'lzr');
        if (res.url) {
          uploadedUrls.push(res.url);
        }
      }

      if (uploadedUrls.length > 0) {
        setImages(prev => [...prev, ...uploadedUrls]);
      } else {
        setErrorMessage('Failed to upload image(s). You can paste direct URLs below.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSetPrimaryImage = (index) => {
    if (index === 0) return;
    setImages(prev => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      return [selected, ...copy];
    });
  };

  const handleVariantStockChange = (size, newStockVal) => {
    const parsed = parseInt(newStockVal, 10);
    const validStock = isNaN(parsed) || parsed < 0 ? 0 : parsed;
    setVariants(prev => prev.map(v => v.size === size ? { ...v, stock: validStock } : v));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const parsedBasePrice = parseFloat(basePrice);
    if (isNaN(parsedBasePrice) || parsedBasePrice <= 0) {
      setErrorMessage('Please enter a valid base price.');
      return;
    }

    const parsedSalePrice = salePrice.trim() !== '' ? parseFloat(salePrice) : null;
    if (parsedSalePrice !== null && (isNaN(parsedSalePrice) || parsedSalePrice < 0)) {
      setErrorMessage('Sale price must be a valid positive number or empty.');
      return;
    }

    const detailsArray = detailsText
      .split('\n')
      .map(d => d.trim())
      .filter(d => d.length > 0);

    const payload = {
      productId: product.id,
      name: name.trim(),
      subtitle: subtitle.trim() || null,
      basePrice: parsedBasePrice,
      salePrice: parsedSalePrice,
      isActive,
      isFeatured,
      category,
      drop: drop.trim(),
      description: description.trim(),
      fit: fit.trim(),
      details: detailsArray,
      images,
      variants: variants.map(v => ({
        size: v.size,
        stock: v.stock
      }))
    };

    setIsSaving(true);

    const outcome = await executeAction(
      `product_edit_${product.id}`,
      async () => {
        const res = await updateAdminProduct(payload);
        if (!res.success) {
          throw new Error(res.error || 'Failed to update product');
        }

        for (const v of variants) {
          if (v.id && v.stock !== v.originalStock) {
            const diff = v.stock - v.originalStock;
            await adjustVariantStock({
              variantId: v.id,
              delta: diff,
              reason: 'Admin product editor manual stock override',
              updatedBy: 'Admin'
            });
          }
        }

        return res;
      },
      {
        label: 'Saving product details...',
        successTitle: 'Product updated successfully',
        errorTitle: 'Product update failed',
        entityType: 'product',
        entityId: product.sku || product.id,
        detail: name
      }
    );

    setIsSaving(false);

    if (outcome.success) {
      setSuccessMessage('Product changes saved successfully.');
      if (onProductUpdated) {
        onProductUpdated({
          ...product,
          ...payload,
          product_variants: variants.map(v => ({
            ...v,
            stock_quantity: v.stock
          }))
        });
      }
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setErrorMessage(outcome.error);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);

    const outcome = await executeAction(
      `product_delete_${product.id}`,
      async () => {
        const res = await deleteAdminProduct(product.id);
        if (!res.success) {
          throw new Error(res.error || 'Failed to delete product.');
        }
        return res;
      },
      {
        label: 'Deleting product...',
        successTitle: 'Product deleted successfully',
        errorTitle: 'Product could not be deleted',
        entityType: 'product',
        entityId: product.sku || product.id,
        detail: product.name
      }
    );

    setIsDeleting(false);

    if (outcome.success) {
      if (onProductDeleted) onProductDeleted(product.id);
      onClose();
    } else {
      setErrorMessage(outcome.error);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-xs animate-fadeIn font-sans">
      <div 
        className="bg-[#16161A] border border-[#24242A] w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col font-sans text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#121215]/95 backdrop-blur border-b border-[#24242A] p-4 px-6 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-100 font-mono tracking-tight">
                {product.sku}
              </span>
              <span className="text-[10px] bg-[#1F1F24] text-zinc-300 px-2.5 py-0.5 rounded-full font-semibold border border-[#2B2B32]">
                Edit Product
              </span>
            </div>
            <h3 className="text-sm font-bold text-zinc-200 mt-0.5 truncate">{product.name}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#222228] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6 text-xs text-zinc-300">
          {/* Feedback messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 text-rose-300 rounded-xl flex items-center gap-2">
              <AlertCircle size={15} className="text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-950/50 border border-emerald-800/60 text-emerald-300 rounded-xl flex items-center gap-2">
              <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider border-b border-[#24242A] pb-1.5">
              1. Title & Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="text-zinc-300 font-medium block mb-1">Product Title *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#121215] border border-[#24242A] focus:border-zinc-500 text-zinc-100 px-3.5 py-2 rounded-xl outline-none transition-colors"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-zinc-300 font-medium block mb-1">Subtitle / Headline</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-[#121215] border border-[#24242A] focus:border-zinc-500 text-zinc-100 px-3.5 py-2 rounded-xl outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#121215] border border-[#24242A] focus:border-zinc-500 text-zinc-100 px-3 py-2 rounded-xl outline-none cursor-pointer"
                >
                  <option value="tees">Tees</option>
                  <option value="hoodies">Hoodies & Sweatshirts</option>
                  <option value="waffle">Waffle Knits</option>
                  <option value="pants">Pants & Bottoms</option>
                  <option value="accessories">Accessories</option>
                </select>
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Collection / Drop</label>
                <input
                  type="text"
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  className="w-full bg-[#121215] border border-[#24242A] focus:border-zinc-500 text-zinc-100 px-3.5 py-2 rounded-xl outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider border-b border-[#24242A] pb-1.5">
              2. Pricing
            </h4>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="text-zinc-300 font-medium block mb-1">Base Price (₹) *</label>
                <input
                  type="number"
                  min="0"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full bg-[#121215] border border-[#24242A] focus:border-zinc-500 text-zinc-100 font-mono font-bold px-3.5 py-2 rounded-xl outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Sale Price (₹, Optional)</label>
                <input
                  type="number"
                  min="0"
                  placeholder="Leave empty if none"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full bg-[#121215] border border-[#24242A] focus:border-zinc-500 text-zinc-100 font-mono font-bold px-3.5 py-2 rounded-xl outline-none placeholder-zinc-600"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Photos */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between border-b border-[#24242A] pb-1.5">
              <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                3. Photos ({images.length})
              </h4>
              <span className="text-[11px] text-zinc-500">First image is primary</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex gap-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-2.5 px-3 bg-[#121215] hover:bg-[#18181D] border border-dashed border-[#2B2B32] rounded-xl text-zinc-300 text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  {isUploadingImage ? <RefreshCw size={13} className="animate-spin" /> : <Upload size={13} className="text-zinc-400" />}
                  <span>{isUploadingImage ? 'Uploading...' : 'Upload Photos'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Or paste image URL (https://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 bg-[#121215] border border-[#24242A] px-3 py-2 rounded-xl text-xs text-zinc-100 outline-none focus:border-zinc-500 placeholder-zinc-600"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={!imageUrlInput.trim()}
                  className="px-3.5 py-2 bg-[#1E1E24] hover:bg-[#26262E] text-zinc-200 border border-[#2B2B33] rounded-xl text-xs font-medium disabled:opacity-40"
                >
                  Add URL
                </button>
              </div>

              {images.length > 0 && (
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5 pt-1">
                  {images.map((imgUrl, idx) => (
                    <div key={idx} className="relative group aspect-[3/4] bg-[#121215] border border-[#24242A] rounded-xl overflow-hidden">
                      <img src={imgUrl} alt="Product" className="w-full h-full object-cover" />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-black/80 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                          PRIMARY
                        </span>
                      )}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-1.5">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="w-full py-1 bg-white text-zinc-900 text-[10px] font-bold rounded-md"
                          >
                            Set Primary
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Variants */}
          {variants.length > 0 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between border-b border-[#24242A] pb-1.5">
                <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={13} className="text-zinc-400" />
                  <span>4. Size Stock Matrix</span>
                </h4>
                <span className="text-xs text-zinc-400">
                  Total: {variants.reduce((s, v) => s + (v.stock || 0), 0)} units
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {variants.map((v) => (
                  <div key={v.size} className="bg-[#121215] border border-[#24242A] p-2.5 rounded-xl text-center space-y-1">
                    <span className="text-xs font-bold text-zinc-100 block">{v.size}</span>
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => handleVariantStockChange(v.size, e.target.value)}
                      className="w-full bg-[#18181D] border border-[#24242A] text-center text-zinc-100 font-mono font-semibold py-1 rounded-lg text-xs outline-none focus:border-zinc-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Description */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider border-b border-[#24242A] pb-1.5">
              5. Descriptions & Bullets
            </h4>

            <div className="space-y-2.5">
              <div>
                <label className="text-zinc-300 font-medium block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#121215] border border-[#24242A] focus:border-zinc-500 text-zinc-100 px-3.5 py-2 rounded-xl outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Fit & Cut</label>
                <input
                  type="text"
                  value={fit}
                  onChange={(e) => setFit(e.target.value)}
                  className="w-full bg-[#121215] border border-[#24242A] focus:border-zinc-500 text-zinc-100 px-3.5 py-2 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Specification Bullets (one per line)</label>
                <textarea
                  rows={3}
                  value={detailsText}
                  onChange={(e) => setDetailsText(e.target.value)}
                  className="w-full bg-[#121215] border border-[#24242A] focus:border-zinc-500 text-zinc-100 px-3.5 py-2 rounded-xl outline-none resize-none font-mono text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Visibility */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="flex items-center gap-2.5 p-3.5 bg-[#121215] border border-[#24242A] rounded-xl cursor-pointer select-none hover:bg-[#18181D] transition-colors">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded accent-white bg-[#16161A] border-[#24242A]"
              />
              <div>
                <span className="text-xs font-semibold text-zinc-100 block">Active in Store</span>
                <span className="text-[11px] text-zinc-500">Visible to customers</span>
              </div>
            </label>

            <label className="flex items-center gap-2.5 p-3.5 bg-[#121215] border border-[#24242A] rounded-xl cursor-pointer select-none hover:bg-[#18181D] transition-colors">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 rounded accent-white bg-[#16161A] border-[#24242A]"
              />
              <div>
                <span className="text-xs font-semibold text-zinc-100 block">Featured</span>
                <span className="text-[11px] text-zinc-500">Highlight on homepage</span>
              </div>
            </label>
          </div>

          {/* Delete Danger Zone */}
          <div className="p-4 bg-rose-950/30 border border-rose-800/50 rounded-2xl flex items-center justify-between">
            <div>
              <span className="font-semibold text-rose-300 block">Delete Product</span>
              <span className="text-[11px] text-rose-400/80">Permanently delete this product and all size variants.</span>
            </div>

            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-1.5 bg-[#1E1E24] text-rose-300 border border-rose-800/60 hover:bg-rose-950/60 rounded-xl font-medium transition-colors cursor-pointer"
              >
                Delete
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-2.5 py-1 bg-[#1E1E24] border border-[#2B2B33] rounded-lg text-zinc-400 text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDelete}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm'}
                </button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#24242A]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#1E1E24] hover:bg-[#26262E] text-zinc-300 text-xs font-medium rounded-xl border border-[#2B2B33] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {isSaving ? <RefreshCw size={13} className="animate-spin text-zinc-900" /> : null}
              <span>Save Product Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
