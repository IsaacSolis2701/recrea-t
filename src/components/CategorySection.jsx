import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Package, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CategorySection = ({ category, materials, onEdit, onDelete, onViewImage }) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="mb-8 bg-card rounded-xl border overflow-hidden shadow-sm">
      <div 
        className="p-4 bg-muted/30 flex items-center justify-between cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground capitalize">{category.name}</h3>
            {category.description && (
              <p className="text-sm text-muted-foreground">{category.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {materials.length} {materials.length === 1 ? 'producto' : 'productos'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon">
          {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </Button>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4">
              {materials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No hay productos en esta categoría.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {materials.map(material => (
                    <motion.div
                      key={material.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-card rounded-xl border overflow-hidden group shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="h-40 bg-secondary flex items-center justify-center overflow-hidden relative">
                        {material.image_url ? (
                          <img src={material.image_url} alt={material.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        ) : (
                          <Package className="w-12 h-12 text-muted-foreground" />
                        )}
                        {material.ambiance_image_url && (
                          <div className="absolute bottom-2 right-2">
                            <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full" onClick={(e) => { e.stopPropagation(); onViewImage({url: material.ambiance_image_url, alt: `${material.name} - vista de ambiente`}); }}>
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 mr-2">
                            <h4 className="font-semibold text-foreground leading-tight">{material.name}</h4>
                          </div>
                          {material.price && (
                             <p className="text-sm font-bold text-foreground">{material.price}€<span className="font-normal text-muted-foreground text-xs">/m²</span></p>
                          )}
                        </div>
                         <p className="text-sm text-muted-foreground mt-2 truncate">{material.brand || material.description}</p>
                      </div>
                      <div className="p-2 border-t bg-muted/10 flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => onEdit(material)}>
                            <Edit className="w-4 h-4 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDelete(material.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CategorySection;