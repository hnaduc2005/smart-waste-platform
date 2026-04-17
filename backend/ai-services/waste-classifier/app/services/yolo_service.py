import logging
import io
from PIL import Image
from ultralytics import YOLO
from app.config import settings

logger = logging.getLogger(__name__)

class WasteClassifierModel:
    def __init__(self):
        self.model = None
        # Lazy loading: model is not loaded on startup
        
    def load_model(self):
        try:
            # Fallback to default yolo11n.pt if best.pt is not found for testing
            import os
            model_path = settings.MODEL_PATH
            if not os.path.exists(model_path):
                logger.warning(f"Model not found at {model_path}. Using default yolo11n.pt for testing.")
                model_path = "yolo11n.pt" # Ultralytics will auto-download this
                
            self.model = YOLO(model_path)
            logger.info("YOLO Model loaded successfully.")
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            self.model = None

    def predict(self, image_bytes: bytes):
        if self.model is None:
            self.load_model()
            if self.model is None:
                raise RuntimeError("Failed to load model. Cannot perform prediction.")
            
        try:
            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            
            results = self.model.predict(
                source=image,
                conf=settings.CONFIDENCE_THRESHOLD,
                save=False
            )
            
            predictions = []
            
            if results and len(results) > 0:
                result = results[0]
                boxes = result.boxes
                
                for box in boxes:
                    class_id = int(box.cls[0].item())
                    confidence = float(box.conf[0].item())
                    
                    bndbox = box.xyxy[0].tolist() 
                    
                    class_name = settings.CLASS_NAMES.get(class_id, result.names.get(class_id, "Unknown"))
                    
                    predictions.append({
                        "class_id": class_id,
                        "class_name": class_name,
                        "confidence": confidence,
                        "bounding_box": {
                            "xmin": bndbox[0],
                            "ymin": bndbox[1],
                            "xmax": bndbox[2],
                            "ymax": bndbox[3]
                        }
                    })
                    
            return {
                "predictions": predictions,
                "image_width": image.width,
                "image_height": image.height
            }
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise e

classifier_model = WasteClassifierModel()
