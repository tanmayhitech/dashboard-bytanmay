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
  Layers,
  Star,
  Eye,
  EyeOff,
  Clock,
  Database,
  Link as LinkIcon,
  AlertTriangle
} from 'lucide-react';

export const ProductEditModal = ({ product, onClose, onProductUpdated, onProductDeleted }) => {
  // Product Basics
  const [name, setName] = useState(product.name || '');
  const [subtitle, setSubtitle] = useState(product.subtitle || '');
  const [basePrice, setBasePrice] = useState(product.base_price?.toString() || '899');
  const [salePrice, setSalePrice] = useState(product.sale_price !== null && product.sale_price !== undefined ? product.sale_price.toString() : '');
  const [isActive, setIsActive] = useState(product.is_active !== false);
  const [isFeatured, setIsFeatured] = useState(Boolean(product.is_featured));
  const [category, setCategory] = useState(product.category || 'tees');
  const [drop, setDrop] = useState(product.drop || 'DROP 01 // RACING DIVISION');
  const [description, setDescription] = useState(product.description || '');
  const [fit, setFit] = useState(product.fit || 'Boxy oversized silhouette with dropped shoulders');
  
  // Specifications
  const initialDetails = Array.isArray(product.details) 
    ? product.details.join('\n') 
    : typeof product.details === 'string' 
      ? product.details 
      : '';
  const [detailsText, setDetailsText] = useState(initialDetails);

  // Photos State
  const initialImages = Array.isArray(product.images) ? product.images : (product.images ? [product.images] : []);
  const [images, setImages] = useState(initialImages);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Variants State
  const initialVariants = (product.product_variants || product.variants || []).map(v => ({
    id: v.id,
    size: v.size,
    sku: v.sku,
    stock: v.stock_quantity ?? v.stockQuantity ?? 0,
    originalStock: v.stock_quantity ?? v.stockQuantity ?? 0
  }));
  const [variants, setVariants] = useState(initialVariants);

  // Deletion Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Save / Execution Context
  const { executeAction } = useAdminFeedback();
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [lastDuration, setLastDuration] = useState(null);

  if (!product) return null;

  // Handle Image Upload from PC
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
        } else if (res.error) {
          console.warn('[ProductEditModal] Upload error:', res.error);
        }
      }

      if (uploadedUrls.length > 0) {
        setImages(prev => [...prev, ...uploadedUrls]);
      } else {
        setErrorMessage('Failed to upload image(s). You can also paste direct URLs.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle Adding Image by URL
  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  // Remove Image
  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Make Image Primary Cover
  const handleSetPrimaryImage = (index) => {
    if (index === 0) return;
    setImages(prev => {
      const next = [...prev];
      const [chosen] = next.splice(index, 1);
      next.unshift(chosen);
      return next;
    });
  };

  // Variant Stock Change
  const handleVariantStockChange = (size, newStock) => {
    setVariants(prev => prev.map(v => v.size === size ? { ...v, stock: Math.max(0, parseInt(newStock, 10) || 0) } : v));
  };

  // Save Product Updates
  const handleSave = async (e) => {
    e?.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLastDuration(null);

    const parsedBase = parseInt(basePrice, 10);
    const parsedSale = salePrice.trim() !== '' ? parseInt(salePrice, 10) : null;

    if (isNaN(parsedBase) || parsedBase < 0) {
      setErrorMessage('Please enter a valid non-negative base price.');
      return;
    }

    const detailsArray = detailsText
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    setIsSaving(true);

    const outcome = await executeAction(
      'product_update',
      async () => {
        // 1. Update main product
        const res = await updateAdminProduct({
          productId: product.id,
          name: name.trim(),
          subtitle: subtitle.trim(),
          basePrice: parsedBase,
          salePrice: parsedSale,
          isActive,
          isFeatured,
          category: category.trim(),
          drop: drop.trim(),
          description: description.trim(),
          fit: fit.trim(),
          details: detailsArray,
          images: images
        });

        if (!res.success) {
          throw new Error(res.error || 'Failed to update product in database.');
        }

        // 2. Update changed variant stocks if any
        const updatedVariants = [];
        for (const v of variants) {
          if (v.id && v.stock !== v.originalStock) {
            const delta = v.stock - v.originalStock;
            await adjustVariantStock({
              variantId: v.id,
              delta,
              reason: `Admin product edit modal stock adjustment for ${v.sku || v.size}`
            });
            updatedVariants.push({ ...v, stock_quantity: v.stock, originalStock: v.stock });
          } else {
            updatedVariants.push({ ...v, stock_quantity: v.stock });
          }
        }

        return {
          ...res,
          updatedVariants
        };
      },
      {
        label: 'Updating product...',
        successTitle: 'Product updated successfully',
        errorTitle: 'Product could not be updated',
        entityType: 'product',
        entityId: product.id,
        detail: `Title: ${name.trim()} • Base: ₹${parsedBase} • Status: ${isActive ? 'Active' : 'Draft'}`
      }
    );

    setIsSaving(false);

    if (outcome.success) {
      setSuccessMessage('Product updated successfully and catalog refreshed.');
      setLastDuration(outcome.duration);

      const finalVariants = outcome.data?.updatedVariants?.length > 0
        ? outcome.data.updatedVariants
        : (product.product_variants || []);

      if (onProductUpdated) {
        onProductUpdated({
          ...product,
          name: name.trim(),
          subtitle: subtitle.trim(),
          base_price: parsedBase,
          sale_price: parsedSale,
          is_active: isActive,
          is_featured: isFeatured,
          category: category.trim(),
          drop: drop.trim(),
          description: description.trim(),
          fit: fit.trim(),
          details: detailsArray,
          images: images,
          product_variants: finalVariants
        });
      }

      setTimeout(() => {
        onClose();
      }, 800);
    } else {
      setErrorMessage(outcome.error);
      setLastDuration(outcome.duration);
    }
  };

  // Permanently Delete Product
  const handleDelete = async () => {
    setIsDeleting(true);
    setErrorMessage(null);
    setLastDuration(null);

    const outcome = await executeAction(
      'product_delete',
      () => deleteAdminProduct(product.id),
      {
        label: 'Deleting product...',
        successTitle: 'Product deleted successfully',
        errorTitle: 'Product could not be deleted',
        entityType: 'product',
        entityId: product.id,
        detail: `SKU: ${product.sku} ("${product.name}")`
      }
    );

    setIsDeleting(false);

    if (outcome.success) {
      if (onProductDeleted) {
        onProductDeleted(product.id);
      }
      onClose();
    } else {
      setErrorMessage(outcome.error);
      setLastDuration(outcome.duration);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-sans">
      <div 
        className="bg-[#121212] border border-[#242424] w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-[#121212]/95 backdrop-blur border-b border-[#202020] px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#1a1a1a] text-zinc-300 border border-[#262626]">
                {product.sku}
              </span>
              <span className="text-xs text-zinc-400 font-medium">Edit Catalog Product</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              {product.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-[#1a1a1a] rounded-full transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content & Form */}
        <form onSubmit={handleSave} className="p-6 space-y-6 text-xs">

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span className="font-semibold text-xs">Update Failed</span>
              </div>
              <p className="text-[11px] text-rose-300/90 pl-6">{errorMessage}</p>
              {lastDuration && (
                <div className="pl-6 pt-1 flex items-center gap-2 text-[10px] font-mono text-zinc-400">
                  <span className="px-2 py-0.5 bg-[#181818] rounded border border-[#2a2a2a]">⏱ {lastDuration}</span>
                  <span className="text-zinc-500">Database: Unchanged</span>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                <span className="font-semibold text-xs">{successMessage}</span>
              </div>
              {lastDuration && (
                <div className="pl-6 pt-1 flex items-center gap-2 text-[10px] font-mono">
                  <span className="px-2 py-0.5 bg-[#181818] text-zinc-300 rounded border border-[#2a2a2a]">⏱ {lastDuration}</span>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">Database: Updated</span>
                  <span className="px-2 py-0.5 bg-sky-500/20 text-sky-300 rounded border border-sky-500/30">Sync: Complete</span>
                </div>
              )}
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider border-b border-[#202020] pb-2">
              1. Title & Classification
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Subtitle / Material Headline
                </label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3 py-2.5 rounded-xl text-xs outline-none cursor-pointer"
                >
                  <option value="tees">Tees & Graphic Jerseys</option>
                  <option value="hoodies">Hoodies & Sweatshirts</option>
                  <option value="waffle">Waffle Knits & Thermals</option>
                  <option value="pants">Pants & Bottoms</option>
                  <option value="accessories">Caps & Accessories</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Drop / Collection
                </label>
                <input
                  type="text"
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider border-b border-[#202020] pb-2">
              2. Pricing Tiers
            </h4>

            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Base Price (₹ INR) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={basePrice}
                  onChange={(e) => setBasePrice(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Sale Price (₹ INR, Optional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Leave empty for regular price"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white font-mono px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Photos Management */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#202020] pb-2">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                3. Photos & Media ({images.length})
              </h4>
              <span className="text-[10px] text-zinc-500">First image is Primary cover</span>
            </div>

            <div className="space-y-3">
              {/* Upload Buttons */}
              <div className="flex flex-col sm:flex-row gap-2.5">
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
                  className="flex-1 py-2.5 px-4 bg-[#181818] hover:bg-[#202020] border border-dashed border-[#333333] hover:border-zinc-400 rounded-xl text-xs text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isUploadingImage ? (
                    <RefreshCw size={14} className="animate-spin text-white" />
                  ) : (
                    <Upload size={14} className="text-zinc-400" />
                  )}
                  <span>{isUploadingImage ? 'Uploading image...' : 'Upload Photos from Computer'}</span>
                </button>
              </div>

              {/* Direct URL input */}
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Or paste direct image URL (https://...)"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3.5 py-2 rounded-xl text-xs outline-none"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  disabled={!imageUrlInput.trim()}
                  className="px-4 py-2 bg-[#222222] hover:bg-[#333333] text-zinc-200 text-xs font-medium rounded-xl border border-[#303030] disabled:opacity-40 transition-colors"
                >
                  Add URL
                </button>
              </div>

              {/* Photos Gallery */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                  {images.map((imgUrl, idx) => (
                    <div 
                      key={idx} 
                      className="relative group aspect-[3/4] bg-[#0c0c0c] border border-[#242424] rounded-xl overflow-hidden shadow-sm"
                    >
                      <img 
                        src={imgUrl} 
                        alt={`Photo ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                      />

                      {/* Primary Badge */}
                      {idx === 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-black/85 text-emerald-400 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                          PRIMARY
                        </span>
                      )}

                      {/* Actions Overlay */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="p-1 bg-rose-500 text-white rounded-md hover:bg-rose-600 transition-colors"
                            title="Remove photo"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        {idx !== 0 && (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(idx)}
                            className="w-full py-1 bg-white/90 text-black text-[10px] font-bold rounded hover:bg-white transition-colors"
                          >
                            Make Primary
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Size Inventory Matrix */}
          {variants.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#202020] pb-2">
                <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Package size={14} className="text-zinc-400" />
                  <span>4. Variant Stock Matrix</span>
                </h4>
                <span className="text-[10px] text-zinc-400">
                  Total Stock: {variants.reduce((s, v) => s + (v.stock || 0), 0)}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {variants.map((v) => (
                  <div key={v.size} className="bg-[#181818] border border-[#262626] p-2.5 rounded-xl text-center space-y-1">
                    <span className="text-xs font-bold text-white block">{v.size}</span>
                    <input
                      type="number"
                      min="0"
                      value={v.stock}
                      onChange={(e) => handleVariantStockChange(v.size, e.target.value)}
                      className="w-full bg-[#121212] border border-[#2a2a2a] text-center text-white font-mono py-1 rounded-lg text-xs outline-none focus:border-zinc-400"
                    />
                    <span className="text-[9px] text-zinc-500 block">units</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 5: Description & Specs */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider border-b border-[#202020] pb-2">
              5. Details & Specifications
            </h4>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none resize-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Fit & Cut
                </label>
                <input
                  type="text"
                  value={fit}
                  onChange={(e) => setFit(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Bullet Point Specifications (One per line)
                </label>
                <textarea
                  rows={3}
                  value={detailsText}
                  onChange={(e) => setDetailsText(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none resize-none transition-colors font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 6: Visibility & Publishing */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <label className="flex items-center gap-3 p-3.5 bg-[#181818] border border-[#262626] rounded-2xl cursor-pointer select-none hover:border-[#333333] transition-colors">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="accent-white w-4 h-4 rounded"
              />
              <div>
                <span className="text-xs text-white font-medium block">Active in Store</span>
                <span className="text-[11px] text-zinc-400">Visible to customers</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3.5 bg-[#181818] border border-[#262626] rounded-2xl cursor-pointer select-none hover:border-[#333333] transition-colors">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="accent-white w-4 h-4 rounded"
              />
              <div>
                <span className="text-xs text-white font-medium block">Featured Product</span>
                <span className="text-[11px] text-zinc-400">Highlighted on homepage</span>
              </div>
            </label>
          </div>

          {/* Danger Zone: Delete Product */}
          <div className="p-4 bg-rose-500/5 border border-rose-500/20 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-semibold text-rose-400 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  <span>Danger Zone: Delete Product</span>
                </h5>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Permanently deletes this item, its size variants, and associated inventory records.
                </p>
              </div>

              {!showDeleteConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-xs font-medium transition-colors"
                >
                  Delete Product
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-[#181818] hover:bg-[#202020] text-zinc-400 text-xs rounded-lg border border-[#2e2e2e]"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    {isDeleting ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    <span>{isDeleting ? 'Deleting...' : 'Confirm Delete'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#202020]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-[#181818] hover:bg-[#202020] text-zinc-400 hover:text-white text-xs font-medium rounded-xl border border-[#282828] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              {isSaving ? <RefreshCw size={13} className="animate-spin text-black" /> : null}
              <span>{isSaving ? 'Saving changes...' : 'Save Product Changes'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
