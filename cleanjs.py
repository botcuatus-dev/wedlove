#!/usr/bin/env python3
"""
Dọn nốt phần còn sót sau resolve_strings.py:
  - xoá hàm giải mã (_0x1bb9), hàm trả về mảng (_0x43b3) và IIFE xoay mảng
  - xoá các dòng alias thừa (const _0x... = _0x31bd9b;)
  - !![] -> true, ![] -> false, 0x28 -> 40
  - đổi tên biến _0x... thành tên dễ đọc (suy từ ngữ cảnh, không đoán được thì v1, v2...)
Chỉ xử lý tĩnh, không chạy mã.

Dùng: python cleanup_js.py index.html.pretty.js.resolved.js
Ra:   <file>.clean.js  (+ in bảng đổi tên)
"""
import re, sys

if len(sys.argv) < 2:
    sys.exit("Usage: python cleanup_js.py <file.js>")
path = sys.argv[1]
code = open(path, encoding="utf-8", errors="replace").read()

_KW = {"return", "typeof", "case", "delete", "void", "throw", "in", "of", "new", "else", "do"}

def regex_allowed(src, i):
    """Dấu / tại vị trí i bắt đầu regex literal (chứ không phải phép chia)?"""
    j = i - 1
    while j >= 0 and src[j] in " \t\r\n":
        j -= 1
    if j < 0:
        return True
    c = src[j]
    if c in "(,=:[!&|?{};+-*%<>~^":
        return True
    if c.isalnum() or c in "_$":
        k = j
        while k >= 0 and (src[k].isalnum() or src[k] in "_$"):
            k -= 1
        return src[k + 1:j + 1] in _KW
    return False


def spans(src):
    res, i, n, start = [], 0, len(src), 0

    def flush(upto):
        if start < upto:
            res.append((start, upto, "code"))

    while i < n:
        c = src[i]
        if c in "'\"`":
            flush(i)
            j = i + 1
            while src[j] != c:
                if src[j] == "\\":
                    j += 1
                j += 1
            res.append((i, j + 1, "str"))
            i = start = j + 1
        elif src.startswith("/*", i):
            flush(i)
            j = src.index("*/", i + 2) + 2
            res.append((i, j, "comment"))
            i = start = j
        elif src.startswith("//", i):
            flush(i)
            j = src.find("\n", i)
            j = n if j == -1 else j
            res.append((i, j, "comment"))
            i = start = j
        elif c == "/" and regex_allowed(src, i):
            # regex literal: coi như một khối "chuỗi" để // bên trong không bị nhầm là comment
            flush(i)
            j, in_class = i + 1, False
            while True:
                ch = src[j]
                if ch == "\\":
                    j += 2
                    continue
                if ch == "[":
                    in_class = True
                elif ch == "]":
                    in_class = False
                elif ch == "/" and not in_class:
                    break
                j += 1
            j += 1
            while j < n and src[j].isalpha():
                j += 1
            res.append((i, j, "str"))
            i = start = j
        else:
            i += 1
    flush(n)
    return res

def map_code(src, fn):
    return "".join(fn(src[a:b]) if k == "code" else src[a:b] for a, b, k in spans(src))


def block_end(src, open_idx):
    depth = 0
    for a, b, k in spans(src):
        if k != "code" or b <= open_idx:
            continue
        for m in re.finditer(r"[{}]", src[max(a, open_idx):b]):
            depth += 1 if m.group() == "{" else -1
            if depth == 0:
                return max(a, open_idx) + m.start() + 1
    raise ValueError("không khớp ngoặc")


def remove_function(src, name):
    m = re.search(r"function\s+" + re.escape(name) + r"\s*\(", src)
    if not m:
        return src
    o = src.index("{", m.end())
    return src[:m.start()] + src[block_end(src, o):]


# ---------- 1. tên hàm giải mã / mảng ----------
am = re.search(r"function\s+(_0x[0-9a-f]+)\(\)\s*\{\s*(?:const|var|let)\s+\w+\s*=\s*\[", code)
dm = re.search(r"function\s+(_0x[0-9a-f]+)\((_0x\w+)\s*,\s*_0x\w+\)\s*\{\s*\2\s*=\s*\2\s*-\s*(?:0x[0-9a-f]+|\d+)", code)
arr_func = am.group(1) if am else None
dec_name = dm.group(1) if dm else None
print("[+] array fn:", arr_func, "| decoder fn:", dec_name)

# ---------- 2. bỏ IIFE xoay mảng ----------
if arr_func:
    code, n = re.subn(
        r"\(function\(\s*\w+\s*,\s*\w+\s*\)\s*\{.*?\}\(\s*" + re.escape(arr_func) + r"\s*,\s*(?:0x[0-9a-f]+|\d+)\s*\),\s*",
        "(", code, count=1, flags=re.S)
    print("[+] đã bỏ IIFE xoay mảng" if n else "[!] không thấy IIFE xoay mảng")

# ---------- 3. bỏ hàm giải mã / hàm mảng ----------
for fn in (dec_name, arr_func):
    if fn:
        code = remove_function(code, fn)

# ---------- 4. bỏ alias thừa ----------
aliases = {dec_name} if dec_name else set()
changed = True
while changed:
    changed = False
    for a, b in re.findall(r"(_0x[0-9a-f]+)\s*=\s*(_0x[0-9a-f]+)\s*[,;]", code):
        if b in aliases and a not in aliases:
            aliases.add(a)
            changed = True
if aliases:
    A = "(?:" + "|".join(map(re.escape, aliases)) + ")"
    prev = None
    while prev != code:
        prev = code
        code = re.sub(r"(?:const|let|var)\s+" + A + r"\s*=\s*" + A + r"\s*;", "", code)
        code = re.sub(r"(const|let|var)\s+" + A + r"\s*=\s*" + A + r"\s*,\s*", r"\1 ", code)
        code = re.sub(r",\s*" + A + r"\s*=\s*" + A + r"\s*(?=[,;])", "", code)
    print(f"[+] đã bỏ {len(aliases)} alias")

# ---------- 5. chuẩn hoá literal ----------
def norm(t):
    t = t.replace("!![]", "true").replace("![]", "false")
    t = re.sub(r"(?<![\w$])0x[0-9a-fA-F]+(?![\w$])", lambda m: str(int(m.group(), 16)), t)
    return t
code = map_code(code, norm)

# ---------- 6. đổi tên _0x... ----------
def camel(s):
    parts = re.split(r"[^A-Za-z0-9]+", s)
    return parts[0].lower() + "".join(p.capitalize() for p in parts[1:])

ids = []
for a, b, k in spans(code):
    if k == "code":
        for m in re.finditer(r"_0x[0-9a-f]+", code[a:b]):
            if m.group() not in ids:
                ids.append(m.group())

used, mapping, counter = set(re.findall(r"[A-Za-z_$][\w$]*", code)) - set(ids), {}, 0
def unique(base):
    name, i = base, 2
    while name in used:
        name, i = f"{base}{i}", i + 1
    used.add(name)
    return name

for ident in ids:
    e = re.escape(ident)
    base = None
    m = re.search(e + r"\s*=\s*document\.getElementById\((['\"])([^'\"]+)\1\)(\.value)?", code)
    if m:
        base = camel(m.group(2)) + ("Value" if m.group(3) else "El")
    if not base and re.search(e + r"\s*=\s*document\.getElementById\(\s*\w+\s*\)", code):
        base = "fieldEl"
    if not base:
        m = re.search(e + r"\s*=\s*document\.createElement\((['\"])(\w+)\1\)", code)
        if m:
            base = m.group(2) + "El"
    if not base and re.search(e + r"\s*=\s*\w+\.getContext\(", code):
        base = "ctx"
    if not base and re.search(e + r"\s*=\s*new CSSStyleSheet", code):
        base = "sheet"
    if not base and re.search(r"addEventListener\(\s*['\"]\w+['\"]\s*,\s*(?:function\s*)?\(?\s*" + e + r"\s*\)?\s*(?:=>|\{)", code):
        base = "event"
    if not base and re.search(r"forEach\(\s*" + e + r"\s*=>", code):
        base = "fieldId"
    if not base and re.search(r"\b" + e + r"\s*=\s*\(\)\s*=>", code):
        base = "handler"
    if not base:
        counter += 1
        base = f"v{counter}"
    mapping[ident] = unique(base)

code = map_code(code, lambda t: re.sub(r"_0x[0-9a-f]+", lambda m: mapping.get(m.group(), m.group()), t))

try:
    import jsbeautifier
    code = jsbeautifier.beautify(code)
except ImportError:
    pass

out = path + ".clean.js"
open(out, "w", encoding="utf-8").write(code)
print(f"[+] ghi {out}")
print("[+] bảng đổi tên:")
for k, v in mapping.items():
    print(f"    {k} -> {v}")