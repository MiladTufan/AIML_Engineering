from PyPDF2 import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from io import BytesIO
from rembg import remove
from PIL import Image
from reportlab.lib.utils import ImageReader
import io
from models.global_edits import GlobalEdit
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from models.global_edits import cast_blockobject_to_textbox

pdfmetrics.registerFont(TTFont('Inter', 'fonts/Inter_18pt-Regular.ttf'))

class PDFEditor(object):
    def __init__(self):
        pass
    
    
    def embed_edits_into_pdf(pdf, edits: GlobalEdit):
        writer  = PdfWriter()
        existing_pdf = PdfReader(BytesIO(pdf))
        width, height = PDFEditor.get_pdf_dims(existing_pdf)
        num_changes = 0
        
        for edit in edits.pageEdits:
            packet = BytesIO()
            can = canvas.Canvas(packet, pagesize=A4)
            for box in edit.textboxes:
                textbox = cast_blockobject_to_textbox(box)
                can.setFont(textbox.StyleState.textFontName, textbox.StyleState.textBaseFontSize) 
                                                              
                offset_left = 3.5 * box.BoxDims.currentScale                                                              
                offset_top = (textbox.StyleState.textBaseFontSize ) * box.BoxDims.currentScale                                                              
                                                                                                    
                can.drawString(((box.BoxDims.left + offset_left) / box.BoxDims.currentScale), 
                               height - (((box.BoxDims.top + offset_top) / box.BoxDims.currentScale)), textbox.text)
                num_changes += 1
        
            can.save()
            PDFEditor.paste_text_into_page(writer, packet, pdf, edit.id)
        
        if num_changes == 0:
            for i, page in enumerate(existing_pdf.pages):
                print(f"adding page: {i}")
                writer.add_page(page)
        
        new_pdf = PDFEditor.create_stream(writer)
        return new_pdf
    
    
    @staticmethod
    def create_pdf_from_bytes(bytes: io.BytesIO):
        reader = PdfReader(bytes)
        
        writer = PdfWriter()
        
        for page in reader.pages:
            writer.add_page(page)
            
        out_stream = io.BytesIO()
        writer.write(out_stream)
        out_stream.seek(0)
        
        
        headers = {"Content-Disposition": 'attachment; filename="modified.pdf"'}
        
        return out_stream, headers
    
    @staticmethod
    def get_pdf_dims(pdf):
        page1 = pdf.pages[0]
        media_box = page1.mediabox
        width = float(media_box.width)
        height = float(media_box.height)
        print(f"Width: {width} pt, Height: {height} pt")
        return width, height
    
    @staticmethod
    def _remove_bg_from_image(img_path) -> ImageReader:
        img = None
        with open(img_path, "rb") as f:
            img = f.read()

        pil_image = Image.open(io.BytesIO(remove(img)))
        img_buffer = io.BytesIO()
        
        pil_image.save(img_buffer, format="PNG")
        img_buffer.seek(0)
        img_reader = ImageReader(img_buffer)
        return img_reader


    @staticmethod
    def paste_img_into_pdf(img_pos, img_size, page_num, pdf_path, img_path, remove_bg=False):
        packet = BytesIO()
        can = canvas.Canvas(packet, pagesize=A4)
        if not remove_bg:
            can.drawImage(img_path, img_pos[0], img_pos[1], img_size[0], img_size[1])
        else:
            img_reader = PDFEditor._remove_bg_from_image(img_path)
            can.drawImage(img_reader, img_pos[0], img_pos[1], img_size[0], img_size[1], mask="auto")
        can.save()

        packet.seek(0)

        overlay_pdf = PdfReader(packet)
        existing_pdf = PdfReader(pdf_path)
        output = PdfWriter()

        page_num = page_num - 1
        for i, page in enumerate(existing_pdf.pages):
            if i == page_num:
                page.merge_page(overlay_pdf.pages[0])
            output.add_page(page)
        
        # Save the result
        with open("merged_output.pdf", "wb") as f:
            output.write(f)

    @staticmethod
    def create_text_overlay(pdf_height, packet, x, y, font_size, font, text):
        can = canvas.Canvas(packet, pagesize=A4)

        can.setFont("Helvetica", font_size)  # Font name, size in points
        can.drawString(x, pdf_height - y, text)
        can.save()

        return packet
    
    @staticmethod
    def paste_text_into_page(complete_pdf_writer, packet, pdf_file, pagenumber):
        packet.seek(0)
        overlay_pdf = PdfReader(packet)
        existing_pdf = PdfReader(BytesIO(pdf_file))
        
        if (len(overlay_pdf.pages) <= 0):
            return
        
        pagenumber = pagenumber - 1
        for i, page in enumerate(existing_pdf.pages):
            if i == pagenumber:
                page.merge_page(overlay_pdf.pages[0])
            complete_pdf_writer.add_page(page)

        return complete_pdf_writer
    
    @staticmethod
    def create_stream(complete_pdf_writer):
        out_stream = io.BytesIO()
        complete_pdf_writer.write(out_stream)
        out_stream.seek(0)

        return out_stream
