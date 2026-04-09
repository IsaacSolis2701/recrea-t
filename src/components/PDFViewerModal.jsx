import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2, RotateCcw, Download } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Button } from '@/components/ui/button';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

const PDFViewerModal = ({ pdfUrl, filename, isOpen, onClose }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('1');
  const containerRef = useRef(null);

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setPageNumber(1);
    setPageInputValue('1');
  };

  const goToPrevPage = () => {
    const next = Math.max(1, pageNumber - 1);
    setPageNumber(next);
    setPageInputValue(String(next));
  };

  const goToNextPage = () => {
    const next = Math.min(numPages || 1, pageNumber + 1);
    setPageNumber(next);
    setPageInputValue(String(next));
  };

  const handlePageInputChange = (e) => {
    setPageInputValue(e.target.value);
  };

  const handlePageInputBlur = () => {
    const parsed = parseInt(pageInputValue, 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= (numPages || 1)) {
      setPageNumber(parsed);
      setPageInputValue(String(parsed));
    } else {
      setPageInputValue(String(pageNumber));
    }
  };

  const handlePageInputKeyDown = (e) => {
    if (e.key === 'Enter') e.target.blur();
  };

  const handleZoomIn = () => setScale(prev => Math.min(3.0, parseFloat((prev + 0.25).toFixed(2))));
  const handleZoomOut = () => setScale(prev => Math.max(0.5, parseFloat((prev - 0.25).toFixed(2))));
  const handleResetZoom = () => setScale(1.2);
  const toggleFullscreen = () => setIsFullscreen(prev => !prev);

  const handleDownload = () => {
    window.open(pdfUrl, '_blank', 'noopener,noreferrer');
  };

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.96, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className={`bg-white shadow-2xl flex flex-col ${isFullscreen ? 'w-full h-full' : 'w-full max-w-5xl h-[80vh] rounded-2xl'
            }`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM6 20V4h5v7h7v9H6z" />
                </svg>
              </div>
              <span className="font-semibold text-gray-800 text-sm truncate">
                {filename || 'Documento PDF'}
              </span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon" onClick={handleDownload} className="text-gray-500 hover:text-gray-800 h-8 w-8" title="Descargar">
                <Download className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={toggleFullscreen} className="hidden sm:flex text-gray-500 hover:text-gray-800 h-8 w-8" title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}>
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-500 hover:text-gray-800 h-8 w-8">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div
            ref={containerRef}
            className="flex-1 min-h-0 overflow-auto"
            style={{ backgroundColor: '#e5e7eb' }}
          >
            <div className="min-h-full flex flex-col items-center py-6 px-4 gap-4">
              <Document
                file={pdfUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <div className="w-12 h-12 border-3 border-gray-300 border-t-red-500 rounded-full animate-spin" style={{ borderWidth: '3px' }} />
                    <p className="text-gray-500 text-sm">Cargando PDF...</p>
                  </div>
                }
                error={
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                      <X className="w-8 h-8 text-red-500" />
                    </div>
                    <p className="text-gray-800 font-semibold">Error al cargar el PDF</p>
                    <p className="text-gray-500 text-sm text-center max-w-xs">
                      No se pudo cargar el documento. Puedes intentar descargarlo directamente.
                    </p>
                    <Button size="sm" onClick={handleDownload} className="mt-2">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar PDF
                    </Button>
                  </div>
                }
              >
                <div
                  className="rounded-lg overflow-hidden shadow-xl"
                  style={{ background: 'white' }}
                >
                  <Page
                    pageNumber={pageNumber}
                    scale={scale}
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                    canvasBackground="white"
                  />
                </div>
              </Document>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-gray-50 border-t border-gray-200 px-4 py-3 shrink-0">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Page Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={pageNumber <= 1}
                  className="h-8 px-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <input
                    type="text"
                    value={pageInputValue}
                    onChange={handlePageInputChange}
                    onBlur={handlePageInputBlur}
                    onKeyDown={handlePageInputKeyDown}
                    className="w-10 h-8 text-center border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                  <span className="text-gray-400">/</span>
                  <span className="font-medium text-gray-700">{numPages || '?'}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={pageNumber >= (numPages || 1)}
                  className="h-8 px-2"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={scale <= 0.5} className="h-8 px-2">
                  <ZoomOut className="w-4 h-4" />
                </Button>
                <button
                  onClick={handleResetZoom}
                  className="text-sm font-medium text-gray-600 hover:text-gray-900 min-w-[52px] text-center tabular-nums cursor-pointer"
                  title="Restablecer zoom"
                >
                  {Math.round(scale * 100)}%
                </button>
                <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={scale >= 3.0} className="h-8 px-2">
                  <ZoomIn className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleResetZoom} className="h-8 px-2 hidden sm:flex text-gray-500" title="Restablecer zoom">
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PDFViewerModal;
