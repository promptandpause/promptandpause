import os 
path = 'lib/services/circleService.ts' 
os.makedirs(os.path.dirname(path), exist_ok=True) 
content = open(path, 'r', encoding='utf-8').read() 
print('done') 
