import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ClientPDFViewer from '@/components/ClientPDFViewer';

const ClientPDFPage = ({ onBack }) => {
  return (
    <motion.div
      key="client-pdf-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-6"
    >
      <Button
        variant="ghost"
        onClick={onBack}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <ClientPDFViewer />
    </motion.div>
  );
};

export default ClientPDFPage;