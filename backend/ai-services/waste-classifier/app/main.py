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
        "message": "Welcome to EcoCycle Waste Classifier API",
        "status": "Running",
        "model_loaded": classifier_model.model is not None
    }

@app.post("/predict")
async def predict_waste(file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    try:
        # Read the file content
        contents = await file.read()
        
        # Run prediction
        predictions = classifier_model.predict(contents)
        
        return JSONResponse(content={
            "filename": file.filename,
            "predictions": predictions
        })
    except RuntimeError as re:
        raise HTTPException(status_code=503, detail=str(re))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
