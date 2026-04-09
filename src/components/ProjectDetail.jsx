import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Home,
  Hammer,
  FileText,
  CheckSquare,
  Trash2,
  Edit,
  Image as ImageIcon,
  Loader2,
  CalendarDays,
  MapPin,
  FolderOpen,
  Sparkles,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import DeleteConfirmDialog from '@/components/DeleteConfirmDialog';
import ProjectHome from '@/components/ProjectHome';
import ProjectWorkProgress from '@/components/ProjectWorkProgress';
import ProjectDocuments from '@/components/ProjectDocuments';
import ProjectDecisions from '@/components/ProjectDecisions';
import GalleryManager from '@/components/GalleryManager';

const ProjectDetail = ({ project, onBack, onUpdate, onDelete, onEdit, userRole, onNavigateToPayment }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="ml-4 text-lg text-muted-foreground">Cargando proyecto...</p>
      </div>
    );
  }

  const handleUpdate = (key, value) => {
    const updatedProject = { ...project, [key]: value };
    onUpdate(updatedProject);
  };

  const handleStatusChange = (newStatus) => {
    handleUpdate('status', newStatus);
  };

  const handleDeleteConfirm = () => {
    onDelete(project.id);
    setShowDeleteDialog(false);
  };

  const statusLabels = {
    planning: 'Planificacion',
    'in-progress': 'En progreso',
    completed: 'Completado',
  };

  const statusStyles = {
    planning: 'bg-amber-100 text-amber-800 border-amber-200',
    'in-progress': 'bg-sky-100 text-sky-800 border-sky-200',
    completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const startDate = project.start_date || project.startDate;
  const estimatedDelivery = project.estimated_delivery || project.estimatedDelivery;
  const clientName = project.client_name || project.clientName || 'Cliente asignado';
  const pendingDocs =
    (project.invoices?.filter((invoice) => !invoice.paid).length || 0) +
    (project.budgets?.filter((budget) => budget.status === 'pending').length || 0);
  const pendingMaterials = project.materials?.filter((material) => material.status === 'pending').length || 0;
  const galleryCount = project.gallery?.length || 0;
  const isClient = userRole === 'client';

  const tabs = {
    home: {
      label: 'Inicio',
      icon: Home,
      component: <ProjectHome project={project} userRole={userRole} setActiveTab={setActiveTab} onUpdate={handleUpdate} />,
    },
    work: {
      label: 'Obra',
      icon: Hammer,
      component: (
        <ProjectWorkProgress
          phases={project.phases}
          onUpdate={(newPhases) => handleUpdate('phases', newPhases)}
          userRole={userRole}
        />
      ),
    },
    documents: {
      label: 'Docs',
      icon: FileText,
      component: (
        <ProjectDocuments
          projectId={project.id}
          invoices={project.invoices}
          certifications={project.certifications}
          budgets={project.budgets}
          onUpdate={handleUpdate}
          userRole={userRole}
          onNavigateToPayment={(certification) => onNavigateToPayment && onNavigateToPayment(certification, project.id)}
        />
      ),
    },
    materials: {
      label: 'Materiales',
      icon: CheckSquare,
      component: (
        <ProjectDecisions
          materials={project.materials}
          onUpdate={(newMaterials) => handleUpdate('materials', newMaterials)}
          userRole={userRole}
        />
      ),
    },
    gallery: {
      label: 'Galeria',
      icon: ImageIcon,
      component: (
        <GalleryManager
          gallery={project.gallery || []}
          onUpdate={(newGallery) => handleUpdate('gallery', newGallery)}
          userRole={userRole}
        />
      ),
    },
  };

  const quickStats = [
    {
      label: 'Cliente',
      value: clientName,
      icon: User,
    },
    {
      label: 'Inicio',
      value: startDate
        ? new Date(startDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })
        : 'Por definir',
      icon: CalendarDays,
    },
    {
      label: 'Ubicacion',
      value: project.location || 'Pendiente',
      icon: MapPin,
    },
    {
      label: 'Galeria',
      value: `${galleryCount} imagen${galleryCount === 1 ? '' : 'es'}`,
      icon: ImageIcon,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-transparent flex flex-col gap-5 sm:gap-6 lg:gap-8 pb-28 lg:pb-0"
      style={{ minHeight: 'calc(100vh - 10rem)' }}
    >
      <div className="flex-grow space-y-5 sm:space-y-6 lg:space-y-8">
        <div className="client-shell rounded-[30px] p-5 sm:p-7 lg:p-8 xl:p-10 overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-[hsl(var(--sage-green)/0.16)] to-transparent" />

          <div className="relative flex items-center justify-between mb-5">
            {userRole === 'admin' ? (
              <Button onClick={onBack} variant="ghost" className="p-0 h-auto text-sm sm:text-base">
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="font-semibold">Todos los Proyectos</span>
              </Button>
            ) : (
              <div />
            )}

            {userRole === 'admin' && (
              <div className="flex items-center gap-2">
                <Button onClick={() => onEdit(project)} variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  onClick={() => setShowDeleteDialog(true)}
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>

          <div className="relative grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_420px] xl:items-start">
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${statusStyles[project.status] || statusStyles.planning}`}>
                  {statusLabels[project.status] || statusLabels.planning}
                </span>
                {isClient && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-foreground/70 border border-white/80">
                    <Sparkles className="w-3.5 h-3.5" />
                    Portal del proyecto
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold text-foreground leading-tight">{project.name}</h1>
                <p className="text-muted-foreground mt-3 text-base sm:text-lg max-w-3xl">{project.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                {quickStats.map((stat) => (
                  <div key={stat.label} className="surface-panel rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-[0.2em]">
                      <stat.icon className="w-4 h-4" />
                      {stat.label}
                    </div>
                    <p className="mt-3 text-sm sm:text-base font-semibold text-foreground">{stat.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="surface-panel rounded-[28px] p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Avance global</p>
                  <p className="text-4xl font-bold mt-2">{project.progress || 0}%</p>
                </div>
                <div className="h-16 w-16 rounded-full border-[10px] border-[hsl(var(--sage-green)/0.22)] flex items-center justify-center text-sm font-bold text-foreground">
                  {project.progress || 0}
                </div>
              </div>

              <div className="w-full bg-secondary/70 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--sage-green))] via-emerald-500 to-sky-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${project.progress || 0}%` }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('documents')}
                  className="rounded-2xl border border-white/80 bg-white/75 p-4 text-left transition hover:border-primary/30 hover:bg-white"
                >
                  <FolderOpen className="w-5 h-5 text-primary" />
                  <p className="mt-3 text-2xl font-bold">{pendingDocs}</p>
                  <p className="text-sm text-muted-foreground">Documentos por revisar</p>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('materials')}
                  className="rounded-2xl border border-white/80 bg-white/75 p-4 text-left transition hover:border-primary/30 hover:bg-white"
                >
                  <CheckSquare className="w-5 h-5 text-primary" />
                  <p className="mt-3 text-2xl font-bold">{pendingMaterials}</p>
                  <p className="text-sm text-muted-foreground">Decisiones pendientes</p>
                </button>
              </div>

              {estimatedDelivery && (
                <div className="rounded-2xl bg-[hsl(var(--sage-green)/0.14)] p-4 border border-[hsl(var(--sage-green)/0.15)]">
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Entrega estimada</p>
                  <p className="mt-2 text-lg font-semibold">
                    {new Date(estimatedDelivery).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}

              {userRole === 'admin' && (
                <div className="w-full">
                  <Select value={project.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-full bg-white/80 border-white/80">
                      <SelectValue placeholder="Cambiar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(statusLabels).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-2 rounded-[22px] border border-white/80 bg-white/65 backdrop-blur-xl p-2 shadow-[0_16px_40px_rgba(57,69,45,0.06)]">
          {Object.entries(tabs).map(([key, tab]) => (
            <Button
              key={key}
              onClick={() => setActiveTab(key)}
              variant={activeTab === key ? 'secondary' : 'ghost'}
              className={`rounded-2xl px-4 py-6 h-auto flex items-center gap-3 transition-all duration-300 ${activeTab === key ? 'bg-white shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === key ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className="font-semibold text-sm">{tab.label}</span>
            </Button>
          ))}
        </div>

        <div className="surface-panel rounded-[28px] p-4 sm:p-6 xl:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {tabs[activeTab].component}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div
        className="lg:hidden fixed left-0 right-0 bottom-0 flex justify-center z-40 px-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
      >
        <div className="flex items-center justify-between w-full max-w-xl gap-1 bg-card/92 backdrop-blur-2xl border border-white/70 p-1.5 rounded-[28px] shadow-[0_-4px_30px_rgba(57,69,45,0.12),0_16px_45px_rgba(57,69,45,0.2)]">
          {Object.entries(tabs).map(([key, tab]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-[22px] flex-1 px-2 py-2.5 flex flex-col items-center gap-1 transition-all duration-300 active:scale-95 ${
                activeTab === key
                  ? 'bg-white shadow-sm'
                  : 'hover:bg-white/50'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === key ? 'text-primary' : 'text-muted-foreground'}`} />
              <span className={`font-semibold text-[11px] leading-none ${activeTab === key ? 'text-foreground' : 'text-muted-foreground'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
        projectName={project.name}
      />
    </motion.div>
  );
};

export default ProjectDetail;
