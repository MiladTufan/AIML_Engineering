from pdf_editor import PDFEditor
from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse

import io

app = FastAPI()

origins = [
    "http://localhost:4200",  # Angular dev server default port
    "http://localhost:4200/edit-pdf",  # Angular dev server default port
    # add other origins if needed
]




print("THIS IS MAIN")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
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
    print(temp_pdf)
    
    print(f"Received PDF file: {pdf.filename} ({len(pdf_bytes)} bytes)")
    return {"filename": pdf.filename, "size": len(pdf_bytes), "temp": temp_pdf.getbuffer().nbytes}

@app.get("/download-pdf")
async def download_pdf():
    global temp_pdf
    print(temp_pdf)
    out_stream, headers = PDFEditor.create_pdf_from_bytes(temp_pdf)
    return StreamingResponse(out_stream, media_type="application/pdf", headers=headers)
    





# if __name__ == "__main__":
#     pdf_path = r"C:\Users\Milad\Desktop\Milad\Gewerbe\online-business\te\edit-pdfs-online\edit-pdfs-online\backend\test\Eintritt 1_Angabe.pdf"
#     img_path = r"C:\Users\Milad\Desktop\Milad\Gewerbe\online-business\te\edit-pdfs-online\edit-pdfs-online\backend\test\unterschrift.jpg"
#     PDFEditor.paste_img_into_pdf([200, 300], [400,500], 1, pdf_path, img_path, remove_bg=True)
