import os
from PIL import Image
import glob

def remove_white_bg(img_path):
    try:
        img = Image.open(img_path).convert("RGBA")
        datas = img.getdata()
        
        newData = []
        for item in datas:
            # Check if pixel is close to white
            # R, G, B > 230
            if item[0] > 230 and item[1] > 230 and item[2] > 230:
                newData.append((255, 255, 255, 0)) # transparent
            else:
                newData.append(item)
                
        img.putdata(newData)
        
        # Save as PNG
        out_path = os.path.splitext(img_path)[0] + ".png"
        img.save(out_path, "PNG")
        print(f"Processed {img_path} -> {out_path}")
        
        # If original was jpg, we might want to remove it
        if img_path.lower().endswith(".jpg") or img_path.lower().endswith(".jpeg"):
            os.remove(img_path)
            
    except Exception as e:
        print(f"Error processing {img_path}: {e}")

if __name__ == "__main__":
    files = glob.glob("public/pet_*.*") + glob.glob("public/Pet_*.*")
    for f in files:
        if f.lower().endswith(('.png', '.jpg', '.jpeg')):
            remove_white_bg(f)
