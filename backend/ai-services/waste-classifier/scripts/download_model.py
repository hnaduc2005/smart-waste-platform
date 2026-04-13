import os
import gdown
import sys

# Add the parent directory to the path so we can import app config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import settings

def main():
    """
    Utility script to download the YOLO model weights from Google Drive.
    """
    # Create the model directory if it doesn't exist
    if not os.path.exists(settings.MODEL_DIR):
        os.makedirs(settings.MODEL_DIR)
        
    # TODO: Replace with the actual Google Drive file ID of your best.pt
    # The file MUST be 'Anyone with the link can view'
    drive_file_id = "YOUR_GOOGLE_DRIVE_FILE_ID_HERE" 
    download_url = f'https://drive.google.com/uc?id={drive_file_id}'
    
    print(f"Downloading model to {settings.MODEL_PATH}...")
    
    try:
        gdown.download(download_url, settings.MODEL_PATH, quiet=False)
        print("Model downloaded successfully!")
    except Exception as e:
        print(f"Failed to download the model: {e}")

if __name__ == "__main__":
    main()
