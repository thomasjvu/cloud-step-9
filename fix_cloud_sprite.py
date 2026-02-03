from PIL import Image

def fix_cloud():
    try:
        # Load the original spritesheet
        print("Loading sprite sheet...")
        img = Image.open('cloud-bounce/sprites/cloud_spritesheet.png')
        img = img.convert('RGBA')
        
        # Crop the top-left 512x512 (Standard Cloud)
        cloud = img.crop((0, 0, 512, 512))
        print("Cropped top-left cloud.")
        
        pixels = cloud.load()
        width, height = cloud.size
        
        # Define center region where face usually is
        # The sprite is 512x512. Face is in the middle.
        # Let's target a generous box in the middle.
        center_y_start, center_y_end = 200, 360
        center_x_start, center_x_end = 150, 362
        
        modified_count = 0
        
        for y in range(center_y_start, center_y_end):
            for x in range(center_x_start, center_x_end):
                r, g, b, a = pixels[x, y]
                
                # Check if not transparent
                if a > 0:
                    # Calculate brightness
                    brightness = (r + g + b) // 3
                    
                    # If dark (face feature), replace with cloud white
                    # Cloud body is usually very bright/white.
                    # Face is black/dark grey.
                    if brightness < 220:
                        # Replace with white/light blue-ish 
                        # Or even better, just pure white with slight shading?
                        # Let's pick a color from a known "safe" cloud body spot 
                        # like (256, 150) which is probably white body.
                        # Or just hardcode a nice cloud white.
                        pixels[x, y] = (245, 251, 255, a) # Keep original alpha if it was partially transp? 
                        # Actually if it was opaque black face, we want opaque white body.
                        # But edges might be antialiased.
                        # Let's correct alpha to be fully opaque if it was the face.
                        # Actually, better to keep '255' alpha for the body fill.
                        
                        modified_count += 1
                        
        print(f"Removed face pixels: {modified_count}")
        
        # Save the result
        cloud.save('cloud-bounce/sprites/cloud_no_face_fixed.png')
        print("Successfully created cloud_no_face_fixed.png")
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_cloud()
