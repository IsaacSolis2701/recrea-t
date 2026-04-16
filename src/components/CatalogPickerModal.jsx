import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Search, CheckCircle2, ChevronRight, ArrowLeft, Layers } from 'lucide-react';

const CatalogPickerModal = ({ isOpen, onClose, categories = [], materials = [], onSelect, existingMaterials = [] }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const getMaterialsForCategory = (catId) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return [];
    return materials.filter(
      (m) => m.category_id === catId || m.category === cat.name || m.category === catId,
    );
  };

  const isAlreadyAdded = (material) =>
    existingMaterials.some(
      (m) =>
        m.name?.toLowerCase() === material.name?.toLowerCase() ||
        (m.catalog_id && m.catalog_id === material.id),
    );

  const selectedCategoryObj = categories.find((c) => c.id === selectedCategoryId);

  const filteredMaterials = selectedCategoryId
    ? getMaterialsForCategory(selectedCategoryId).filter(
        (m) =>
          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false),
      )
    : [];

  const handleClose = () => {
    setSelectedCategoryId(null);
    setSearchTerm('');
    onClose();
  };

  const handleBack = () => {
    setSelectedCategoryId(null);
    setSearchTerm('');
  };

  const handleSelect = (material) => {
    onSelect(material);
    setSelectedCategoryId(null);
    setSearchTerm('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedCategoryId && (
              <button onClick={handleBack} className="hover:text-primary transition-colors mr-1">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {selectedCategoryObj?.name ?? 'Elegir del Catálogo'}
          </DialogTitle>
          <DialogDescription>
            {selectedCategoryId
              ? 'Selecciona un producto para añadirlo al espacio.'
              : 'Selecciona una categoría de producto.'}
          </DialogDescription>
        </DialogHeader>

        {/* Nivel 0: Categorías */}
        {!selectedCategoryId && (
          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2 mt-4">
            {categories.length > 0 ? (
              categories.map((cat) => {
                const count = getMaterialsForCategory(cat.id).length;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className="p-3 rounded-lg border flex justify-between items-center bg-background/50 cursor-pointer hover:bg-secondary/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-primary" />
                      <div>
                        <span className="font-semibold">{cat.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {count} producto{count !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="mt-2 font-semibold">Sin categorías en el catálogo</p>
                <p className="text-sm text-muted-foreground">
                  Añade categorías y productos al catálogo primero.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Nivel 1: Productos de la categoría */}
        {selectedCategoryId && (
          <>
            <div className="relative my-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((material) => {
                  const alreadyAdded = isAlreadyAdded(material);
                  return (
                    <div
                      key={material.id}
                      className={`p-3 rounded-lg border flex justify-between items-center ${
                        alreadyAdded ? 'bg-muted/50 opacity-60' : 'bg-background/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
                        {material.image_url && (
                          <img
                            src={material.image_url}
                            alt={material.name}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{material.name}</p>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {material.brand || material.description}
                          </p>
                        </div>
                      </div>
                      {alreadyAdded ? (
                        <div className="flex items-center gap-1.5 text-primary text-xs font-medium flex-shrink-0">
                          <CheckCircle2 className="w-4 h-4" />
                          Añadido
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleSelect(material)}
                          className="flex-shrink-0"
                        >
                          Añadir
                        </Button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 mx-auto text-muted-foreground" />
                  <p className="mt-2 font-semibold">
                    {getMaterialsForCategory(selectedCategoryId).length === 0
                      ? 'Sin productos en esta categoría'
                      : 'No se encontraron productos'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {getMaterialsForCategory(selectedCategoryId).length === 0
                      ? 'Añade productos a esta categoría en el catálogo.'
                      : 'Prueba con otra búsqueda.'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CatalogPickerModal;
