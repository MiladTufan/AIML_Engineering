from fastapi import File, UploadFile, APIRouter, Form
import logging
from utils.errors import *
from io import BytesIO
from api.sessionAPI import SessionAPI
from fastapi import Response
from fastapi.responses import StreamingResponse
from models.global_edits import Payload, init_payload
from PyPDF2 import PdfReader, PdfWriter
from pdf_editor import PDFEditor
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

logging.basicConfig(
    level=logging.INFO,  # Minimum log level
    format="[%(levelname)s] %(message)s",
)

logger = logging.getLogger(__name__)


class RouterAPI:
    def __init__(self):
        self.logger = logger
        self.headers = {"Content-Disposition": 'attachment; filename="modified.pdf"'}
        self.origins = ["http://localhost:4200", ]
        self.session_api = SessionAPI()
        self.headers = {"Content-Disposition": 'attachment; filename="modified.pdf"'}
        

        self.router = APIRouter()
        self.router.post("/upload-image")(self.upload_image)
        self.router.post("/upload-pdf")(self.upload_pdf)
        self.router.post("/create-session")(self.session_api.create_session)
        self.router.post("/embed-pdf")(self.embed_objs_into_pdf)


        self.router.get("/get-session")(self.session_api.get_session)
        self.router.get("/get-pdf")(self.get_pdf)
        self.router.get("/download-pdf/{signed_sid}")(self.download_pdf)

        self.router.patch("/update-session")(self.session_api.db.update_session_data)




    async def upload_image(self, image: UploadFile = File(...)):
        content = await image.read()
        return {"filename" : image.filename, "content_size" : len(content)}

    def _get_data(self, signed_sid: str):
        ret = self.session_api.verify_id(signed_sid)
        if ret is not None and ret["sid"] is not None:
            pdf = self.session_api.db.get_data(ret["sid"])
            return pdf
        return None
    
    async def upload_pdf(self, signed_sid: str = Form(...), pdf: UploadFile = File(...)):
        """
        Uploads a PDF file to the server or storage system.

        Args:
            signed_sid (str): the signed browser session id from cookies.
            pdf (UploadFile): The PDF file to save.

        Returns:
            dict{filename, size}:

        Raises:
            BadRequestError: If the file is not a valid PDF.
        """
        if pdf.content_type != "application/pdf":
            return BadRequestError("Only PDF files allowed")
        
        # TODO Find out if this check is needed!   
        ret = self.session_api.verify_id(signed_sid)
        if ret is not None and ret["sid"] is not None:
            pdf_bytes = await pdf.read()
            self.session_api.db.update_session_data(ret["sid"], pdf_bytes)
            print(f"LEN OF PDF IS: {len(self._get_data(signed_sid))}")

            # TODO Sanitize filename and FILE ITSELF
            self.logger.debug(f"Received PDF file: {pdf.filename} ({len(pdf_bytes)} bytes)")
            return {"filename": pdf.filename, "size": len(pdf_bytes)}

        return BadRequestError()
    
    async def get_pdf(self, signed_sid: str):
        """
        Retrieves a PDF file from the server DB.

        Args:
            signed_sid (str): the signed session ID from the browser Cookies.

        Returns:
            bytes/application/octet-stream: The raw content of the PDF file.

        Raises:
            FileNotFoundError: If the requested PDF file does not exist.
            IOError: If there is an error reading the file.
        """
        
        data = self._get_data(signed_sid)
        if data is None:
            return NotFoundError("PDF")
        if data:
            return Response(content=data, media_type="application/octet-stream")

    async def download_pdf(self, signed_sid: str):
        data = self._get_data(signed_sid)
        if data is None:
            return BadRequestError()
        
        if data:
            return StreamingResponse(BytesIO(data), media_type="application/pdf", 
                                    headers=self.headers)

    async def embed_objs_into_pdf(self, payload: Payload):
        ret = self.session_api.verify_id(payload.signed_id)
        
        if ret is not None and ret["sid"] is not None:
            pdf = self.session_api.db.get_data(ret["sid"])
        if not pdf:
            return BadRequestError()  
        
        writer  = PdfWriter()
        existing_pdf = PdfReader(BytesIO(pdf))
        width, height = PDFEditor.get_pdf_dims(existing_pdf)

        for edit in payload.edits.pageEdits:
            packet = BytesIO()
            can = canvas.Canvas(packet, pagesize=A4)
            for box in edit.textboxes:
                can.setFont("Helvetica", box.textStyleEditorState.font_size)  # Font name, size in points
                can.drawString(box.baseLeft, height - box.baseTop, box.text)
        
            can.save()
            PDFEditor.paste_text_into_page(writer, packet, pdf, edit.id)
        new_pdf = PDFEditor.create_stream(writer)

        self.session_api.db.update_session_data(ret["sid"], new_pdf.getvalue())
