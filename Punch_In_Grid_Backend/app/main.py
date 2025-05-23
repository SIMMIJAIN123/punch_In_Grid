from fastapi import FastAPI
from app.api import user_auth

app = FastAPI()

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# ✅ Allow React frontend (running on port 3001)
origins = [
    "http://localhost:3001",
    "http://127.0.0.1:3001"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,     
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your router
app.include_router(user_auth.router)

# Custom OpenAPI for Swagger UI Bearer Auth support
from fastapi.openapi.utils import get_openapi

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="PowerGrid API",
        version="1.0.0",
        description="API for user management",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    # Apply bearerAuth security scheme globally to all endpoints
    for path in openapi_schema["paths"].values():
        for operation in path.values():
            operation["security"] = [{"bearerAuth": []}]
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi



