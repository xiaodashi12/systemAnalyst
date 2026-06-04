import fitz  # PyMuPDF
import json
import os
from PIL import Image

def generate_book_assets(pdf_path: str, book_id: str, output_base: str):
    doc = fitz.open(pdf_path)
    pages_dir = os.path.join(output_base, book_id)
    os.makedirs(pages_dir, exist_ok=True)
    
    index = []  # Full book text index
    
    total_pages = len(doc)
    print(f"开始处理 PDF，总页数: {total_pages}...")
    
    for i, page in enumerate(doc):
        page_num = i + 1
        
        # 1. 保持 1.0 倍原始超清分辨率即可 (1721x2312)
        mat = fitz.Matrix(1.0, 1.0)
        pix = page.get_pixmap(matrix=mat)
        
        # 2. 将 pixmap 转化为 PIL 图像，并以 70% 质量压缩保存为 JPG
        img = Image.frombytes("RGBA" if pix.alpha else "RGB", (pix.width, pix.height), pix.samples)
        img_path = os.path.join(pages_dir, f"page_{page_num:04d}.jpg")
        img.convert("RGB").save(img_path, "JPEG", quality=70, optimize=True)
        
        # 3. 提取文本用于搜索索引
        text = page.get_text("text").strip()
        index.append({
            "page": page_num,
            "text": text
        })
        
        if page_num % 50 == 0 or page_num == total_pages:
            print(f"进度: [{page_num}/{total_pages}] 页已处理")
            
    # 4. 保存搜索索引
    index_path = os.path.join(output_base, f"{book_id}-index.json")
    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False)
        
    print("\n🎉 处理完成！")
    print(f"图片保存目录: {pages_dir}")
    print(f"索引文件保存路径: {index_path}")
    
    doc.close()

if __name__ == "__main__":
    generate_book_assets(
        pdf_path="/Users/cjg/Downloads/sys-analyst-2nd.pdf",
        book_id="sys-analyst-2nd",
        output_base="public/pages"
    )
