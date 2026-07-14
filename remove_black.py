from PIL import Image

def remove_black(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    datas = img.getdata()
    
    newData = []
    # Tolerance for black
    for item in datas:
        if item[0] < 30 and item[1] < 30 and item[2] < 30:
            newData.append((255, 255, 255, 0))
        else:
            newData.append(item)
            
    img.putdata(newData)
    img.save(output_path, "PNG")

remove_black("d:\\NTT\\AI\\Web\\Game lop5\\public\\leaderboard_icon.jpg", "d:\\NTT\\AI\\Web\\Game lop5\\public\\leaderboard_icon.png")
