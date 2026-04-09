import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Building2, Clock, CheckCircle2, TrendingUp, UploadCloud, Database } from 'lucide-react';
import ProjectCard from '@/components/ProjectCard';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { apiRequest } from '@/lib/apiClient';
import { seedDemoData } from '@/utils/seedData';

const Dashboard = ({ projects, onSelectProject, userRole, onProjectsLoaded }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [seeded, setSeeded] = useState(localStorage.getItem('seeded_projects') === 'true');
  const demoModeEnabled = import.meta.env.VITE_ENABLE_DEMO_TOOLS === 'true';

  const stats = {
    total: projects.length,
    active: projects.filter((project) => project.status === 'in-progress').length,
    completed: projects.filter((project) => project.status === 'completed').length,
    pending: projects.filter((project) => project.status === 'planning').length,
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const loadOldProjects = async () => {
    setIsLoading(true);

    try {
      await apiRequest('/demo/restore-projects', {
        method: 'POST',
      });
      toast({ title: '¡Proyectos cargados!', description: 'Los proyectos anteriores se han restaurado.' });
      onProjectsLoaded();
      localStorage.setItem('seeded_projects', 'true');
      setSeeded(true);
    } catch (error) {
      toast({ title: 'Error al cargar', description: error.message, variant: 'destructive' });
    }

    setIsLoading(false);
  };

  const handleSeedData = async () => {
    setIsLoading(true);
    toast({ title: 'Generando datos...', description: 'Por favor espera, poblando la base de datos.' });

    const result = await seedDemoData();

    if (result.success) {
      toast({ title: '¡Éxito!', description: 'Datos de demostración generados correctamente.' });
      onProjectsLoaded();
      localStorage.setItem('seeded_projects', 'true');
      setSeeded(true);
    } else {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
    }

    setIsLoading(false);
  };

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl sm:text-4xl font-bold mb-2 text-foreground">Home</h1>
        <p className="text-muted-foreground">
          {userRole === 'admin' ? 'Gestiona y supervisa todos tus proyectos de construcción' : 'Bienvenido a tu portal de proyecto'}
        </p>
      </motion.div>

      {userRole === 'admin' && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          <div className="surface-panel rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-foreground/8 flex items-center justify-center">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <span className="text-3xl sm:text-4xl font-bold text-foreground">{stats.total}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Obras Abiertas</p>
          </div>

          <div className="surface-panel rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
              </div>
              <span className="text-3xl sm:text-4xl font-bold text-foreground">{stats.active}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">En Progreso</p>
          </div>

          <div className="surface-panel rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
              </div>
              <span className="text-3xl sm:text-4xl font-bold text-foreground">{stats.completed}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Completados</p>
          </div>

          <div className="surface-panel rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" />
              </div>
              <span className="text-3xl sm:text-4xl font-bold text-foreground">{stats.pending}</span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">Planificación</p>
          </div>
        </motion.div>
      )}

      {userRole === 'admin' && (
        <motion.div variants={itemVariants}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-foreground">Proyectos Recientes</h2>
            <div className="flex gap-2">
              {demoModeEnabled && !seeded && (
                <Button variant="outline" onClick={loadOldProjects} disabled={isLoading}>
                  <UploadCloud className="w-4 h-4 mr-2" />
                  Restaurar Proyectos
                </Button>
              )}
              {demoModeEnabled && (
                <Button onClick={handleSeedData} disabled={isLoading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Database className="w-4 h-4 mr-2" />
                  {isLoading ? 'Generando...' : 'Generar Datos Demo'}
                </Button>
              )}
            </div>
          </div>
          {projects.length === 0 ? (
            <div className="bg-card rounded-xl p-12 text-center border">
              <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">No hay proyectos aún</h3>
              <p className="text-muted-foreground">
                {demoModeEnabled
                  ? (seeded ? 'Comienza creando tu primer proyecto nuevo.' : 'Puedes crear un proyecto nuevo, cargar los anteriores o generar datos de demo.')
                  : 'Comienza creando tu primer proyecto nuevo.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} onClick={() => onSelectProject(project)} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default Dashboard;
