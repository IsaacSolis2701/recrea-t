import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Calendar, Euro, AlertCircle, Download, CheckCircle2, Clock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import AddInvoiceModal from '@/components/AddInvoiceModal';

const getInvoiceStatus = (invoice) => {
  if (invoice.paid) return 'paid';
  if (!invoice.dueDate) return 'pending';
  return new Date(invoice.dueDate) < new Date() ? 'overdue' : 'pending';
};

const STATUS_CONFIG = {
  paid: {
    label: 'Pagada',
    icon: CheckCircle2,
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    border: 'border-emerald-200',
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-50',
  },
  overdue: {
    label: 'Vencida',
    icon: XCircle,
    badge: 'bg-red-100 text-red-700 border-red-200',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50',
  },
  pending: {
    label: 'Pendiente',
    icon: Clock,
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    border: 'border-amber-200',
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50',
  },
};

const InvoiceManager = ({ invoices, onUpdate, userRole }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleAddInvoice = (invoiceData) => {
    const newInvoice = {
      id: Date.now().toString(),
      ...invoiceData,
      createdAt: new Date().toISOString(),
    };
    onUpdate([...invoices, newInvoice]);
    setIsAddModalOpen(false);
    toast({ title: 'Factura añadida', description: 'La factura ha sido registrada exitosamente.' });
  };

  const getDaysLabel = (invoice) => {
    if (!invoice.dueDate || invoice.paid) return null;
    const days = Math.ceil((new Date(invoice.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
    if (days < 0) return `Vencida hace ${Math.abs(days)} días`;
    if (days === 0) return 'Vence hoy';
    return `Vence en ${days} días`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Facturas y Pagos</h2>
        {userRole === 'admin' && (
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#b3c1b3] text-white hover:bg-opacity-90">
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
              const status = getInvoiceStatus(invoice);
              const cfg = STATUS_CONFIG[status];
              const StatusIcon = cfg.icon;
              const daysLabel = getDaysLabel(invoice);

              return (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.07 }}
                  className={`bg-card rounded-xl border ${cfg.border} overflow-hidden`}
                >
                  {/* Header band */}
                  <div className={`flex items-center justify-between px-5 py-3 ${cfg.iconBg} border-b ${cfg.border}`}>
                    <div className="flex items-center gap-2">
                      <StatusIcon className={`w-4 h-4 ${cfg.iconColor}`} />
                      <span className={`text-xs font-semibold uppercase tracking-wide ${cfg.iconColor}`}>
                        {cfg.label}
                      </span>
                    </div>
                    <span className={`text-xs font-medium border rounded-full px-2.5 py-0.5 ${cfg.badge}`}>
                      {invoice.number}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-5 space-y-4">
                    <div>
                      <p className="text-lg font-semibold text-foreground leading-tight">{invoice.description}</p>
                    </div>

                    {/* Amount */}
                    <div className="flex items-center gap-2">
                      <Euro className="w-4 h-4 text-muted-foreground" />
                      <span className="text-2xl font-bold text-foreground">
                        {invoice.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                      </span>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                      {invoice.issueDate && (
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Emisión</p>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {new Date(invoice.issueDate).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        </div>
                      )}
                      {invoice.dueDate && (
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide">Vencimiento</p>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">
                              {new Date(invoice.dueDate).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Days warning */}
                    {daysLabel && (
                      <div className={`flex items-center gap-2 p-2.5 rounded-lg text-sm font-medium ${
                        status === 'overdue' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {daysLabel}
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
