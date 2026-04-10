import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { apiRequest } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft, Package } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import AddMaterialModal from '@/components/AddMaterialModal';
import ImageViewModal from '@/components/ImageViewModal';
import CategorySection from '@/components/CategorySection';
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

const MaterialsCatalog = ({ onBack }) => {
  const [materials, setMaterials] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, isEditing: false, data: null });
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, materialId: null });
  const [viewImage, setViewImage] = useState(null);

  const fetchData = async () => {
    setLoading(true);

    try {
      const [categoriesResponse, materialsResponse] = await Promise.all([
        apiRequest('/categories'),
        apiRequest('/materials-catalog'),
      ]);

      const catalogCategories = categoriesResponse.categories || [];
      const catalogMaterials = materialsResponse.materials || [];

      setCategories(catalogCategories);
      setMaterials(catalogMaterials);

      if (catalogCategories.length === 0) {
        const fallbackCategories = Array.from(new Set(catalogMaterials.map((material) => material.category).filter(Boolean)))
          .map((name) => ({ id: name, name, description: '' }));
        setCategories(fallbackCategories);
      }
    } catch (error) {
      toast({ title: 'Aviso', description: error.message || 'No se pudo cargar el catálogo.', variant: 'default' });
      setMaterials([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveMaterial = async (materialData) => {
    try {
      if (modalState.isEditing) {
        const response = await apiRequest(`/materials-catalog/${modalState.data.id}`, {
          method: 'PUT',
          body: materialData,
        });
        setMaterials(materials.map((material) => material.id === response.material.id ? response.material : material));
        toast({ title: 'Producto actualizado', description: 'Los cambios han sido guardados en el catálogo.' });
      } else {
        const response = await apiRequest('/materials-catalog', {
          method: 'POST',
          body: materialData,
        });
        setMaterials([response.material, ...materials]);
        toast({ title: 'Producto añadido', description: 'El nuevo producto se ha guardado en el catálogo.' });
      }
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }

    setModalState({ isOpen: false, isEditing: false, data: null });
  };

  const handleDelete = async (materialId) => {
    try {
      await apiRequest(`/materials-catalog/${materialId}`, { method: 'DELETE' });
      setMaterials(materials.filter((material) => material.id !== materialId));
      toast({ title: 'Producto eliminado', description: 'El producto ha sido eliminado del catálogo.' });
    } catch (error) {
      toast({ title: 'Error al eliminar', description: error.message, variant: 'destructive' });
    }

    setDeleteDialog({ isOpen: false, materialId: null });
  };

  const openEditModal = (material) => {
    setModalState({ isOpen: true, isEditing: true, data: material });
  };

  const openDeleteDialog = (materialId) => {
    setDeleteDialog({ isOpen: true, materialId });
  };

  const handleNewCategory = (newCategoryName) => {
    const exists = categories.find((category) => category.name.toLowerCase() === newCategoryName.toLowerCase());
    if (!exists) {
      setCategories([...categories, { id: newCategoryName, name: newCategoryName, description: '' }]);
    }
  };

  const categoriesForGrouping = [...categories];
  const groupedMaterials = categoriesForGrouping.reduce((accumulator, category) => {
    accumulator[category.id] = materials.filter((material) => material.category_id === category.id || material.category === category.name || material.category === category.id);
    return accumulator;
  }, {});

  const uncategorized = materials.filter((material) => !material.category_id && !material.category && !categoriesForGrouping.some((category) => category.id === material.category || category.name === material.category));
  if (uncategorized.length > 0) {
    groupedMaterials.uncategorized = uncategorized;
    if (!categoriesForGrouping.find((category) => category.id === 'uncategorized')) {
      categoriesForGrouping.push({ id: 'uncategorized', name: 'Sin Categoría', description: 'Productos sin clasificar' });
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-foreground">
          <button onClick={onBack} className="flex items-center gap-2 hover:text-primary transition-colors">
            <ArrowLeft className="w-5 h-5"/>
            <span>Catálogo de Productos</span>
          </button>
        </h2>
        <Button size="sm" onClick={() => setModalState({ isOpen: true, isEditing: false, data: null })}>
          <Plus className="w-4 h-4 mr-2" />
          Añadir Producto
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <p className="text-muted-foreground animate-pulse">Cargando catálogo...</p>
        </div>
      ) : materials.length === 0 ? (
        <div className="bg-card border rounded-xl p-12 text-center mt-8 shadow-sm">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">Tu catálogo está vacío</h3>
          <p className="text-muted-foreground">
            Añade tu primer producto para empezar a construir tu base de datos.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {categoriesForGrouping.map((category) => {
            const categoryMaterials = groupedMaterials[category.id] || [];
            if (categoryMaterials.length === 0 && category.id === 'uncategorized') return null;

            return (
              <CategorySection
                key={category.id}
                category={category}
                materials={categoryMaterials}
                onEdit={openEditModal}
                onDelete={openDeleteDialog}
                onViewImage={setViewImage}
              />
            );
          })}
        </div>
      )}

      <AddMaterialModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, isEditing: false, data: null })}
        onSubmit={handleSaveMaterial}
        isEditing={modalState.isEditing}
        initialData={modalState.data}
        context="catalog"
        availableCategories={categoriesForGrouping.map((category) => category.name)}
        onNewCategory={handleNewCategory}
        availableSubcategories={[...new Set(materials.map((m) => m.subcategory).filter(Boolean))]}
      />

      <AlertDialog open={deleteDialog.isOpen} onOpenChange={(isOpen) => !isOpen && setDeleteDialog({ isOpen: false, materialId: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente y eliminará el producto de tu catálogo. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteDialog.materialId)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
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
