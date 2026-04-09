import React, { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Bell, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminReminderDashboard = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleSendReminders = async () => {
    try {
      const response = await apiRequest('/reminders/send', {
        method: 'POST',
      });
      toast({
        title: 'Recordatorios disparados',
        description: `${response.updated || 0} recordatorio(s) actualizados.`,
      });
      fetchReminders();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Bell className="w-6 h-6" /> Recordatorios
        </h2>
        <Button onClick={handleSendReminders}>
          <Send className="w-4 h-4 mr-2" />
          Disparar Recordatorios Pendientes
        </Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha Programada</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Certificación</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8">Cargando...</TableCell></TableRow>
            ) : reminders.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No hay recordatorios programados</TableCell></TableRow>
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
