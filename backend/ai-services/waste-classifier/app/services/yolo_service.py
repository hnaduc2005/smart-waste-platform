import logging
import io
from PIL import Image
from ultralytics import YOLO
from app.config import settings

logger = logging.getLogger(__name__)

class WasteClassifierModel:
    def __init__(self):
        self.model = None

    def load_model(self):
        try:
            import os
            model_path = settings.MODEL_PATH
            if not os.path.exists(model_path):
                logger.warning(f"Model not found at {model_path}. Using default yolo11n.pt for testing.")
                model_path = "yolo11n.pt"

            self.model = YOLO(model_path)
            logger.info(f"YOLO Model loaded. Task: {self.model.task}. Classes: {self.model.names}")
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
            img_width, img_height = image.width, image.height

            results = self.model.predict(
                source=image,
                conf=settings.CONFIDENCE_THRESHOLD,
                save=False,
                verbose=False
            )

            predictions = []

            if results and len(results) > 0:
                result = results[0]
                boxes = result.boxes

                if boxes is None or len(boxes) == 0:
                    logger.info("No objects detected in image.")
                else:
                    logger.info(f"Detected {len(boxes)} object(s).")
                    for box in boxes:
                        class_id = int(box.cls[0].item())
                        confidence = float(box.conf[0].item())
                        bndbox = box.xyxy[0].tolist()

                        class_name = settings.CLASS_NAMES.get(class_id, result.names.get(class_id, "Unknown"))

                        predictions.append({
                            "class_id": class_id,
                            "class_name": class_name,
                            "confidence": round(confidence, 4),
                            "bounding_box": {
                                "xmin": round(bndbox[0], 2),
                                "ymin": round(bndbox[1], 2),
                                "xmax": round(bndbox[2], 2),
                                "ymax": round(bndbox[3], 2)
                            }
                        })

                    # Sort by confidence descending
                    predictions.sort(key=lambda x: x["confidence"], reverse=True)

            return {
                "predictions": predictions,
                "image_width": img_width,
                "image_height": img_height
            }
        except Exception as e:
            logger.error(f"Prediction error: {e}")
            raise e

classifier_model = WasteClassifierModel()
