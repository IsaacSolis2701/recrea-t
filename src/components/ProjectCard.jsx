import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar } from 'lucide-react';

const ProjectCard = ({ project, onClick }) => {
  const statusColors = {
    planning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'in-progress': 'bg-blue-100 text-blue-700 border-blue-200',
    completed: 'bg-green-100 text-green-700 border-green-200',
  };

  const statusLabels = {
    planning: 'Planificacion',
    'in-progress': 'En progreso',
    completed: 'Completado',
  };

  const startDate = project.start_date || project.startDate;
  const clientName = project.client_name || project.clientName || project.client;

  const handleLocationClick = (event) => {
    event.stopPropagation();
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(project.location)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.05)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="surface-panel rounded-[24px] p-6 cursor-pointer transition-all"
    >
      <div className="flex items-start justify-between mb-4 gap-4">
        <h3 className="text-xl font-bold text-foreground">{project.name}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </span>
      </div>

      <div className="space-y-3 mb-4">
        <div
          className="flex items-center gap-2 text-muted-foreground text-sm hover:text-primary transition-colors cursor-pointer"
          onClick={handleLocationClick}
        >
          <MapPin className="w-4 h-4" />
          <span>{project.location}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Calendar className="w-4 h-4" />
          <span>Inicio: {startDate ? new Date(startDate).toLocaleDateString('es-ES') : 'Pendiente'}</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progreso</span>
          <span className="text-primary font-semibold">{project.progress}%</span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${project.progress}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[hsl(var(--sage-green))] via-emerald-500 to-sky-500"
          />
        </div>
      </div>

      {clientName && (
        <div className="mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Cliente: <span className="text-foreground font-medium">{clientName}</span>
          </p>
        </div>
      )}
    </motion.div>
  );
};

export default ProjectCard;
