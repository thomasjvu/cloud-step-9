
import os
from PIL import Image

def fix_white_clouds(path):
    img = Image.open(path).convert("RGBA")
    width, height = img.size
    
    # Create a mask for flood filling
    # We want to identify the "background" starting from corners
    # (assuming corners are background)
    
    # Threshold for "white-ish" background
    limit = 240
    
    # Get pixel data
    pixels = img.load()
    
    # Stack for flood fill
    stack = [(0, 0), (width-1, 0), (0, height-1), (width-1, height-1)]
    visited = set(stack)
    
    background_mask = set()
    
    while stack:
        x, y = stack.pop()
        
        # Check if this pixel is "white-ish"
        r, g, b, a = pixels[x, y]
        if r > limit and g > limit and b > limit:
            background_mask.add((x, y))
            
            # Add neighbors
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = x + dx, y + dy
                if 0 <= nx < width and 0 <= ny < height:
                    if (nx, ny) not in visited:
                        visited.add((nx, ny))
                        stack.append((nx, ny))

    # Now recreate image:
    # If pixel in background_mask -> Transparent
    # Else -> Keep original (which restores the white inside)
    
    new_img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
    new_pixels = new_img.load()
    
    for y in range(height):
        for x in range(width):
            if (x, y) in background_mask:
                new_pixels[x, y] = (0, 0, 0, 0)
            else:
                new_pixels[x, y] = pixels[x, y]
                
    new_img.save(path)
    print(f"Restored white interior for {path}")

# Fix cloud_spritesheet
fix_white_clouds('/Users/area/repos/nano-banana/cloud-bounce/sprites/cloud_spritesheet.png')
# Fix generated boss clouds too if they have white bg
fix_white_clouds('/Users/area/.gemini/antigravity/brain/42ac3e0a-1590-49b5-adf6-3215bb035d8d/rain_cloud_boss_clean_1769998282529.png')
fix_white_clouds('/Users/area/.gemini/antigravity/brain/42ac3e0a-1590-49b5-adf6-3215bb035d8d/thunder_cloud_boss_clean_1769998294793.png')
