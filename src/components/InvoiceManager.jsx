import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Calendar, DollarSign, AlertCircle, Download, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import AddInvoiceModal from '@/components/AddInvoiceModal';

const InvoiceManager = ({ invoices, onUpdate, userRole }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddInvoice = (invoiceData) => {
    const newInvoice = {
      id: Date.now().toString(),
      ...invoiceData,
      createdAt: new Date().toISOString()
    };

    onUpdate([...invoices, newInvoice]);
    setIsAddModalOpen(false);
    
    toast({
      title: "Factura añadida",
      description: "La factura ha sido registrada exitosamente",
    });
  };

  const handleDownload = (invoice) => {
    toast({
      title: "🚧 Función en desarrollo",
      description: "La descarga de facturas estará disponible próximamente",
    });
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && !invoices.find(inv => inv.dueDate === dueDate)?.paid;
  };

  const getDaysUntilDue = (dueDate) => {
    const days = Math.ceil((new Date(dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Facturas y Pagos</h2>
        {userRole === 'admin' && (
          <Button
            onClick={() => setIsAddModalOpen(true)}
             className="bg-[#b3c1b3] text-white hover:bg-opacity-90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Factura
          </Button>
        )}
      </div>

      {invoices.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No hay facturas registradas</h3>
          <p className="text-muted-foreground">
            {userRole === 'admin' 
              ? 'Comienza añadiendo la primera factura del proyecto'
              : 'Las facturas aparecerán aquí cuando sean añadidas'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {invoices.map((invoice, index) => {
              const daysUntilDue = getDaysUntilDue(invoice.dueDate);
              const overdue = isOverdue(invoice.dueDate);
              
              return (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-card rounded-xl p-6 border ${
                    invoice.paid 
                      ? 'border-green-500/50' 
                      : overdue 
                      ? 'border-red-500/50' 
                      : 'border-yellow-500/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        invoice.paid 
                          ? 'bg-green-500/20' 
                          : overdue 
                          ? 'bg-red-500/20' 
                          : 'bg-yellow-500/20'
                      }`}>
                        <FileText className={`w-5 h-5 ${
                          invoice.paid 
                            ? 'text-green-500' 
                            : overdue 
                            ? 'text-red-500' 
                            : 'text-yellow-500'
                        }`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">{invoice.number}</h3>
                        <p className="text-sm text-muted-foreground">{invoice.description}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDownload(invoice)}
                      className="text-primary hover:text-opacity-80"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">Monto</span>
                      </div>
                      <span className="text-xl font-bold text-foreground">${invoice.amount.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm">Vencimiento</span>
                      </div>
                      <span className="text-foreground">
                        {new Date(invoice.dueDate).toLocaleDateString('es-ES')}
                      </span>
                    </div>

                    {!invoice.paid && (
                      <div className={`flex items-center gap-2 p-3 rounded-lg ${
                        overdue ? 'bg-red-500/10' : 'bg-yellow-500/10'
                      }`}>
                        <AlertCircle className={`w-4 h-4 ${
                          overdue ? 'text-red-400' : 'text-yellow-400'
                        }`} />
                        <span className={`text-sm ${
                          overdue ? 'text-red-400' : 'text-yellow-400'
                        }`}>
                          {overdue 
                            ? `Vencida hace ${Math.abs(daysUntilDue)} días` 
                            : `Vence en ${daysUntilDue} días`}
                        </span>
                      </div>
                    )}

                    {invoice.paid && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-green-400">Pagada</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AddInvoiceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddInvoice}
      />
    </div>
  );
};

export default InvoiceManager;