
import os
from PIL import Image

sprite_dir = '/Users/area/repos/nano-banana/cloud-bounce/sprites'
files = [f for f in os.listdir(sprite_dir) if f.endswith('.png')]

def make_transparent(img):
    # Convert white-ish pixels to transparent
    img = img.convert("RGBA")
    datas = img.getdata()
    
    new_data = []
    for item in datas:
        # Check for white-ish (R>240, G>240, B>240)
        if item[0] > 240 and item[1] > 240 and item[2] > 240:
            new_data.append((255, 255, 255, 0))
        else:
            new_data.append(item)
            
    img.putdata(new_data)
    return img

def get_bbox(img):
    return img.getbbox()

print(f"Processing {len(files)} sprites...")

for fname in files:
    if 'spritesheet' in fname or 'animation' in fname or 'perfect' in fname:
        path = os.path.join(sprite_dir, fname)
        try:
            print(f"Processing {fname}...")
            img = Image.open(path)
            
            # 1. Fix Transparency
            img = make_transparent(img)
            
            # 2. Analyze Content
            bbox = get_bbox(img)
            if bbox:
                print(f"  Content BBox: {bbox}")
                w, h = img.size
                
                # Special handling for cloud_spritesheet to fix "double cloud"
                if 'cloud_spritesheet' in fname:
                    # Split into 4 quadrants (2x2)
                    q_w = w // 2
                    q_h = h // 2
                    quadrants = [
                        (0, 0, q_w, q_h),
                        (q_w, 0, w, q_h),
                        (0, q_h, q_w, h),
                        (q_w, q_h, w, h)
                    ]
                    
                    # Create new clean 2x2 sheet
                    new_sheet = Image.new('RGBA', (w, h), (0,0,0,0))
                    
                    for i, quad in enumerate(quadrants):
                        crop = img.crop(quad)
                        c_bbox = crop.getbbox()
                        if c_bbox:
                            # Crop to content
                            content = crop.crop(c_bbox)
                            # Draw centered in quadrant
                            cw, ch = content.size
                            # Center offset
                            ox = (q_w - cw) // 2
                            oy = (q_h - ch) // 2
                            paste_x = quad[0] + ox
                            paste_y = quad[1] + oy
                            new_sheet.paste(content, (paste_x, paste_y))
                            print(f"  Quadrant {i}: Found content {cw}x{ch}")
                        else:
                            print(f"  Quadrant {i}: Empty")
                            
                    img = new_sheet
                    print("  Rebuilt cloud sheet from quadrants.")

            # Save back
            img.save(path)
            print("  Saved.")
            
        except Exception as e:
            print(f"Error processing {fname}: {e}")
