import os
import sys

for root, dirs, files in os.walk('frontend/src/modules'):
    for f in files:
        if f.endswith(('.ts', '.tsx')):
            print(os.path.join(root, f))