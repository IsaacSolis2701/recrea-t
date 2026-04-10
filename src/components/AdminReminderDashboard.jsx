import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminReminderDashboard = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingIds, setSendingIds] = useState(new Set());
  const [sendingAll, setSendingAll] = useState(false);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/reminders');
      setReminders(response.reminders || []);
    } catch (error) {
      console.error('Error fetching reminders:', error);
      toast({ title: 'Error', description: 'No se pudieron cargar los recordatorios', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReminders();
  }, []);

  const handleSendAll = async () => {
    setSendingAll(true);
    try {
      const response = await apiRequest('/reminders/send', { method: 'POST' });
      toast({
        title: 'Recordatorios disparados',
        description: `${response.sent || 0} recordatorio(s) enviado(s).`,
      });
      fetchReminders();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setSendingAll(false);
    }
  };

  const handleSendOne = async (reminderId) => {
    setSendingIds((prev) => new Set(prev).add(reminderId));
    try {
      await apiRequest(`/reminders/${reminderId}/send`, { method: 'POST' });
      toast({ title: 'Recordatorio enviado', description: 'El email ha sido enviado al cliente.' });
      setReminders((prev) =>
        prev.map((r) =>
          r.id === reminderId
            ? { ...r, status: 'sent', sent_at: new Date().toISOString() }
            : r
        )
      );
    } catch (error) {
      toast({ title: 'Error al enviar', description: error.message, variant: 'destructive' });
    } finally {
      setSendingIds((prev) => {
        const next = new Set(prev);
        next.delete(reminderId);
        return next;
      });
    }
  };

  const pendingCount = reminders.filter((r) => r.status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="w-6 h-6" /> Recordatorios
          </h2>
          {pendingCount > 0 && (
            <p className="text-sm text-yellow-600 mt-0.5">{pendingCount} recordatorio{pendingCount !== 1 ? 's' : ''} pendiente{pendingCount !== 1 ? 's' : ''}</p>
          )}
        </div>
        <Button onClick={handleSendAll} disabled={sendingAll || pendingCount === 0}>
          <Send className="w-4 h-4 mr-2" />
          {sendingAll ? 'Enviando...' : `Enviar pendientes${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
        </Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha programada</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Certificación</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Último envío</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : reminders.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No hay recordatorios programados</TableCell></TableRow>
            ) : (
              reminders.map((reminder) => (
                <TableRow key={reminder.id}>
                  <TableCell>{new Date(reminder.reminder_date + 'T12:00:00').toLocaleDateString('es-ES')}</TableCell>
                  <TableCell className="font-medium">{reminder.app_users?.name || 'Desconocido'}</TableCell>
                  <TableCell>{reminder.certification_name || reminder.certification_id}</TableCell>
                  <TableCell className="capitalize">{reminder.type}</TableCell>
                  <TableCell>
                    {reminder.status === 'sent' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs font-medium">Enviado</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 text-xs font-medium">Pendiente</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {reminder.sent_at ? new Date(reminder.sent_at).toLocaleDateString('es-ES') : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant={reminder.status === 'sent' ? 'outline' : 'default'}
                      onClick={() => handleSendOne(reminder.id)}
                      disabled={sendingIds.has(reminder.id)}
                    >
                      {sendingIds.has(reminder.id) ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : reminder.status === 'sent' ? (
                        <><RefreshCw className="w-3 h-3 mr-1" /> Reenviar</>
                      ) : (
                        <><Send className="w-3 h-3 mr-1" /> Enviar</>
                      )}
                    </Button>
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

export default AdminReminderDashboard;
