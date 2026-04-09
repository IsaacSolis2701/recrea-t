import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FileUp, Paperclip } from 'lucide-react';
import { uploadFile } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';

const AddCertificationModal = ({ isOpen, onClose, onSubmit, certification }) => {
  const getInitialState = () => ({
    name: certification?.name || '',
    type: certification?.type || '',
    number: certification?.number || '',
    amount: certification?.amount || '',
    expiryDate: certification?.expiryDate || '',
    file: null,
    existingFileName: certification?.file || null,
    existingFileUrl: certification?.fileUrl || null,
  });

  const [formData, setFormData] = useState(getInitialState());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialState());
    }
  }, [isOpen, certification]);

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

      const certificationData = {
        ...certification,
        name: formData.name,
        type: formData.type,
        number: formData.number,
        amount: parseFloat(formData.amount) || 0,
        expiryDate: formData.expiryDate,
        isPaid: certification?.isPaid || false,
        file: fileName,
        fileUrl,
      };

      onSubmit(certificationData);
      setFormData(getInitialState());
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            {certification ? 'Editar Certificación' : 'Añadir Certificación'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre de la Certificación</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Certificado Eléctrico"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <Input
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              placeholder="Ej: Eléctrica, Gas, Estructural"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="number">Número de Certificado</Label>
            <Input
              id="number"
              value={formData.number}
              onChange={(e) => setFormData({ ...formData, number: e.target.value })}
              placeholder="Ej: CE-12345678"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Importe</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="Ej: 500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiryDate">Fecha de Vencimiento</Label>
            <Input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cert-file-upload">Adjuntar PDF (opcional)</Label>
            <div className="flex items-center justify-center w-full">
              <Label htmlFor="cert-file-upload" className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-secondary hover:bg-secondary/80">
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
                <Input id="cert-file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf,application/pdf" />
              </Label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-[#b3c1b3] text-white hover:bg-opacity-90"
            >
              {isSubmitting ? 'Guardando...' : certification ? 'Guardar Cambios' : 'Añadir Certificación'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCertificationModal;
