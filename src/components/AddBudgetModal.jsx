import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUp, Paperclip } from 'lucide-react';
import { uploadFile } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';

const AddBudgetModal = ({ isOpen, onClose, onSubmit, budget }) => {
  const getInitialState = () => ({
    title: budget?.title || '',
    description: budget?.description || '',
    amount: budget?.amount || '',
    file: null,
    existingFileName: budget?.file || null,
    existingFileUrl: budget?.fileUrl || null,
  });

  const [formData, setFormData] = useState(getInitialState());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState());
    }
  }, [budget, isOpen]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      let fileName = formData.existingFileName;
      let fileUrl = formData.existingFileUrl;

      if (formData.file) {
        const response = await uploadFile('/uploads/document', formData.file);
        fileName = response.fileName;
        fileUrl = response.fileUrl;
      }

      onSubmit({
        title: formData.title,
        description: formData.description,
        amount: parseFloat(formData.amount),
        file: fileName,
        fileUrl,
      });
      onClose();
    } catch (error) {
      toast({
        title: 'Error al subir el PDF',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files.length > 0) {
      setFormData({ ...formData, file: event.target.files[0] });
    }
  };

  const isEditing = !!budget;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {isEditing ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del Presupuesto</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(event) => setFormData({ ...formData, title: event.target.value })}
              placeholder="Ej: Presupuesto Inicial"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(event) => setFormData({ ...formData, description: event.target.value })}
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto Total</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(event) => setFormData({ ...formData, amount: event.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file-upload">Adjuntar PDF</Label>
            <div className="flex items-center justify-center w-full">
              <Label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-secondary/80">
                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
                  {formData.file ? (
                    <>
                      <Paperclip className="w-8 h-8 mb-2 text-primary" />
                      <p className="text-sm text-foreground"><span className="font-semibold">{formData.file.name}</span></p>
                    </>
                  ) : formData.existingFileName ? (
                    <>
                      <Paperclip className="w-8 h-8 mb-2 text-primary" />
                      <p className="text-sm text-foreground"><span className="font-semibold">{formData.existingFileName}</span></p>
                    </>
                  ) : (
                    <>
                      <FileUp className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground"><span className="font-semibold">Click para adjuntar</span></p>
                    </>
                  )}
                </div>
                <Input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,application/pdf" />
              </Label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Añadir Presupuesto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddBudgetModal;
