import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Replace map background
html = re.sub(r'<img src="\./public/game_map_background\.png" alt="Map" class="map-bg">',
              '<img src="./public/map.png" alt="Map" class="map-bg">', html)

# Replace the stations in map-container
new_stations = '''
        <!-- Stations on Map -->
        <!-- Ti?ng Vi?t: R?ng xanh bí ?n (góc trái du?i) -->
        <div class="station" data-subject="vietnamese" style="top: 75%; left: 15%;">
          <img src="./public/icon_tiengviet.png" alt="Ti?ng Vi?t" class="station-img">
        </div>
        
        <!-- Toán h?c: Kim t? tháp -->
        <div class="station" data-subject="math" style="top: 50%; left: 45%;">
          <img src="./public/icon_toan.png" alt="Toán H?c" class="station-img">
        </div>
        
        <!-- Ð? Thi -->
        <div class="station" data-subject="exam" style="top: 40%; left: 75%;">
          <img src="./public/dethi_icon.png" alt="Ð? Thi" class="station-img">
        </div>

        <!-- Cài Ð?t (Admin) -->
        <div id="admin-station" class="station" style="top: 20%; left: 15%; display:none;" onclick="app.admin.openAdmin()">
          <img src="./public/icon_caidat.png" alt="Cài Ð?t" class="station-img">
        </div>
        
        <!-- Kho Báu (Ngôi nhà có ?ng khói) -->
        <div id="treasure-station" class="station" style="top: 70%; left: 80%;" onclick="app.treasure.open()">
          <img src="./public/treasure_chest.png" alt="Kho Báu" class="station-img">
        </div>
'''
html = re.sub(r'<div class="station" data-subject="math".*?</div>\s*</div>\s*</div>',
              new_stations + '</div>\n    </div>', html, flags=re.DOTALL)

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(html)
