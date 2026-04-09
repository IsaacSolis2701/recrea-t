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
  const [headerExpanded, setHeaderExpanded] = useState(false);

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
          phases={project.phases || []}
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
      className="bg-transparent flex flex-col gap-4 pb-28"
      style={{ minHeight: 'calc(100vh - 10rem)' }}
    >
      <div className="flex-grow space-y-4">
        {/* Compact header — always visible */}
        <div className="client-shell rounded-[24px] overflow-hidden relative">
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[hsl(var(--sage-green)/0.16)] to-transparent" />

          <div className="relative px-4 sm:px-6 pt-4 pb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {userRole === 'admin' && (
                <Button onClick={onBack} variant="ghost" size="sm" className="p-0 h-auto shrink-0">
                  <ArrowLeft className="w-4 h-4 mr-1.5" />
                  <span className="font-semibold text-sm hidden sm:inline">Proyectos</span>
                </Button>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-bold text-foreground leading-tight truncate">{project.name}</h1>
                  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] shrink-0 ${statusStyles[project.status] || statusStyles.planning}`}>
                    {statusLabels[project.status] || statusLabels.planning}
                  </span>
                </div>
                {project.location && (
                  <div className="flex items-center gap-1 mt-0.5 text-xs text-muted-foreground">
                    <MapPin className="w-3 h-3 shrink-0" />
                    <span className="truncate">{project.location}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Progress pill */}
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-white/70 border border-white/80 px-3 py-1.5">
                <div className="w-16 h-1.5 rounded-full bg-secondary/70 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--sage-green))] to-sky-400"
                    style={{ width: `${project.progress || 0}%` }}
                  />
                </div>
                <span className="text-xs font-bold text-foreground">{project.progress || 0}%</span>
              </div>

              {userRole === 'admin' && (
                <>
                  <Button onClick={() => onEdit(project)} variant="outline" size="sm" className="h-8 px-3">
                    <Edit className="w-3.5 h-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline text-xs">Editar</span>
                  </Button>
                  <Button
                    onClick={() => setShowDeleteDialog(true)}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}

              <button
                type="button"
                onClick={() => setHeaderExpanded((v) => !v)}
                className="h-8 w-8 rounded-full bg-white/70 border border-white/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <motion.span
                  animate={{ rotate: headerExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-center"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </motion.span>
              </button>
            </div>
          </div>

          {/* Expandable detail section */}
          <AnimatePresence initial={false}>
            {headerExpanded && (
              <motion.div
                key="expanded"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="px-4 sm:px-6 pb-5 space-y-4">
                  {project.description && (
                    <p className="text-muted-foreground text-sm max-w-3xl">{project.description}</p>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {quickStats.map((stat) => (
                      <div key={stat.label} className="surface-panel rounded-2xl p-3.5">
                        <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] uppercase tracking-[0.2em]">
                          <stat.icon className="w-3.5 h-3.5" />
                          {stat.label}
                        </div>
                        <p className="mt-2 text-sm font-semibold text-foreground">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="surface-panel rounded-[20px] p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Avance global</p>
                        <p className="text-2xl font-bold">{project.progress || 0}%</p>
                      </div>
                      <div className="w-full bg-secondary/70 rounded-full h-2.5 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--sage-green))] via-emerald-500 to-sky-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress || 0}%` }}
                          transition={{ duration: 0.9, ease: 'easeOut' }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => { setActiveTab('documents'); setHeaderExpanded(false); }}
                          className="rounded-xl border border-white/80 bg-white/75 p-3 text-left transition hover:border-primary/30 hover:bg-white"
                        >
                          <FolderOpen className="w-4 h-4 text-primary" />
                          <p className="mt-2 text-xl font-bold">{pendingDocs}</p>
                          <p className="text-xs text-muted-foreground">Docs por revisar</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setActiveTab('materials'); setHeaderExpanded(false); }}
                          className="rounded-xl border border-white/80 bg-white/75 p-3 text-left transition hover:border-primary/30 hover:bg-white"
                        >
                          <CheckSquare className="w-4 h-4 text-primary" />
                          <p className="mt-2 text-xl font-bold">{pendingMaterials}</p>
                          <p className="text-xs text-muted-foreground">Decisiones pend.</p>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {estimatedDelivery && (
                        <div className="surface-panel rounded-[20px] bg-[hsl(var(--sage-green)/0.14)] p-4 border border-[hsl(var(--sage-green)/0.15)]">
                          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Entrega estimada</p>
                          <p className="mt-1.5 text-base font-semibold">
                            {new Date(estimatedDelivery).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </p>
                        </div>
                      )}
                      {userRole === 'admin' && (
                        <Select value={project.status} onValueChange={handleStatusChange}>
                          <SelectTrigger className="w-full bg-white/80 border-white/80">
                            <SelectValue placeholder="Cambiar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusLabels).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* Bottom tab bar — fixed on all screen sizes */}
      <div
        className="fixed left-0 right-0 bottom-0 flex justify-center z-40 px-3"
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
      >
        <div className="flex items-center justify-between w-full max-w-2xl gap-1 bg-card/92 backdrop-blur-2xl border border-white/70 p-1.5 rounded-[28px] shadow-[0_-4px_30px_rgba(57,69,45,0.12),0_16px_45px_rgba(57,69,45,0.2)]">
          {Object.entries(tabs).map(([key, tab]) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={`rounded-[22px] flex-1 px-2 py-2.5 flex flex-col items-center gap-1 transition-all duration-300 active:scale-95 ${
                activeTab === key ? 'bg-white shadow-sm' : 'hover:bg-white/50'
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
