from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse


class APIError(HTTPException):
    def __init__(self, status_code: int, message: str):
        super().__init__(status_code=status_code, detail={"error": message})
    
class NotFoundError(APIError):
    def __init__(self, entity="Resource"):
        super().__init__(404, f"{entity} not found!")

class BadRequestError(APIError):
    def __init__(self, message="Invalid Request"):
        super().__init__(400, message)

def register_error_handlers(app):
    @app.exception_handler(APIError)
    async def api_error_handler(request: Request, exc: APIError):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)

    @app.exception_handler(Exception)
    async def generic_error_handler(request: Request, exc: Exception):
        return JSONResponse(status_code=500, content={"error": "Internal Server Error"})