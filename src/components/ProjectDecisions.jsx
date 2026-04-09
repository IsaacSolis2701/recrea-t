import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, ChevronRight, CheckCircle2, Edit, BookOpen, Layers } from 'lucide-react';
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
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, isEditing: false, data: null });
  const [viewingImage, setViewingImage] = useState(null);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [catalogMaterials, setCatalogMaterials] = useState([]);

  useEffect(() => {
    const fetchCatalogMaterials = async () => {
      if (userRole !== 'admin') return;
      try {
        const response = await apiRequest('/materials-catalog');
        setCatalogMaterials(response.materials || []);
      } catch (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    };
    fetchCatalogMaterials();
  }, [userRole]);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getSubcategoriesForCategory = (categoryId) => {
    const mats = (materials || []).filter((m) => m.category === categoryId);
    const subs = [...new Set(mats.map((m) => m.subcategory || 'General'))];
    return subs;
  };

  const getDecisionsForSubcategory = (categoryId, subcategoryId) =>
    (materials || []).filter(
      (m) => m.category === categoryId && (m.subcategory || 'General') === subcategoryId
    );

  const getSubcategoryStatus = (categoryId, subcategoryId) => {
    const mats = getDecisionsForSubcategory(categoryId, subcategoryId);
    if (mats.length === 0) return null;
    const pending = mats.filter((m) => m.status === 'pending').length;
    if (pending > 0)
      return (
        <span className="text-sm text-primary font-semibold">
          {pending} pendiente{pending > 1 ? 's' : ''}
        </span>
      );
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-medium">Todo decidido</span>
      </div>
    );
  };

  const getCategoryStatus = (categoryId) => {
    const mats = (materials || []).filter((m) => m.category === categoryId);
    if (mats.length === 0) return null;
    const pending = mats.filter((m) => m.status === 'pending').length;
    if (pending > 0)
      return (
        <span className="text-sm text-primary font-semibold">
          {pending} pendiente{pending > 1 ? 's' : ''}
        </span>
      );
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-medium">Todo decidido</span>
      </div>
    );
  };

  const getAvailableSubcategoriesForCategory = (categoryId) =>
    getSubcategoriesForCategory(categoryId);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectDecision = (decision) => setSelectedDecision(decision);

  const handleUpdateDecision = (updatedDecision) => {
    let updatedMaterials = (materials || []).map((m) =>
      m.id === updatedDecision.id ? updatedDecision : m
    );

    // When client approves, cancel other pending alternatives in same subcategory
    if (updatedDecision.status === 'approved') {
      const targetSubcat = updatedDecision.subcategory || 'General';
      updatedMaterials = updatedMaterials.map((m) => {
        if (
          m.id !== updatedDecision.id &&
          m.category === updatedDecision.category &&
          (m.subcategory || 'General') === targetSubcat &&
          m.status === 'pending'
        ) {
          return { ...m, status: 'cancelled' };
        }
        return m;
      });
    }

    onUpdate(updatedMaterials);
    setSelectedDecision(updatedDecision);
  };

  const handleSaveDecision = async (decisionData) => {
    if (modalState.isEditing) {
      const updatedMaterials = (materials || []).map((m) =>
        m.id === modalState.data.id ? { ...m, ...decisionData, status: 'pending' } : m
      );
      onUpdate(updatedMaterials);
      toast({ title: 'Material actualizado', description: 'Los cambios han sido guardados.' });
    } else {
      const resolvedSubcategory = decisionData.subcategory ||
        (selectedSubcategory && selectedSubcategory !== '__new__' ? selectedSubcategory : null) ||
        'General';
      const newDecision = {
        id: Date.now().toString(),
        ...decisionData,
        category: selectedCategory,
        subcategory: resolvedSubcategory,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      onUpdate([...(materials || []), newDecision]);
      // Navigate to the resolved subcategory so user sees the new material
      if (selectedSubcategory === '__new__' || !selectedSubcategory) {
        setSelectedSubcategory(resolvedSubcategory);
      }
      toast({ title: 'Material añadido', description: 'El nuevo material está listo para el cliente.' });
    }
    setModalState({ isOpen: false, isEditing: false, data: null });
  };

  const handleEditDecision = (decision) =>
    setModalState({ isOpen: true, isEditing: true, data: decision });

  const handlePickFromCatalog = (material) => {
    const resolvedSubcat = selectedSubcategory && selectedSubcategory !== '__new__'
      ? selectedSubcategory : 'General';
    const newDecision = {
      ...material,
      id: Date.now().toString(),
      category: selectedCategory,
      subcategory: resolvedSubcat,
      catalog_id: material.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    delete newDecision.created_at;
    onUpdate([...(materials || []), newDecision]);
    toast({ title: 'Material añadido desde el catálogo', description: `Se ha añadido ${material.name}.` });
    setIsCatalogPickerOpen(false);
  };

  const onBack = () => {
    if (selectedDecision) {
      setSelectedDecision(null);
    } else if (selectedSubcategory) {
      setSelectedSubcategory(null);
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const getTitle = () => {
    if (selectedDecision) return selectedDecision.name;
    if (selectedSubcategory) return selectedSubcategory;
    if (selectedCategory) return CATEGORIES.find((c) => c.id === selectedCategory)?.name || selectedCategory;
    return 'Materiales';
  };

  // Catalog materials filtered by current category (for picker)
  const pickerCatalogMaterials = catalogMaterials.filter(
    (m) => m.category === selectedCategory
  );

  // Materials in current subcategory (for duplicate check)
  const materialsInSubcategory = selectedSubcategory
    ? getDecisionsForSubcategory(selectedCategory, selectedSubcategory)
    : [];

  const isInSubcategoryView = selectedCategory && selectedSubcategory && !selectedDecision;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">
          {selectedCategory || selectedDecision ? (
            <button onClick={onBack} className="flex items-center gap-2 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>{getTitle()}</span>
            </button>
          ) : (
            <span>{getTitle()}</span>
          )}
        </h2>

        {userRole === 'admin' && isInSubcategoryView && (
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

      {/* Breadcrumb */}
      {(selectedCategory || selectedSubcategory || selectedDecision) && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <button onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); setSelectedDecision(null); }} className="hover:text-foreground transition-colors">
            Materiales
          </button>
          {selectedCategory && (
            <>
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => { setSelectedSubcategory(null); setSelectedDecision(null); }} className="hover:text-foreground transition-colors">
                {CATEGORIES.find((c) => c.id === selectedCategory)?.name || selectedCategory}
              </button>
            </>
          )}
          {selectedSubcategory && selectedSubcategory !== '__new__' && (
            <>
              <ChevronRight className="w-3 h-3" />
              <button onClick={() => setSelectedDecision(null)} className="hover:text-foreground transition-colors">
                {selectedSubcategory}
              </button>
            </>
          )}
          {selectedDecision && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span className="text-foreground font-medium">{selectedDecision.name}</span>
            </>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Level 0: Categories */}
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
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Layers className="w-4 h-4 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{category.name}</h3>
                </div>
                <div className="flex items-center gap-3">
                  {getCategoryStatus(category.id)}
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </motion.div>
            ))}
          </motion.div>
        ) : !selectedSubcategory ? (
          /* Level 1: Subcategories */
          <motion.div
            key="subcategories"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {getSubcategoriesForCategory(selectedCategory).length === 0 ? (
              <div className="bg-card border rounded-xl p-10 text-center">
                <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">Sin subcategorías</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {userRole === 'admin'
                    ? 'Añade materiales para crear subcategorías automáticamente.'
                    : 'El administrador añadirá materiales próximamente.'}
                </p>
                {userRole === 'admin' && (
                  <Button
                    size="sm"
                    className="mt-4"
                    onClick={() => setModalState({ isOpen: true, isEditing: false, data: null })}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir primer material
                  </Button>
                )}
              </div>
            ) : (
              getSubcategoriesForCategory(selectedCategory).map((sub, index) => (
                <motion.div
                  key={sub}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedSubcategory(sub)}
                  className="bg-card p-4 rounded-xl border flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <h3 className="font-semibold text-foreground">{sub}</h3>
                  <div className="flex items-center gap-3">
                    {getSubcategoryStatus(selectedCategory, sub)}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </motion.div>
              ))
            )}

            {userRole === 'admin' && getSubcategoriesForCategory(selectedCategory).length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => { setSelectedSubcategory('__new__'); setModalState({ isOpen: true, isEditing: false, data: null }); }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva subcategoría
              </Button>
            )}
          </motion.div>
        ) : selectedDecision ? (
          /* Level 3: Material Detail */
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
          /* Level 2: Material List in subcategory */
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            <MaterialList
              decisions={getDecisionsForSubcategory(selectedCategory, selectedSubcategory)}
              onSelectDecision={handleSelectDecision}
              onEditDecision={handleEditDecision}
              userRole={userRole}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AddMaterialModal
        isOpen={modalState.isOpen}
        onClose={() => {
          setModalState({ isOpen: false, isEditing: false, data: null });
          // If user cancels while creating new subcategory, go back to subcategory list
          if (selectedSubcategory === '__new__') setSelectedSubcategory(null);
        }}
        onSubmit={handleSaveDecision}
        category={selectedCategory}
        subcategory={selectedSubcategory === '__new__' ? '' : selectedSubcategory}
        availableSubcategories={getAvailableSubcategoriesForCategory(selectedCategory)}
        isEditing={modalState.isEditing}
        initialData={modalState.data}
        context="project"
      />

      <CatalogPickerModal
        isOpen={isCatalogPickerOpen}
        onClose={() => setIsCatalogPickerOpen(false)}
        materials={pickerCatalogMaterials}
        onSelect={handlePickFromCatalog}
        existingMaterials={materialsInSubcategory}
      />

      <ImageViewModal
        image={viewingImage}
        onClose={() => setViewingImage(null)}
      />
    </div>
  );
};

export default ProjectDecisions;
