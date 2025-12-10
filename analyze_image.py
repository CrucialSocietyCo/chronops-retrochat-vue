from PIL import Image
import sys

def analyze(image_path):
    img = Image.open(image_path)
    print(f"Format: {img.format}, Size: {img.size}, Mode: {img.mode}")
    
    bg_color = img.getpixel((0, 0))
    print(f"Background color: {bg_color}")
    
    width, height = img.size
    
    # Check for grid lines
    # We'll look for rows and columns that are entirely background color
    
    empty_rows = []
    for y in range(height):
        is_empty = True
        for x in range(width):
            if img.getpixel((x, y)) != bg_color:
                is_empty = False
                break
        if is_empty:
            empty_rows.append(y)
            
    empty_cols = []
    for x in range(width):
        is_empty = True
        for y in range(height):
            if img.getpixel((x, y)) != bg_color:
                is_empty = False
                break
        if is_empty:
            empty_cols.append(x)
            
    print(f"Empty rows count: {len(empty_rows)}")
    print(f"Empty cols count: {len(empty_cols)}")
    
    # Try to deduce grid size
    # If we have regular spacing, we'll see patterns in empty_rows/cols
    
    if len(empty_rows) > 0:
        print(f"Sample empty rows: {empty_rows[:10]} ... {empty_rows[-10:]}")
    if len(empty_cols) > 0:
        print(f"Sample empty cols: {empty_cols[:10]} ... {empty_cols[-10:]}")

if __name__ == "__main__":
    analyze(sys.argv[1])
