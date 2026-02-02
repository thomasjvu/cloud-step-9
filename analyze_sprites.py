
import os
from PIL import Image
import numpy as np

sprite_dir = '/Users/area/repos/nano-banana/cloud-bounce/sprites'
files = [f for f in os.listdir(sprite_dir) if f.endswith('.png')]

print(f"Found {len(files)} sprites.")

for fname in files:
    path = os.path.join(sprite_dir, fname)
    try:
        img = Image.open(path).convert('RGBA')
        arr = np.array(img)
        
        # Check background color (top-left pixel)
        bg = arr[0,0]
        print(f"\n--- {fname} ({img.size}) ---")
        print(f"Top-Left Pixel: {bg}")
        
        # Find non-white pixels (assuming white background)
        # We consider "white" as R>240, G>240, B>240
        # Or just use the top-left color as reference?
        
        # Let's verify if alpha is used.
        if np.mean(arr[:,:,3]) < 255:
            print("Image has transparency.")
        else:
            print("Image is fully opaque.")

        # Find bounding box of "dark" content (non-white)
        # mask = (arr[:,:,0] < 240) | (arr[:,:,1] < 240) | (arr[:,:,2] < 240)
        # If transparency exists, also extract where alpha > 0
        
        is_transparent = arr[:,:,3] > 0
        is_dark = (arr[:,:,0] < 250) | (arr[:,:,1] < 250) | (arr[:,:,2] < 250)
        
        # If opaque, use is_dark. If transparent, use is_transparent.
        mask = is_transparent if np.mean(arr[:,:,3]) < 255 else is_dark
        
        if not np.any(mask):
            print("Image appears blank or full white.")
            continue
            
        rows = np.any(mask, axis=1)
        cols = np.any(mask, axis=0)
        rmin, rmax = np.where(rows)[0][[0, -1]]
        cmin, cmax = np.where(cols)[0][[0, -1]]
        
        print(f"Content Bounds: y[{rmin}:{rmax}], x[{cmin}:{cmax}]")
        print(f"Content Size: {cmax-cmin}x{rmax-rmin}")
        
        # Check for text labels? 
        # Heuristically, if there are small disconnected components at edges.
        # Simple ascii visualization of the grid (downsampled)
        
        h, w = mask.shape
        step_h = h // 20
        step_w = w // 20
        print("Visual Map (Low Res):")
        for y in range(0, h, step_h):
            row_str = ""
            for x in range(0, w, step_w):
                # check chunk
                chunk = mask[y:y+step_h, x:x+step_w]
                if np.mean(chunk) > 0.1:
                    row_str += "#"
                else:
                    row_str += "."
            print(row_str)
            
    except Exception as e:
        print(f"Error analyzing {fname}: {e}")
