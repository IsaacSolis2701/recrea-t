import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiRequest } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus, ArrowLeft, Package, Layers, ChevronRight,
  Trash2, Edit, Eye,
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AddMaterialModal from '@/components/AddMaterialModal';
import ImageViewModal from '@/components/ImageViewModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const MaterialsCatalog = ({ onBack }) => {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, isEditing: false, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, materialId: null });
  const [deleteCategoryDialog, setDeleteCategoryDialog] = useState({ isOpen: false, categoryId: null });
  const [viewImage, setViewImage] = useState(null);
  const [addZoneOpen, setAddZoneOpen] = useState(false);
  const [newZoneName, setNewZoneName] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [categoriesResponse, materialsResponse] = await Promise.all([
        apiRequest('/categories'),
        apiRequest('/materials-catalog'),
      ]);
      setCategories(categoriesResponse.categories || []);
      setMaterials(materialsResponse.materials || []);
    } catch (error) {
      toast({ title: 'Aviso', description: error.message || 'No se pudo cargar el catálogo.', variant: 'default' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const getMaterialsForCategory = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return [];
    return materials.filter(
      (m) => m.category_id === catId || m.category === cat.name || m.category === catId,
    );
  };

  // ── Zone handlers ────────────────────────────────────────────────────────────

  const handleAddCustomZone = async () => {
    const name = newZoneName.trim();
    if (!name) return;
    if (categories.some((c) => c.name.toLowerCase() === name.toLowerCase())) {
      toast({ title: 'Ya existe', description: 'Ya hay una zona con ese nombre.', variant: 'destructive' });
      return;
    }
    try {
      const res = await apiRequest('/categories', { method: 'POST', body: { name, description: '' } });
      setCategories((prev) => [...prev, res.category]);
      toast({ title: 'Zona creada', description: `"${name}" añadida al catálogo.` });
      setAddZoneOpen(false);
      setNewZoneName('');
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleDeleteCategory = async () => {
    const { categoryId } = deleteCategoryDialog;
    try {
      await apiRequest(`/categories/${categoryId}`, { method: 'DELETE' });
      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
      toast({ title: 'Zona eliminada' });
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId(null);
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setDeleteCategoryDialog({ isOpen: false, categoryId: null });
  };

  // ── Material handlers ────────────────────────────────────────────────────────

  const handleSaveMaterial = async (materialData) => {
    try {
      if (modalState.isEditing) {
        const response = await apiRequest(`/materials-catalog/${modalState.data.id}`, {
          method: 'PUT',
          body: materialData,
        });
        setMaterials((prev) => prev.map((m) => m.id === response.material.id ? response.material : m));
        toast({ title: 'Producto actualizado' });
      } else {
        const response = await apiRequest('/materials-catalog', {
          method: 'POST',
          body: materialData,
        });
        setMaterials((prev) => [response.material, ...prev]);
        toast({ title: 'Producto añadido' });
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
    setModalState({ isOpen: false, isEditing: false, data: null });
  };

  const handleDelete = async () => {
    try {
      await apiRequest(`/materials-catalog/${deleteDialog.materialId}`, { method: 'DELETE' });
      setMaterials((prev) => prev.filter((m) => m.id !== deleteDialog.materialId));
      toast({ title: 'Producto eliminado' });
    } catch (error) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    }
    setDeleteDialog({ isOpen: false, materialId: null });
  };

  // ── Navigation ───────────────────────────────────────────────────────────────

  const goBack = () => {
    if (selectedCategoryId) { setSelectedCategoryId(null); return; }
    onBack();
  };

  const getTitle = () => {
    if (selectedCategory) return selectedCategory.name;
    return 'Catálogo de Productos';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-foreground">
          <button onClick={goBack} className="flex items-center gap-2 hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span>{getTitle()}</span>
          </button>
        </h2>

        <div className="flex items-center gap-2">
          {!selectedCategoryId && (
            <Button size="sm" onClick={() => setAddZoneOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Añadir categoría
            </Button>
          )}
          {selectedCategoryId && (
            <Button size="sm" onClick={() => setModalState({ isOpen: true, isEditing: false, data: null })}>
              <Plus className="w-4 h-4 mr-2" />
              Añadir producto
            </Button>
          )}
        </div>
      </div>

      {/* Breadcrumb */}
      {selectedCategoryId && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap mb-4">
          <button
            onClick={() => setSelectedCategoryId(null)}
            className="hover:text-foreground transition-colors"
          >
            Catálogo
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">{selectedCategory?.name}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground animate-pulse">Cargando catálogo...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {/* Level 0: Zones */}
          {!selectedCategoryId && (
            <motion.div key="zones" className="space-y-3">
              {categories.length === 0 ? (
                <div className="bg-card border rounded-xl p-12 text-center">
                  <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold">Sin categorías creadas</h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Crea categorías (ej: Grifería, Suelos) para organizar los productos del catálogo.
                  </p>
                  <div className="mt-4 flex justify-center">
                    <Button variant="outline" onClick={() => setAddZoneOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir categoría
                    </Button>
                  </div>
                </div>
              ) : (
                categories.map((cat, index) => {
                  const count = getMaterialsForCategory(cat.id).length;
                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.04 }}
                      className="bg-card p-4 rounded-xl border flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors group"
                      onClick={() => setSelectedCategoryId(cat.id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10">
                          <Layers className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{cat.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {count} producto{count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteCategoryDialog({ isOpen: true, categoryId: cat.id });
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                          title="Eliminar categoría"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {/* Level 1: Products within category */}
          {selectedCategoryId && (
            <motion.div
              key="products"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.25 }}
            >
              {getMaterialsForCategory(selectedCategoryId).length === 0 ? (
                <div className="bg-card border rounded-xl p-10 text-center">
                  <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="font-semibold">Sin productos en {selectedCategory?.name}</p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Añade el primer producto a esta categoría.
                  </p>
                  <Button size="sm" className="mt-4" onClick={() => setModalState({ isOpen: true, isEditing: false, data: null })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir producto
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {getMaterialsForCategory(selectedCategoryId).map((material) => (
                    <motion.div
                      key={material.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-card rounded-xl border overflow-hidden group shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="h-40 bg-secondary flex items-center justify-center overflow-hidden relative">
                        {material.image_url ? (
                          <img
                            src={material.image_url}
                            alt={material.name}
                            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <Package className="w-12 h-12 text-muted-foreground" />
                        )}
                        {material.ambiance_image_url && (
                          <div className="absolute bottom-2 right-2">
                            <button
                              type="button"
                              className="h-8 w-8 rounded-full bg-card/80 border flex items-center justify-center hover:bg-card"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewImage({ url: material.ambiance_image_url, alt: material.name });
                              }}
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-foreground leading-tight flex-1">{material.name}</h4>
                          {material.price > 0 && (
                            <p className="text-sm font-bold text-foreground shrink-0">
                              {material.price}€<span className="font-normal text-muted-foreground text-xs">/m²</span>
                            </p>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {material.brand || material.description}
                        </p>
                      </div>
                      <div className="p-2 border-t bg-muted/10 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setModalState({ isOpen: true, isEditing: true, data: material })}
                        >
                          <Edit className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteDialog({ isOpen: true, materialId: material.id })}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Add Material Modal */}
      <AddMaterialModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, isEditing: false, data: null })}
        onSubmit={handleSaveMaterial}
        isEditing={modalState.isEditing}
        initialData={modalState.data}
        context="catalog"
        availableCategories={categories.map((c) => c.name)}
        onNewCategory={(name) => {
          if (!categories.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
            apiRequest('/categories', { method: 'POST', body: { name, description: '' } })
              .then((res) => setCategories((prev) => [...prev, res.category]))
              .catch(() => {});
          }
        }}
        category={selectedCategory?.name}
      />

      {/* Add Category Dialog */}
      <Dialog open={addZoneOpen} onOpenChange={setAddZoneOpen}>
        <DialogContent className="bg-card border max-w-sm">
          <DialogHeader>
            <DialogTitle>Añadir categoría</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              placeholder="Nombre de la categoría (ej: Grifería, Suelos...)"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddCustomZone()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => { setAddZoneOpen(false); setNewZoneName(''); }}>
                Cancelar
              </Button>
              <Button onClick={handleAddCustomZone} disabled={!newZoneName.trim()}>
                Crear categoría
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Material Dialog */}
      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => !open && setDeleteDialog({ isOpen: false, materialId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente y eliminará el producto del catálogo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Category Dialog */}
      <AlertDialog
        open={deleteCategoryDialog.isOpen}
        onOpenChange={(open) => !open && setDeleteCategoryDialog({ isOpen: false, categoryId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la categoría del catálogo. Los productos de esta categoría no se borran, pero quedarán sin categoría asignada.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {viewImage && (
        <ImageViewModal
          isOpen={!!viewImage}
          onClose={() => setViewImage(null)}
          imageUrl={viewImage.url}
          altText={viewImage.alt}
        />
      )}
    </motion.div>
  );
};

export default MaterialsCatalog;
