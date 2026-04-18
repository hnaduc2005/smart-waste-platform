import React from 'react';
import WasteDetector from '../components/waste-classifier/WasteDetector';

export default function WasteClassifierPage() {
  return (
    <div className="pt-20"> {/* Add padding for standard top navbar if it exists */}
      <WasteDetector />
    </div>
  );
}
