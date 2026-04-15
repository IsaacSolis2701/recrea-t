import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Package, CheckCircle2, AlertTriangle, Edit, Ban, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MaterialList = ({ decisions, onSelectDecision, onEditDecision, onDeleteDecision, userRole, gridLayout = false }) => {
  if (!decisions || decisions.length === 0) {
    return (
      <div className="bg-card border rounded-xl p-12 text-center shadow-sm">
        <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-foreground mb-2">No hay materiales</h3>
        <p className="text-muted-foreground">
          No se encontraron materiales para mostrar.
        </p>
      </div>
    );
  }

  const getStatus = (decision) => {
    if (decision.status === 'approved') {
      return (
        <div className="flex items-center gap-1 text-green-600">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-medium">Decidido</span>
        </div>
      );
    }
    if (decision.status === 'rejected') {
        return (
          <div className="flex items-center gap-1 text-yellow-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Cambio</span>
          </div>
        );
      }
    if (decision.status === 'cancelled') {
      return (
        <div className="flex items-center gap-1 text-gray-400">
          <Ban className="w-4 h-4" />
          <span className="text-sm font-medium">Cancelado</span>
        </div>
      );
    }
    return <span className="text-sm text-primary font-semibold">Pendiente</span>;
  }

  if (gridLayout) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {decisions.map((decision, index) => (
          <motion.div
            key={decision.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-card rounded-xl border overflow-hidden hover:shadow-md transition-shadow group cursor-pointer flex flex-col"
            onClick={() => onSelectDecision(decision)}
          >
            <div className="h-32 bg-secondary flex items-center justify-center relative overflow-hidden">
               {decision.image_url ? (
                 <img src={decision.image_url} alt={decision.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
               ) : (
                 <Package className="w-10 h-10 text-muted-foreground" />
               )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <h3 className="font-semibold text-foreground line-clamp-1">{decision.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2 mt-1 flex-1">{decision.description}</p>
              <div className="flex items-center justify-between mt-4 pt-2 border-t">
                {getStatus(decision)}
                {userRole === 'admin' && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEditDecision(decision); }}>
                    <Edit className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {decisions.map((decision, index) => (
        <motion.div
          key={decision.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-card p-4 rounded-xl border flex items-center justify-between shadow-sm hover:shadow-md transition-shadow"
        >
          <div onClick={() => onSelectDecision(decision)} className="flex-grow cursor-pointer">
            <h3 className="font-semibold text-foreground">{decision.name}</h3>
            <p className="text-sm text-muted-foreground">{decision.description}</p>
          </div>
          <div className="flex items-center gap-3">
            {getStatus(decision)}
            {userRole === 'admin' && (
              <>
                <Button variant="ghost" size="icon" onClick={() => onEditDecision(decision)}>
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </Button>
                {decision.status === 'pending' && onDeleteDecision && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onDeleteDecision(decision); }}
                    className="hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </>
            )}
            <ChevronRight onClick={() => onSelectDecision(decision)} className="w-5 h-5 text-muted-foreground cursor-pointer" />
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default MaterialList;