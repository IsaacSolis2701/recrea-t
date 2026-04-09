import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { uploadFile } from '@/lib/apiClient';

const DEFAULT_PHASE_NAMES = [
  'PreReforma',
  'Inicio de Obra',
  'Demolición',
  'Tabiquería',
  'Instalaciones',
  'Acabados',
  'Entrega',
];

const ImageFormModal = ({ isOpen, onClose, onSubmit, image, phases }) => {
  const [formData, setFormData] = useState({
    url: '',
    description: '',
    phase: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Build phase options from project phases or use defaults
  const phaseNames = phases && phases.length > 0
    ? phases.map((p) => p.name)
    : DEFAULT_PHASE_NAMES;

  useEffect(() => {
    if (image) {
      setFormData({
        url: image.url,
        description: image.description,
        phase: image.phase
      });
    } else {
      setFormData({
        url: '',
        description: '',
        phase: phaseNames[0] || ''
      });
    }
    setSelectedFile(null);
  }, [image, isOpen]);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFormData((previousValue) => ({ ...previousValue, url: URL.createObjectURL(file) }));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!formData.url && !image) {
      toast({
        title: 'Error',
        description: 'Por favor, adjunta una imagen o proporciona una URL.',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.phase) {
      toast({
        title: 'Error',
        description: 'Por favor, selecciona la fase del proyecto.',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let finalUrl = formData.url;

      if (selectedFile) {
        const response = await uploadFile('/uploads/image', selectedFile);
        finalUrl = response.fileUrl;
      }

      const dataToSubmit = {
        ...formData,
        url: finalUrl,
        id: image ? image.id : Date.now().toString(),
        uploadedAt: image ? image.uploadedAt : new Date().toISOString()
      };

      onSubmit(dataToSubmit);
      onClose();
    } catch (error) {
      toast({
        title: 'Error al subir la imagen',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!image;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {isEditing ? 'Editar Imagen' : 'Añadir Imagen'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="imageFile">{isEditing ? 'Archivo de Imagen' : 'Adjuntar Imagen'}</Label>
            {isEditing ? (
              <div className="p-2 bg-muted rounded-md">
                <img src={formData.url} alt="Previsualización" className="w-full h-auto max-h-48 object-contain rounded" />
                <p className="text-xs text-muted-foreground mt-2 text-center">Puedes reemplazarla subiendo otra imagen.</p>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-2 file:text-primary file:font-semibold file:bg-primary/10 file:border-0 file:rounded-md file:py-1 file:px-3 file:mr-4 hover:file:bg-primary/20"
                />
              </div>
            ) : (
              <>
                <Input
                  id="imageFile"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="file:text-primary file:font-semibold file:bg-primary/10 file:border-0 file:rounded-md file:py-1 file:px-3 file:mr-4 hover:file:bg-primary/20"
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground mt-1">Archivo seleccionado: {selectedFile.name}</p>
                )}
                {!selectedFile && (
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(event) => setFormData({ ...formData, url: event.target.value })}
                    placeholder="O introduce una URL de imagen si no adjuntas un archivo"
                    className="mt-2"
                  />
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phase">Fase del Proyecto</Label>
            <Select
              value={formData.phase}
              onValueChange={(value) => setFormData({ ...formData, phase: value })}
            >
              <SelectTrigger id="phase">
                <SelectValue placeholder="Selecciona la fase..." />
              </SelectTrigger>
              <SelectContent>
                {phaseNames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              className="flex-1 bg-[#b3c1b3] text-white hover:bg-opacity-90"
            >
              {isSubmitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Añadir Imagen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ImageFormModal;
