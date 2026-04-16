export interface PredictResponse {
  class_name: string;
  class_id?: number;
  confidence: number;
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

      const data: PredictResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Error in predictWaste API:', error);
      throw error;
    }
  },
};
