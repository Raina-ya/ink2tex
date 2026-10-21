import base64
import io
import time
from threading import Lock

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from PIL import Image
from pix2tex.cli import LatexOCR


class RecognitionRequest(BaseModel):
    image: str
    samples: int = 1


app = FastAPI(title="Handwritten Formula to LaTeX")
app.mount("/static", StaticFiles(directory="static"), name="static")
model = None
model_lock = Lock()


def get_model():
    global model
    if model is None:
        model = LatexOCR()
    return model


@app.get("/")
def index():
    return FileResponse("static/index.html")


@app.post("/api/recognize")
def recognize(request: RecognitionRequest):
    try:
        _, encoded = request.image.split(",", 1)
        image = Image.open(io.BytesIO(base64.b64decode(encoded))).convert("RGB")
        samples = max(1, min(request.samples, 8))
        temperatures = [0.18, 0.22, 0.26, 0.30, 0.34, 0.38, 0.42, 0.46]
        candidates = []
        timings_ms = []

        with model_lock:
            ocr = get_model()
            original_temperature = ocr.args.get("temperature", 0.25)
            try:
                for temperature in temperatures[:samples]:
                    ocr.args.temperature = temperature
                    started = time.perf_counter()
                    prediction = ocr(image)
                    timings_ms.append(round((time.perf_counter() - started) * 1000))
                    if prediction not in candidates:
                        candidates.append(prediction)
            finally:
                ocr.args.temperature = original_temperature

        return {
            "candidates": candidates,
            "primary": candidates[0],
            "timingsMs": timings_ms,
            "totalMs": sum(timings_ms),
        }
    except ValueError as error:
        raise HTTPException(status_code=400, detail="圖片資料格式不正確。") from error
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"辨識失敗：{error}") from error
