from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config.setting import settings
from elasticsearch import Elasticsearch
from app.api.user_auth import router as auth_router
from app.api.user_auth import router_api as api_router

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize Elasticsearch
es = Elasticsearch(settings.elasticsearch_url)

# Include routers
app.include_router(auth_router)
app.include_router(api_router)

@app.get("/")
async def root():
    return {"message": "Welcome to PowerGrid Backend API"}