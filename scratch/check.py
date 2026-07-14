with open('src/main.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()
for i, l in enumerate(lines):
    if 'game: {' in l:
        print('game starts at', i)
    if 'exam: {' in l:
        print('exam starts at', i)
