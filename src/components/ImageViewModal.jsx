import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { motion } from 'framer-motion';

const ImageViewModal = ({ isOpen, onClose, image, imageUrl, altText }) => {
  const resolvedUrl = image?.url || imageUrl;
  const resolvedAlt = image?.description || altText || 'Imagen';
  const resolvedOpen = typeof isOpen === 'boolean' ? isOpen : Boolean(image || imageUrl);

  if (!resolvedOpen || !resolvedUrl) return null;

  return (
    <Dialog open={resolvedOpen} onOpenChange={onClose}>
      <DialogContent className="p-0 bg-transparent border-0 max-w-4xl w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="relative"
        >
          <img src={resolvedUrl} alt={resolvedAlt} className="rounded-lg max-h-[90vh] w-auto mx-auto" />
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageViewModal;
