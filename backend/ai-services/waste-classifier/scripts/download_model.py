import os
import gdown
import sys
import argparse

# Add the parent directory to the path so we can import app config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.config import settings

def main():
    """
    Utility script to download the YOLO model weights from Google Drive.
    """
    parser = argparse.ArgumentParser(description="Download YOLO model weights from Google Drive.")
    parser.add_argument("--drive-id", type=str, help="Google Drive File ID for best.pt")
    args = parser.parse_args()

    # Create the model directory if it doesn't exist
    if not os.path.exists(settings.MODEL_DIR):
        os.makedirs(settings.MODEL_DIR)
        
    drive_file_id = args.drive_id or settings.MODEL_DRIVE_ID
    
    if not drive_file_id:
        print("Error: Google Drive File ID is not provided.")
        print("Please provide it via --drive-id argument or MODEL_DRIVE_ID environment variable.")
        print("Example: python scripts/download_model.py --drive-id 1xyz...")
        sys.exit(1)
        
    download_url = f'https://drive.google.com/uc?id={drive_file_id}'
    
    print(f"Downloading model from Drive ID '{drive_file_id}' to {settings.MODEL_PATH}...")
    
    try:
        gdown.download(download_url, settings.MODEL_PATH, quiet=False)
        print("Model downloaded successfully!")
    except Exception as e:
        print(f"Failed to download the model: {e}")

if __name__ == "__main__":
    main()
