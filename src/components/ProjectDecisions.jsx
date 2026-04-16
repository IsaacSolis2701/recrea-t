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
  const [selectedDecision, setSelectedDecision] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, isEditing: false, data: null });
  const [viewingImage, setViewingImage] = useState(null);
  const [isCatalogPickerOpen, setIsCatalogPickerOpen] = useState(false);
  const [catalogMaterials, setCatalogMaterials] = useState([]);
  const [catalogCategories, setCatalogCategories] = useState([]);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isAddSpaceOpen, setIsAddSpaceOpen] = useState(false);
  const [customSpaceName, setCustomSpaceName] = useState('');
  const [removeSpaceDialog, setRemoveSpaceDialog] = useState({ isOpen: false, spaceId: null });
  const [editSpaceDialog, setEditSpaceDialog] = useState({ isOpen: false, spaceId: null, name: '' });

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [matRes, catRes] = await Promise.all([
          apiRequest('/materials-catalog'),
          apiRequest('/categories'),
        ]);
        setCatalogMaterials(matRes.materials || []);
        setCatalogCategories(catRes.categories || []);
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

  const handleDeleteDecision = (decision) => {
    onUpdate((materials || []).filter((m) => m.id !== decision.id));
    toast({ title: 'Material eliminado', description: `${decision.name} ha sido eliminado.` });
  };

  const handleSaveDecision = (decisionData) => {
    if (modalState.isEditing) {
      const updatedMaterials = (materials || []).map((m) =>
        m.id === modalState.data.id ? { ...m, ...decisionData, status: 'pending', changeNote: null } : m
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

  const handleCreateNewProduct = async (materialData) => {
    try {
      const response = await apiRequest('/materials-catalog', { method: 'POST', body: materialData });
      const newCatalogProduct = response.material;
      setCatalogMaterials((prev) => [newCatalogProduct, ...prev]);
      const newDecision = {
        ...newCatalogProduct,
        id: `proj-${Date.now()}`,
        space_id: selectedSpaceId,
        category: selectedSpaceId,
        catalog_id: newCatalogProduct.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
      };
      delete newDecision.created_at;
      onUpdate([...(materials || []), newDecision]);
      toast({ title: 'Producto creado', description: `"${newCatalogProduct.name}" añadido al catálogo y al espacio.` });
      setIsNewProductModalOpen(false);
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleNewCategoryForProject = async (name) => {
    if (!catalogCategories.find((c) => c.name.toLowerCase() === name.toLowerCase())) {
      try {
        const res = await apiRequest('/categories', { method: 'POST', body: { name, description: '' } });
        setCatalogCategories((prev) => [...prev, res.category]);
      } catch {
        // silent
      }
    }
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
    // Desasociar materiales del espacio pero no eliminarlos
    const updatedMaterials = (materials || []).map((m) =>
      (m.space_id || m.category) === spaceId
        ? { ...m, space_id: null, category: null }
        : m,
    );
    onUpdate(updatedMaterials);
    setRemoveSpaceDialog({ isOpen: false, spaceId: null });
    if (selectedSpaceId === spaceId) {
      setSelectedSpaceId(null);
      setSelectedDecision(null);
    }
  };

  const handleConfirmEditSpace = () => {
    const { spaceId, name } = editSpaceDialog;
    const trimmed = name.trim();
    if (!trimmed) return;
    if (spaces.some((s) => s.id !== spaceId && s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast({ title: 'Ya existe', description: 'Ya hay un espacio con ese nombre.', variant: 'destructive' });
      return;
    }
    onSpacesUpdate(spaces.map((s) => (s.id === spaceId ? { ...s, name: trimmed } : s)));
    setEditSpaceDialog({ isOpen: false, spaceId: null, name: '' });
    toast({ title: 'Espacio renombrado' });
  };

  const onBack = () => {
    if (selectedDecision) setSelectedDecision(null);
    else if (selectedSpaceId) setSelectedSpaceId(null);
  };

  const getTitle = () => {
    if (selectedDecision) return selectedDecision.name;
    if (selectedSpaceId) return getSpaceName(selectedSpaceId);
    return 'Espacios';
  };

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

        {userRole === 'admin' && selectedSpaceId && !selectedDecision && (
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setIsCatalogPickerOpen(true)}>
              <BookOpen className="w-4 h-4 mr-2" />
              Del catálogo
            </Button>
            <Button size="sm" onClick={() => setIsNewProductModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo producto
            </Button>
          </div>
        )}

        {userRole === 'admin' && !selectedSpaceId && (
          <Button size="sm" onClick={() => setIsAddSpaceOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Añadir espacio
          </Button>
        )}
      </div>

      {/* Breadcrumb */}
      {(selectedSpaceId || selectedDecision) && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground flex-wrap">
          <button
            onClick={() => { setSelectedSpaceId(null); setSelectedDecision(null); }}
            className="hover:text-foreground transition-colors"
          >
            Espacios
          </button>
          {selectedSpaceId && (
            <>
              <ChevronRight className="w-3 h-3" />
              <button
                onClick={() => setSelectedDecision(null)}
                className="hover:text-foreground transition-colors"
              >
                {getSpaceName(selectedSpaceId)}
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
                  <div className="mt-4 flex justify-center">
                    <Button size="sm" onClick={() => setIsAddSpaceOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Añadir espacio
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
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditSpaceDialog({ isOpen: true, spaceId: space.id, name: space.name });
                          }}
                          className="p-1 rounded hover:bg-secondary"
                          title="Renombrar espacio"
                        >
                          <PenLine className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRemoveSpaceDialog({ isOpen: true, spaceId: space.id });
                          }}
                          className="p-1 rounded hover:bg-destructive/10"
                          title="Eliminar espacio"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>
        ) : selectedDecision ? (
          /* Nivel 2: Detalle de producto */
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
          /* Nivel 1: Productos del espacio */
          <motion.div
            key="list"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {getMaterialsForSpace(selectedSpaceId).length === 0 ? (
              <div className="bg-card border rounded-xl p-10 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="font-semibold text-foreground">Sin materiales</p>
                <p className="text-muted-foreground text-sm mt-1">
                  {userRole === 'admin'
                    ? 'Añade materiales del catálogo o crea un producto nuevo para este espacio.'
                    : 'El administrador añadirá los materiales de este espacio.'}
                </p>
                {userRole === 'admin' && (
                  <div className="mt-4 flex gap-2 justify-center">
                    <Button size="sm" variant="outline" onClick={() => setIsCatalogPickerOpen(true)}>
                      <BookOpen className="w-4 h-4 mr-2" />
                      Del catálogo
                    </Button>
                    <Button size="sm" onClick={() => setIsNewProductModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Nuevo producto
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <MaterialList
                decisions={getMaterialsForSpace(selectedSpaceId)}
                onSelectDecision={setSelectedDecision}
                onEditDecision={handleEditDecision}
                onDeleteDecision={handleDeleteDecision}
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

      {/* Dialog: Renombrar espacio */}
      <Dialog
        open={editSpaceDialog.isOpen}
        onOpenChange={(v) => !v && setEditSpaceDialog({ isOpen: false, spaceId: null, name: '' })}
      >
        <DialogContent className="bg-card border max-w-sm">
          <DialogHeader>
            <DialogTitle>Renombrar espacio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input
              value={editSpaceDialog.name}
              onChange={(e) => setEditSpaceDialog((prev) => ({ ...prev, name: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirmEditSpace()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setEditSpaceDialog({ isOpen: false, spaceId: null, name: '' })}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmEditSpace} disabled={!editSpaceDialog.name.trim()}>
                Guardar
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
              Se eliminará el espacio "{getSpaceName(removeSpaceDialog.spaceId)}". Los materiales asignados quedarán sin espacio pero no se borrarán.
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
        isEditing={modalState.isEditing}
        initialData={modalState.data}
        context="project"
      />

      <AddMaterialModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onSubmit={handleCreateNewProduct}
        context="catalog"
        availableCategories={catalogCategories.map((c) => c.name)}
        onNewCategory={handleNewCategoryForProject}
        isEditing={false}
      />

      <CatalogPickerModal
        isOpen={isCatalogPickerOpen}
        onClose={() => setIsCatalogPickerOpen(false)}
        categories={catalogCategories}
        materials={catalogMaterials}
        onSelect={handlePickFromCatalog}
        existingMaterials={selectedSpaceId ? getMaterialsForSpace(selectedSpaceId) : []}
      />

      <ImageViewModal
        image={viewingImage}
        onClose={() => setViewingImage(null)}
      />
    </div>
  );
};

export default ProjectDecisions;
