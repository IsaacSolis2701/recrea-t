import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ListTodo, Hammer, CheckSquare, CalendarDays, Plus, Save, Edit, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const ProjectWorkProgress = ({ phases, onUpdate, userRole }) => {
  const [editingPhases, setEditingPhases] = useState(false);
  const [tempPhases, setTempPhases] = useState(phases);

  const handleStartEditing = () => {
    setTempPhases(JSON.parse(JSON.stringify(phases))); // Deep copy
    setEditingPhases(true);
  };

  const handleCancelEditing = () => {
    setEditingPhases(false);
  };

  const handleSaveChanges = () => {
    onUpdate(tempPhases);
    setEditingPhases(false);
    toast({ title: "Fases guardadas", description: "La lista de fases de obra ha sido actualizada." });
  };
  
  const handleTempPhaseChange = (id, field, value) => {
    setTempPhases(tempPhases.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  
  const handleAddPhase = () => {
    const newPhase = {
      id: `temp_${Date.now()}`,
      name: 'Nueva Fase',
      status: 'pending',
      date: null,
    };
    setTempPhases([...tempPhases, newPhase]);
  };
  
  const handleRemovePhase = (id) => {
    setTempPhases(tempPhases.filter(p => p.id !== id));
  };

  const handleStatusChange = (phaseId, newStatus) => {
    const updatedPhases = phases.map(phase =>
      phase.id === phaseId ? { ...phase, status: newStatus } : phase
    );
    onUpdate(updatedPhases);
    toast({ title: "Fase actualizada", description: "El estado de la fase ha cambiado." });
  };
  
  const handleDateChange = (phaseId, newDate) => {
    const updatedPhases = phases.map(phase =>
      phase.id === phaseId ? { ...phase, date: newDate } : phase
    );
    onUpdate(updatedPhases);
    toast({ title: "Fase actualizada", description: "La fecha de la fase ha cambiado." });
  };
  
  const getStatusIcon = (status) => {
    const commonClass = "w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0";
    switch (status) {
      case 'completed':
        return <div className={`${commonClass} bg-green-400`}><CheckSquare className="w-5 h-5" /></div>;
      case 'active':
        return <div className={`${commonClass} bg-blue-400`}><Hammer className="w-5 h-5" /></div>;
      default:
        return <div className={`${commonClass} bg-gray-300`}><ListTodo className="w-5 h-5" /></div>;
    }
  };
  
  const phaseStatusOptions = {
    pending: 'Pendiente',
    active: 'En Progreso',
    completed: 'Completado'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Fases de la Obra</h2>
        {userRole === 'admin' && !editingPhases && (
          <Button variant="outline" size="sm" onClick={handleStartEditing}>
            <Edit className="w-4 h-4 mr-2" />
            Editar Fases
          </Button>
        )}
      </div>
      
      {editingPhases && userRole === 'admin' ? (
        <div className="bg-card border rounded-xl p-4 space-y-4">
          <h3 className="text-lg font-semibold">Editando Fases</h3>
          {tempPhases.map((phase, index) => (
            <div key={phase.id} className="flex items-center gap-2">
              <Input 
                value={phase.name}
                onChange={(e) => handleTempPhaseChange(phase.id, 'name', e.target.value)}
                placeholder="Nombre de la fase"
              />
              <Button variant="ghost" size="icon" onClick={() => handleRemovePhase(phase.id)} className="text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          <Button variant="outline" onClick={handleAddPhase} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Añadir Fase
          </Button>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={handleCancelEditing}>Cancelar</Button>
            <Button onClick={handleSaveChanges}>
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative pl-4 sm:pl-6">
            <div className="absolute left-8 sm:left-10 top-0 bottom-0 w-0.5 bg-border -translate-x-1/2"></div>
            <div className="space-y-6">
                {phases.map((phase, index) => (
                <motion.div 
                    key={phase.id}
                    className="relative flex items-start gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15 }}
                >
                    <div className="absolute left-4 sm:left-6 top-0 z-10 -translate-x-1/2">
                        {getStatusIcon(phase.status)}
                    </div>
                    <div className="flex-1 ml-10 sm:ml-12 bg-card border rounded-xl p-3 shadow-sm">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                            <h3 className="font-bold text-lg text-foreground md:col-span-1">{phase.name}</h3>

                            {userRole === 'admin' ? (
                              <>
                                <div className="md:col-span-1">
                                  <Select value={phase.status} onValueChange={(value) => handleStatusChange(phase.id, value)}>
                                      <SelectTrigger>
                                          <SelectValue placeholder="Estado"/>
                                      </SelectTrigger>
                                      <SelectContent>
                                          {Object.entries(phaseStatusOptions).map(([key, label]) => (
                                              <SelectItem key={key} value={key}>{label}</SelectItem>
                                          ))}
                                      </SelectContent>
                                  </Select>
                                </div>
                                <div className="relative md:col-span-1">
                                    <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input 
                                      type="date"
                                      value={phase.date ? phase.date.split('T')[0] : ''}
                                      onChange={(e) => handleDateChange(phase.id, e.target.value)}
                                      className="pl-9"
                                    />
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-muted-foreground capitalize md:col-span-1">
                                    {phaseStatusOptions[phase.status]}
                                </p>
                                {phase.date && (
                                    <p className="text-sm text-muted-foreground md:col-span-1">
                                        {new Date(phase.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </p>
                                )}
                              </>
                            )}
                        </div>
                    </div>
                </motion.div>
                ))}
            </div>
        </div>
      )}
    </div>
  );
};

export default ProjectWorkProgress;