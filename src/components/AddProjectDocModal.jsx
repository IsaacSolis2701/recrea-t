import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileUp, Paperclip } from 'lucide-react';
import { uploadFile } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';

const DOC_TYPES = [
  { value: 'contrato', label: 'Contrato firmado' },
  { value: 'licencia', label: 'Licencia de urbanismo' },
  { value: 'permiso', label: 'Permiso de obras' },
  { value: 'otro', label: 'Otro documento' },
];

const AddProjectDocModal = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({ name: '', type: 'contrato', file: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) setFormData({ name: '', type: 'contrato', file: null });
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      toast({ title: 'Archivo requerido', description: 'Debes adjuntar un archivo.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await uploadFile('/uploads/document', formData.file);
      onSubmit({
        name: formData.name || DOC_TYPES.find((t) => t.value === formData.type)?.label || formData.type,
        type: formData.type,
        file: response.fileName,
        fileUrl: response.fileUrl,
      });
      onClose();
    } catch (error) {
      toast({ title: 'Error al subir el archivo', description: error.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Añadir documento</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Tipo de documento</Label>
            <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DOC_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nombre del documento <span className="text-muted-foreground text-xs">(opcional)</span></Label>
            <Input
              placeholder="Ej: Contrato Obra Mayo 2025"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Archivo</Label>
            <Label
              htmlFor="doc-file-upload"
              className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-secondary/80"
            >
              {formData.file ? (
                <div className="flex flex-col items-center">
                  <Paperclip className="w-6 h-6 mb-1 text-primary" />
                  <p className="text-sm font-semibold text-foreground">{formData.file.name}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-muted-foreground">
                  <FileUp className="w-6 h-6 mb-1" />
                  <p className="text-sm font-semibold">Click para adjuntar</p>
                  <p className="text-xs">PDF, imagen o documento</p>
                </div>
              )}
              <Input
                id="doc-file-upload"
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => e.target.files[0] && setFormData({ ...formData, file: e.target.files[0] })}
              />
            </Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Subiendo...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectDocModal;
