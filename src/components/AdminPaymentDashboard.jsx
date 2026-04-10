import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, Clock, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const AdminPaymentDashboard = () => {
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchCertifications();
  }, []);

  const fetchCertifications = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/certifications');
      setCertifications(response.certifications || []);
    } catch (error) {
      console.error('Error fetching certifications:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los pagos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const filtered = certifications.filter((c) => {
    const matchesSearch =
      c.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.project_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'paid' && c.is_paid) ||
      (filter === 'pending' && !c.is_paid);
    return matchesSearch && matchesFilter;
  });

  const pendingCount = certifications.filter((c) => !c.is_paid).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Control de Pagos</h2>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-600 mt-0.5">{pendingCount} certificación{pendingCount !== 1 ? 'es' : ''} pendiente{pendingCount !== 1 ? 's' : ''} de pago</p>
          )}
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar cliente, obra o cert..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-background"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendientes</option>
            <option value="paid">Pagados</option>
          </select>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Proyecto</TableHead>
              <TableHead>Certificación</TableHead>
              <TableHead>Importe</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha pago</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No se encontraron certificaciones</TableCell></TableRow>
            ) : (
              filtered.map((cert) => (
                <TableRow key={`${cert.project_id}-${cert.id}`} className={!cert.is_paid ? 'bg-yellow-500/5' : ''}>
                  <TableCell className="font-medium">{cert.client_name || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{cert.project_name || '—'}</TableCell>
                  <TableCell>{cert.name}{cert.number ? <span className="text-xs text-muted-foreground ml-1">#{cert.number}</span> : null}</TableCell>
                  <TableCell className="font-semibold">{Number(cert.amount).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}</TableCell>
                  <TableCell className="text-sm">
                    {cert.expiry_date ? new Date(cert.expiry_date + 'T12:00:00').toLocaleDateString('es-ES') : '—'}
                  </TableCell>
                  <TableCell>
                    {cert.is_paid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" /> Pagado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium">
                        <Clock className="w-3 h-3" /> Pendiente
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cert.payment_date ? new Date(cert.payment_date).toLocaleDateString('es-ES') : '—'}
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
