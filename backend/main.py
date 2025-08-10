from pdf_editor import PDFEditor
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from models.global_edits import GlobalEdit
from io import BytesIO
from PyPDF2 import PdfReader, PdfWriter
import logging
import io

app = FastAPI()

origins = [
    "http://localhost:4200",  # Angular dev server default port
    # add other origins if needed
]
logger = logging.getLogger("uvicorn")

headers = {"Content-Disposition": 'attachment; filename="modified.pdf"'}


print("THIS IS MAIN")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
    # allow_credentials=True
)

temp_pdf = None

@app.post("/upload-image")
async def upload_image(image: UploadFile = File(...)):
    content = await image.read()
    return {"filename" : image.filename, "content_size" : len(content)}

@app.post("/upload-pdf")
async def upload_pdf(pdf: UploadFile = File(...)):
    global temp_pdf
    if pdf.content_type != "application/pdf":
        return JSONResponse({"error": "Only PDF files allowed"}, status_code=400)

    pdf_bytes = await pdf.read()
    temp_pdf = io.BytesIO(pdf_bytes)

    print(f"Received PDF file: {pdf.filename} ({len(pdf_bytes)} bytes)")
    return {"filename": pdf.filename, "size": len(pdf_bytes), "temp": temp_pdf.getbuffer().nbytes}

@app.post("/complete-pdf")
async def complete_pdf(global_edits: GlobalEdit):
    global temp_pdf
    complete_pdf  = PdfWriter()

    packet = BytesIO()

    logger.info("FAST API COMPLETE PDF")
    logger.info(global_edits)
    logger.info(f"Received PDF file: ({temp_pdf.getbuffer().nbytes} bytes)")

    for edit in global_edits.pageEdits:
        logger.info(f"handling page: {edit.id}")
        for box in edit.textboxes:
            packet = PDFEditor.create_text_overlay(packet, box.BoxDims.left, box.BoxDims.top, 
                                                box.textStyleEditorState.font_size, box.textStyleEditorState.fontname, 
                                                box.text)
            logger.info(f"handling box: {box.id}, text: {box.text} coordinates: {box.BoxDims.left} / {box.BoxDims.top}")
        
        PDFEditor.paste_text_into_page(complete_pdf, packet, temp_pdf, edit.id)

    new_pdf = PDFEditor.create_stream(complete_pdf)
    temp_pdf = new_pdf

@app.get("/download-pdf")
async def download_pdf():
    global temp_pdf
    return StreamingResponse(temp_pdf, media_type="application/pdf", headers=headers)






# if __name__ == "__main__":
#     pdf_path = r"C:\Users\Milad\Desktop\Milad\Gewerbe\online-business\te\edit-pdfs-online\edit-pdfs-online\backend\test\Eintritt 1_Angabe.pdf"
#     img_path = r"C:\Users\Milad\Desktop\Milad\Gewerbe\online-business\te\edit-pdfs-online\edit-pdfs-online\backend\test\unterschrift.jpg"
#     PDFEditor.paste_img_into_pdf([200, 300], [400,500], 1, pdf_path, img_path, remove_bg=True)
