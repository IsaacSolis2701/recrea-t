import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, ChevronRight, CheckCircle2, BookOpen,
  Layers, Trash2, Package, Home, PenLine,
} from 'lucide-react';
import MaterialList from '@/components/MaterialList';
import MaterialDetail from '@/components/MaterialDetail';
import AddMaterialModal from '@/components/AddMaterialModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

const SUGGESTED_SPACES = [
  'Generales', 'Aseo', 'Baño Principal', 'Baño Niños', 'Cocina',
  'Salón', 'Comedor', 'Dormitorio Principal', 'Dormitorio 2',
  'Dormitorio 3', 'Pasillo', 'Exterior',
];

const ProjectDecisions = ({ materials = [], spaces = [], onUpdate, onSpacesUpdate, userRole }) => {
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, isEditing: false, data: null });
  const [viewingImage, setViewingImage] = useState(null);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [catalogMaterials, setCatalogMaterials] = useState([]);
  const [isAddSpaceOpen, setIsAddSpaceOpen] = useState(false);
  const [customSpaceName, setCustomSpaceName] = useState('');
  const [removeSpaceDialog, setRemoveSpaceDialog] = useState({ isOpen: false, spaceId: null });

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const matRes = await apiRequest('/materials-catalog');
        setCatalogMaterials(matRes.materials || []);
      } catch (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      }
    };
    fetchCatalog();
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────

  const getSpaceName = (id) => spaces.find((s) => s.id === id)?.name || id;

  const getMaterialsForSpace = (spaceId) =>
    (materials || []).filter((m) => (m.space_id || m.category) === spaceId);

  const getSubcategoriesInSpace = (spaceId) => {
    const subs = getMaterialsForSpace(spaceId).map((m) => m.subcategory || 'General');
    return [...new Set(subs)];
  };

  const getMaterialsForSubcategory = (spaceId, subcategory) =>
    getMaterialsForSpace(spaceId).filter((m) => (m.subcategory || 'General') === subcategory);

  const getSpaceStatus = (spaceId) => {
    const mats = getMaterialsForSpace(spaceId);
    if (mats.length === 0) return null;
    const pending = mats.filter((m) => m.status === 'pending').length;
    if (pending > 0)
      return <span className="text-sm text-primary font-semibold">{pending} pendiente{pending > 1 ? 's' : ''}</span>;
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-medium">Todo decidido</span>
      </div>
    );
  };

  const getSubcategoryStatus = (spaceId, subcategory) => {
    const mats = getMaterialsForSubcategory(spaceId, subcategory);
    if (mats.length === 0) return null;
    const pending = mats.filter((m) => m.status === 'pending').length;
    if (pending > 0)
      return <span className="text-sm text-primary font-semibold">{pending} pendiente{pending > 1 ? 's' : ''}</span>;
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle2 className="w-4 h-4" />
        <span className="text-sm font-medium">Todo decidido</span>
      </div>
    );
  };

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleUpdateDecision = (updatedDecision) => {
    let updatedMaterials = (materials || []).map((m) =>
      m.id === updatedDecision.id ? updatedDecision : m
    );
    if (updatedDecision.status === 'approved') {
      const dSpaceId = updatedDecision.space_id || updatedDecision.category;
      updatedMaterials = updatedMaterials.map((m) => {
        const mSpaceId = m.space_id || m.category;
        if (
          m.id !== updatedDecision.id &&
          mSpaceId === dSpaceId &&
          m.subcategory === updatedDecision.subcategory &&
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

  const handleSaveDecision = (decisionData) => {
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
      space_id: selectedSpaceId,
      category: selectedSpaceId,
      subcategory: material.subcategory || 'General',
      catalog_id: material.id,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    delete newDecision.created_at;
    onUpdate([...(materials || []), newDecision]);
    toast({ title: 'Material añadido', description: `${material.name} añadido al espacio.` });
    setIsCatalogPickerOpen(false);
  };

  const handleCreateCommonSpaces = () => {
    const existingNames = new Set(spaces.map((s) => s.name.toLowerCase()));
    const baseTs = Date.now();
    const newSpaces = SUGGESTED_SPACES
      .filter((name) => !existingNames.has(name.toLowerCase()))
      .map((name, i) => ({ id: `space-${baseTs}-${i}`, name }));
    if (newSpaces.length === 0) {
      toast({ title: 'Ya están creadas', description: 'Las zonas comunes ya existen.' });
      return;
    }
    onSpacesUpdate([...spaces, ...newSpaces]);
    toast({ title: 'Zonas comunes creadas', description: `${newSpaces.length} espacios añadidos.` });
  };

  const handleAddSpace = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (spaces.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: 'Ya existe', description: 'Ya hay un espacio con ese nombre.', variant: 'destructive' });
      return;
    }
    const newSpace = { id: `space-${Date.now()}`, name: trimmed };
    onSpacesUpdate([...spaces, newSpace]);
    setIsAddSpaceOpen(false);
    setCustomSpaceName('');
    toast({ title: 'Espacio añadido', description: `"${trimmed}" ha sido añadido al proyecto.` });
  };

  const handleConfirmRemoveSpace = () => {
    const { spaceId } = removeSpaceDialog;
    onSpacesUpdate(spaces.filter((s) => s.id !== spaceId));
    onUpdate((materials || []).filter((m) => (m.space_id || m.category) !== spaceId));
    setRemoveSpaceDialog({ isOpen: false, spaceId: null });
    if (selectedSpaceId === spaceId) {
      setSelectedSpaceId(null);
      setSelectedSubcategory(null);
      setSelectedDecision(null);
    }
  };

  const onBack = () => {
    if (selectedDecision) setSelectedDecision(null);
    else if (selectedSubcategory) setSelectedSubcategory(null);
    else if (selectedSpaceId) setSelectedSpaceId(null);
  };

  const getTitle = () => {
    if (selectedDecision) return selectedDecision.name;
    if (selectedSubcategory) return selectedSubcategory;
    if (selectedSpaceId) return getSpaceName(selectedSpaceId);
    return 'Materiales';
  };

  const materialsInSubcategory = selectedSpaceId && selectedSubcategory
    ? getMaterialsForSubcategory(selectedSpaceId, selectedSubcategory)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">
          {selectedSpaceId || selectedDecision ? (
            <button onClick={onBack} className="flex items-center gap-2 hover:text-primary transition-colors">
              <ArrowLeft className="w-5 h-5" />
              <span>{getTitle()}</span>
            </button>
          ) : (
            <span>{getTitle()}</span>
          )}
        </h2>

        {userRole === 'admin' && selectedSpaceId && selectedSubcategory && !selectedDecision && (
          <Button size="sm" variant="outline" onClick={() => setIsCatalogPickerOpen(true)}>
            <BookOpen className="w-4 h-4 mr-2" />
            Añadir del catálogo
          </Button>
        )}

        {userRole === 'admin' && !selectedSpaceId && (
          <Button size="sm" onClick={() => setIsAddSpaceOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Añadir espacio
          </Button>
        )}
      </div>

      {/* Breadcrumb */}
      {(selectedSpaceId || selectedSubcategory || selectedDecision) && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <button
            onClick={() => { setSelectedSpaceId(null); setSelectedSubcategory(null); setSelectedDecision(null); }}
            className="hover:text-foreground transition-colors"
          >
            Materiales
          </button>
          {selectedSpaceId && (
            <>
              <ChevronRight className="w-3 h-3" />
              <button
                onClick={() => { setSelectedSubcategory(null); setSelectedDecision(null); }}
                className="hover:text-foreground transition-colors"
              >
                {getSpaceName(selectedSpaceId)}
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
        {/* Nivel 0: Espacios */}
        {!selectedSpaceId ? (
          <motion.div key="spaces" className="space-y-3">
            {spaces.length === 0 ? (
              <div className="bg-card border rounded-xl p-10 text-center">
                <Home className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">Sin espacios</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {userRole === 'admin'
                    ? 'Añade los espacios de la obra para gestionar materiales por estancia.'
                    : 'El administrador configurará los espacios próximamente.'}
                </p>
                {userRole === 'admin' && (
                  <div className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                    <Button size="sm" onClick={handleCreateCommonSpaces}>
                      <Home className="w-4 h-4 mr-2" />
                      Crear zonas comunes
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setIsAddSpaceOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir personalizado
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              spaces.map((space, index) => (
                <motion.div
                  key={space.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card p-4 rounded-xl border flex items-center justify-between cursor-pointer hover:bg-secondary/50 transition-colors group"
                  onClick={() => setSelectedSpaceId(space.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Layers className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{space.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        {getMaterialsForSpace(space.id).length} elemento{getMaterialsForSpace(space.id).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getSpaceStatus(space.id)}
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    {userRole === 'admin' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRemoveSpaceDialog({ isOpen: true, spaceId: space.id });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                        title="Eliminar espacio"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : !selectedSubcategory ? (
          /* Nivel 1: Tipos de elemento dentro del espacio */
          <motion.div
            key="subcategories"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.25 }}
            className="space-y-3"
          >
            {getSubcategoriesInSpace(selectedSpaceId).length === 0 ? (
              <div className="bg-card border rounded-xl p-10 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">Sin elementos</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {userRole === 'admin'
                    ? 'Añade materiales del catálogo para este espacio.'
                    : 'El administrador añadirá los materiales de este espacio.'}
                </p>
                {userRole === 'admin' && (
                  <Button size="sm" className="mt-4" onClick={() => setIsCatalogPickerOpen(true)}>
                    <BookOpen className="w-4 h-4 mr-2" />
                    Añadir del catálogo
                  </Button>
                )}
              </div>
            ) : (
              <>
                {getSubcategoriesInSpace(selectedSpaceId).map((sub, index) => (
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
                      {getSubcategoryStatus(selectedSpaceId, sub)}
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </motion.div>
                ))}
                {userRole === 'admin' && (
                  <div className="pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-dashed"
                      onClick={() => setIsCatalogPickerOpen(true)}
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      Añadir elemento del catálogo
                    </Button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        ) : selectedDecision ? (
          /* Nivel 3: Detalle */
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
          /* Nivel 2: Opciones en subcategoría */
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
                  Añade opciones del catálogo para comparar y elegir.
                </p>
                <Button size="sm" className="mt-4" onClick={() => setIsCatalogPickerOpen(true)}>
                  <BookOpen className="w-4 h-4 mr-2" />
                  Añadir del catálogo
                </Button>
              </div>
            ) : (
              <MaterialList
                decisions={materialsInSubcategory}
                onSelectDecision={setSelectedDecision}
                onEditDecision={handleEditDecision}
                userRole={userRole}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dialog: Añadir espacio */}
      <Dialog open={isAddSpaceOpen} onOpenChange={(v) => { setIsAddSpaceOpen(v); if (!v) setCustomSpaceName(''); }}>
        <DialogContent className="bg-card border max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir espacio</DialogTitle>
            <DialogDescription>
              Elige una estancia sugerida o escribe un nombre personalizado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_SPACES
                .filter((s) => !spaces.some((sp) => sp.name.toLowerCase() === s.toLowerCase()))
                .map((s) => (
                  <button
                    key={s}
                    onClick={() => handleAddSpace(s)}
                    className="px-3 py-1.5 rounded-full text-sm border bg-background/50 hover:bg-primary/10 hover:border-primary/30 transition-colors"
                  >
                    {s}
                  </button>
                ))}
            </div>
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="Nombre personalizado..."
                value={customSpaceName}
                onChange={(e) => setCustomSpaceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSpace(customSpaceName)}
                className="flex-1"
              />
              <Button onClick={() => handleAddSpace(customSpaceName)} disabled={!customSpaceName.trim()}>
                <PenLine className="w-4 h-4 mr-1.5" />
                Añadir
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirm eliminar espacio */}
      <AlertDialog
        open={removeSpaceDialog.isOpen}
        onOpenChange={(open) => !open && setRemoveSpaceDialog({ isOpen: false, spaceId: null })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar espacio?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el espacio "{getSpaceName(removeSpaceDialog.spaceId)}" y todos sus materiales de este proyecto. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRemoveSpace} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AddMaterialModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, isEditing: false, data: null })}
        onSubmit={handleSaveDecision}
        category={selectedSpaceId}
        subcategory={selectedSubcategory}
        availableSubcategories={[]}
        isEditing={modalState.isEditing}
        initialData={modalState.data}
        context="project"
      />

      <CatalogPickerModal
        isOpen={isCatalogPickerOpen}
        onClose={() => setIsCatalogPickerOpen(false)}
        materials={catalogMaterials}
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
