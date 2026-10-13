#!/usr/bin/env python3
"""
Deobfuscate kiểu obfuscator.io (mảng chuỗi + hàm giải mã + đoạn xoay mảng).
CHỈ PHÂN TÍCH TĨNH: không chạy mã của file mục tiêu.

Dùng:  python3 resolve_strings.py myheart.js
Ra:    myheart.js.resolved.js

Script làm:
  1. đọc mảng chuỗi, tìm hàm giải mã (offset) và kiểu mã hóa (base64 / plain)
  2. tìm phép xoay mảng cho đến khi checksum khớp (tính bằng Python, không chạy JS)
  3. CẮT khỏi file: đoạn xoay mảng, hàm mảng, hàm giải mã, các khai báo alias
  4. thay mọi lời gọi _0xNNNN(0x..) bằng chuỗi thật
  5. đổi obj['prop'] -> obj.prop, rồi làm đẹp mã nếu có jsbeautifier
"""
import re, sys, json, collections

NAME = r'_0x[0-9a-fA-F]+'


def die(msg):
    sys.exit("[!] " + msg)


if len(sys.argv) < 2:
    die("Usage: python3 resolve_strings.py <file.js>")
path = sys.argv[1]
s = open(path, encoding="utf-8", errors="replace").read()

ESC = {'n': '\n', 't': '\t', 'r': '\r', 'b': '\b', 'f': '\f', 'v': '\v', '0': '\0'}


def read_string(src, i):
    q = src[i]
    i += 1
    out = []
    while src[i] != q:
        c = src[i]
        if c == '\\':
            i += 1
            c = src[i]
            if c == 'x':
                out.append(chr(int(src[i + 1:i + 3], 16)))
                i += 2
            elif c == 'u':
                out.append(chr(int(src[i + 1:i + 5], 16)))
                i += 4
            else:
                out.append(ESC.get(c, c))
        else:
            out.append(c)
        i += 1
    return ''.join(out), i + 1


def match_brace(src, i):
    """i trỏ vào '{'. Trả về vị trí ngay sau '}' tương ứng (bỏ qua chuỗi)."""
    depth, n = 0, len(src)
    while i < n:
        c = src[i]
        if c in '\'"`':
            q = c
            i += 1
            while i < n and src[i] != q:
                if src[i] == '\\':
                    i += 1
                i += 1
        elif c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    raise ValueError("không khớp ngoặc")


# ---------- 1. Mảng chuỗi ----------
m = re.search(rf'function\s+({NAME})\(\)\s*\{{\s*(?:const|var|let)\s+[\w$]+\s*=\s*\[', s)
if not m:
    die("Không thấy hàm trả về mảng chuỗi (function _0x..(){const x=[...]). "
        "File này có thể không phải kiểu obfuscator.io.")
arr_func = m.group(1)
arr_start = m.start()
arr_end = match_brace(s, s.index('{', m.start()))

arr, pos = [], m.end()
while True:
    while s[pos] in " \n\r\t,":
        pos += 1
    if s[pos] == ']':
        break
    if s[pos] in "'\"":
        v, pos = read_string(s, pos)
        arr.append(v)
    else:
        die(f"Phần tử mảng không phải chuỗi tại {pos}: {s[pos:pos + 40]!r}")
print(f"[+] mảng {arr_func}: {len(arr)} chuỗi")

# ---------- 2. Hàm giải mã ----------
dm = re.search(
    rf'function\s+({NAME})\(({NAME})\s*(?:,\s*({NAME}))?\)\s*\{{\s*\2\s*=\s*\2\s*-\s*(0x[0-9a-fA-F]+|\d+)', s)
if not dm:
    die("Không thấy hàm giải mã dạng function _0x..(a,b){a=a-0x..;")
dec_name, offset = dm.group(1), int(dm.group(4), 0)
dec_start = dm.start()
dec_end = match_brace(s, s.index('{', dm.start()))
dec_body = s[dec_start:dec_end]
print(f"[+] hàm giải mã {dec_name}, offset {hex(offset)}")

if re.search(r'\b0x100\b|\b256\b', dec_body):
    die("Hàm giải mã có vẻ dùng RC4 (có 0x100/256). Script này chưa hỗ trợ RC4: "
        "hãy gửi thân hàm giải mã để bổ sung.")

am = re.search(r"['\"]([A-Za-z0-9+/=]{64,65})['\"]", dec_body)
ALPHA = am.group(1) if am else None
mode = "base64" if ALPHA else "plain"
print(f"[+] chế độ chuỗi: {mode}")


def b64_bytes(t):
    out, buf, bits = bytearray(), 0, 0
    for c in t:
        k = ALPHA.find(c)
        if k < 0 or c == '=':
            continue
        buf = (buf << 6) | k
        bits += 6
        if bits >= 8:
            bits -= 8
            out.append((buf >> bits) & 0xFF)
            buf &= (1 << bits) - 1
    return bytes(out)


def decode(rot, idx):
    i = idx - offset
    if i < 0:
        raise IndexError(i)
    raw = rot[i]
    if mode == "plain":
        return raw
    return b64_bytes(raw).decode('utf-8', 'replace')


# ---------- 3. Đoạn xoay mảng ----------
tm = re.search(r'\(\s*' + re.escape(arr_func) + r'\s*,\s*(0x[0-9a-fA-F]+|\d+)\s*\)', s)
if not tm:
    die("Không thấy lời gọi xoay mảng (_0x..arr, 0x..)")
target = int(tm.group(1), 0)

region = s[max(0, tm.start() - 6000):tm.start()]
cands = re.findall(r'(?:const|let|var)\s+[\w$]+\s*=\s*(-?\s*parseInt.*?)\s*;\s*if\s*\(', region, re.S)
if not cands:
    cands = re.findall(r'if\s*\(\s*(-?\s*parseInt.*?)===', region, re.S)
if not cands:
    print(region[-1500:])
    die("Không tách được biểu thức checksum (đoạn nghi ngờ in ở trên)")
expr_src = cands[-1]

CALL = re.compile(
    r'parseInt\(\s*[\w$]+\(\s*(0x[0-9a-fA-F]+|\d+)\s*(?:,\s*([\'"])(.*?)\2\s*)?\)\s*\)')
calls = [int(c.group(1), 0) for c in CALL.finditer(expr_src)]
tmpl = CALL.sub('@', expr_src)
# an toàn: phần còn lại chỉ được gồm số, toán tử, ngoặc -> mới eval
if not calls or not re.fullmatch(r'[@\s0-9a-fA-FxX+\-*/().]*', tmpl):
    die(f"Biểu thức checksum lạ, không dám eval: {expr_src[:200]!r}")


def js_parseint(v):
    mm = re.match(r'\s*([+-]?\d+)', v)
    return int(mm.group(1)) if mm else None


def run(rot):
    vals = []
    for idx in calls:
        n = js_parseint(decode(rot, idx))
        if n is None:
            return None  # NaN trong JS -> không bao giờ bằng target
        vals.append(str(n))
    it = iter(vals)
    e = re.sub('@', lambda _: next(it), tmpl)
    return eval(e, {"__builtins__": {}}, {})


rot = collections.deque(arr)
for _ in range(len(arr) + 1):
    try:
        if run(list(rot)) == target:
            break
    except Exception:
        pass
    rot.rotate(-1)  # tương đương push(shift)
else:
    die("Không tìm được phép xoay khớp checksum")
arr = list(rot)
print("[+] đã xoay mảng khớp checksum")

# ---------- 4. Xác định các đoạn cần cắt ----------
cuts = [(arr_start, arr_end), (dec_start, dec_end)]
ts = s.rfind('(function(', 0, tm.start())
tail = re.match(r'\s*\)\s*;?', s[tm.end():])
if ts != -1 and tail:
    cuts.append((ts, tm.end() + tail.end()))
else:
    print("[?] không cắt được đoạn xoay mảng (không nhận ra dạng IIFE); sẽ để lại")

cuts.sort()
for (a1, b1), (a2, b2) in zip(cuts, cuts[1:]):
    if a2 < b1:
        die("Các đoạn cần cắt chồng lên nhau, dừng để không làm hỏng file")
out = s
for a, b in sorted(cuts, reverse=True):
    out = out[:a] + out[b:]

# ---------- 5. Alias của hàm giải mã ----------
pairs = re.findall(rf'({NAME})\s*=\s*({NAME})\s*(?=[,;])', s)
aliases, alias_pairs = {dec_name}, []
changed = True
while changed:
    changed = False
    for a, b in pairs:
        if b in aliases and a not in aliases:
            aliases.add(a)
            alias_pairs.append((a, b))
            changed = True
print(f"[+] {len(aliases)} tên (gồm alias) trỏ tới hàm giải mã")


def drop_alias(txt, a, b):
    A, B = re.escape(a), re.escape(b)
    txt = re.sub(rf'\b(?:const|let|var)\s+{A}\s*=\s*{B}\s*;', '', txt)
    txt = re.sub(rf'\b((?:const|let|var)\s+){A}\s*=\s*{B}\s*,', r'\1', txt)
    txt = re.sub(rf',\s*{A}\s*=\s*{B}(?=\s*[,;])', '', txt)
    return txt


for a, b in alias_pairs:
    out = drop_alias(out, a, b)

# ---------- 6. Thay lời gọi bằng chuỗi thật ----------
replaced = 0


def sub_call(mm):
    global replaced
    if mm.group(1) not in aliases:
        return mm.group(0)
    try:
        r = json.dumps(decode(arr, int(mm.group(2), 0)), ensure_ascii=False)
    except Exception:
        return mm.group(0)
    replaced += 1
    return r


out = re.sub(rf'\b({NAME})\(\s*(0x[0-9a-fA-F]+|\d+)\s*(?:,\s*([\'"])(.*?)\3\s*)?\)', sub_call, out)

# ---------- 7. obj['prop'] / obj[("prop")] -> obj.prop ----------
KW = {'return', 'typeof', 'void', 'delete', 'in', 'of', 'case', 'else', 'do', 'throw', 'yield', 'await',
      'instanceof'}


def sub_prop(mm):
    prev = re.search(r'[\w$]+$', mm.group(1))
    if prev and prev.group(0) in KW:
        return mm.group(0)
    return f"{mm.group(1)}.{mm.group(3)}"


out = re.sub(r'([\w$)\]]+)\[\s*\(?\s*(["\'])([A-Za-z_$][\w$]*)\2\s*\)?\s*\]', sub_prop, out)

try:
    import jsbeautifier
    out = jsbeautifier.beautify(out)
except ImportError:
    print("[?] chưa có jsbeautifier -> file ra sẽ dính một dòng. Cài: pip3 install jsbeautifier")

dst = path + ".resolved.js"
open(dst, "w", encoding="utf-8").write(out)

left = sum(len(re.findall(rf'\b{re.escape(a)}\b', out)) for a in aliases)
print(f"[+] đã thay {replaced} chuỗi; ghi {dst}")
print(f"[+] còn {left} chỗ nhắc tới tên hàm giải mã/alias" + (" (nên kiểm tra)" if left else " (sạch)"))