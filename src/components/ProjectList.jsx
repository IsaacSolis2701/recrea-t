import React from 'react';
import { motion } from 'framer-motion';
import ProjectCard from '@/components/ProjectCard';

const ProjectList = ({ projects, onSelectProject }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="space-y-6"
    >
      <h1 className="text-3xl font-bold text-white">Todos los Proyectos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onClick={() => onSelectProject(project)}
          />
        ))}
      </div>
    </motion.div>
  );
};

export default ProjectList;