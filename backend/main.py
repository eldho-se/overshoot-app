import os
from dotenv import load_dotenv

load_dotenv()
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from api.countries_api import CountryApi
from api.scenario_api import ScenarioApi
from api.carbon_energy_pie_api import PieChartApi
from api.forcast_api import ForcastApi

app = FastAPI(
    title="Global Ecological Overshoot API",
    description="Provides data and analytics on ecological overshoot, bio-capacity, and carbon footprint for countries "
                "and the world.",
    version="1.0.0",
    license_info={"name": "MIT", "url": "https://opensource.org/licenses/MIT"},
    openapi_url="/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {
            "name": "Footprint",
            "description": "Endpoints for bio-capacity, carbon footprint, and ecological overshoot analytics."
        }
    ],
)

@app.get("/_health", include_in_schema=False)
async def health_check():
    return {"status": "healthy"}

def get_allowed_origins():
    # Allow all origins
    return ["*","http://localhost:3000", "http://127.0.0.1:3000"]
from fastapi import status
from fastapi.responses import JSONResponse

@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    # Allow docs, openapi, and health check without key
    if (request.url.path.startswith("/docs") or 
        request.url.path.startswith("/redoc") or 
        request.url.path.startswith("/openapi.json") or
        request.url.path == "/_health"):
        return await call_next(request)
    key = request.headers.get("x-api-key")
    if key != "thesis_project_2025":
        return JSONResponse(status_code=status.HTTP_403_FORBIDDEN, content={"detail": "Invalid API Key"})
    return await call_next(request)

class DynamicCORSMiddleware(CORSMiddleware):
    async def __call__(self, scope, receive, send):
        if scope["type"] == "http":
            path = scope.get("path", b"").decode() if isinstance(scope.get("path", b""), bytes) else scope.get("path", "")
            origin = None
            for header in scope.get("headers", []):
                if header[0].lower() == b"origin":
                    origin = header[1].decode()
                    break
            if path.startswith("/docs") or path.startswith("/redoc") or path.startswith("/openapi.json"):
                allowed_origins = ["*","http://localhost:3000", "http://127.0.0.1:3000"]
            else:
                allowed_origins = get_allowed_origins()
            # Only allow if origin matches allowed_origins
            if origin and origin not in allowed_origins and allowed_origins != ["*"]:
                from starlette.responses import Response
                response = Response("CORS origin forbidden", status_code=403)
                response.headers["Access-Control-Allow-Origin"] = origin
                response.headers["Vary"] = "Origin"
                await response(scope, receive, send)
                return
        await super().__call__(scope, receive, send)

app.add_middleware(
    DynamicCORSMiddleware,
    allow_origins=get_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PieChartApi(app)
ScenarioApi(app)
CountryApi(app)
ForcastApi(app)

if __name__ == "__main__":
    import uvicorn
    # Use PORT from environment if available (cloud platforms set this automatically)
    port = int(os.getenv("PORT", 8080))
    
    # Detect if running in development mode
    env = os.getenv("ENV", "development")
    reload_enabled = env == "development"

    print(f"Starting server on port {port}")
    
    uvicorn.run(
        "main:app",
        host="127.0.0.1",  # Changed to localhost for local development
        port=port,       # ✅ Dynamic port for cloud
        reload=reload_enabled  # ✅ Only reload in development
    )
