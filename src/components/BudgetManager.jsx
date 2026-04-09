import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, Plus, Eye, Edit, FileUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import PDFViewerModal from '@/components/PDFViewerModal';

const downloadFile = async (fileUrl, fileName) => {
  try {
    const resp = await fetch(fileUrl);
    const blob = await resp.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName || 'presupuesto.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch {
    window.open(fileUrl, '_blank');
  }
};

const BudgetManager = ({ budgets, onUpdate, userRole, onAddBudget, onEditBudget }) => {
  const [previewDoc, setPreviewDoc] = useState(null);

  const handlePreview = (doc) => {
    if (doc.fileUrl) {
      setPreviewDoc(doc);
    } else {
      toast({
        title: 'Sin archivo adjunto',
        description: 'Este presupuesto no tiene un PDF para previsualizar.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (doc) => {
    if (!doc.fileUrl) {
      toast({
        title: 'Sin archivo adjunto',
        description: 'Este presupuesto no tiene un archivo para descargar.',
        variant: 'destructive',
      });
      return;
    }
    downloadFile(doc.fileUrl, doc.file || `${doc.title || 'presupuesto'}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Presupuesto</h2>
        {userRole === 'admin' && (
          <Button onClick={() => onAddBudget()} variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Añadir Presupuesto
          </Button>
        )}
      </div>

      {budgets.length === 0 ? (
        <div className="bg-card border rounded-xl p-8 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-1">No hay presupuestos</h3>
          <p className="text-muted-foreground text-sm">
            Aquí aparecerán los presupuestos del proyecto.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <AnimatePresence>
            {budgets.map((budget, index) => (
              <motion.div
                key={budget.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-xl p-4 border"
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground">{budget.title}</h3>
                    <p className="text-sm text-muted-foreground">{budget.description}</p>
                    {budget.file && (
                      <span className="text-xs text-blue-500 flex items-center gap-1 mt-1">
                        <FileUp className="w-3 h-3" />
                        {budget.file}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col items-start sm:items-end gap-2 w-full sm:w-auto">
                    <span className="text-xl font-bold text-foreground">
                      {(budget.amount ?? 0).toLocaleString('es-ES', {
                        style: 'currency',
                        currency: 'EUR',
                      })}
                    </span>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handlePreview(budget)}
                        disabled={!budget.fileUrl}
                        className="flex-1 sm:flex-initial text-primary hover:text-opacity-80 h-auto p-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDownload(budget)}
                        disabled={!budget.fileUrl}
                        className="flex-1 sm:flex-initial h-auto p-1"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Descargar
                      </Button>
                      {userRole === 'admin' && (
                        <Button size="sm" variant="ghost" onClick={() => onEditBudget(budget)} className="flex-1 sm:flex-initial h-auto p-1">
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <PDFViewerModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        pdfUrl={previewDoc?.fileUrl || ''}
        filename={previewDoc?.file || previewDoc?.title || 'Presupuesto'}
      />
    </div>
  );
};

export default BudgetManager;
