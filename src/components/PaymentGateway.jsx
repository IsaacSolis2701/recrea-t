import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, ArrowLeft, Copy, CheckCheck, Banknote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const IBAN = 'ES19 0128 0700 7701 0011 7304';
const BANK = 'Bankinter';

const PaymentGateway = ({ certification, onBack }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(IBAN.replace(/\s/g, ''));
      setCopied(true);
      toast({ title: 'IBAN copiado', description: 'El IBAN se ha copiado al portapapeles.' });
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast({ title: 'No se pudo copiar', description: 'Copia el IBAN manualmente.', variant: 'destructive' });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="client-shell max-w-2xl mx-auto mt-4 sm:mt-8 rounded-[32px] p-5 sm:p-8 lg:p-10 shadow-lg"
    >
      <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-white rounded-[28px] border border-white/80 flex items-center justify-center mx-auto mb-5 text-primary shadow-sm">
          <Banknote className="w-8 h-8" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold">Pago por transferencia</h2>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">
          Realiza una transferencia bancaria al siguiente número de cuenta.
        </p>
      </div>

      {/* Resumen certificación */}
      <div className="space-y-4 mb-6 rounded-[26px] border border-white/80 bg-white/70 p-5 sm:p-6">
        <div className="flex justify-between items-center pb-4 border-b">
          <span className="text-muted-foreground">Certificación</span>
          <span className="font-semibold">{certification?.name || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center pb-4 border-b">
          <span className="text-muted-foreground">Número</span>
          <span className="font-mono">{certification?.number || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total a pagar</span>
          <span>
            {(certification?.amount || 0).toLocaleString('es-ES', {
              style: 'currency',
              currency: 'EUR',
            })}
          </span>
        </div>
      </div>

      {/* Datos bancarios */}
      <div className="rounded-[26px] border-2 border-primary/15 bg-white/80 p-5 sm:p-6 space-y-4 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Building2 className="w-4 h-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Datos bancarios</span>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Banco</p>
          <p className="font-semibold text-foreground">{BANK}</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">IBAN</p>
          <div className="flex items-center justify-between gap-3 rounded-xl bg-secondary/60 border px-4 py-3">
            <span className="font-mono text-base font-semibold tracking-wider text-foreground select-all">
              {IBAN}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
            >
              {copied ? (
                <><CheckCheck className="w-4 h-4" /> Copiado</>
              ) : (
                <><Copy className="w-4 h-4" /> Copiar</>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Concepto</p>
          <p className="font-medium text-foreground">
            {certification?.name || 'Certificación'}{certification?.number ? ` — ${certification.number}` : ''}
          </p>
        </div>
      </div>

      <div className="rounded-[20px] bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
        <p className="font-semibold mb-1">Instrucciones</p>
        <p>Realiza la transferencia con el importe exacto e indica el concepto. Una vez realizado el pago, notifica al equipo para que confirmen la recepción.</p>
      </div>
    </motion.div>
  );
};

export default PaymentGateway;
