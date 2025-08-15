from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager


from api.routerAPI import RouterAPI
from utils.errors import *


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    print("App is starting up")
    # e.g., create DB session/connection pool
    yield
    # Shutdown code
    print("App is shutting down")
    # e.g., close DB connections
    router_api.session_api.db.db.close()
    print("DB session closed")





logger = logging.getLogger("uvicorn")

app = FastAPI(lifespan=lifespan)

origins = [
    "http://localhost:4200",  # Angular dev server default port
    # add other origins if needed
]


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








