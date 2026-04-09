import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Eye, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/apiClient';
import PDFViewerModal from '@/components/PDFViewerModal';

const ClientPDFViewer = () => {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewerState, setViewerState] = useState({ isOpen: false, url: '', filename: '' });

  const fetchPDFs = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/pdfs');
      setPdfs(response.pdfs || []);
    } catch (error) {
      toast({
        title: 'Error loading documents',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  const handleView = (pdf) => {
    setViewerState({
      isOpen: true,
      url: pdf.file_url,
      filename: pdf.filename
    });
  };

  const handleDownload = (pdf) => {
    window.open(pdf.file_url, '_blank', 'noopener,noreferrer');
    toast({
      title: 'Download started',
      description: pdf.filename
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((index) => (
            <div key={index} className="bg-card border rounded-xl p-6 h-48 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">
          Available Documents
        </h1>
        <p className="text-muted-foreground">
          View and download project-related PDF documents
        </p>
      </div>

      {pdfs.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No documents available</h3>
          <p className="text-muted-foreground">
            Check back later for project documents and reports
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfs.map((pdf) => (
            <motion.div
              key={pdf.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-6">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-8 h-8 text-red-600 dark:text-red-400" />
                </div>

                <h3 className="font-semibold text-foreground mb-2 truncate" title={pdf.filename}>
                  {pdf.filename}
                </h3>

                <div className="space-y-1 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(pdf.upload_date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{formatFileSize(pdf.file_size)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5" />
                    <span>{pdf.uploader_name}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleView(pdf)}
                    className="flex-1"
                    size="sm"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleDownload(pdf)}
                    variant="outline"
                    size="sm"
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <PDFViewerModal
        pdfUrl={viewerState.url}
        filename={viewerState.filename}
        isOpen={viewerState.isOpen}
        onClose={() => setViewerState({ isOpen: false, url: '', filename: '' })}
      />
    </motion.div>
  );
};

export default ClientPDFViewer;
