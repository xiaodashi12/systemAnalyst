import fitz  # PyMuPDF
import json
import os

def generate_toc(pdf_path: str, book_id: str, output_base: str):
    doc = fitz.open(pdf_path)
    toc = doc.get_toc() # Returns a list of lists: [level, title, page]
    
    print(f"提取的大纲项数量: {len(toc)}")
    
    formatted_toc = []
    for item in toc:
        level, title, page = item[0], item[1], item[2]
        formatted_toc.append({
            "title": title,
            "level": level - 1, # Convert 1-based level to 0-based for compatibility
            "pageNum": page
        })
        
    os.makedirs(output_base, exist_ok=True)
    toc_path = os.path.join(output_base, f"{book_id}-toc.json")
    with open(toc_path, "w", encoding="utf-8") as f:
        json.dump(formatted_toc, f, ensure_ascii=False)
        
    print(f"大纲保存路径: {toc_path}")
    doc.close()

if __name__ == "__main__":
    generate_toc(
        pdf_path="/Users/cjg/Downloads/sys-analyst-2nd.pdf",
        book_id="sys-analyst-2nd",
        output_base="public/pages"
    )
