from fastapi import FastAPI
from app.routes.predict import router
from fastapi.middleware.cors import CORSMiddleware
app = FastAPI(title="Phishunter API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # for now
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")