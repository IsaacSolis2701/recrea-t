import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Tag, Ruler, ZoomIn, ImageOff } from 'lucide-react';

const MaterialDetail = ({ decision, onUpdate, userRole, onViewImage }) => {
  const options = Array.isArray(decision.options) && decision.options.length > 0
    ? decision.options
    : [{
        id: `${decision.id}-default`,
        name: decision.name,
        price: decision.price,
        brand: decision.brand,
        format: decision.format,
        description: decision.description,
        imageUrl: decision.image_url,
        status: decision.status === 'approved' ? 'approved' : 'pending',
      }];

  const [selectedOptionId, setSelectedOptionId] = useState(() => {
    const approvedOption = options.find((option) => option.status === 'approved');
    return approvedOption ? approvedOption.id : options[0]?.id || null;
  });
  const [showChangeForm, setShowChangeForm] = useState(false);
  const [changeNote, setChangeNote] = useState('');

  const isDecisionMade = decision.status === 'approved' || decision.status === 'rejected' || decision.status === 'cancelled';

  const handleSelectOption = (optionId) => {
    if (isDecisionMade) return;
    setSelectedOptionId(optionId);
  };

  const handleApprove = () => {
    if (!selectedOptionId) {
      toast({
        title: 'Selección requerida',
        description: 'Por favor, elige una opción antes de aprobar.',
        variant: 'destructive'
      });
      return;
    }

    const updatedOptions = options.map((option) => ({
      ...option,
      status: option.id === selectedOptionId ? 'approved' : 'rejected'
    }));

    onUpdate({ ...decision, options: updatedOptions, status: 'approved' });
    toast({ title: 'Decisión guardada', description: 'Has aprobado la selección.' });
  };

  const handleSubmitChange = () => {
    if (!changeNote.trim()) {
      toast({
        title: 'Descripción requerida',
        description: 'Por favor, describe el cambio que solicitas antes de enviar.',
        variant: 'destructive'
      });
      return;
    }
    onUpdate({ ...decision, status: 'rejected', changeNote: changeNote.trim() });
    toast({ title: 'Cambio solicitado', description: 'Se ha notificado al administrador.' });
    setShowChangeForm(false);
    setChangeNote('');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {options.map((option) => (
          <motion.div
            key={option.id}
            className={`bg-card p-4 rounded-xl border-2 transition-all ${selectedOptionId === option.id ? 'border-primary' : 'border-card'}`}
            whileHover={{ scale: isDecisionMade ? 1 : 1.02 }}
          >
            <div className="flex items-start gap-4">
              <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-secondary group">
                {option.imageUrl ? (
                  <>
                    <img className="w-full h-full object-cover" alt={option.name} src={option.imageUrl} />
                    <div
                      onClick={() => onViewImage({ url: option.imageUrl, description: option.name })}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <ZoomIn className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-muted text-muted-foreground">
                    <ImageOff className="w-5 h-5" />
                    <span className="text-[10px] font-medium uppercase tracking-[0.2em]">Sin imagen</span>
                  </div>
                )}
              </div>
              <div className="flex-1" onClick={() => handleSelectOption(option.id)}>
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-lg text-foreground">{option.name}</h4>
                  <span className="font-semibold text-primary">{Number(option.price || 0)} €/m²</span>
                </div>
                <div className="flex flex-col gap-2 mt-2">
                  {option.brand && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Tag className="w-4 h-4" />
                      <span>{option.brand}</span>
                    </div>
                  )}
                  {option.format && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Ruler className="w-4 h-4" />
                      <span>{option.format} cm</span>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-2">{option.description}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {decision.status === 'approved' && (
        <div className="p-4 rounded-lg text-center bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
          <p className="font-semibold">
            Aprobaste: {options.find((option) => option.id === selectedOptionId)?.name || ''}
          </p>
        </div>
      )}

      {decision.status === 'rejected' && (
        <div className="p-4 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300">
          {userRole === 'admin' ? (
            <>
              <p className="font-semibold">El cliente ha solicitado un cambio:</p>
              {decision.changeNote ? (
                <p className="text-sm mt-2 italic">"{decision.changeNote}"</p>
              ) : (
                <p className="text-sm mt-2 opacity-70">Sin mensaje adicional.</p>
              )}
            </>
          ) : (
            <>
              <p className="font-semibold text-center">Has solicitado un cambio para este material.</p>
              {decision.changeNote && (
                <p className="text-sm mt-2 italic text-center">"{decision.changeNote}"</p>
              )}
            </>
          )}
        </div>
      )}

      {decision.status === 'cancelled' && (
        <div className="p-4 rounded-lg text-center bg-gray-100 text-gray-600">
          <p className="font-semibold">Este material ha sido cancelado automáticamente.</p>
        </div>
      )}

      {userRole === 'client' && decision.status === 'pending' && (
        <div className="sticky bottom-20 space-y-3">
          <Button onClick={handleApprove} className="w-full h-12 text-base" disabled={!selectedOptionId}>
            Aprobar selección
          </Button>

          {!showChangeForm ? (
            <Button
              onClick={() => setShowChangeForm(true)}
              variant="outline"
              className="w-full h-12 text-base"
            >
              Solicitar cambio
            </Button>
          ) : (
            <div className="space-y-2 p-4 rounded-xl border bg-card">
              <p className="text-sm font-semibold text-foreground">Describe el cambio que necesitas:</p>
              <Textarea
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder="Explica qué cambio necesitas para este material..."
                rows={3}
                className="resize-none"
                autoFocus
              />
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => { setShowChangeForm(false); setChangeNote(''); }}
                >
                  Cancelar
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSubmitChange}
                  disabled={!changeNote.trim()}
                >
                  Enviar solicitud
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {decision.renderUrl && (
        <div className="space-y-4 pt-4">
          <h3 className="text-xl font-bold text-foreground">Render</h3>
          <div className="rounded-xl overflow-hidden border aspect-video bg-secondary">
            <img className="w-full h-full object-cover" alt="Render del material aplicado" src={decision.renderUrl} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialDetail;
