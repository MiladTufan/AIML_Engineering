from fastapi import FastAPI, File, UploadFile, APIRouter, Form
from fastapi.middleware.cors import CORSMiddleware
from db.database import Data
from datetime import datetime, timedelta, timezone
import logging
from utils.errors import *
from io import BytesIO
from api.sessionAPI import SessionAPI

class RouterAPI:
    def __init__(self):
        self.logger = logging.getLogger("uvicorn")
        self.headers = {"Content-Disposition": 'attachment; filename="modified.pdf"'}
        self.origins = ["http://localhost:4200", ]
        self.session_api = SessionAPI()

        

        self.router = APIRouter()
        self.router.post("/upload-image")(self.upload_image)
        self.router.post("/upload-pdf")(self.upload_pdf)
        self.router.post("/create-session")(self.session_api.create_session)
        self.router.get("/get-session")(self.session_api.get_session)
        self.router.patch("/update-session")(self.session_api.db.update_session_data)


    async def upload_image(self, image: UploadFile = File(...)):
        content = await image.read()
        return {"filename" : image.filename, "content_size" : len(content)}

    async def upload_pdf(self, signed_sid: str = Form(...), pdf: UploadFile = File(...)):
        if pdf.content_type != "application/pdf":
            return BadRequestError("Only PDF files allowed")
        
        # TODO Find out if this check is needed!
        sid, sig = self.session_api.verify_id(signed_sid)
        if sid is not None:
            pdf_bytes = await pdf.read()
            self.session_api.db.update_session_data(sid, pdf_bytes)

            # TODO Sanitize filename and FILE ITSELF
            self.logger.debug(f"Received PDF file: {pdf.filename} ({len(pdf_bytes)} bytes)")
            return {"filename": pdf.filename, "size": len(pdf_bytes)}

        return BadRequestError()



