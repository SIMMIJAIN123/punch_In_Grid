from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware # This custom CORS class allows any frontend (like React) to call your backend
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.api import user_auth

class CORSMiddleware(BaseHTTPMiddleware):  # Cross-Origin Resource Sharing corsmiddleware: for safe request
    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS":
            return JSONResponse(
                content={},
                headers={
                    "Access-Control-Allow-Origin": "*",  # any frontend can call the backend APIs.
                    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
                    "Access-Control-Allow-Headers": "*",
                    "Access-Control-Max-Age": "3600",
                }
            )
        response = await call_next(request)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        return response

app = FastAPI()

# Add CORS middleware
app.add_middleware(CORSMiddleware)

# Include your router
app.include_router(user_auth.router)

# Custom OpenAPI for Swagger UI Bearer Auth support  : connects frontend (like React) to backend (FastAPI)
from fastapi.openapi.utils import get_openapi


# enables the Swagger UI to show a "Authorize" button, where you can input a JWT token. It automatically applies JWT auth to all API endpoints
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





# from fastapi import FastAPI, Request
# from fastapi.responses import JSONResponse
# from starlette.middleware.base import BaseHTTPMiddleware
# from app.api import user_auth

# class CORSMiddleware(BaseHTTPMiddleware):  # Cross-Origin Resource Sharing corsmiddleware: for safe request
#     async def dispatch(self, request: Request, call_next):
#         if request.method == "OPTIONS":
#             return JSONResponse(
#                 content={},
#                 headers={
#                     "Access-Control-Allow-Origin": "*",  # any frontend can call the backend APIs.
#                     "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS, PATCH",
#                     "Access-Control-Allow-Headers": "*",
#                     "Access-Control-Max-Age": "3600",
#                 }
#             )
#         response = await call_next(request)
#         response.headers["Access-Control-Allow-Origin"] = "*"
#         response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
#         response.headers["Access-Control-Allow-Headers"] = "*"
#         return response

# app = FastAPI()

# # Add CORS middleware
# app.add_middleware(CORSMiddleware)

# # Include your router
# app.include_router(user_auth.router)

# # Custom OpenAPI for Swagger UI Bearer Auth support  : connects frontend (like React) to backend (FastAPI)
# from fastapi.openapi.utils import get_openapi


# # enables the Swagger UI to show a "Authorize" button, where you can input a JWT token. It automatically applies JWT auth to all API endpoints
# def custom_openapi():
#     if app.openapi_schema:
#         return app.openapi_schema
#     openapi_schema = get_openapi(
#         title="PowerGrid API",
#         version="1.0.0",
#         description="API for user management",
#         routes=app.routes,
#     )
#     openapi_schema["components"]["securitySchemes"] = {
#         "bearerAuth": {
#             "type": "http",
#             "scheme": "bearer",
#             "bearerFormat": "JWT",
#         }
#     }
#     # Apply bearerAuth security scheme globally to all endpoints
#     for path in openapi_schema["paths"].values():
#         for operation in path.values():
#             operation["security"] = [{"bearerAuth": []}]
#     app.openapi_schema = openapi_schema
#     return app.openapi_schema

# app.openapi = custom_openapi