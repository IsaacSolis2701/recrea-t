import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Plus, X, ZoomIn, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import ImageFormModal from '@/components/ImageFormModal';
import ImageViewModal from '@/components/ImageViewModal';

const GalleryManager = ({ gallery, onUpdate, userRole, phases }) => {
  const [modalState, setModalState] = useState({ isOpen: false, image: null });
  const [selectedImage, setSelectedImage] = useState(null);

  const handleSaveImage = (imageData) => {
    let updatedGallery;

    if (modalState.image) {
      updatedGallery = gallery.map((image) => (image.id === imageData.id ? { ...image, ...imageData } : image));
      toast({
        title: 'Imagen actualizada',
        description: 'Los detalles de la imagen han sido guardados.',
      });
    } else {
      updatedGallery = [...gallery, imageData];
      toast({
        title: 'Imagen anadida',
        description: 'La imagen ha sido anadida a la galeria.',
      });
    }

    onUpdate(updatedGallery);
    setModalState({ isOpen: false, image: null });
  };

  const handleDeleteImage = (imageId) => {
    if (userRole !== 'admin') {
      toast({
        title: 'Acceso denegado',
        description: 'Solo los administradores pueden eliminar imagenes.',
        variant: 'destructive',
      });
      return;
    }

    const updatedGallery = gallery.filter((image) => image.id !== imageId);
    onUpdate(updatedGallery);
    toast({
      title: 'Imagen eliminada',
      description: 'La imagen ha sido removida de la galeria.',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Galeria</h2>
        {userRole === 'admin' && (
          <Button onClick={() => setModalState({ isOpen: true, image: null })} className="bg-[#b3c1b3] text-white hover:bg-opacity-90">
            <Plus className="w-4 h-4 mr-2" />
            Anadir imagen
          </Button>
        )}
      </div>

      {gallery.length === 0 ? (
        <div className="bg-white/75 border border-white/80 rounded-[26px] p-12 text-center shadow-sm">
          <ImageIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">No hay imagenes en la galeria</h3>
          <p className="text-muted-foreground">
            {userRole === 'admin' ? 'Comienza anadiendo fotos del progreso de la obra.' : 'Las imagenes del proyecto apareceran aqui.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {gallery.map((image, index) => (
              <motion.div
                key={image.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ delay: index * 0.05 }}
                className="relative group bg-card rounded-[24px] overflow-hidden aspect-[4/3] border border-white/80 shadow-sm"
              >
                <img src={image.url} alt={image.description} className="w-full h-full object-cover" />

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-end">
                  <div className="p-4">
                    <p className="text-white text-sm font-semibold mb-1">{image.phase}</p>
                    <p className="text-gray-200 text-xs">{image.description}</p>
                    <p className="text-gray-300 text-xs mt-1">
                      {new Date(image.uploadedAt).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>

                <div className="absolute top-2 right-2 flex gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" onClick={() => setSelectedImage(image)} className="bg-black/50 hover:bg-black/70 text-white w-8 h-8">
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  {userRole === 'admin' && (
                    <>
                      <Button size="icon" variant="ghost" onClick={() => setModalState({ isOpen: true, image })} className="bg-black/50 hover:bg-black/70 text-white w-8 h-8">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDeleteImage(image.id)} className="bg-red-500/80 hover:bg-red-600 text-white w-8 h-8">
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      <ImageFormModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, image: null })}
        onSubmit={handleSaveImage}
        image={modalState.image}
        phases={phases}
      />

      <ImageViewModal image={selectedImage} onClose={() => setSelectedImage(null)} />
    </div>
  );
};

export default GalleryManager;
