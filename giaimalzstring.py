from urllib.parse import urlparse, parse_qs
from lzstring import LZString

lz = LZString()


def decode_lzstring(value: str):
    """Giải nén chuỗi LZ-String dạng EncodedURIComponent."""
    try:
        result = lz.decompressFromEncodedURIComponent(value)
        return result
    except Exception as e:
        print(f"Lỗi giải nén: {e}")
        return None


def decode_url(url: str):
    """Lấy tham số d hoặc id từ URL rồi giải nén."""
    params = parse_qs(urlparse(url).query)

    value = (
        params.get("d", [None])[0]
        or params.get("id", [None])[0]
    )

    if not value:
        print("Không tìm thấy tham số d hoặc id.")
        return None

    result = decode_lzstring(value)

    if result is None:
        print("Không thể giải nén dữ liệu.")
        return None

    print("=== Nội dung sau khi giải nén ===")
    print(repr(result))

    parts = result.split("|")

    print("\n=== Các trường dữ liệu ===")
    names = [
        "Lời nhắn trên bó hoa",
        "Tiêu đề thư",
        "Nội dung thư",
        "Chữ ký",
        "URL âm thanh",
    ]

    for i, name in enumerate(names):
        value = parts[i] if i < len(parts) else ""
        print(f"{name}: {value}")

    return result


if __name__ == "__main__":
    url = input("Nhập URL chứa ?d= hoặc ?id=: ").strip()
    decode_url(url)