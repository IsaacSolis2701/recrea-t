import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/apiClient';

const PaymentGateway = ({ certification, onBack }) => {
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/payments/checkout-session', {
        method: 'POST',
        body: {
          project_id: certification.project_id,
          certification_id: certification.id,
        },
      });

      if (response?.url) {
        window.location.href = response.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: 'Error de pago',
        description: 'No se pudo iniciar la sesion de pago. Intentalo de nuevo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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
          <CreditCard className="w-8 h-8" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-bold">Resumen de pago</h2>
        <p className="text-muted-foreground mt-2 text-base sm:text-lg">
          Confirma la certificacion y registra el pago en un solo paso.
        </p>
      </div>

      <div className="space-y-4 mb-8 rounded-[26px] border border-white/80 bg-white/70 p-5 sm:p-6">
        <div className="flex justify-between items-center pb-4 border-b">
          <span className="text-muted-foreground">Certificacion</span>
          <span className="font-semibold">{certification?.name || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center pb-4 border-b">
          <span className="text-muted-foreground">Numero</span>
          <span className="font-mono">{certification?.number || 'N/A'}</span>
        </div>
        <div className="flex justify-between items-center text-lg font-bold">
          <span>Total a pagar</span>
          <span>
            {(certification?.amount || 100).toLocaleString('es-ES', {
              style: 'currency',
              currency: 'EUR',
            })}
          </span>
        </div>
      </div>

      <Button className="w-full h-12 text-lg font-semibold rounded-2xl" onClick={handlePayment} disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          'Pagar con tarjeta'
        )}
      </Button>
      <p className="text-xs text-center text-muted-foreground mt-4">
        El backend registrara el pago y actualizara tu certificacion.
      </p>
    </motion.div>
  );
};

export default PaymentGateway;
