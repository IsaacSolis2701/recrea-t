import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, ChevronRight, CheckCircle2, Edit, BookOpen } from 'lucide-react';
import MaterialList from '@/components/MaterialList';
import MaterialDetail from '@/components/MaterialDetail';
import AddMaterialModal from '@/components/AddMaterialModal';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ImageViewModal from '@/components/ImageViewModal';
import { apiRequest } from '@/lib/apiClient';
import CatalogPickerModal from '@/components/CatalogPickerModal';

const CATEGORIES = [
  { id: 'general', name: 'General' },
  { id: 'cocina', name: 'Cocina' },
  { id: 'armarios', name: 'Armarios' },
  { id: 'baño-principal', name: 'Baño Principal' },
  { id: 'baño-secundario', name: 'Baño Secundario' },
  { id: 'aseo', name: 'Aseo' },
];

const ProjectDecisions = ({ materials = [], onUpdate, userRole }) => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, isEditing: false, data: null });
  const [viewingImage, setViewingImage] = useState(null);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [catalogMaterials, setCatalogMaterials] = useState([]);

  useEffect(() => {
    const fetchCatalogMaterials = async () => {
      if (userRole !== 'admin') {
        return;
      }

      try {
        const response = await apiRequest('/materials-catalog');
        setCatalogMaterials(response.materials || []);
      } catch (error) {
        toast({
          title: 'Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    fetchCatalogMaterials();
  }, [userRole]);

  const handleSelectDecision = (decision) => {
    setSelectedDecision(decision);
  };

  const handleUpdateDecision = (updatedDecision) => {
    const finalDecision = { ...updatedDecision };
    const updatedMaterials = materials.map((material) => material.id === finalDecision.id ? finalDecision : material);
    onUpdate(updatedMaterials);
    setSelectedDecision(finalDecision);
  };

  const handleSaveDecision = async (decisionData) => {
    if (modalState.isEditing) {
      const updatedMaterials = materials.map((material) =>
        material.id === modalState.data.id ? { ...material, ...decisionData, status: 'pending' } : material,
      );
      onUpdate(updatedMaterials);
      toast({ title: 'Material actualizado', description: 'Los cambios han sido guardados.' });
    } else {
      const newDecision = {
        id: Date.now().toString(),
        ...decisionData,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      onUpdate([...materials, newDecision]);
      toast({ title: 'Material añadido', description: 'El nuevo material está listo para el cliente.' });
    }
    setModalState({ isOpen: false, isEditing: false, data: null });
  };

  const handleEditDecision = (decision) => {
    setModalState({ isOpen: true, isEditing: true, data: decision });
  };

  const handlePickFromCatalog = (material) => {
    const newDecision = {
      ...material,
      id: Date.now().toString(),
      category: selectedCategory,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    delete newDecision.created_at;

    onUpdate([...materials, newDecision]);
    toast({ title: 'Material añadido desde el catálogo', description: `Se ha añadido ${material.name}.` });
    setIsCatalogPickerOpen(false);
  };

  const onBack = () => {
    if (selectedDecision) {
      setSelectedDecision(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const getDecisionsForCategory = (categoryId) => (materials || []).filter((material) => material.category === categoryId);

  const getCategoryStatus = (categoryId) => {
    const categoryMaterials = getDecisionsForCategory(categoryId);
    if (categoryMaterials.length === 0) return null;

    const pendingCount = categoryMaterials.filter((material) => material.status === 'pending').length;

    if (pendingCount > 0) {
      return <span className="text-sm text-primary font-semibold">{pendingCount} pendiente{pendingCount > 1 ? 's' : ''}</span>;
    }

    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-medium">Todo decidido</span>
      </div>
    );
  };

  const getTitle = () => {
    if (selectedDecision) return selectedDecision.name;
    if (selectedCategory) return CATEGORIES.find((category) => category.id === selectedCategory)?.name;
    return 'Materiales';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">
          {(selectedCategory || selectedDecision) ? (
            <button onClick={onBack} className="flex items-center gap-2 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5"/>
              <span>{getTitle()}</span>
            </button>
          ) : <span>{getTitle()}</span>}
        </h2>
        {userRole === 'admin' && selectedCategory && !selectedDecision && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsCatalogPickerOpen(true)}>
              <BookOpen className="w-4 h-4 mr-2" />
              Catálogo
            </Button>
            <Button size="sm" onClick={() => setModalState({ isOpen: true, isEditing: false, data: null })}>
              <Plus className="w-4 h-4 mr-2" />
              Añadir Nuevo
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {!selectedCategory ? (
          <motion.div key="categories" className="space-y-3">
            {CATEGORIES.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => setSelectedCategory(category.id)}
                className="bg-card p-4 rounded-xl border flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
              >
                <h3 className="font-semibold text-foreground">{category.name}</h3>
                <div className="flex items-center gap-3">
                  {getCategoryStatus(category.id)}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : selectedDecision ? (
          <motion.div
            key="detail"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <MaterialDetail
              decision={selectedDecision}
              onUpdate={handleUpdateDecision}
              userRole={userRole}
              onViewImage={(image) => setViewingImage(image)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50 }}
            transition={{ duration: 0.3 }}
          >
            <MaterialList
              decisions={getDecisionsForCategory(selectedCategory)}
              onSelectDecision={handleSelectDecision}
              onEditDecision={handleEditDecision}
              userRole={userRole}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <AddMaterialModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, isEditing: false, data: null })}
        onSubmit={handleSaveDecision}
        category={selectedCategory}
        isEditing={modalState.isEditing}
        initialData={modalState.data}
        context="project"
      />
      <CatalogPickerModal
        isOpen={isCatalogPickerOpen}
        onClose={() => setIsCatalogPickerOpen(false)}
        materials={catalogMaterials.filter((material) => material.category === selectedCategory)}
        onSelect={handlePickFromCatalog}
      />
      <ImageViewModal
        image={viewingImage}
        onClose={() => setViewingImage(null)}
      />
    </div>
  );
};

export default ProjectDecisions;
