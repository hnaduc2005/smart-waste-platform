import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "EcoCycle Waste Classifier AI API"
    VERSION: str = "1.0.0"
    
    # Model configuration
    BASE_DIR: str = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    MODEL_DIR: str = os.path.join(BASE_DIR, "model_weights")
    MODEL_PATH: str = os.path.join(MODEL_DIR, "best.pt")
    
    # Model download configuration
    MODEL_DRIVE_ID: str = "16QT2ZyF1LCkw99bbpXX0opQMRYStbpnI" 
    
    # Prediction settings
    CONFIDENCE_THRESHOLD: float = 0.5
    
    # Class mapping for YOLOv11 Model
    CLASS_NAMES: dict = {
        0: 'biodegradable',
        1: 'recyclable',
        2: 'residual',
        3: 'special'
    }

settings = Settings()
