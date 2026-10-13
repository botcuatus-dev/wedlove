import re, json, base64
import sys
src_path = sys.argv[1] if len(sys.argv) > 1 else 'scripts.js'
s = open(src_path, encoding='utf-8', errors='replace').read()

# all array literals assigned to variables
arrs = {}
for m in re.finditer(r'(?:var|,)\s*(_0x[0-9a-f]+)=\[([^\]]*)\]', s):
    arrs[m.group(1)] = m.group(2)
# string arrays of hex / int arrays
def parse(v):
    items = v.split(',')
    if items and items[0].startswith('"'):
        return [x.strip('"') for x in items]
    return [int(x) for x in items if x.strip()]
parsed = {k: parse(v) for k, v in arrs.items()}

# build concatenations: X="";for(;..<IDX.length..){X+=STR[IDX[..]]}
cats = re.findall(r'(_0x[0-9a-f]+)="",_0x[0-9a-f]+=0;for\(;_0x[0-9a-f]+<(_0x[0-9a-f]+)\.length;_0x[0-9a-f]+\+\+\)\{\1\+=(_0x[0-9a-f]+)\[\2\[', s)
print("concats:", [(a,b,c) for a,b,c in cats])
built = {}
for out, idx, strs in cats:
    built[out] = ''.join(parsed[strs][i] for i in parsed[idx])

order = re.search(r'var _aD=([^;]+);', s).group(1).split('+')
print("order:", order)
hexs = ''.join(built[o] for o in order)
print("hex len", len(hexs))

# function _φ internals
key = re.search(r'function _φ\(_0x[0-9a-f]+\)\{var _0x[0-9a-f]+=\[([\d,]+)\],_0x[0-9a-f]+=(\d+)', s)
keyb = [int(x) for x in key.group(1).split(',')]
xorv = int(re.search(r'\^=(\d+)', s[key.end():key.end()+200]).group(1))
keyb = [k ^ xorv for k in keyb]
print("key", keyb)
data = bytes.fromhex(hexs)
dec = bytes(b ^ keyb[i % len(keyb)] for i, b in enumerate(data)).decode('latin1')

# alphabet permutation: first array of 65 ints near the end
perm = [(k, v) for k, v in parsed.items() if v and isinstance(v[0], int) and len(v) == 65]
print("65-arrays:", [k for k, _ in perm])
a1, a2 = perm[0][1], perm[1][1]
std = list(range(65,91)) + list(range(97,123)) + list(range(48,58)) + [43,47,61]
src = a1 if a2 == std else a2
dst = a2 if a2 == std else a1
mp = {src[i]: dst[i] for i in range(65)}
b64 = ''.join(chr(mp[ord(c)]) if ord(c) in mp else c for c in dec)
out = base64.b64decode(b64 + '=' * (-len(b64) % 4)).decode('utf-8', 'replace')
open(__import__('os').path.basename(src_path) + '.decoded.js', 'w', encoding='utf-8').write(out)
print("decoded chars", len(out))
print(out[:1500])