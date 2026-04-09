import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const AdminPaymentDashboard = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/payments');
      setPayments(response.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los pagos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(p => 
    p.app_users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.certification_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold">Control de Pagos</h2>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text" 
            placeholder="Buscar cliente o cert..." 
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Certificación</TableHead>
              <TableHead>Monto</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Transacción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8">No se encontraron pagos</TableCell></TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{new Date(payment.payment_date).toLocaleDateString('es-ES')}</TableCell>
                  <TableCell className="font-medium">{payment.app_users?.name || 'Usuario Eliminado'}</TableCell>
                  <TableCell>#{payment.certification_id}</TableCell>
                  <TableCell className="font-semibold">{Number(payment.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</TableCell>
                  <TableCell>
                    {payment.status === 'paid' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" /> Pagado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium">
                        <Clock className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {payment.transaction_reference ? payment.transaction_reference.slice(-8) : '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminPaymentDashboard;
