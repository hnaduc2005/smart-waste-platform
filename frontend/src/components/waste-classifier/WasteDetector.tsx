import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { UploadCloud, Search, Trash2, Tag, RefreshCw, AlertCircle } from 'lucide-react';
import { wasteAiApi, PredictResponse, Prediction } from '../../services/wasteAiApi';
import { collectionApi } from '../../services/collectionApi';
import { useAuth } from '../../context/AuthContext';
import './WasteDetector.css';

export default function WasteDetector() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPEG, PNG).');
      return;
    }
    
    setError(null);
    setSelectedFile(file);
    setResult(null); // Clear previous results
    setSubmitSuccess(false);
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDetect = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await wasteAiApi.predictWaste(selectedFile);
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze the image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setSubmitSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleCreateRequest = async () => {
    if (!user?.userId || !result) return;
    setSubmitting(true);
    try {
      // Map YOLO class to our internal waste type enum. Fallback to RECYCLABLE
      let mainType = 'RECYCLABLE';
      const predictions = result.predictions || [];
      if (predictions.some(p => p.class_name.toLowerCase().includes('organic'))) mainType = 'ORGANIC';
      else if (predictions.some(p => p.class_name.toLowerCase().includes('battery') || p.class_name.toLowerCase().includes('hazardous'))) mainType = 'HAZARDOUS';

      // We need GPS. Let's try to get it.
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = `${position.coords.latitude},${position.coords.longitude}`;
          
          if (!selectedFile) {
            alert("No image selected");
            setSubmitting(false);
            return;
          }

          // Use the new API that forwards the image to the backend for native AI validation
          await collectionApi.createRequestWithImage(
            user.userId,
            location,
            selectedFile
          );
          
          setSubmitSuccess(true);
          setSubmitting(false);
        },
        (err) => {
          alert('Vui lòng bật tính năng định vị GPS để tạo yêu cầu.');
          setSubmitting(false);
        }
      );
    } catch (err) {
      console.error(err);
      alert('Tạo yêu cầu thất bại');
      setSubmitting(false);
    }
  };

  return (
    <div className="waste-detector-container">
      <div className="page-bg"></div>
      
      <div className="detector-header">
        <h1>AI Waste Detector</h1>
        <p>Upload an image to detect and classify multiple waste items instantly.</p>
      </div>

      <div className="detector-grid">
        {/* Left Side: Image Upload & Preview */}
        <div className="upload-section">
          <div className="upload-card">
            {!previewUrl ? (
              <div 
                className={`dropzone ${isDragging ? 'drag-active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadCloud className="drop-icon" />
                <h3>Drop your image here</h3>
                <p>Supports JPG, PNG, WEBP (Max 5MB)</p>
                <button className="btn-secondary">Browse Files</button>
                <input 
                  type="file" 
                  accept="image/*" 
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="preview-container">
                <div className="image-wrapper">
                  <img src={previewUrl} alt="Preview" className="preview-image" />
                  
                  {/* Bounding Boxes Overlay */}
                  {result && result.predictions && result.predictions.map((pred, idx) => {
                    // API returns absolute coordinates based on image_width and image_height
                    const { xmin, ymin, xmax, ymax } = pred.bounding_box;
                    const iw = result.image_width;
                    const ih = result.image_height;
                    
                    const left = (xmin / iw) * 100;
                    const top = (ymin / ih) * 100;
                    const width = ((xmax - xmin) / iw) * 100;
                    const height = ((ymax - ymin) / ih) * 100;

                    return (
                      <div 
                        key={idx}
                        className="bounding-box"
                        style={{
                          left: `${left}%`,
                          top: `${top}%`,
                          width: `${width}%`,
                          height: `${height}%`
                        }}
                      >
                        <div className="bounding-box-label">
                          {pred.class_name} {(pred.confidence * 100).toFixed(0)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {error && (
              <div style={{color: '#ef4444', marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center'}}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {previewUrl && (
               <div className="actions-row">
                 <button className="btn-secondary" onClick={handleReset} disabled={isLoading}>
                   <RefreshCw size={18} /> Re-upload
                 </button>
                 <button className="btn-primary" onClick={handleDetect} disabled={isLoading || result !== null}>
                   {isLoading ? (
                     <><div className="loader"></div> Analyzing...</>
                   ) : (
                     <><Search size={18} /> Detect Objects</>
                   )}
                 </button>
               </div>
            )}
          </div>
        </div>

        {/* Right Side: Results List */}
        <div className="results-section">
          <div className="results-card">
            <div className="results-header">
              <h2>Detection Results</h2>
              {result && (
                <span className="badge">{result.predictions.length} objects found</span>
              )}
            </div>

            <div className="results-list">
              {!result && !isLoading && (
                <div className="empty-state">
                  <Search size={48} />
                  <h3>No results yet</h3>
                  <p>Upload an image and run detection to see identified waste here.</p>
                </div>
              )}

              {isLoading && (
                 <div className="empty-state">
                   <div className="loader" style={{marginBottom: '1rem', width: '40px', height: '40px'}}></div>
                   <h3>AI is processing...</h3>
                   <p>Identifying objects and computing bounding boxes.</p>
                 </div>
              )}

              {result && result.predictions && result.predictions.length === 0 && (
                <div className="empty-state">
                  <Trash2 size={48} />
                  <h3>No waste detected</h3>
                  <p>The AI couldn't find any recognizable waste items in this image.</p>
                </div>
              )}

              {result && result.predictions && result.predictions.map((pred, i) => (
                <div className="result-item" key={i}>
                  <div className="item-info">
                    <div className="item-icon">
                      <Tag size={20} />
                    </div>
                    <div className="item-details">
                      <h4>{pred.class_name}</h4>
                      <p>Detected object</p>
                    </div>
                  </div>
                  <div className="confidence-score">
                    {(pred.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
              
              {/* Call to action section */}
              {result && result.predictions && result.predictions.length > 0 && !submitSuccess && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(34,197,94,0.1)', borderRadius: '12px', border: '1px solid var(--green-500)', textAlign: 'center' }}>
                  <h4 style={{ marginBottom: '8px', color: 'var(--green-400)' }}>Bạn muốn thu gom số rác này?</h4>
                  <button onClick={handleCreateRequest} disabled={submitting} className="btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                    {submitting ? 'Đang tạo yêu cầu...' : 'Tạo Yêu cầu Thu gom'}
                  </button>
                </div>
              )}
              
              {submitSuccess && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(59,130,246,0.1)', borderRadius: '12px', border: '1px solid #3b82f6', textAlign: 'center' }}>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>✅</div>
                  <h4 style={{ color: '#60a5fa' }}>Tạo yêu cầu thành công!</h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Bạn có thể theo dõi tiến độ ở trang Tổng quan.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
