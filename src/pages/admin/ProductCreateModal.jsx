import React, { useState, useRef } from 'react';
import { createAdminProduct } from '../../services/adminService';
import { uploadProductImage } from '../../services/imageService';
import { useAdminFeedback } from '../../context/AdminFeedbackContext';
import { 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Package
} from 'lucide-react';

export const ProductCreateModal = ({ onClose, onProductCreated }) => {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('tees');
  const [drop, setDrop] = useState('Drop 01');
  const [basePrice, setBasePrice] = useState('899');
  const [salePrice, setSalePrice] = useState('');
  const [description, setDescription] = useState('');
  const [fit, setFit] = useState('Boxy oversized silhouette with dropped shoulders');
  const [detailsText, setDetailsText] = useState('240 GSM 100% Super-Combed French Terry Cotton\nHigh-density silkscreen archival graphic\nRibbed reinforced crew neckline');
  const [isActive, setIsActive] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);

  const [images, setImages] = useState([]);
  const [imageUrlInput, setImageUrlInput] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  const [variants, setVariants] = useState([
    { size: 'XS', stock: 8 },
    { size: 'S', stock: 10 },
    { size: 'M', stock: 12 },
    { size: 'L', stock: 12 },
    { size: 'XL', stock: 8 },
    { size: 'XXL', stock: 5 }
  ]);

  const { executeAction } = useAdminFeedback();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

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
        }
      }

      if (uploadedUrls.length > 0) {
        setImages(prev => [...prev, ...uploadedUrls]);
      } else {
        setErrorMessage('Failed to upload image(s). You can paste image URLs directly.');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!name.trim()) {
      setErrorMessage('Product Title is required.');
      return;
    }
    if (!sku.trim()) {
      setErrorMessage('SKU Code is required.');
      return;
    }

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
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      slug: slug.trim().toLowerCase() || sku.trim().toLowerCase(),
      subtitle: subtitle.trim() || null,
      category,
      drop: drop.trim(),
      basePrice: parsedBasePrice,
      salePrice: parsedSalePrice,
      description: description.trim(),
      fit: fit.trim(),
      details: detailsArray,
      images,
      isActive,
      isFeatured,
      variants
    };

    setIsSubmitting(true);

    const outcome = await executeAction(
      `product_create_${payload.sku}`,
      () => createAdminProduct(payload),
      {
        label: 'Creating new product...',
        successTitle: 'Product created successfully',
        errorTitle: 'Product creation failed',
        entityType: 'product',
        entityId: payload.sku,
        detail: payload.name
      }
    );

    setIsSubmitting(false);

    if (outcome.success) {
      setSuccessMessage('Product created and catalog updated!');
      if (onProductCreated) onProductCreated(outcome.data?.product || payload);
      setTimeout(() => {
        onClose();
      }, 500);
    } else {
      setErrorMessage(outcome.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/75 backdrop-blur-xs animate-fadeIn font-sans">
      <div 
        className="bg-[#16161A] border border-[#24242A] w-full max-w-3xl max-h-[94vh] sm:max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col font-sans text-zinc-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-[#121215]/95 backdrop-blur border-b border-[#24242A] p-4 px-6 flex items-center justify-between z-10">
          <div>
            <span className="text-xs font-bold text-zinc-100 font-mono tracking-tight">
              CREATE CATALOG PIECE
            </span>
            <h3 className="text-sm font-bold text-zinc-200 mt-0.5">Add New Product to Store</h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-[#222228] rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs text-zinc-300">
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

          {/* Section 1: Title & Details */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider border-b border-[#24242A] pb-1.5">
              1. Title & SKU Details
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="sm:col-span-2">
                <label className="text-zinc-300 font-medium block mb-1">Product Title *</label>
                <input
                  type="text"
                  placeholder="e.g. LZR APEX RACING OVERSIZED TEE"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-[#121215] border border-[#24242A] focus:border-zinc-500 text-zinc-100 px-3.5 py-2 rounded-xl outline-none transition-colors"
                  required
                />
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">SKU Code *</label>
                <input
                  type="text"
                  placeholder="e.g. LZR-D01-05"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  className="w-full bg-[#121215] border border-[#24242A] focus:border-zinc-500 text-zinc-100 font-mono uppercase px-3.5 py-2 rounded-xl outline-none transition-colors font-bold"
                  required
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

              <div className="sm:col-span-2">
                <label className="text-zinc-300 font-medium block mb-1">Collection / Drop</label>
                <input
                  type="text"
                  placeholder="e.g. Drop 01 // Racing Division"
                  value={drop}
                  onChange={(e) => setDrop(e.target.value)}
                  className="w-full bg-[#121215] border border-[#24242A] focus:border-zinc-500 text-zinc-100 px-3.5 py-2 rounded-xl outline-none transition-colors"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-zinc-300 font-medium block mb-1">Subtitle / Material Headline</label>
                <input
                  type="text"
                  placeholder="e.g. 240 GSM HEAVYWEIGHT OVERSIZED TEE"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
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
                  placeholder="899"
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

          {/* Section 5: Description & Specs */}
          <div className="space-y-3.5">
            <h4 className="text-xs font-semibold text-zinc-200 uppercase tracking-wider border-b border-[#24242A] pb-1.5">
              5. Descriptions & Bullets
            </h4>

            <div className="space-y-2.5">
              <div>
                <label className="text-zinc-300 font-medium block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Editorial product narrative..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#121215] border border-[#24242A] focus:border-zinc-500 text-zinc-100 px-3.5 py-2 rounded-xl outline-none resize-none"
                />
              </div>

              <div>
                <label className="text-zinc-300 font-medium block mb-1">Fit & Cut Description</label>
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
                <span className="text-[11px] text-zinc-500">Publish immediately to live shop</span>
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
                <span className="text-xs font-semibold text-zinc-100 block">Featured Piece</span>
                <span className="text-[11px] text-zinc-500">Showcase in hero slots</span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 sm:gap-2.5 pt-3 border-t border-[#24242A]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-[#1E1E24] hover:bg-[#26262E] text-zinc-300 text-xs font-medium rounded-xl border border-[#2B2B33] transition-colors min-h-[40px] flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-5 py-2.5 bg-white hover:bg-zinc-200 disabled:opacity-50 text-black text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs min-h-[42px]"
            >
              {isSubmitting ? <RefreshCw size={13} className="animate-spin text-zinc-900" /> : <Plus size={13} />}
              <span>Create Product</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
