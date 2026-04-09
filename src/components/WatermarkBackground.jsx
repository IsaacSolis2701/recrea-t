import React from 'react';

const WatermarkBackground = () => {
  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-background">
      <div className="absolute inset-0 watermark-pattern"></div>
    </div>
  );
};

export default WatermarkBackground;