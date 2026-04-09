import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import LocationSearch from '@/components/LocationSearch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ProjectFormModal = ({ isOpen, onClose, onSubmit, clients, project }) => {
  const getInitialFormData = (p) => ({
    name: p?.name || '',
    description: p?.description || '',
    location: p?.location || '',
    clientId: p?.client_id || '',
    start_date: p?.start_date ? new Date(p.start_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  const [formData, setFormData] = useState(getInitialFormData(project));

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(project));
    }
  }, [project, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleLocationSelect = (address) => {
    setFormData({ ...formData, location: address });
  };

  const isEditing = !!project;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {isEditing ? 'Editar Proyecto' : 'Nueva Obra'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Obra</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Ubicación</Label>
            <LocationSearch 
              onLocationSelect={handleLocationSelect} 
              initialValue={formData.location} 
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="client">Cliente</Label>
             <Select onValueChange={(value) => setFormData({ ...formData, clientId: value })} value={formData.clientId}>
                <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                </SelectTrigger>
                <SelectContent>
                    {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="start_date">Fecha de Inicio</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isEditing ? 'Guardar Cambios' : 'Crear Obra'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProjectFormModal;