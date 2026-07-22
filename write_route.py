import os
os.makedirs('app/api/social/circles/[id]/members', exist_ok=True)
content = open('lib/services/circleService.ts', 'r').read()
print('service file length:', len(content))
