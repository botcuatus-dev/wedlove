import requests
import re
import textwrap
import re, json, base64
import sys

url = input("Nhập url: ")

response = requests.get(
    url,
    headers={"User-Agent": "Mozilla/5.0"},
    timeout=30
)
response.raise_for_status()

pattern = re.compile(
    r"<script\b(?![^>]*\bsrc\s*=)[^>]*>(.*?)</script\s*>",
    re.IGNORECASE | re.DOTALL
)

match = pattern.search(response.text)

if match:
    s = "\n".join(
        line.lstrip(" \t")
        for line in match.group(1).splitlines()
    ).strip()
        
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

    s = base64.b64decode(b64 + '=' * (-len(b64) % 4)).decode('utf-8', 'replace')

    # ---------- 1. Đọc mảng chuỗi ----------
    m = re.search(r'function\s+(_0x[0-9a-f]+)\(\)\s*\{\s*(?:const|var|let)\s+\w+\s*=\s*\[', s)
    arr_func = m.group(1)
    pos = m.end()

    ESC = {'n': '\n', 't': '\t', 'r': '\r', 'b': '\b', 'f': '\f', 'v': '\v', '0': '\0'}

    def read_string(src, i):
        q = src[i]; i += 1; out = []
        while src[i] != q:
            c = src[i]
            if c == '\\':
                i += 1; c = src[i]
                if c == 'x':
                    out.append(chr(int(src[i+1:i+3], 16))); i += 2
                elif c == 'u':
                    out.append(chr(int(src[i+1:i+5], 16))); i += 4
                else:
                    out.append(ESC.get(c, c))
            else:
                out.append(c)
            i += 1
        return ''.join(out), i + 1

    arr = []
    while True:
        while src_c := s[pos]:
            if src_c in " \n\r\t,":
                pos += 1
            else:
                break
        if s[pos] == ']':
            break
        if s[pos] in "'\"":
            v, pos = read_string(s, pos)
            arr.append(v)
        else:
            raise SystemExit(f"Phần tử mảng không phải chuỗi tại {pos}: {s[pos:pos+40]!r}")
    print(f"[+] array {arr_func}: {len(arr)} chuỗi")

    # ---------- 2. Hàm giải mã + offset ----------
    dm = re.search(r'function\s+(_0x[0-9a-f]+)\((_0x\w+)\s*,\s*_0x\w+\)\s*\{\s*\2\s*=\s*\2\s*-\s*(0x[0-9a-f]+|\d+)', s)
    dec_name, offset = dm.group(1), int(dm.group(3), 0)
    print(f"[+] decoder {dec_name}, offset {hex(offset)}")

    # ---------- 3. Biểu thức xoay mảng ----------
    tm = re.search(r'\}\(\s*' + re.escape(arr_func) + r'\s*,\s*(0x[0-9a-f]+|\d+)\s*\)', s)
    target = int(tm.group(1), 0)
    em = re.search(r'const\s+\w+\s*=\s*(parseInt.*?);\s*if\s*\(', s, re.S)
    expr = re.sub(r'parseInt\(\s*\w+\((0x[0-9a-f]+|\d+)\)\s*\)', r'pi(\1)', em.group(1))

    def run(rot):
        def pi(idx):
            v = rot[idx - offset]
            mm = re.match(r'\s*([+-]?\d+)', v)
            if not mm:
                raise ValueError("NaN")
            return int(mm.group(1))
        return eval(expr, {"pi": pi})

    for _ in range(len(arr) + 1):
        try:
            if run(arr) == target:
                break
        except Exception:
            pass
        arr.append(arr.pop(0))
    else:
        raise SystemExit("Không tìm được phép xoay khớp checksum")
    print("[+] đã xoay mảng khớp checksum")

    # ---------- 4. Tìm alias của hàm giải mã ----------
    aliases = {dec_name}
    changed = True
    while changed:
        changed = False
        for a, b in re.findall(r'(_0x[0-9a-f]+)\s*=\s*(_0x[0-9a-f]+)\s*[,;]', s):
            if b in aliases and a not in aliases:
                aliases.add(a); changed = True
    print(f"[+] {len(aliases)} alias")

    # ---------- 5. Thay thế ----------
    def sub_call(mm):
        if mm.group(1) not in aliases:
            return mm.group(0)
        return json.dumps(arr[int(mm.group(2), 0) - offset], ensure_ascii=False)

    out = re.sub(r'\b(_0x[0-9a-f]+)\((0x[0-9a-f]+|\d+)\)', sub_call, s)

    # obj["prop"] / obj['prop'] -> obj.prop
    out = re.sub(r'(?<=[\w$\)\]])\[\s*["\']([A-Za-z_$][\w$]*)["\']\s*\]', r'.\1', out)

    # atob("...") -> thêm chú thích giải mã
    def sub_atob(mm):
        try:
            raw = base64.b64decode(mm.group(2) + '=' * (-len(mm.group(2)) % 4))
            txt = raw.decode('utf-8', 'replace')
            return f'{mm.group(0)} /* => {json.dumps(txt, ensure_ascii=False)} */'
        except Exception:
            return mm.group(0)
    out = re.sub(r'atob\((["\'])([A-Za-z0-9+/=]+)\1\)', sub_atob, out)

    try:
        import jsbeautifier
        code = jsbeautifier.beautify(out)
    except ImportError:
        pass
    
    left = len(re.findall(r'\b_0x[0-9a-f]+\((?:0x[0-9a-f]+|\d+)\)', out))
    print(f"[+] ghi {dst}; còn {left} lời gọi dạng _0x..(0x..) chưa thay")




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

    open("script.deobf.clean.js", "w", encoding="utf-8").write(code)
    print(f"[+] ghi file script.deobf.clean.js")
    print("[+] bảng đổi tên:")
    for k, v in mapping.items():
        print(f"    {k} -> {v}")

    print(code[:1000])


else:
    print("Không tìm thấy inline script.")