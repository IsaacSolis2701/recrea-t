import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminPDFManager from '@/components/AdminPDFManager';
import ProtectedRoute from '@/components/ProtectedRoute';

const AdminPDFPage = ({ onBack }) => {
  return (
    <ProtectedRoute requiredRole="admin">
      <motion.div
        key="admin-pdf-page"
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
          Back to Dashboard
        </Button>

        <AdminPDFManager />
      </motion.div>
    </ProtectedRoute>
  );
};

export default AdminPDFPage;