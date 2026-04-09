import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Receipt, CheckCircle, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const PaymentHistory = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPayments();
  }, [user]);

  const fetchPayments = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const response = await apiRequest('/payments');
      setPayments(response.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({ title: 'Error', description: 'No se pudo cargar el historial de pagos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = (payment) => {
    const amount = Number(payment.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' });
    const paymentDate = new Date(payment.payment_date).toLocaleDateString('es-ES', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    const ref = payment.transaction_reference || 'N/D';

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Recibo de Pago — ReCrea-T</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #f8f8f6; padding: 40px 20px; color: #111; }
    .card { background: white; max-width: 520px; margin: 0 auto; border-radius: 20px; padding: 40px; box-shadow: 0 4px 40px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 32px; }
    .logo { font-size: 26px; font-weight: 700; letter-spacing: -0.03em; }
    .tagline { color: #888; font-size: 13px; margin-top: 4px; letter-spacing: 0.08em; text-transform: uppercase; }
    .divider { height: 1px; background: #eee; margin: 24px 0; }
    .title { font-size: 20px; font-weight: 700; margin-bottom: 4px; }
    .badge { display: inline-flex; align-items: center; gap: 6px; background: #e8f5e9; color: #2e7d32; padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600; margin-bottom: 28px; }
    .row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
    .row:last-of-type { border-bottom: none; }
    .label { color: #777; font-size: 14px; }
    .value { font-weight: 600; font-size: 14px; font-family: monospace; }
    .amount-box { background: #f5f5f3; border-radius: 14px; padding: 20px 24px; margin-top: 24px; display: flex; justify-content: space-between; align-items: center; }
    .amount-label { font-size: 15px; font-weight: 600; color: #444; }
    .amount-value { font-size: 30px; font-weight: 700; }
    .footer { text-align: center; margin-top: 32px; color: #aaa; font-size: 11px; line-height: 1.6; }
    @media print {
      body { background: white; padding: 0; }
      .card { box-shadow: none; border-radius: 0; padding: 20px; }
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="logo">ReCrea-T</div>
      <div class="tagline">Reforme Disfrutando</div>
    </div>
    <div class="divider"></div>
    <div class="title">Recibo de Pago</div>
    <div style="margin-top: 8px; margin-bottom: 24px;">
      <span class="badge">✓ Pagado</span>
    </div>
    <div class="row">
      <span class="label">Certificación</span>
      <span class="value">#${payment.certification_id}</span>
    </div>
    <div class="row">
      <span class="label">Fecha de pago</span>
      <span class="value">${paymentDate}</span>
    </div>
    <div class="row">
      <span class="label">Referencia</span>
      <span class="value">${ref}</span>
    </div>
    <div class="amount-box">
      <span class="amount-label">Total pagado</span>
      <span class="amount-value">${amount}</span>
    </div>
    <div class="footer">
      <p>Este documento es un comprobante de pago emitido por ReCrea-T.</p>
      <p>Generado el ${today}</p>
    </div>
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, '_blank');
    if (!win) {
      toast({ title: 'Bloqueado', description: 'Permite las ventanas emergentes para descargar el recibo.', variant: 'destructive' });
    }
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  };

  if (loading) {
    return <div className="text-center py-10 animate-pulse text-muted-foreground">Cargando historial...</div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold flex items-center gap-2">
        <Receipt className="w-6 h-6" />
        Historial de Pagos
      </h2>

      {payments.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center">
          <Receipt className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay pagos registrados</h3>
          <p className="text-muted-foreground">Tus pagos completados aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment, index) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-card border rounded-xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-lg">Certificación #{payment.certification_id}</span>
                  {payment.status === 'paid' ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-xs font-medium">
                      <CheckCircle className="w-3 h-3" /> Pagado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 text-xs font-medium">
                      <Clock className="w-3 h-3" /> Pendiente
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground flex flex-col sm:flex-row gap-1 sm:gap-4">
                  <span>{new Date(payment.payment_date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                  {payment.transaction_reference && (
                    <span className="font-mono text-xs opacity-70">Ref: {payment.transaction_reference.slice(-8)}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xl font-bold">
                  {Number(payment.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReceipt(payment)}
                  disabled={payment.status !== 'paid'}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Recibo
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentHistory;
