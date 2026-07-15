from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pathlib import Path

app = FastAPI(title="{{PROJECT_NAME}}")

templates = Jinja2Templates(directory="templates")
static_path = Path(__file__).parent / "static"
app.mount("/static", StaticFiles(directory=str(static_path)), name="static")


@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/dashboard", response_class=HTMLResponse)
async def dashboard(request: Request):
    stats = [
        {"label": "Total Users", "value": "1,284", "delta": "+12%"},
        {"label": "Revenue", "value": "$84K", "delta": "+8%"},
        {"label": "Tasks", "value": "42", "delta": "-3%"},
        {"label": "Completion", "value": "94%", "delta": "+2%"},
    ]
    return templates.TemplateResponse("dashboard.html", {"request": request, "stats": stats})


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
