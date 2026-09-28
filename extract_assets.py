import os
from PIL import Image

src_path = r"C:\Users\Acer\.gemini\antigravity\brain\597075dc-cfc4-41df-a297-bdd3ac4239d4\.user_uploaded\media_1790494365155.png"
out_dir = r"C:\Users\Acer\OneDrive\Desktop\loozarss\src\assets\images"
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_path)
w, h = img.size
print(f"Total Dimensions: {w}x{h}")

# The reference image is a full page screenshot. Let's calculate relative Y coordinates:
# Total height is h.
# Header is roughly 0 to ~0.04h
# Hero banner is roughly 0.045h to 0.265h
# Campaign section is roughly 0.27h to 0.46h
# Featured Drop section is roughly 0.465h to 0.635h
# Manifesto Collage is roughly 0.64h to 0.81h
# Instagram section is roughly 0.82h to 0.93h
# Footer is roughly 0.94h to 1.0h

# Let's crop high-resolution slices:

# 1. Hero banner (w * 0.02, h * 0.045 to w * 0.98, h * 0.215)
hero_box = (int(w * 0.02), int(h * 0.042), int(w * 0.98), int(h * 0.212))
hero_img = img.crop(hero_box)
hero_img.save(os.path.join(out_dir, "exact-hero-banner.png"))
print("Saved exact-hero-banner.png", hero_img.size)

# 2. Campaign Gang photo (w * 0.02, h * 0.272 to w * 0.98, h * 0.462)
camp_box = (int(w * 0.02), int(h * 0.272), int(w * 0.98), int(h * 0.462))
camp_img = img.crop(camp_box)
camp_img.save(os.path.join(out_dir, "exact-campaign-gang.png"))
print("Saved exact-campaign-gang.png", camp_img.size)

# 3. Featured Drop Tee Flatlay (w * 0.35, h * 0.47 to w * 0.74, h * 0.63)
tee_box = (int(w * 0.35), int(h * 0.472), int(w * 0.74), int(h * 0.632))
tee_img = img.crop(tee_box)
tee_img.save(os.path.join(out_dir, "exact-tee-flatlay.png"))
print("Saved exact-tee-flatlay.png", tee_img.size)

# 4. Detail 1: Collar tag (w * 0.75, h * 0.47 to w * 0.90, h * 0.52)
d1_box = (int(w * 0.75), int(h * 0.472), int(w * 0.90), int(h * 0.522))
d1_img = img.crop(d1_box)
d1_img.save(os.path.join(out_dir, "exact-detail-collar.png"))
print("Saved exact-detail-collar.png", d1_img.size)

# 5. Detail 2: Eye macro (w * 0.75, h * 0.525 to w * 0.90, h * 0.575)
d2_box = (int(w * 0.75), int(h * 0.525), int(w * 0.90), int(h * 0.575))
d2_img = img.crop(d2_box)
d2_img.save(os.path.join(out_dir, "exact-detail-eye.png"))
print("Saved exact-detail-eye.png", d2_img.size)

# 6. Detail 3: Stitch macro (w * 0.75, h * 0.58 to w * 0.90, h * 0.63)
d3_box = (int(w * 0.75), int(h * 0.58), int(w * 0.90), int(h * 0.63))
d3_img = img.crop(d3_box)
d3_img.save(os.path.join(out_dir, "exact-detail-stitch.png"))
print("Saved exact-detail-stitch.png", d3_img.size)

# 7. Manifesto Girl portrait (w * 0.02, h * 0.642 to w * 0.44, h * 0.812)
m_girl_box = (int(w * 0.02), int(h * 0.642), int(w * 0.44), int(h * 0.812))
m_girl = img.crop(m_girl_box)
m_girl.save(os.path.join(out_dir, "exact-manifesto-girl.png"))
print("Saved exact-manifesto-girl.png", m_girl.size)

# 8. Manifesto Center street & building (w * 0.44, h * 0.642 to w * 0.71, h * 0.812)
m_center_box = (int(w * 0.44), int(h * 0.642), int(w * 0.71), int(h * 0.812))
m_center = img.crop(m_center_box)
m_center.save(os.path.join(out_dir, "exact-manifesto-center.png"))
print("Saved exact-manifesto-center.png", m_center.size)

# 9. Instagram 6 images row (w * 0.03 to w * 0.97, h * 0.842 to h * 0.932)
ig_y1 = int(h * 0.842)
ig_y2 = int(h * 0.932)
col_width = (w * 0.94) / 6.0
for i in range(6):
    x1 = int(w * 0.03 + i * col_width)
    x2 = int(w * 0.03 + (i + 1) * col_width - (w * 0.01))
    ig_crop = img.crop((x1, ig_y1, x2, ig_y2))
    ig_crop.save(os.path.join(out_dir, f"exact-ig-{i+1}.png"))
    print(f"Saved exact-ig-{i+1}.png", ig_crop.size)

print("All exact assets extracted successfully!")
