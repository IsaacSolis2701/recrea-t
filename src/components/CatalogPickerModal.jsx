import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Package, Search, CheckCircle2, ChevronRight, ArrowLeft, Layers } from 'lucide-react';

const CatalogPickerModal = ({ isOpen, onClose, materials, onSelect, existingMaterials = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);

  const isAlreadyAdded = (material) => {
    return existingMaterials.some(
      (m) => m.name?.toLowerCase() === material.name?.toLowerCase() ||
             (m.catalog_id && m.catalog_id === material.id)
    );
  };

  const subcategories = [...new Set(materials.map((m) => m.subcategory || 'General'))];

  const materialsInSubcategory = materials.filter((m) => {
    const matchesSub = (m.subcategory || 'General') === selectedSubcategory;
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    return matchesSub && matchesSearch;
  });

  const handleClose = () => {
    setSelectedSubcategory(null);
    setSearchTerm('');
    onClose();
  };

  const handleBack = () => {
    setSelectedSubcategory(null);
    setSearchTerm('');
  };

  const handleSelect = (material) => {
    onSelect({ ...material, subcategory: selectedSubcategory });
    setSelectedSubcategory(null);
    setSearchTerm('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-card border max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selectedSubcategory && (
              <button onClick={handleBack} className="hover:text-primary transition-colors mr-1">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            {selectedSubcategory ?? 'Elegir del Catálogo'}
          </DialogTitle>
          <DialogDescription>
            {selectedSubcategory
              ? 'Selecciona un material para añadirlo al proyecto.'
              : 'Selecciona una subcategoría para ver los materiales disponibles.'}
          </DialogDescription>
        </DialogHeader>

        {!selectedSubcategory ? (
          /* Paso 1 — subcategorías */
          <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2 mt-4">
            {subcategories.length > 0 ? (
              subcategories.map((sub) => (
                <div
                  key={sub}
                  onClick={() => setSelectedSubcategory(sub)}
                  className="p-3 rounded-lg border flex justify-between items-center bg-background/50 cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="font-semibold">{sub}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="mt-2 font-semibold">Sin materiales en esta zona</p>
                <p className="text-sm text-muted-foreground">
                  Añade materiales al catálogo con la categoría correcta.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Paso 2 — materiales dentro de la subcategoría */
          <>
            <div className="relative my-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar material..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-2">
              {materialsInSubcategory.length > 0 ? (
                materialsInSubcategory.map((material) => {
                  const alreadyAdded = isAlreadyAdded(material);
                  return (
                    <div
                      key={material.id}
                      className={`p-3 rounded-lg border flex justify-between items-center ${
                        alreadyAdded ? 'bg-muted/50 opacity-60' : 'bg-background/50'
                      }`}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="font-semibold truncate">{material.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {material.description}
                        </p>
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
                  <p className="mt-2 font-semibold">No se encontraron materiales</p>
                  <p className="text-sm text-muted-foreground">Prueba con otra búsqueda.</p>
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
