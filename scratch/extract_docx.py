import zipfile
import xml.etree.ElementTree as ET
import os

docx_path = r"c:\Users\Vallejo\OneDrive\Desktop\dentalprinter-clinic\HISTORIA CLINICA.docx"
output_path = r"c:\Users\Vallejo\OneDrive\Desktop\dentalprinter-clinic\docs\HISTORIA_CLINICA_TEXTO.txt"

if not os.path.exists(docx_path):
    print(f"Error: {docx_path} not found")
    exit(1)

try:
    with zipfile.ZipFile(docx_path) as docx:
        xml_content = docx.read('word/document.xml')
        root = ET.fromstring(xml_content)
        
        # Namespaces
        ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
        
        paragraphs = []
        for elem in root.iter():
            if elem.tag.endswith('p'):
                # Extract all text in this paragraph
                text_elems = elem.findall('.//w:t', ns)
                text = "".join([t.text for t in text_elems if t.text])
                if text.strip():
                    paragraphs.append(text)
            elif elem.tag.endswith('tr'):
                # Extract table row text
                cells = elem.findall('.//w:tc', ns)
                row_text = []
                for cell in cells:
                    cell_text = "".join([t.text for t in cell.findall('.//w:t', ns) if t.text])
                    if cell_text.strip():
                        row_text.append(cell_text.strip())
                if row_text:
                    paragraphs.append(" | ".join(row_text))

        with open(output_path, 'w', encoding='utf-8') as f:
            for p in paragraphs:
                f.write(p + "\n")
                
        print(f"Successfully extracted {len(paragraphs)} paragraphs/rows to {output_path}")

except Exception as e:
    print(f"Error: {e}")
