import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, ArrowLeft, Edit, Trash2, Tags } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CategoryManager = ({ onBack }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, isEditing: false, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, categoryId: null });
  const [formData, setFormData] = useState({ name: '', description: '' });

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await apiRequest('/categories');
      setCategories(response.categories || []);
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudieron cargar las categorías.', variant: 'destructive' });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleOpenModal = (category = null) => {
    if (category) {
      setFormData({ name: category.name, description: category.description || '' });
      setModalState({ isOpen: true, isEditing: true, data: category });
    } else {
      setFormData({ name: '', description: '' });
      setModalState({ isOpen: true, isEditing: false, data: null });
    }
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, isEditing: false, data: null });
    setFormData({ name: '', description: '' });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'El nombre es obligatorio.', variant: 'destructive' });
      return;
    }

    try {
      if (modalState.isEditing) {
        const response = await apiRequest(`/categories/${modalState.data.id}`, {
          method: 'PUT',
          body: { name: formData.name, description: formData.description },
        });
        setCategories(categories.map((category) => category.id === response.category.id ? response.category : category));
        toast({ title: 'Éxito', description: 'Categoría actualizada correctamente.' });
      } else {
        const response = await apiRequest('/categories', {
          method: 'POST',
          body: { name: formData.name, description: formData.description },
        });
        setCategories([...categories, response.category].sort((a, b) => a.name.localeCompare(b.name)));
        toast({ title: 'Éxito', description: 'Categoría añadida correctamente.' });
      }
      handleCloseModal();
    } catch (error) {
      toast({ title: 'Error al guardar', description: error.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await apiRequest(`/categories/${id}`, { method: 'DELETE' });
      setCategories(categories.filter((category) => category.id !== id));
      toast({ title: 'Eliminada', description: 'La categoría ha sido eliminada.' });
    } catch (error) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    }
    setDeleteDialog({ isOpen: false, categoryId: null });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">
          <button onClick={onBack} className="flex items-center gap-2 hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5"/>
            <span>Gestión de Categorías</span>
          </button>
        </h2>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="w-4 h-4 mr-2" />
          Añadir Categoría
        </Button>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Cargando categorías...</div>
        ) : categories.length === 0 ? (
          <div className="p-12 text-center">
            <Tags className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay categorías</h3>
            <p className="text-muted-foreground">Crea tu primera categoría para organizar los materiales.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {categories.map((category) => (
              <div key={category.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div>
                  <h3 className="font-semibold text-foreground">{category.name}</h3>
                  {category.description && (
                    <p className="text-sm text-muted-foreground mt-1">{category.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleOpenModal(category)}>
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setDeleteDialog({ isOpen: true, categoryId: category.id })}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={modalState.isOpen} onOpenChange={(isOpen) => !isOpen && handleCloseModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{modalState.isEditing ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="cat-name">Nombre de la categoría *</Label>
              <Input
                id="cat-name"
                value={formData.name}
                onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                placeholder="Ej: Suelos, Grifería..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat-desc">Descripción</Label>
              <Textarea
                id="cat-desc"
                value={formData.description}
                onChange={(event) => setFormData({ ...formData, description: event.target.value })}
                placeholder="Descripción opcional de la categoría..."
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
              <Button type="submit">{modalState.isEditing ? 'Guardar Cambios' : 'Crear Categoría'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setDeleteDialog({ isOpen: false, categoryId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará la categoría permanentemente. Los materiales asociados podrían quedarse sin categoría.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteDialog.categoryId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default CategoryManager;
