import React, { useState, useRef } from 'react';
import { createAdminProduct } from '../../services/adminService';
import { uploadProductImage } from '../../services/imageService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Package,
  Layers,
  Sparkles,
  Clock,
  Database,
  Link as LinkIcon
} from 'lucide-react';

export const ProductCreateModal = ({ onClose, onProductCreated }) => {
  // Form State
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('tees');
  const [drop, setDrop] = useState('DROP 01 // RACING DIVISION');
  const [basePrice, setBasePrice] = useState('899');
  const [salePrice, setSalePrice] = useState('');
  const [description, setDescription] = useState('');
  const [fit, setFit] = useState('Boxy oversized silhouette with dropped shoulders');
  const [detailsText, setDetailsText] = useState('240 GSM 100% Super-Combed French Terry Cotton\nHigh-density silkscreen archival speedway graphic\nRibbed reinforced crew neckline & twin needle hem');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  // Photos State
  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Variant Matrix State
  const [variants, setVariants] = useState([
    { size: 'XS', stock: 8 },
    { size: 'S', stock: 10 },
    { size: 'M', stock: 12 },
    { size: 'L', stock: 12 },
    { size: 'XL', stock: 8 },
    { size: 'XXL', stock: 5 }
  ]);

  // Feedback & Execution Context
  const { executeAction } = useAdminFeedback();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [lastDuration, setLastDuration] = useState(null);

  // Auto-generate SKU and slug from name
  const handleNameChange = (val) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]+/g, '-')) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
    if (!sku || sku.startsWith('LZR-')) {
      const initials = val.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 4);
      if (initials) {
        setSku(`LZR-D01-${initials}`);
      }
    }
  };

  // Handle Photo File Upload
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploadingImage(true);
    setErrorMessage(null);

    try {
      const uploadedUrls = [];
      for (const file of files) {
        const res = await uploadProductImage(file, sku || 'lzr');
        if (res.url) {
          uploadedUrls.push(res.url);
        } else if (res.error) {
          console.warn('[ProductCreateModal] Upload error:', res.error);
        }
      }

      if (uploadedUrls.length > 0) {
        setImages(prev => [...prev, ...uploadedUrls]);
      } else {
        setErrorMessage('Failed to upload selected image(s). You can also paste image URLs directly.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Add Image via Direct URL
  const handleAddImageUrl = (e) => {
    e.preventDefault();
    if (!imageUrlInput.trim()) return;
    setImages(prev => [...prev, imageUrlInput.trim()]);
    setImageUrlInput('');
  };

  // Remove Photo
  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Set Primary Photo
  const handleSetPrimaryImage = (index) => {
    if (index === 0) return;
    setImages(prev => {
      const next = [...prev];
      const [chosen] = next.splice(index, 1);
      next.unshift(chosen);
      return next;
    });
  };

  // Variant Stock Update
  const handleVariantStockChange = (size, newStock) => {
    setVariants(prev => prev.map(v => v.size === size ? { ...v, stock: Math.max(0, parseInt(newStock, 10) || 0) } : v));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLastDuration(null);

    const cleanName = name.trim();
    const cleanSku = sku.trim().toUpperCase();
    const parsedBase = parseInt(basePrice, 10);
    const parsedSale = salePrice.trim() !== '' ? parseInt(salePrice, 10) : null;

    if (!cleanName) {
      setErrorMessage('Product Title is required.');
      return;
    }

    if (!cleanSku) {
      setErrorMessage('Product SKU is required.');
      return;
    }

    if (isNaN(parsedBase) || parsedBase < 0) {
      setErrorMessage('Please enter a valid non-negative base price.');
      return;
    }

    const detailsArray = detailsText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    setIsSubmitting(true);

    const outcome = await executeAction(
      'product_create',
      () => createAdminProduct({
        name: cleanName,
        sku: cleanSku,
        slug: slug.trim() || null,
        subtitle: subtitle.trim() || null,
        basePrice: parsedBase,
        salePrice: parsedSale,
        category: category.trim(),
        drop: drop.trim(),
        description: description.trim(),
        fit: fit.trim(),
        details: detailsArray,
        images: images.length > 0 ? images : [],
        isFeatured,
        isActive,
        variants
      }),
      {
        label: 'Creating product in database...',
        successTitle: 'Product created successfully',
        errorTitle: 'Product could not be created',
        entityType: 'product',
        entityId: cleanSku,
        detail: `Title: ${cleanName} • SKU: ${cleanSku} • Base Price: ₹${parsedBase} • Variants: ${variants.length}`
      }
    );

    setIsSubmitting(false);

    if (outcome.success) {
      setSuccessMessage(`Product "${cleanName}" created successfully!`);
      setLastDuration(outcome.duration);
      if (onProductCreated) {
        onProductCreated(outcome.data.product);
      }
      setTimeout(() => {
        onClose();
      }, 900);
    } else {
      setErrorMessage(outcome.error);
      setLastDuration(outcome.duration);
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
            <span className="text-[10px] text-zinc-400 font-semibold tracking-wider uppercase block">
              Catalog Management
            </span>
            <h3 className="text-lg font-bold text-white">
              Add New Product
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
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs">

          {/* Feedback */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl space-y-1.5">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={15} className="shrink-0 text-rose-400" />
                <span className="font-semibold text-xs">Creation Failed</span>
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
              1. Basic Product Info
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Product Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. LZR APEX RACING TEE"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  SKU Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g. LZR-D01-05"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white font-mono uppercase px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
                  required
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

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Collection / Drop
                </label>
                <input
                  type="text"
                  placeholder="e.g. DROP 01 // RACING DIVISION"
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none transition-colors"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Subtitle / Material Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. 240 GSM HEAVYWEIGHT OVERSIZED TEE"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
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
                  placeholder="899"
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

          {/* Section 3: Photoshoot Media Manager */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#202020] pb-2">
              <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                3. Product Photos & Media ({images.length})
              </h4>
              <span className="text-[10px] text-zinc-500">First image is Primary cover</span>
            </div>

            {/* Upload Controls */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  className="hidden"
                  id="product-photo-upload"
                />
                
                <button
                  type="button"
                  disabled={isUploadingImage}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3 px-4 bg-[#181818] hover:bg-[#202020] border border-dashed border-[#333333] hover:border-zinc-400 rounded-xl text-xs text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isUploadingImage ? (
                    <RefreshCw size={14} className="animate-spin text-white" />
                  ) : (
                    <Upload size={14} className="text-zinc-400" />
                  )}
                  <span>{isUploadingImage ? 'Uploading image...' : 'Upload Photos from Computer'}</span>
                </button>
              </div>

              {/* Direct Image URL input */}
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

              {/* Thumbnail Gallery Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 pt-2">
                  {images.map((imgUrl, idx) => (
                    <div 
                      key={idx} 
                      className="relative group aspect-[3/4] bg-[#0c0c0c] border border-[#242424] rounded-xl overflow-hidden shadow-sm"
                    >
                      <img 
                        src={imgUrl} 
                        alt={`Preview ${idx + 1}`} 
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

          {/* Section 4: Size & Inventory Matrix */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider border-b border-[#202020] pb-2 flex items-center justify-between">
              <span>4. Variant Size Matrix & Stock</span>
              <span className="text-[10px] font-normal text-zinc-400">Total: {variants.reduce((s, v) => s + (v.stock || 0), 0)} units</span>
            </h4>

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

          {/* Section 5: Descriptions & Specifications */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider border-b border-[#202020] pb-2">
              5. Details & Specifications
            </h4>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Short Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Streetwear piece overview, silhouette, and story..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#181818] border border-[#262626] focus:border-zinc-500 text-white px-3.5 py-2.5 rounded-xl text-xs outline-none resize-none transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-medium text-zinc-300 block">
                  Fit & Cut Notes
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
                <span className="text-xs text-white font-medium block">Publish Immediately</span>
                <span className="text-[11px] text-zinc-400">Make live on storefront</span>
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
                <span className="text-xs text-white font-medium block">Feature on Homepage</span>
                <span className="text-[11px] text-zinc-400">Highlight in Drop 01 carousel</span>
              </div>
            </label>
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
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-bold rounded-xl transition-colors flex items-center gap-2 shadow-sm"
            >
              {isSubmitting ? <RefreshCw size={13} className="animate-spin text-black" /> : null}
              <span>{isSubmitting ? 'Creating Product...' : 'Create & Publish Product'}</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
