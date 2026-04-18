from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services.yolo_service import classifier_model

app = FastAPI(title=settings.PROJECT_NAME, version=settings.VERSION)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to EcoCycle Waste Detector API",
        "status": "Running",
        "model_loaded": classifier_model.model is not None,
        "version": settings.VERSION,
    }

@app.get("/health")
def health_check():
    model_loaded = classifier_model.model is not None
    return {
        "status": "healthy",
        "service": "EcoCycle Waste Detector API",
        "model_loaded": model_loaded,
        "model_task": getattr(classifier_model.model, "task", None) if model_loaded else None,
    }

@app.post("/predict")
async def predict_waste(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")

    try:
        contents = await file.read()
        result_dict = classifier_model.predict(contents)

        return JSONResponse(content={
            "filename": file.filename,
            "predictions": result_dict["predictions"],
            "image_width": result_dict["image_width"],
            "image_height": result_dict["image_height"],
            "conf_threshold": settings.CONFIDENCE_THRESHOLD,
            "total_detections": len(result_dict["predictions"]),
        })
    except RuntimeError as re:
        raise HTTPException(status_code=503, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Alias for semantic clarity
@app.post("/detect")
async def detect_waste(file: UploadFile = File(...)):
    return await predict_waste(file)
