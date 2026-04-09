import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, ImageOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import AddMaterialModal from '@/components/AddMaterialModal';

const MaterialSelector = ({ materials, onUpdate, userRole }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState({});

  const handleAddMaterial = (materialData) => {
    const newMaterial = {
      id: Date.now().toString(),
      ...materialData,
      createdAt: new Date().toISOString()
    };
    onUpdate([...materials, newMaterial]);
    setIsAddModalOpen(false);
    toast({ title: "Material añadido", description: "El material está listo para la selección del cliente." });
  };
  
  const handleSelectOption = (materialId, optionName) => {
    setSelectedOptions(prev => ({ ...prev, [materialId]: optionName }));
  };

  const handleApprove = (materialId) => {
    const material = materials.find(mat => mat.id === materialId);
    if (!material) return;

    if (!selectedOptions[materialId] && (material.options && material.options.length > 0)) {
       toast({ title: "Selección requerida", description: "Por favor, escoge una opción antes de aprobar.", variant: "destructive" });
       return;
    }
    const updatedMaterials = materials.map(mat => 
      mat.id === materialId ? { ...mat, status: 'approved', selectedOption: selectedOptions[materialId] || null } : mat
    );
    onUpdate(updatedMaterials);
    toast({ title: "Decisión guardada", description: "Has aprobado la selección." });
  };
  
  const handleRequestChange = (materialId) => {
    const updatedMaterials = materials.map(mat =>
      mat.id === materialId ? { ...mat, status: 'rejected' } : mat
    );
    onUpdate(updatedMaterials);
    toast({ title: "Cambio solicitado", description: "Se ha notificado al administrador." });
  };

  const renderMaterialCard = (material) => {
    const isDecisionMade = material.status === 'approved' || material.status === 'rejected';

    return (
      <div key={material.id} className="bg-card p-5 rounded-2xl border">
        <h3 className="font-semibold text-lg text-foreground mb-3">{material.name}</h3>
        {material.description && <p className="text-muted-foreground text-sm mb-4">{material.description}</p>}

        {material.options && material.options.length > 0 && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            {material.options.map(option => (
              <div 
                key={option.name}
                className={`rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${selectedOptions[material.id] === option.name ? 'border-primary' : 'border-transparent'}`}
                onClick={() => !isDecisionMade && handleSelectOption(material.id, option.name)}
              >
                {option.imageUrl ? (
                  <img className="w-full h-24 object-cover" alt={option.name} src={option.imageUrl} />
                ) : (
                  <div className="flex h-24 w-full items-center justify-center bg-muted text-muted-foreground">
                    <ImageOff className="h-5 w-5" />
                  </div>
                )}
                <div className="p-2 bg-card">
                  <p className="font-medium text-center text-sm">{option.name}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {!material.options || material.options.length === 0 ? (
          material.imageUrl ? (
            <img className="w-full h-40 object-cover rounded-lg mb-4" alt={material.name} src={material.imageUrl} />
          ) : (
            <div className="mb-4 flex h-40 w-full items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <ImageOff className="h-6 w-6" />
            </div>
          )
        ) : null}

        {userRole === 'client' && !isDecisionMade && (
          <div className="flex gap-3">
            <Button onClick={() => handleApprove(material.id)} className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
              Aprobar
            </Button>
            <Button onClick={() => handleRequestChange(material.id)} variant="outline" className="w-full">
              Solicitar Cambio
            </Button>
          </div>
        )}

        {isDecisionMade && (
          <div className={`p-3 rounded-lg text-center ${material.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p className="font-semibold text-sm">
              {material.status === 'approved' ? `Aprobado: ${material.selectedOption || 'Opción única'}` : 'Cambio solicitado'}
            </p>
          </div>
        )}
      </div>
    );
  };

  const pendingDecisions = materials.filter(m => m.status === 'pending');
  const pastDecisions = materials.filter(m => m.status !== 'pending');

  return (
    <div className="space-y-8">
      {userRole === 'admin' && (
        <div className="flex justify-end">
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Añadir Decisión
          </Button>
        </div>
      )}

      {materials.length === 0 ? (
         <div className="bg-card border rounded-xl p-12 text-center">
            <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No hay decisiones pendientes</h3>
            <p className="text-muted-foreground">
              {userRole === 'admin' 
                ? 'Añade opciones para que el cliente decida.'
                : 'Las decisiones sobre materiales aparecerán aquí.'}
            </p>
          </div>
      ) : (
        <>
          {pendingDecisions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Decisiones Pendientes</h2>
              <div className="space-y-4">
                {pendingDecisions.map(renderMaterialCard)}
              </div>
            </div>
          )}

          {pastDecisions.length > 0 && (
             <div className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground">Decisiones Anteriores</h2>
              <div className="space-y-4">
                {pastDecisions.map(renderMaterialCard)}
              </div>
            </div>
          )}
        </>
      )}

      <AddMaterialModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSubmit={handleAddMaterial} />
    </div>
  );
};

export default MaterialSelector;
