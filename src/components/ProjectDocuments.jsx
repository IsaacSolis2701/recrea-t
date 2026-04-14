import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Plus, Eye, Edit, FileUp, Download, Trash2, FileCheck2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
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
import AddInvoiceModal from '@/components/AddInvoiceModal';
import AddBudgetModal from '@/components/AddBudgetModal';
import AddCertificationModal from '@/components/AddCertificationModal';
import AddProjectDocModal from '@/components/AddProjectDocModal';
import BudgetManager from '@/components/BudgetManager';
import CertificationManager from '@/components/CertificationManager';
import CertificationExpirationWidget from '@/components/CertificationExpirationWidget';
import PaymentHistory from '@/components/PaymentHistory';
import PDFViewerModal from '@/components/PDFViewerModal';

const DOC_TYPE_LABELS = {
  contrato: 'Contrato firmado',
  licencia: 'Licencia de urbanismo',
  permiso: 'Permiso de obras',
  otro: 'Documento',
};

const ProjectDocuments = ({ projectId, invoices, certifications, budgets, projectDocs = [], onUpdate, userRole, onNavigateToPayment }) => {
  const [modal, setModal] = useState({ type: null, isOpen: false, data: null });
  const [previewDoc, setPreviewDoc] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isAddDocOpen, setIsAddDocOpen] = useState(false);
  const [deleteDocTarget, setDeleteDocTarget] = useState(null);

  const handleAddProjectDoc = (docData) => {
    const newDoc = { id: Date.now().toString(), ...docData, createdAt: new Date().toISOString() };
    onUpdate('project_docs', [...projectDocs, newDoc]);
    toast({ title: 'Documento añadido', description: 'El documento ha sido guardado correctamente.' });
  };

  const handleDeleteProjectDoc = () => {
    onUpdate('project_docs', projectDocs.filter((d) => d.id !== deleteDocTarget.id));
    setDeleteDocTarget(null);
    toast({ title: 'Documento eliminado' });
  };

  const handleDeleteItem = () => {
    const { type, item } = deleteTarget;
    const currentItems = (type === 'invoices' ? invoices : type === 'budgets' ? budgets : certifications) || [];
    onUpdate(type, currentItems.filter((i) => i.id !== item.id));
    setDeleteTarget(null);
    toast({ title: 'Documento eliminado', description: 'El documento ha sido eliminado correctamente.' });
  };

  const handleOpenModal = (type, data = null) => {
    setModal({ type, isOpen: true, data });
  };

  const handleCloseModal = () => {
    setModal({ type: null, isOpen: false, data: null });
  };

  const handleSave = (type, data) => {
    let updatedItems;
    if (modal.data) {
      const currentItems = (type === 'invoices' ? invoices : type === 'budgets' ? budgets : certifications) || [];
      updatedItems = currentItems.map((item) => item.id === modal.data.id ? { ...item, ...data } : item);
      toast({ title: 'Documento actualizado', description: 'Los cambios han sido guardados.' });
    } else {
      const newItem = { id: Date.now().toString(), ...data, date: new Date().toISOString() };
      if (type === 'invoices') newItem.paid = Boolean(data.paid);
      if (type === 'budgets') newItem.status = 'pending';
      const currentItems = (type === 'invoices' ? invoices : type === 'budgets' ? budgets : certifications) || [];
      updatedItems = [...currentItems, newItem];
      toast({ title: 'Documento añadido', description: 'El documento ha sido registrado.' });
    }

    onUpdate(type, updatedItems);
    handleCloseModal();
  };

  const handlePreview = (doc) => {
    if (doc.fileUrl) {
      setPreviewDoc(doc);
    } else {
      toast({
        title: 'Sin archivo adjunto',
        description: 'Este documento no tiene un PDF para previsualizar.',
        variant: 'destructive'
      });
    }
  };

  const handleDownload = async (doc) => {
    if (!doc.fileUrl) {
      toast({ title: 'Sin archivo adjunto', description: 'Este documento no tiene un archivo para descargar.', variant: 'destructive' });
      return;
    }
    try {
      const resp = await fetch(doc.fileUrl);
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file || doc.number || doc.title || 'documento.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      window.open(doc.fileUrl, '_blank');
    }
  };

  const mainBudget = budgets?.find((budget) => budget.status === 'approved');
  const otherBudgets = budgets?.filter((budget) => budget.status !== 'approved');
  const clientMetrics = [
    {
      label: 'Certificaciones pendientes',
      value: certifications?.filter((certification) => !certification.isPaid).length || 0,
    },
    {
      label: 'Facturas pendientes',
      value: invoices?.filter((invoice) => !invoice.paid).length || 0,
    },
    {
      label: 'Presupuestos activos',
      value: budgets?.length || 0,
    },
  ];

  const renderDocList = (docs, title, type) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-foreground">{title}</h3>
        {userRole === 'admin' && (
          <Button size="sm" variant="outline" onClick={() => handleOpenModal(type)}>
            <Plus className="w-4 h-4 mr-2" /> Añadir
          </Button>
        )}
      </div>
      {docs && docs.length > 0 ? (
        docs.map((doc) => (
          <div key={doc.id} className="bg-white/75 p-4 rounded-2xl border border-white/80 shadow-sm flex justify-between items-center flex-wrap gap-3">
            <div>
              <p className="font-semibold">{doc.name || doc.number || doc.title}</p>
              <p className="text-sm text-muted-foreground">
                {type === 'certifications' && doc.number ? `Nº: ${doc.number} - ` : ''}
                {doc.amount ? `${doc.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })} - ` : ''}
                {doc.dueDate || doc.expiryDate ? `Vence: ${new Date(doc.dueDate || doc.expiryDate).toLocaleDateString('es-ES')}` : `Subido: ${new Date(doc.date).toLocaleDateString('es-ES')}`}
              </p>
              {doc.file && <span className="text-xs text-blue-500 flex items-center gap-1"><FileUp className="w-3 h-3"/>{doc.file}</span>}
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => handlePreview(doc)} disabled={!doc.fileUrl}>
                <Eye className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Ver</span>
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)} disabled={!doc.fileUrl}>
                <Download className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Descargar</span>
              </Button>
              {userRole === 'admin' && (
                <Button size="sm" variant="ghost" onClick={() => handleOpenModal(type, doc)}>
                  <Edit className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Editar</span>
                </Button>
              )}
              {userRole === 'admin' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteTarget({ type, item: doc })}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Eliminar</span>
                </Button>
              )}
            </div>
          </div>
        ))
      ) : (
        <p className="text-sm text-muted-foreground p-3 bg-card rounded-lg border text-center">No hay {title.toLowerCase()}.</p>
      )}
    </div>
  );

  return (
    <div className="space-y-10">
      {userRole === 'client' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {clientMetrics.map((metric) => (
            <div key={metric.label} className="rounded-[22px] border border-white/80 bg-white/70 p-4 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{metric.label}</p>
              <p className="mt-3 text-3xl font-bold">{metric.value}</p>
            </div>
          ))}
        </div>
      )}

      {userRole === 'client' && certifications?.length > 0 && (
        <CertificationExpirationWidget
          certifications={certifications}
          onPay={(certification) => onNavigateToPayment && onNavigateToPayment(certification)}
        />
      )}

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Documentos y Presupuestos</h2>

        {mainBudget && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="client-shell p-6 rounded-[28px] border-2 border-primary/10 shadow-sm mb-8"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-primary">Presupuesto Aceptado</h3>
                <p className="text-muted-foreground">{mainBudget.title}</p>
                {mainBudget.acceptanceDate && (
                  <p className="text-sm text-muted-foreground mt-1">Aceptado el: {new Date(mainBudget.acceptanceDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                )}
              </div>
              <div className="text-left sm:text-right">
                <p className="text-3xl font-bold text-foreground">{mainBudget.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</p>
                <div className="flex items-center justify-start sm:justify-end gap-2 mt-2">
                  <Button size="sm" variant="ghost" onClick={() => handlePreview(mainBudget)} className="text-primary hover:text-primary/80" disabled={!mainBudget.fileUrl}>
                    <Eye className="w-4 h-4 mr-2" />Ver
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDownload(mainBudget)} disabled={!mainBudget.fileUrl}>
                    <Download className="w-4 h-4 mr-2" />Descargar
                  </Button>
                  {userRole === 'admin' && (
                    <Button size="sm" variant="ghost" onClick={() => handleOpenModal('budgets', mainBudget)}>
                      <Edit className="w-4 h-4 mr-2" />Editar
                    </Button>
                  )}
                  {userRole === 'admin' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget({ type: 'budgets', item: mainBudget })}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />Eliminar
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        <BudgetManager
          budgets={otherBudgets || []}
          onUpdate={(updatedBudgets) => {
            const allBudgets = [
              ...(mainBudget ? [mainBudget] : []),
              ...updatedBudgets
            ];
            onUpdate('budgets', allBudgets);
          }}
          userRole={userRole}
          onAddBudget={() => handleOpenModal('budgets')}
          onEditBudget={(data) => handleOpenModal('budgets', data)}
        />
      </div>

      <div className="pt-6 border-t">
        <CertificationManager
          projectId={projectId}
          certifications={certifications || []}
          onUpdate={(updated) => onUpdate('certifications', updated)}
          userRole={userRole}
          onPayCertification={(certification) => onNavigateToPayment && onNavigateToPayment(certification)}
        />
      </div>

      <div className="pt-6 border-t">
        {renderDocList(invoices, 'Facturas', 'invoices')}
      </div>

      {/* Sección: Documentos oficiales (contrato, licencias) */}
      <div className="pt-6 border-t">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Documentos</h3>
          </div>
          {userRole === 'admin' && (
            <Button size="sm" variant="outline" onClick={() => setIsAddDocOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Añadir
            </Button>
          )}
        </div>

        {projectDocs.length === 0 ? (
          <p className="text-sm text-muted-foreground p-3 bg-card rounded-lg border text-center">
            {userRole === 'admin'
              ? 'Añade contratos firmados, licencias de urbanismo u otros documentos.'
              : 'Los documentos del proyecto aparecerán aquí.'}
          </p>
        ) : (
          <div className="space-y-2">
            {projectDocs.map((doc) => (
              <div key={doc.id} className="bg-white/75 p-4 rounded-2xl border border-white/80 shadow-sm flex justify-between items-center flex-wrap gap-3">
                <div>
                  <p className="font-semibold">{doc.name || DOC_TYPE_LABELS[doc.type] || 'Documento'}</p>
                  <p className="text-xs text-muted-foreground">
                    {DOC_TYPE_LABELS[doc.type] || doc.type}
                    {doc.createdAt ? ` · ${new Date(doc.createdAt).toLocaleDateString('es-ES')}` : ''}
                  </p>
                  {doc.file && (
                    <span className="text-xs text-blue-500 flex items-center gap-1 mt-0.5">
                      <FileUp className="w-3 h-3" />{doc.file}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => setPreviewDoc(doc)} disabled={!doc.fileUrl}>
                    <Eye className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Ver</span>
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDownload(doc)} disabled={!doc.fileUrl}>
                    <Download className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Descargar</span>
                  </Button>
                  {userRole === 'admin' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteDocTarget(doc)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4 mr-1 sm:mr-2" /> <span className="hidden sm:inline">Eliminar</span>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {userRole === 'client' && (
        <div className="pt-10 border-t">
          <PaymentHistory />
        </div>
      )}

      <AddInvoiceModal isOpen={modal.isOpen && modal.type === 'invoices'} onClose={handleCloseModal} onSubmit={(data) => handleSave('invoices', data)} invoice={modal.data} />
      <AddCertificationModal isOpen={modal.isOpen && modal.type === 'certifications'} onClose={handleCloseModal} onSubmit={(data) => handleSave('certifications', data)} certification={modal.data} />
      <AddBudgetModal isOpen={modal.isOpen && modal.type === 'budgets'} onClose={handleCloseModal} onSubmit={(data) => handleSave('budgets', data)} budget={modal.data} />
      <PDFViewerModal
        isOpen={!!previewDoc}
        onClose={() => setPreviewDoc(null)}
        pdfUrl={previewDoc?.fileUrl || ''}
        filename={previewDoc?.file || previewDoc?.title || previewDoc?.number || previewDoc?.name || 'Documento'}
      />

      <AddProjectDocModal isOpen={isAddDocOpen} onClose={() => setIsAddDocOpen(false)} onSubmit={handleAddProjectDoc} />

      <AlertDialog open={!!deleteDocTarget} onOpenChange={(open) => !open && setDeleteDocTarget(null)}>
        <AlertDialogContent className="bg-card border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará permanentemente <span className="font-semibold text-foreground">"{deleteDocTarget?.name}"</span>. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProjectDoc} className="bg-red-600 hover:bg-red-700 text-white">Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-card border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará permanentemente
              <span className="font-semibold text-foreground"> "{deleteTarget?.item?.name || deleteTarget?.item?.number || deleteTarget?.item?.title}"</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteItem} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProjectDocuments;
