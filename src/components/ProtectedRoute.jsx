import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user } = useAuth();

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <ShieldAlert className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Authentication Required</h2>
        <p className="text-muted-foreground">
          Please log in to access this page
        </p>
      </motion.div>
    );
  }

  if (requiredRole && user.role !== requiredRole) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20"
      >
        <ShieldAlert className="w-16 h-16 text-destructive mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground">
          You don't have permission to access this page
        </p>
      </motion.div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
