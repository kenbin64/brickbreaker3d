B = r'C:/dev/brickbreaker3d/butterflyfx-core/butterflyfx_core'
import os
os.makedirs(f'{B}/kernel', exist_ok=True)
def w(path, txt):
    open(path,'w',encoding='utf-8').write(txt)
    print('wrote', path)
