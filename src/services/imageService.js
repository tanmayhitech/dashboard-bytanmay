import { supabase, isSupabaseConfigured } from '../supabase/client.js';

/**
 * LOOZARS® Image Service
 * Handles client-side image compression, Supabase Storage uploads, and fallback Data URL processing.
 */

/**
 * Reads a File object and compresses it before upload
 * 
 * @param {File} file 
 * @param {number} maxWidth 
 * @param {number} quality 
 * @returns {Promise<Blob>}
 */
export const compressImage = (file, maxWidth = 1600, quality = 0.85) => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        elem.toBlob((blob) => {
          resolve(blob || file);
        }, file.type === 'image/png' ? 'image/png' : 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

/**
 * Uploads an image file to Supabase Storage bucket 'product-images'
 * Returns the public CDN URL for the uploaded photo.
 * 
 * @param {File|Blob} file 
 * @param {string} prefix 
 * @returns {Promise<{ url: string|null, error: string|null }>}
 */
export const uploadProductImage = async (file, prefix = 'product') => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = file.name ? file.name.split('.').pop().toLowerCase() : 'jpg';
  const cleanExt = ['png', 'jpg', 'jpeg', 'webp', 'avif'].includes(extension) ? extension : 'jpg';
  const filename = `${prefix}_${timestamp}_${randomStr}.${cleanExt}`;
  const filePath = `catalog/${filename}`;

  if (isSupabaseConfigured) {
    try {
      const compressedBlob = await compressImage(file);
      const mimeType = cleanExt === 'png' ? 'image/png' : cleanExt === 'webp' ? 'image/webp' : 'image/jpeg';

      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(filePath, compressedBlob, {
          contentType: mimeType,
          upsert: true
        });

      if (!error && data) {
        const { data: publicData } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        if (publicData?.publicUrl) {
          return { url: publicData.publicUrl, error: null };
        }
      }

      console.warn('[imageService] Supabase Storage upload error:', error?.message);
    } catch (err) {
      console.warn('[imageService] Storage upload exception:', err.message);
    }
  }

  // Fallback: Convert file to Base64 Data URL so user can always see & save their photo
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      resolve({ url: reader.result, error: null });
    };
    reader.onerror = (err) => {
      resolve({ url: null, error: err?.message || 'Failed to read image file.' });
    };
  });
};
