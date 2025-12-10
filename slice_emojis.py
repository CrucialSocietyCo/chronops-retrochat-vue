from PIL import Image
import sys
import os

def slice_emojis(image_path, output_dir, start_index=100):
    img = Image.open(image_path).convert("RGBA")
    width, height = img.size
    pixels = img.load()
    
    bg_color = pixels[0, 0]
    print(f"Background color: {bg_color}")
    
    visited = set()
    components = []
    
    # BFS to find connected components
    for y in range(height):
        for x in range(width):
            if (x, y) in visited:
                continue
            
            current_color = pixels[x, y]
            # Check if pixel matches background (ignoring alpha if it was already transparent, but here we expect opaque bg)
            if current_color == bg_color:
                visited.add((x, y))
                continue
                
            # Found a new component
            component_pixels = []
            queue = [(x, y)]
            visited.add((x, y))
            
            min_x, max_x = x, x
            min_y, max_y = y, y
            
            while queue:
                cx, cy = queue.pop(0)
                component_pixels.append((cx, cy))
                
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)
                
                # Check neighbors
                for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                    nx, ny = cx + dx, cy + dy
                    if 0 <= nx < width and 0 <= ny < height:
                        if (nx, ny) not in visited:
                            if pixels[nx, ny] != bg_color:
                                visited.add((nx, ny))
                                queue.append((nx, ny))
                            else:
                                visited.add((nx, ny)) # Mark background as visited to avoid re-checking
            
            # Filter out tiny noise
            if len(component_pixels) > 10:
                components.append({
                    'pixels': component_pixels,
                    'bbox': (min_x, min_y, max_x, max_y)
                })
                
    print(f"Found {len(components)} components.")
    
    # Sort components (top-to-bottom, left-to-right)
    # We sort by y first (with some tolerance for rows), then x
    # A simple way is to sort by y // 20 (assuming row height ~20) then x
    components.sort(key=lambda c: (c['bbox'][1] // 20, c['bbox'][0]))
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
        
    count = 0
    for comp in components:
        min_x, min_y, max_x, max_y = comp['bbox']
        w = max_x - min_x + 1
        h = max_y - min_y + 1
        
        # Create new image
        # User said 16x16, but we'll size to fit the component, or maybe max(w, h, 16)
        # Let's just crop exactly first, then maybe pad?
        # Actually, let's crop exactly but make background transparent
        
        # Create a transparent image of the component size
        emoji_img = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        emoji_pixels = emoji_img.load()
        
        for px, py in comp['pixels']:
            emoji_pixels[px - min_x, py - min_y] = pixels[px, py]
            
        # Save
        filename = f"smiley_{start_index + count}.png"
        emoji_img.save(os.path.join(output_dir, filename))
        count += 1
        
    print(f"Saved {count} emojis to {output_dir}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python3 slice_emojis.py <image_path> <output_dir>")
        sys.exit(1)
    slice_emojis(sys.argv[1], sys.argv[2])
