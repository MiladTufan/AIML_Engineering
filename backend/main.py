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
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas


from api.routerAPI import RouterAPI
from utils.errors import *

logger = logging.getLogger("uvicorn")

app = FastAPI()

origins = [
    "http://localhost:4200",  # Angular dev server default port
    # add other origins if needed
]

headers = {"Content-Disposition": 'attachment; filename="modified.pdf"'}

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
    # allow_credentials=True
)

router_api = RouterAPI()
app.include_router(router_api.router, prefix="/session")
register_error_handlers(app)




















# temp_pdf = None

# @app.post("/upload-image")
# async def upload_image(image: UploadFile = File(...)):
#     content = await image.read()
#     return {"filename" : image.filename, "content_size" : len(content)}

# @app.post("/upload-pdf")
# async def upload_pdf(pdf: UploadFile = File(...)):
#     global temp_pdf
#     if pdf.content_type != "application/pdf":
#         return JSONResponse({"error": "Only PDF files allowed"}, status_code=400)

#     pdf_bytes = await pdf.read()
#     temp_pdf = BytesIO(pdf_bytes)

#     print(f"Received PDF file: {pdf.filename} ({len(pdf_bytes)} bytes)")
#     return {"filename": pdf.filename, "size": len(pdf_bytes), "temp": temp_pdf.getbuffer().nbytes}

# @app.post("/complete-pdf")
# async def complete_pdf(global_edits: GlobalEdit):
#     global temp_pdf
#     complete_pdf  = PdfWriter()


#     logger.info("FAST API COMPLETE PDF")
#     logger.info(global_edits)
#     logger.info(f"Received PDF file: ({temp_pdf.getbuffer().nbytes} bytes)")

#     existing_pdf = PdfReader(BytesIO(temp_pdf.getvalue()))

#     page1 = existing_pdf.pages[0]

#     media_box = page1.mediabox
#     width = float(media_box.width)
#     height = float(media_box.height)
#     print(f"Width: {width} pt, Height: {height} pt")

#     for edit in global_edits.pageEdits:
#         logger.info(f"handling page: {edit.id}")
        
#         packet = BytesIO()
#         can = canvas.Canvas(packet, pagesize=A4)
        
#         for box in edit.textboxes:
#             # packet = PDFEditor.create_text_overlay(height, packet, box.baseLeft, box.baseTop, 
#             #                                     box.textStyleEditorState.font_size, box.textStyleEditorState.fontname, 
#             #                                     box.text)
            

#             can.setFont("Helvetica", box.textStyleEditorState.font_size)  # Font name, size in points
#             can.drawString(box.baseLeft, height - box.baseTop, box.text)
#             logger.info(f"handling box: {box.id}, text: {box.text} coordinates: {box.baseLeft} / {box.baseTop}")

#         can.save()
#         PDFEditor.paste_text_into_page(complete_pdf, packet, temp_pdf, edit.id)

#     new_pdf = PDFEditor.create_stream(complete_pdf)
#     temp_pdf = new_pdf

# @app.get("/download-pdf")
# async def download_pdf():
#     global temp_pdf
#     return StreamingResponse(temp_pdf, media_type="application/pdf", headers=headers)



