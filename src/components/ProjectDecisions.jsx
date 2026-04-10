import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, ChevronRight, CheckCircle2, BookOpen, Layers, Trash2, Package } from 'lucide-react';
import MaterialList from '@/components/MaterialList';
import MaterialDetail from '@/components/MaterialDetail';
import AddMaterialModal from '@/components/AddMaterialModal';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ImageViewModal from '@/components/ImageViewModal';
import { apiRequest } from '@/lib/apiClient';
import CatalogPickerModal from '@/components/CatalogPickerModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
} from '@/components/ui/alert-dialog';

const ProjectDecisions = ({ materials = [], onUpdate, userRole, selectedCategories = [], onCategoriesUpdate }) => {
  const [selectedCategory, setSelectedCategory] = useState(null); // catalog category ID
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, isEditing: false, data: null });
  const [viewingImage, setViewingImage] = useState(null);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [catalogMaterials, setCatalogMaterials] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
  const [removeCategoryDialog, setRemoveCategoryDialog] = useState({ isOpen: false, categoryId: null });

  useEffect(() => {
    const fetchCatalogData = async () => {
      try {
        const [catRes, matRes] = await Promise.all([
          apiRequest('/categories'),
          apiRequest('/materials-catalog'),
        ]);
        const realCats = catRes.categories || [];
        const mats = matRes.materials || [];

        // Add synthetic categories for materials whose category name has no matching DB record.
        // This handles legacy data or materials created before the categories table was populated.
        const realNamesLower = new Set(realCats.map((c) => c.name.toLowerCase()));
        const synthetic = [];
        for (const m of mats) {
          if (!m.category) continue;
          const nameLower = m.category.toLowerCase();
          if (!realNamesLower.has(nameLower) && !synthetic.find((s) => s.name.toLowerCase() === nameLower)) {
            synthetic.push({ id: m.category, name: m.category, description: '' });
          }
        }

        setCatalogCategories([...realCats, ...synthetic]);
        setCatalogMaterials(mats);
      } catch (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    };
    fetchCatalogData();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getCategoryName = (catId) =>
    catalogCategories.find((c) => c.id === catId)?.name || catId;

  // Match catalog materials to a category by ID or name (case-insensitive fallback for legacy data)
  const getCatalogMaterialsForCategory = (catId) => {
    const catName = getCategoryName(catId);
    const catNameLower = catName.toLowerCase();
    return catalogMaterials.filter(
      (m) =>
        m.category_id === catId ||
        (m.category && m.category.toLowerCase() === catNameLower)
    );
  };

  // Subcategories available in the catalog for a given category.
  // Materials without subcategory are grouped under 'General'.
  const getCatalogSubcategories = (catId) => {
    const mats = getCatalogMaterialsForCategory(catId);
    const subs = mats.map((m) => m.subcategory || 'General');
    return [...new Set(subs)];
  };

  const getDecisionsForSubcategory = (catId, subcategory) =>
    (materials || []).filter((m) => {
      if (m.category !== catId) return false;
      const sub = m.subcategory || 'General';
      return sub === subcategory;
    });

  const getSubcategoryStatus = (catId, subcategory) => {
    const mats = getDecisionsForSubcategory(catId, subcategory);
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

  const getCategoryStatus = (catId) => {
    const mats = (materials || []).filter((m) => m.category === catId);
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

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectDecision = (decision) => setSelectedDecision(decision);

  const handleUpdateDecision = (updatedDecision) => {
    let updatedMaterials = (materials || []).map((m) =>
      m.id === updatedDecision.id ? updatedDecision : m
    );

    if (updatedDecision.status === 'approved') {
      const targetSubcat = updatedDecision.subcategory;
      updatedMaterials = updatedMaterials.map((m) => {
        if (
          m.id !== updatedDecision.id &&
          m.category === updatedDecision.category &&
          m.subcategory === targetSubcat &&
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
    }
    setModalState({ isOpen: false, isEditing: false, data: null });
  };

  const handleEditDecision = (decision) =>
    setModalState({ isOpen: true, isEditing: true, data: decision });

  const handlePickFromCatalog = (material) => {
    const newDecision = {
      ...material,
      id: Date.now().toString(),
      category: selectedCategory,
      // Normalize: 'General' subcategory stays as 'General' in the project material
      subcategory: selectedSubcategory || 'General',
      catalog_id: material.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    delete newDecision.created_at;
    onUpdate([...(materials || []), newDecision]);
    toast({ title: 'Material añadido desde el catálogo', description: `Se ha añadido ${material.name}.` });
    setIsCatalogPickerOpen(false);
  };

  const handleAddSection = (catId) => {
    if (!selectedCategories.includes(catId)) {
      onCategoriesUpdate([...selectedCategories, catId]);
    }
    setIsAddSectionOpen(false);
  };

  const handleConfirmRemoveSection = () => {
    const catId = removeCategoryDialog.categoryId;
    onCategoriesUpdate(selectedCategories.filter((id) => id !== catId));
    onUpdate((materials || []).filter((m) => m.category !== catId));
    setRemoveCategoryDialog({ isOpen: false, categoryId: null });
    if (selectedCategory === catId) {
      setSelectedCategory(null);
      setSelectedSubcategory(null);
      setSelectedDecision(null);
    }
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
    if (selectedCategory) return getCategoryName(selectedCategory);
    return 'Materiales';
  };

  // Catalog materials for picker: filtered by current category + subcategory
  const pickerCatalogMaterials = selectedCategory && selectedSubcategory
    ? getCatalogMaterialsForCategory(selectedCategory).filter((m) => {
        const sub = m.subcategory || 'General';
        return sub === selectedSubcategory;
      })
    : [];

  const materialsInSubcategory = selectedSubcategory
    ? getDecisionsForSubcategory(selectedCategory, selectedSubcategory)
    : [];

  const isInSubcategoryView = selectedCategory && selectedSubcategory && !selectedDecision;

  // Catalog categories not yet added to the project
  const availableCatalogCategories = catalogCategories.filter(
    (c) => !selectedCategories.includes(c.id)
  );

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
          <Button size="sm" variant="outline" onClick={() => setIsCatalogPickerOpen(true)}>
            <BookOpen className="w-4 h-4 mr-2" />
            Añadir del catálogo
          </Button>
        )}

        {userRole === 'admin' && !selectedCategory && (
          <Button size="sm" onClick={() => setIsAddSectionOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Añadir sección
          </Button>
        )}
      </div>

      {/* Breadcrumb */}
      {(selectedCategory || selectedSubcategory || selectedDecision) && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <button
            onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); setSelectedDecision(null); }}
            className="hover:text-foreground transition-colors"
          >
            Materiales
          </button>
          {selectedCategory && (
            <>
              <ChevronRight className="w-3 h-3" />
              <button
                onClick={() => { setSelectedSubcategory(null); setSelectedDecision(null); }}
                className="hover:text-foreground transition-colors"
              >
                {getCategoryName(selectedCategory)}
              </button>
            </>
          )}
          {selectedSubcategory && (
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
        {/* Level 0: Project sections (from catalog categories) */}
        {!selectedCategory ? (
          <motion.div key="categories" className="space-y-3">
            {selectedCategories.length === 0 ? (
              <div className="bg-card border rounded-xl p-10 text-center">
                <Layers className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">Sin secciones</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {userRole === 'admin'
                    ? 'Añade una sección del catálogo para empezar a gestionar materiales.'
                    : 'El administrador configurará las secciones de materiales próximamente.'}
                </p>
                {userRole === 'admin' && catalogCategories.length === 0 && (
                  <p className="text-muted-foreground text-xs mt-2">
                    El catálogo está vacío. Primero añade categorías y productos en el catálogo.
                  </p>
                )}
                {userRole === 'admin' && catalogCategories.length > 0 && (
                  <Button size="sm" className="mt-4" onClick={() => setIsAddSectionOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Añadir primera sección
                  </Button>
                )}
              </div>
            ) : (
              selectedCategories.map((catId, index) => {
                const cat = catalogCategories.find((c) => c.id === catId);
                if (!cat) return null;
                return (
                  <motion.div
                    key={catId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card p-4 rounded-xl border flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors group"
                    onClick={() => setSelectedCategory(catId)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Layers className="w-4 h-4 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">{cat.name}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      {getCategoryStatus(catId)}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      {userRole === 'admin' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRemoveCategoryDialog({ isOpen: true, categoryId: catId });
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </motion.div>
        ) : !selectedSubcategory ? (
          /* Level 1: Subcategories from catalog */
          <motion.div
            key="subcategories"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {getCatalogSubcategories(selectedCategory).length === 0 ? (
              <div className="bg-card border rounded-xl p-10 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">Sin subcategorías en el catálogo</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Añade productos con subcategorías al catálogo para esta sección.
                </p>
              </div>
            ) : (
              getCatalogSubcategories(selectedCategory).map((sub, index) => (
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
          /* Level 2: Material list in subcategory */
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {materialsInSubcategory.length === 0 && userRole === 'admin' ? (
              <div className="bg-card border rounded-xl p-10 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">Sin materiales</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Añade materiales del catálogo para esta subcategoría.
                </p>
                {pickerCatalogMaterials.length > 0 ? (
                  <Button size="sm" className="mt-4" onClick={() => setIsCatalogPickerOpen(true)}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Añadir del catálogo
                  </Button>
                ) : (
                  <p className="text-muted-foreground text-xs mt-3">
                    No hay productos en esta subcategoría del catálogo.
                  </p>
                )}
              </div>
            ) : (
              <MaterialList
                decisions={materialsInSubcategory}
                onSelectDecision={handleSelectDecision}
                onEditDecision={handleEditDecision}
                userRole={userRole}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Add section from catalog */}
      <Dialog open={isAddSectionOpen} onOpenChange={setIsAddSectionOpen}>
        <DialogContent className="bg-card border max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir sección al proyecto</DialogTitle>
            <DialogDescription>
              Selecciona una categoría del catálogo para añadirla como sección.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 mt-2">
            {availableCatalogCategories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {catalogCategories.length === 0
                  ? 'El catálogo no tiene categorías. Créalas primero en el catálogo.'
                  : 'Todas las categorías del catálogo ya están añadidas.'}
              </div>
            ) : (
              availableCatalogCategories.map((cat) => {
                const subCount = getCatalogSubcategories(cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleAddSection(cat.id)}
                    className="w-full text-left p-3 rounded-lg border bg-background/50 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{cat.name}</p>
                        {cat.description && (
                          <p className="text-xs text-muted-foreground">{cat.description}</p>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {subCount} subcategoría{subCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm remove section */}
      <AlertDialog
        open={removeCategoryDialog.isOpen}
        onOpenChange={(open) => !open && setRemoveCategoryDialog({ isOpen: false, categoryId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar sección?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará la sección "{getCategoryName(removeCategoryDialog.categoryId)}" y todos sus
              materiales de este proyecto. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemoveSection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddMaterialModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, isEditing: false, data: null })}
        onSubmit={handleSaveDecision}
        category={selectedCategory}
        subcategory={selectedSubcategory}
        availableSubcategories={[]}
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
