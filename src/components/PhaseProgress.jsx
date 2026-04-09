import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';

const PhaseProgress = ({ phases, onUpdate, userRole }) => {
  const handleProgressChange = (phaseId, newProgress) => {
    if (userRole !== 'admin') {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden actualizar el progreso",
        variant: "destructive"
      });
      return;
    }

    const updatedPhases = phases.map(phase => {
      if (phase.id === phaseId) {
        let status = 'pending';
        if (newProgress[0] > 0 && newProgress[0] < 100) status = 'active';
        if (newProgress[0] === 100) status = 'completed';
        
        return { ...phase, progress: newProgress[0], status };
      }
      return phase;
    });

    onUpdate(updatedPhases);
    
    toast({
      title: "Progreso actualizado",
      description: "El progreso de la fase ha sido actualizado exitosamente",
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'active':
        return <Clock className="w-6 h-6 text-blue-500" />;
      default:
        return <Circle className="w-6 h-6 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-4">
      {phases.map((phase, index) => (
        <motion.div
          key={phase.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card rounded-xl p-4 border"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {getStatusIcon(phase.status)}
              <div>
                <h3 className="text-lg font-semibold text-foreground">{phase.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">{phase.status}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">{phase.progress}%</div>
            </div>
          </div>
          
          <Slider
            value={[phase.progress]}
            onValueChange={(value) => handleProgressChange(phase.id, value)}
            max={100}
            step={5}
            className="w-full"
            disabled={userRole !== 'admin'}
          />
        </motion.div>
      ))}
    </div>
  );
};

export default PhaseProgress;