import React, { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { UploadCloud, Search, Trash2, Tag, RefreshCw, AlertCircle, X, List } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
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

  // Helper: wrap geolocation in a promise with 10s timeout
  const getLocationAsync = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GEOLOCATION_NOT_SUPPORTED'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(`${pos.coords.latitude},${pos.coords.longitude}`),
        (err) => reject(err),
        { timeout: 10000, maximumAge: 60000 }
      );
    });
  };

  const handleCreateRequest = async () => {
    if (!user?.userId || !result || !selectedFile) return;
    setSubmitting(true);
    try {
      let location: string;

      try {
        location = await getLocationAsync();
      } catch {
        // GPS không khả dụng hoặc bị từ chối → hỏi nhập thủ công
        const manual = window.prompt(
          'Không lấy được vị trí GPS.\nVui lòng nhập địa chỉ hoặc tọa độ của bạn:',
          'TP. Hồ Chí Minh'
        );
        if (!manual || manual.trim() === '') {
          alert('Cần có vị trí để tạo yêu cầu thu gom.');
          setSubmitting(false);
          return;
        }
        location = manual.trim();
      }

      await collectionApi.createRequestWithImage(
        user.userId,
        location,
        'Phát hiện tự động qua AI', // description
        selectedFile               // image (File)
      );

      setSubmitSuccess(true);
    } catch (err) {
      console.error('Tạo yêu cầu thu gom thất bại:', err);
      alert('Tạo yêu cầu thất bại. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="waste-detector-container">
      <div className="page-bg"></div>
      
      <div className="detector-header" style={{ position: 'relative' }}>
        <button 
          onClick={() => navigate('/dashboard')}
          style={{ 
            position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)',
            padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
            fontSize: '14px', fontWeight: 600, transition: 'all 0.2s'
          }}
          className="btn-cancel-ai"
        >
          <X size={16} /> Thoát AI
        </button>
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
                  <h4 style={{ color: '#60a5fa', marginBottom: '12px' }}>Tạo yêu cầu thành công!</h4>
                  <button 
                    onClick={() => navigate('/dashboard', { state: { activeTab: 'requests' } })}
                    className="btn-primary" 
                    style={{ width: '100%', justifyContent: 'center', background: '#3b82f6' }}
                  >
                    <List size={18} /> Xem danh sách yêu cầu
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
