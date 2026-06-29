import os
import sys

root_dir = sys.argv[1] if len(sys.argv) > 1 else 'backend/src/modules'
count = 0
for root, dirs, files in os.walk(root_dir):
    for f in files:
        if f.endswith('.ts'):
            print(os.path.join(root, f))
            count += 1
print(f"\nTotal: {count}", file=sys.stderr)