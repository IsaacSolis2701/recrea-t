import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Trash2, Eye, Download, FileText, Calendar, User, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { apiRequest, uploadFile } from '@/lib/apiClient';
import { useAuth } from '@/contexts/AuthContext';
import PDFViewerModal from '@/components/PDFViewerModal';

const AdminPDFManager = () => {
  const { user } = useAuth();
  const [pdfs, setPdfs] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [viewerState, setViewerState] = useState({ isOpen: false, url: '', filename: '' });

  const fetchPDFs = async () => {
    try {
      setLoading(true);
      const [pdfResponse, projectResponse] = await Promise.all([
        apiRequest('/pdfs'),
        apiRequest('/projects'),
      ]);
      setPdfs(pdfResponse.pdfs || []);
      setProjects(projectResponse.projects || []);
    } catch (error) {
      toast({
        title: 'Error loading PDFs',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPDFs();
  }, []);

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PDF file only',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      await uploadFile('/pdfs', file, selectedProjectId ? { project_id: selectedProjectId } : {});

      toast({
        title: 'PDF uploaded successfully',
        description: `${file.name} has been uploaded`,
      });

      fetchPDFs();
      event.target.value = '';
    } catch (error) {
      toast({
        title: 'Upload failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (pdf) => {
    if (!window.confirm(`Are you sure you want to delete "${pdf.filename}"?`)) {
      return;
    }

    try {
      await apiRequest(`/pdfs/${pdf.id}`, { method: 'DELETE' });
      toast({
        title: 'PDF deleted',
        description: `${pdf.filename} has been removed`,
      });

      fetchPDFs();
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleView = (pdf) => {
    setViewerState({
      isOpen: true,
      url: pdf.file_url,
      filename: pdf.filename,
    });
  };

  const handleDownload = (pdf) => {
    window.open(pdf.file_url, '_blank', 'noopener,noreferrer');
    toast({
      title: 'Download started',
      description: pdf.filename,
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">PDF Document Manager</h1>
        <p className="text-muted-foreground">Upload and assign private PDF documents to a specific project.</p>
      </div>

      <div className="bg-card border rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Upload New PDF</h2>

        <div className="space-y-2">
          <label htmlFor="pdf-project" className="text-sm font-medium text-foreground">
            Project assignment
          </label>
          <select
            id="pdf-project"
            value={selectedProjectId}
            onChange={(event) => setSelectedProjectId(event.target.value)}
            className="w-full rounded-xl border bg-background px-3 py-2 text-sm"
          >
            <option value="">Internal document only</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted-foreground">
            If you assign a project, only the linked client will see this PDF.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex-1">
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
              id="pdf-upload"
            />
            <Button asChild disabled={uploading} className="w-full sm:w-auto">
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <Upload className="w-4 h-4 mr-2" />
                {uploading ? 'Uploading...' : 'Select PDF File'}
              </label>
            </Button>
          </label>
        </div>

        <p className="text-sm text-muted-foreground">Accepted formats: PDF only</p>
        {user && <p className="text-xs text-muted-foreground">Subiendo como {user.name}</p>}
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold text-foreground">Uploaded Documents</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading PDFs...</p>
          </div>
        ) : pdfs.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No PDFs uploaded yet</h3>
            <p className="text-muted-foreground">Upload your first PDF document to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-semibold text-sm">Filename</th>
                  <th className="text-left p-4 font-semibold text-sm hidden md:table-cell">Project</th>
                  <th className="text-left p-4 font-semibold text-sm hidden sm:table-cell">Size</th>
                  <th className="text-left p-4 font-semibold text-sm hidden lg:table-cell">Uploaded</th>
                  <th className="text-left p-4 font-semibold text-sm hidden xl:table-cell">Uploader</th>
                  <th className="text-right p-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {pdfs.map((pdf) => (
                  <tr key={pdf.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <span className="font-medium text-foreground truncate">{pdf.filename}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden md:table-cell">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="w-4 h-4" />
                        {pdf.project_name || 'Internal only'}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground hidden sm:table-cell">{formatFileSize(pdf.file_size)}</td>
                    <td className="p-4 text-muted-foreground text-sm hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {formatDate(pdf.upload_date)}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground text-sm hidden xl:table-cell">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {pdf.uploader_name}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" onClick={() => handleView(pdf)} title="View PDF">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDownload(pdf)} title="Download PDF">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(pdf)}
                          className="text-destructive hover:text-destructive"
                          title="Delete PDF"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PDFViewerModal
        pdfUrl={viewerState.url}
        filename={viewerState.filename}
        isOpen={viewerState.isOpen}
        onClose={() => setViewerState({ isOpen: false, url: '', filename: '' })}
      />
    </motion.div>
  );
};

export default AdminPDFManager;
