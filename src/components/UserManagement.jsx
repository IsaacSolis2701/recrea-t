import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/apiClient';

const UserFormModal = ({ isOpen, onClose, onSubmit, user }) => {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    password: '',
  });

  React.useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
        password: '',
      });
    } else {
      setFormData({
        name: '',
        username: '',
        email: '',
        password: '',
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{user ? 'Editar Cliente' : 'Nuevo Cliente'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre Completo</Label>
            <Input id="name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Usuario de acceso</Label>
            <Input id="username" type="text" value={formData.username} onChange={(event) => setFormData({ ...formData, username: event.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={formData.email} onChange={(event) => setFormData({ ...formData, email: event.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">{user ? 'Nueva contraseña' : 'Contraseña'}</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(event) => setFormData({ ...formData, password: event.target.value })}
              placeholder={user ? 'Déjalo vacío para mantener la actual' : ''}
              required={!user}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button type="submit">{user ? 'Guardar Cambios' : 'Crear Cliente'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const UserManagement = ({ users, onUsersUpdate, projects }) => {
  const [modalState, setModalState] = useState({ isOpen: false, user: null });

  const clients = users.filter((user) => user.role === 'client');

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
          },
        });
        toast({ title: 'Cliente actualizado', description: 'Los datos del cliente se han guardado.' });
      } else {
        await apiRequest('/users', {
          method: 'POST',
          body: {
            name: userData.name,
            username: userData.username,
            email: userData.email,
            password: userData.password,
            role: 'client',
          },
        });
        toast({ title: 'Cliente creado', description: 'El nuevo cliente ha sido añadido con éxito.' });
      }

      onUsersUpdate();
      setModalState({ isOpen: false, user: null });
    } catch (error) {
      toast({ title: 'Error de usuario', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (userId) => {
    const projectAssigned = projects.some((project) => project.client_id === userId);
    if (projectAssigned) {
      toast({ title: 'Error', description: 'No se puede eliminar un cliente con un proyecto asignado.', variant: 'destructive' });
      return;
    }

    try {
      await apiRequest(`/users/${userId}`, { method: 'DELETE' });
      toast({ title: 'Cliente eliminado', description: 'El cliente ha sido eliminado.' });
      onUsersUpdate();
    } catch (error) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2 text-foreground">Gestión de Clientes</h1>
          <p className="text-muted-foreground">Crea, edita y gestiona los usuarios de tus clientes.</p>
        </div>
        <Button onClick={() => setModalState({ isOpen: true, user: null })}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Cliente
        </Button>
      </div>

      <div className="bg-card border rounded-xl">
        {clients.length > 0 ? (
          <ul className="divide-y divide-border">
            {clients.map((client) => (
              <li key={client.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-semibold">{client.name}</p>
                  <p className="text-sm text-muted-foreground">Usuario: {client.username}</p>
                  <p className="text-sm text-muted-foreground">Email: {client.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setModalState({ isOpen: true, user: client })}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDeleteUser(client.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center">
            <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold">No hay clientes</h3>
            <p className="text-muted-foreground mt-2">Empieza añadiendo tu primer cliente.</p>
          </div>
        )}
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
