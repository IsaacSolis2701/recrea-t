import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Plus, Calendar, FileCheck, Download, Eye, AlertCircle, CheckCircle, CreditCard, Clock, Unlock, Lock, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import AddCertificationModal from '@/components/AddCertificationModal';
import PDFViewerModal from '@/components/PDFViewerModal';
import { apiRequest } from '@/lib/apiClient';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const downloadFile = async (fileUrl, fileName) => {
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'certificacion.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch {
    window.open(fileUrl, '_blank');
  }
};

const CertificationManager = ({ projectId, certifications, onUpdate, userRole, onPayCertification }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleDeleteCertification = () => {
    const updated = certifications.filter((c) => c.id !== deleteTarget.id);
    onUpdate(updated);
    setDeleteTarget(null);
    toast({ title: 'Certificación eliminada', description: 'La certificación ha sido eliminada correctamente.' });
  };

  const handleAddCertification = (certData) => {
    const newCert = {
      id: Date.now().toString(),
      ...certData,
      isPaid: false,
      paymentEnabled: false,
      createdAt: new Date().toISOString(),
    };

    onUpdate([...certifications, newCert]);
    setIsAddModalOpen(false);

    toast({
      title: 'Certificacion anadida',
      description: 'La certificacion ha sido registrada exitosamente.',
    });
  };

  const handleTogglePaidStatus = async (certId) => {
    const targetCert = certifications.find((cert) => cert.id === certId);
    if (!targetCert || !projectId) {
      return;
    }

    try {
      const response = await apiRequest(`/projects/${projectId}/certifications/${certId}/payment-status`, {
        method: 'POST',
        body: {
          isPaid: !targetCert.isPaid,
        },
      });

      onUpdate(response.project?.certifications || certifications);
      toast({
        title: 'Estado de pago actualizado',
        description: `La certificacion ahora esta marcada como ${!targetCert.isPaid ? 'Pagada' : 'Pendiente'}.`,
      });
    } catch (error) {
      toast({
        title: 'No se pudo actualizar el estado',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleTogglePaymentEnabled = (certId) => {
    const targetCert = certifications.find((c) => c.id === certId);
    if (!targetCert) return;

    const updatedCerts = certifications.map((cert) =>
      cert.id === certId ? { ...cert, paymentEnabled: !cert.paymentEnabled } : cert
    );
    onUpdate(updatedCerts);
    toast({
      title: targetCert.paymentEnabled ? 'Pago deshabilitado' : 'Pago habilitado',
      description: targetCert.paymentEnabled
        ? 'El cliente ya no puede realizar el pago.'
        : 'El cliente ya puede realizar el pago desde su portal.',
    });
  };

  const handlePreview = (cert) => {
    if (cert.fileUrl) {
      setPreviewDoc(cert);
    } else {
      toast({
        title: 'Sin archivo adjunto',
        description: 'Esta certificacion no tiene un PDF para previsualizar.',
        variant: 'destructive',
      });
    }
  };

  const handleDownload = (cert) => {
    if (!cert.fileUrl) {
      toast({
        title: 'Sin archivo adjunto',
        description: 'Esta certificacion no tiene un archivo para descargar.',
        variant: 'destructive',
      });
      return;
    }

    downloadFile(cert.fileUrl, cert.file || `${cert.name || 'certificacion'}.pdf`);
  };

  const getDaysUntilExpiry = (expiryDate) => {
    if (!expiryDate) return null;
    return Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Certificaciones</h2>
        {userRole === 'admin' && (
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#b3c1b3] text-white hover:bg-opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Nueva certificacion
          </Button>
        )}
      </div>

      {certifications.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No hay certificaciones</h3>
          <p className="text-muted-foreground">
            {userRole === 'admin' ? 'Anade la primera certificacion del proyecto.' : 'Las certificaciones apareceran aqui.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {certifications.map((cert, index) => {
              const daysUntilExpiry = getDaysUntilExpiry(cert.expiryDate);
              const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
              const isUrgent = daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0;
              const isExpired = daysUntilExpiry !== null && daysUntilExpiry < 0;

              return (
                <motion.div
                  key={cert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-card rounded-xl p-6 border flex flex-col justify-between transition-all ${
                    isUrgent && !cert.isPaid ? 'border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Award className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-foreground">{cert.name}</h3>
                          <p className="text-sm text-muted-foreground">{cert.type || 'Certificacion'}</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePreview(cert)}
                          disabled={!cert.fileUrl}
                          className="text-primary hover:text-opacity-80 h-8 w-8 p-0"
                          title="Ver PDF"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(cert)}
                          disabled={!cert.fileUrl}
                          className="h-8 w-8 p-0"
                          title="Descargar PDF"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        {userRole === 'admin' && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(cert)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            title="Eliminar certificación"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <FileCheck className="w-4 h-4" />
                          <span className="text-sm">Numero</span>
                        </div>
                        <span className="text-foreground font-mono">{cert.number || cert.id.slice(0, 6)}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <CreditCard className="w-4 h-4" />
                          <span className="text-sm">Monto</span>
                        </div>
                        <span className="text-foreground font-semibold">
                          {(cert.amount || 0).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                        </span>
                      </div>

                      {cert.expiryDate && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            <span className="text-sm">Vencimiento</span>
                          </div>
                          <span className="text-foreground">{new Date(cert.expiryDate).toLocaleDateString('es-ES')}</span>
                        </div>
                      )}

                      {isExpired && !cert.isPaid && (
                        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-red-500 font-medium">Expirada hace {Math.abs(daysUntilExpiry)} dias</span>
                        </div>
                      )}

                      {isExpiringSoon && !cert.isPaid && !isExpired && (
                        <div className={`flex items-center gap-2 p-3 rounded-lg ${isUrgent ? 'bg-red-500/10' : 'bg-yellow-500/10'}`}>
                          <AlertCircle className={`w-4 h-4 ${isUrgent ? 'text-red-500' : 'text-yellow-500'}`} />
                          <span className={`text-sm font-medium ${isUrgent ? 'text-red-500' : 'text-yellow-500'}`}>
                            Expira en {daysUntilExpiry} dias
                          </span>
                        </div>
                      )}

                      <div className={`flex items-center justify-between p-3 rounded-lg border ${cert.isPaid ? 'bg-green-500/10 border-green-200' : 'bg-muted/30 border-transparent'}`}>
                        <div className="flex items-center gap-2">
                          {cert.isPaid ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Clock className="w-4 h-4 text-muted-foreground" />}
                          <span className={`text-sm font-semibold ${cert.isPaid ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {cert.isPaid ? 'Pagado' : 'Pendiente de pago'}
                          </span>
                        </div>
                        {userRole === 'client' && !cert.isPaid && cert.paymentEnabled && (
                          <Button size="sm" onClick={() => onPayCertification && onPayCertification(cert)} className="h-8 text-xs">
                            Pagar
                          </Button>
                        )}
                        {userRole === 'client' && !cert.isPaid && !cert.paymentEnabled && (
                          <span className="text-xs text-muted-foreground italic">Pago no habilitado</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {userRole === 'admin' && (
                    <div className="mt-4 space-y-2">
                      <Button
                        onClick={() => handleTogglePaymentEnabled(cert.id)}
                        variant={cert.paymentEnabled ? 'default' : 'outline'}
                        size="sm"
                        className="w-full"
                      >
                        {cert.paymentEnabled ? (
                          <><Lock className="w-3.5 h-3.5 mr-2" />Deshabilitar pago cliente</>
                        ) : (
                          <><Unlock className="w-3.5 h-3.5 mr-2" />Habilitar pago cliente</>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleTogglePaidStatus(cert.id)}
                        variant={cert.isPaid ? 'outline' : 'secondary'}
                        className="w-full"
                      >
                        {cert.isPaid ? 'Marcar como pendiente' : 'Marcar como pagado'}
                      </Button>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AddCertificationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddCertification}
      />

      <PDFViewerModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        pdfUrl={previewDoc?.fileUrl || ''}
        filename={previewDoc?.file || previewDoc?.name || 'Certificacion'}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar certificación?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente la certificación
              <span className="font-semibold text-foreground"> "{deleteTarget?.name}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCertification} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CertificationManager;
