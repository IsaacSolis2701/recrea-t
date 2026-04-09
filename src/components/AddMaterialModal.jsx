import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Image, Plus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { uploadFile } from '@/lib/apiClient';

const AddMaterialModal = ({ isOpen, onClose, onSubmit, isEditing = false, initialData = null, context = 'project', availableCategories = [], onNewCategory, category, subcategory, availableSubcategories = [] }) => {
  const getInitialFormData = (data, defaultCategory, defaultSubcategory) => ({
    name: data?.name || '',
    description: data?.description || '',
    category: data?.category || defaultCategory || '',
    subcategory: data?.subcategory || defaultSubcategory || '',
    price: data?.price || '',
    brand: data?.brand || '',
    format: data?.format || '',
    imageUrl: data?.image_url || '',
    ambianceImageUrl: data?.ambiance_image_url || '',
  });

  const [formData, setFormData] = useState(getInitialFormData(null, category || availableCategories?.[0], subcategory));
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [showNewSubcategoryInput, setShowNewSubcategoryInput] = useState(false);
  const [newSubcategory, setNewSubcategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [productImageFile, setProductImageFile] = useState(null);
  const [ambianceImageFile, setAmbianceImageFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const defaultCategory = category || (availableCategories.length > 0 ? availableCategories[0] : '');
      if (isEditing && initialData) {
        setFormData(getInitialFormData(initialData, defaultCategory, subcategory));
      } else {
        setFormData(getInitialFormData(null, defaultCategory, subcategory));
      }
      setShowNewCategoryInput(false);
      setNewCategory('');
      setShowNewSubcategoryInput(false);
      setNewSubcategory('');
      setProductImageFile(null);
      setAmbianceImageFile(null);
    }
  }, [isOpen, isEditing, initialData, availableCategories, category]);

  const handleInputChange = (field, value) => {
    setFormData((previousState) => ({ ...previousState, [field]: value }));
  };

  const handleCategoryChange = (value) => {
    if (value === 'create-new') {
      setShowNewCategoryInput(true);
    } else {
      setShowNewCategoryInput(false);
      handleInputChange('category', value);
    }
  };

  const handleAddNewCategory = () => {
    if (newCategory.trim()) {
      const formattedCategory = newCategory.trim().toLowerCase().replace(/\s+/g, '-');
      onNewCategory?.(formattedCategory);
      handleInputChange('category', formattedCategory);
      setShowNewCategoryInput(false);
      setNewCategory('');
    }
  };

  const handleImageChange = (file, field) => {
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    handleInputChange(field, previewUrl);

    if (field === 'imageUrl') {
      setProductImageFile(file);
    } else {
      setAmbianceImageFile(file);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.category && availableCategories.length > 0) {
      toast({
        title: 'Categoría requerida',
        description: 'Por favor, selecciona una categoría para el producto.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let imageUrl = formData.imageUrl;
      let ambianceImageUrl = formData.ambianceImageUrl;

      if (productImageFile) {
        const response = await uploadFile('/uploads/image', productImageFile);
        imageUrl = response.fileUrl;
      }

      if (ambianceImageFile) {
        const response = await uploadFile('/uploads/image', ambianceImageFile);
        ambianceImageUrl = response.fileUrl;
      }

      const materialData = {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || '',
        price: parseFloat(formData.price) || 0,
        brand: formData.brand,
        format: formData.format,
        image_url: imageUrl || null,
        ambiance_image_url: ambianceImageUrl || null,
      };

      await onSubmit(materialData);
    } catch (error) {
      toast({
        title: 'Error al subir imágenes',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const title = context === 'catalog'
    ? (isEditing ? 'Editar Producto del Catálogo' : 'Añadir Producto al Catálogo')
    : (isEditing ? 'Editar Material' : 'Añadir Material');

  const buttonText = context === 'catalog'
    ? (isEditing ? 'Guardar Cambios' : 'Añadir al Catálogo')
    : (isEditing ? 'Guardar Cambios' : 'Crear Material');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">{title}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 max-h-[70vh] overflow-y-auto p-1">
          <div className="space-y-1">
            <Label htmlFor="material-name">Nombre del Producto</Label>
            <Input id="material-name" value={formData.name} onChange={(event) => handleInputChange('name', event.target.value)} placeholder="Ej: Azulejo Metro Blanco" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category-select">Categoría</Label>
            {context !== 'catalog' ? (
              <Input id="category-select" value={formData.category} readOnly />
            ) : !showNewCategoryInput ? (
              <Select value={formData.category} onValueChange={handleCategoryChange}>
                <SelectTrigger id="category-select">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {availableCategories && availableCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ')}</SelectItem>
                  ))}
                  <SelectItem value="create-new" className="text-primary font-semibold">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Crear nueva categoría
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={newCategory}
                  onChange={(event) => setNewCategory(event.target.value)}
                  placeholder="Nombre de la nueva categoría"
                />
                <Button type="button" onClick={handleAddNewCategory}>Añadir</Button>
                <Button type="button" variant="ghost" onClick={() => setShowNewCategoryInput(false)}>Cancelar</Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subcategory-field">Subcategoría</Label>
            {context !== 'catalog' && subcategory ? (
              <Input id="subcategory-field" value={formData.subcategory} readOnly className="bg-muted" />
            ) : !showNewSubcategoryInput ? (
              <Select
                value={formData.subcategory || '__new__'}
                onValueChange={(v) => {
                  if (v === '__new__') { setShowNewSubcategoryInput(true); }
                  else { handleInputChange('subcategory', v); }
                }}
              >
                <SelectTrigger id="subcategory-field">
                  <SelectValue placeholder="Selecciona o crea subcategoría" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubcategories.map((sub) => (
                    <SelectItem key={sub} value={sub}>{sub}</SelectItem>
                  ))}
                  <SelectItem value="__new__" className="text-primary font-semibold">
                    <div className="flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Nueva subcategoría
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={newSubcategory}
                  onChange={(e) => setNewSubcategory(e.target.value)}
                  placeholder="Nombre de la subcategoría"
                />
                <Button
                  type="button"
                  onClick={() => {
                    if (newSubcategory.trim()) {
                      handleInputChange('subcategory', newSubcategory.trim());
                      setShowNewSubcategoryInput(false);
                      setNewSubcategory('');
                    }
                  }}
                >Añadir</Button>
                <Button type="button" variant="ghost" onClick={() => setShowNewSubcategoryInput(false)}>Cancelar</Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="material-price">Precio (€/m²)</Label>
              <Input id="material-price" type="number" step="0.01" value={formData.price} onChange={(event) => handleInputChange('price', event.target.value)} placeholder="25.50" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="material-format">Formato (cm)</Label>
              <Input id="material-format" value={formData.format} onChange={(event) => handleInputChange('format', event.target.value)} placeholder="10x20" />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="material-brand">Marca</Label>
            <Input id="material-brand" value={formData.brand} onChange={(event) => handleInputChange('brand', event.target.value)} placeholder="Ej: Porcelanosa" />
          </div>

          <div className="space-y-1">
            <Label htmlFor="material-desc">Descripción (opcional)</Label>
            <Textarea id="material-desc" rows={2} value={formData.description} onChange={(event) => handleInputChange('description', event.target.value)} placeholder="Acabado brillo, ideal para cocinas." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Imagen del Producto</Label>
              <div className="w-full h-32 rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                {formData.imageUrl ? (
                  <img src={formData.imageUrl} alt="Vista previa" className="h-full w-full object-cover" />
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <Input id="material-image" type="file" accept="image/*" onChange={(event) => handleImageChange(event.target.files[0], 'imageUrl')} className="file:text-primary file:font-semibold" />
            </div>
            <div className="space-y-2">
              <Label>Imagen de Ambiente</Label>
              <div className="w-full h-32 rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
                {formData.ambianceImageUrl ? (
                  <img src={formData.ambianceImageUrl} alt="Vista previa de ambiente" className="h-full w-full object-cover" />
                ) : (
                  <Image className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <Input id="ambiance-image" type="file" accept="image/*" onChange={(event) => handleImageChange(event.target.files[0], 'ambianceImageUrl')} className="file:text-primary file:font-semibold" />
            </div>
          </div>
        </form>

        <DialogFooter className="pt-4">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
            {isSubmitting ? 'Guardando...' : buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddMaterialModal;
