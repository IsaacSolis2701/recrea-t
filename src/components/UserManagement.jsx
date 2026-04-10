import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/apiClient';

const UserFormModal = ({ isOpen, onClose, onSubmit, user }) => {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'client',
  });

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', username: user.username || '', email: user.email || '', password: '', role: user.role || 'client' });
    } else {
      setFormData({ name: '', username: '', email: '', password: '', role: 'client' });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Usuario' : 'Nuevo Usuario'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="um-name">Nombre Completo</Label>
            <Input id="um-name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="um-username">Usuario de acceso</Label>
            <Input id="um-username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="um-email">Email</Label>
            <Input id="um-email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="um-role">Rol</Label>
            <select
              id="um-role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm bg-background"
            >
              <option value="client">Cliente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="um-password">{user ? 'Nueva contraseña' : 'Contraseña'}</Label>
            <Input
              id="um-password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={user ? 'Déjalo vacío para mantener la actual' : ''}
              required={!user}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{user ? 'Guardar Cambios' : 'Crear Usuario'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UserManagement = ({ users, onUsersUpdate, projects }) => {
  const [modalState, setModalState] = useState({ isOpen: false, user: null });
  const [changeRequests, setChangeRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const fetchChangeRequests = async () => {
    try {
      setLoadingRequests(true);
      const response = await apiRequest('/profile-change-requests');
      setChangeRequests(response.requests || []);
    } catch {
      setChangeRequests([]);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    fetchChangeRequests();
  }, []);

  const handleSaveUser = async (userData) => {
    try {
      if (modalState.user) {
        await apiRequest(`/users/${modalState.user.id}`, {
          method: 'PUT',
          body: {
            name: userData.name,
            username: userData.username,
            email: userData.email,
            password: userData.password || undefined,
            role: userData.role,
          },
        });
        toast({ title: 'Usuario actualizado', description: 'Los datos del usuario se han guardado.' });
      } else {
        await apiRequest('/users', {
          method: 'POST',
          body: {
            name: userData.name,
            username: userData.username,
            email: userData.email,
            password: userData.password,
            role: userData.role,
          },
        });
        toast({ title: 'Usuario creado', description: 'El nuevo usuario ha sido añadido.' });
      }
      onUsersUpdate();
      setModalState({ isOpen: false, user: null });
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId) => {
    const projectAssigned = projects.some((p) => p.client_id === userId);
    if (projectAssigned) {
      toast({ title: 'Error', description: 'No se puede eliminar un usuario con proyectos asignados.', variant: 'destructive' });
      return;
    }
    try {
      await apiRequest(`/users/${userId}`, { method: 'DELETE' });
      toast({ title: 'Usuario eliminado' });
      onUsersUpdate();
    } catch (error) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    }
  };

  const handleApprove = async (requestId) => {
    setProcessingId(requestId);
    try {
      const response = await apiRequest(`/profile-change-requests/${requestId}/approve`, { method: 'PATCH' });
      toast({ title: 'Solicitud aprobada', description: 'Los datos del cliente han sido actualizados.' });
      setChangeRequests((prev) => prev.filter((r) => r.id !== requestId));
      onUsersUpdate();
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    try {
      await apiRequest(`/profile-change-requests/${requestId}/reject`, { method: 'PATCH' });
      toast({ title: 'Solicitud rechazada' });
      setChangeRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setProcessingId(null);
    }
  };

  const admins = users.filter((u) => u.role === 'admin');
  const clients = users.filter((u) => u.role === 'client');

  const renderUserRow = (u) => (
    <li key={u.id} className="p-4 flex justify-between items-center">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold">{u.name}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${u.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
            {u.role === 'admin' ? 'Admin' : 'Cliente'}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">@{u.username} · {u.email}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => setModalState({ isOpen: true, user: u })}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteUser(u.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </li>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Crea, edita y gestiona clientes y administradores.</p>
        </div>
        <Button onClick={() => setModalState({ isOpen: true, user: null })}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Usuario
        </Button>
      </div>

      {/* Solicitudes de cambio de datos */}
      {(loadingRequests || changeRequests.length > 0) && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            Solicitudes de cambio de datos
            {changeRequests.length > 0 && (
              <span className="text-xs bg-yellow-500 text-white rounded-full px-2 py-0.5 font-bold">{changeRequests.length}</span>
            )}
          </h2>
          {loadingRequests ? (
            <p className="text-sm text-muted-foreground">Cargando solicitudes...</p>
          ) : (
            <div className="bg-card border rounded-xl divide-y divide-border">
              {changeRequests.map((req) => (
                <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-medium">{req.current_name} <span className="text-xs text-muted-foreground">(@{req.current_username})</span></p>
                    <p className="text-sm text-muted-foreground">Email actual: {req.current_email}</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {req.requested_name && (
                        <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">
                          Nombre → <strong>{req.requested_name}</strong>
                        </span>
                      )}
                      {req.requested_username && (
                        <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">
                          Usuario → <strong>{req.requested_username}</strong>
                        </span>
                      )}
                      {req.requested_email && (
                        <span className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">
                          Email → <strong>{req.requested_email}</strong>
                        </span>
                      )}
                      {req.requested_password && (
                        <span className="text-xs bg-purple-500/10 text-purple-600 px-2 py-0.5 rounded">
                          Contraseña → <strong>nueva contraseña solicitada</strong>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Solicitado el {new Date(req.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(req.id)}
                      disabled={processingId === req.id}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" /> Aprobar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleReject(req.id)}
                      disabled={processingId === req.id}
                      className="text-destructive border-destructive hover:bg-destructive/10"
                    >
                      <XCircle className="w-3.5 h-3.5 mr-1" /> Rechazar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Todos los usuarios</h2>
        <div className="bg-card border rounded-xl">
          {users.length > 0 ? (
            <ul className="divide-y divide-border">
              {admins.map(renderUserRow)}
              {clients.map(renderUserRow)}
            </ul>
          ) : (
            <div className="p-12 text-center">
              <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold">No hay usuarios</h3>
              <p className="text-muted-foreground mt-2">Empieza añadiendo tu primer usuario.</p>
            </div>
          )}
        </div>
      </div>

      <UserFormModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, user: null })}
        onSubmit={handleSaveUser}
        user={modalState.user}
      />
    </motion.div>
  );
};

export default UserManagement;
