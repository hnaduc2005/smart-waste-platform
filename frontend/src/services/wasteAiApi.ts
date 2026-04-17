export interface BoundingBox {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}

export interface Prediction {
  class_id?: number;
  class_name: string;
  confidence: number;
  bounding_box: BoundingBox;
}

export interface PredictResponse {
  filename: string;
  predictions: Prediction[];
  image_width: number;
  image_height: number;
}

const API_BASE_URL = 'http://127.0.0.1:8000';

export const wasteAiApi = {
  predictWaste: async (imageFile: File): Promise<PredictResponse> => {
    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const response = await fetch(`${API_BASE_URL}/predict`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const responseData: PredictResponse = await response.json();
      return responseData;

    } catch (error) {
      console.error('Error in predictWaste API:', error);
      throw error;
    }
  },
};
