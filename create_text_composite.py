import os
from PIL import Image, ImageEnhance, ImageOps

src_dir = r"src\assets\images"
girl_path = os.path.join(src_dir, "hero-text-mask.jpg")
tex_path = os.path.join(src_dir, "distressed-text-texture.png")

girl = Image.open(girl_path).convert("RGBA")
tex = Image.open(tex_path).convert("RGBA")

# Resize texture to match girl dimensions
tex_resized = tex.resize(girl.size, Image.Resampling.LANCZOS)

# Blend girl with texture (overlay mode)
# Let's create an ivory tint + crack overlay
base_ivory = Image.new("RGBA", girl.size, (237, 231, 220, 255))
girl_gray = ImageOps.grayscale(girl).convert("RGBA")

# Enhance contrast of the girl
enhancer = ImageEnhance.Contrast(girl_gray)
girl_high_contrast = enhancer.enhance(1.6)

# Combine: ivory base + girl shadows + crack texture
composite = Image.blend(girl_high_contrast, base_ivory, 0.45)
final_tex = Image.blend(composite, tex_resized, 0.35)

final_tex.convert("RGB").save(os.path.join(src_dir, "hero-composite-text-texture.jpg"), quality=95)
print("Saved hero-composite-text-texture.jpg successfully!")
