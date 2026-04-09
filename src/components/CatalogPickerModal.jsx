import React, { useState } from 'react';
    import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
    import { Button } from '@/components/ui/button';
    import { Input } from '@/components/ui/input';
    import { Package, Search } from 'lucide-react';

    const CatalogPickerModal = ({ isOpen, onClose, materials, onSelect }) => {
      const [searchTerm, setSearchTerm] = useState('');

      const filteredMaterials = materials.filter(material => 
        material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        material.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="bg-card border max-w-md">
            <DialogHeader>
              <DialogTitle>Elegir del Catálogo</DialogTitle>
              <DialogDescription>
                Selecciona un material de tu catálogo para añadirlo al proyecto.
              </DialogDescription>
            </DialogHeader>

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
                {filteredMaterials.length > 0 ? (
                    filteredMaterials.map(material => (
                        <div key={material.id} className="p-3 rounded-lg border bg-background/50 flex justify-between items-center">
                            <div>
                                <p className="font-semibold">{material.name}</p>
                                <p className="text-sm text-muted-foreground">{material.description}</p>
                            </div>
                            <Button size="sm" onClick={() => onSelect(material)}>Añadir</Button>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8">
                        <Package className="w-12 h-12 mx-auto text-muted-foreground"/>
                        <p className="mt-2 font-semibold">No se encontraron materiales</p>
                        <p className="text-sm text-muted-foreground">Prueba con otra búsqueda o añade más materiales al catálogo.</p>
                    </div>
                )}
            </div>
          </DialogContent>
        </Dialog>
      );
    };

    export default CatalogPickerModal;