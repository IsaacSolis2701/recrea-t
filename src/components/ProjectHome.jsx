import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  User,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckSquare,
  Image as ImageIcon,
  Edit,
  Save,
  FolderOpen,
  ChevronRight,
} from 'lucide-react';
import WorkProgressWidget from '@/components/WorkProgressWidget';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const ProjectHome = ({ project, setActiveTab, onUpdate, userRole }) => {
  const mainBudget = project.budgets?.find((budget) => budget.status === 'approved');
  const pendingDocs =
    (project.invoices?.filter((invoice) => !invoice.paid).length || 0) +
    (project.budgets?.filter((budget) => budget.status === 'pending').length || 0);
  const pendingDecisions = project.materials?.filter((material) => material.status === 'pending').length || 0;
  const estimatedDelivery = project.estimated_delivery || project.estimatedDelivery;
  const clientName = project.client_name || project.clientName || 'Cliente asignado';
  const location = project.location || 'Pendiente';

  const [isEditingDate, setIsEditingDate] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(estimatedDelivery || '');

  const handleDateSave = () => {
    onUpdate('estimated_delivery', deliveryDate);
    setIsEditingDate(false);
  };

  const highlightCards = [
    {
      title: 'Documentos',
      value: pendingDocs,
      helper: 'Accesos pendientes',
      icon: FolderOpen,
      tone: 'from-amber-100 to-white',
      onClick: () => setActiveTab('documents'),
    },
    {
      title: 'Decisiones',
      value: pendingDecisions,
      helper: 'Materiales por validar',
      icon: CheckSquare,
      tone: 'from-emerald-100 to-white',
      onClick: () => setActiveTab('materials'),
    },
    {
      title: 'Galeria',
      value: project.gallery?.length || 0,
      helper: 'Imagenes publicadas',
      icon: ImageIcon,
      tone: 'from-sky-100 to-white',
      onClick: () => setActiveTab('gallery'),
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.45fr)_360px] gap-6 xl:gap-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="surface-panel p-5 sm:p-6 xl:p-8 rounded-[26px] space-y-6"
        >
          <div className="flex justify-between items-start">
            <div>
              <span className="text-sm font-semibold bg-white px-3 py-1 rounded-full border border-white/90 shadow-sm">
                Vista general
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-start gap-3 p-4 bg-background/60 rounded-2xl border border-white/80">
              <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground">Ubicacion</p>
                <p className="font-semibold text-foreground">{location}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-background/60 rounded-2xl border border-white/80">
              <User className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-semibold text-foreground">{clientName}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-4 bg-background/60 rounded-2xl border border-white/80">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="w-full">
                <p className="text-muted-foreground">Entrega estimada</p>
                {isEditingDate && userRole === 'admin' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Input
                      type="date"
                      value={deliveryDate}
                      onChange={(event) => setDeliveryDate(event.target.value)}
                      className="h-8 text-sm"
                    />
                    <Button size="icon" className="h-8 w-8" onClick={handleDateSave}>
                      <Save className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-foreground">
                      {estimatedDelivery
                        ? new Date(estimatedDelivery).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })
                        : 'Por definir'}
                    </p>
                    {userRole === 'admin' && (
                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setIsEditingDate(true)}>
                        <Edit className="w-3 h-3 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {mainBudget && (
              <div className="flex items-start gap-3 p-4 bg-background/60 rounded-2xl border border-white/80">
                <DollarSign className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-muted-foreground">Presupuesto</p>
                  <p className="font-semibold text-foreground">
                    {mainBudget.amount.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground font-medium text-sm">Progreso de obra</span>
              <span className="text-2xl font-bold text-primary">{project.progress}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-3">
              <motion.div
                className="bg-gradient-to-r from-[hsl(var(--sage-green))] via-emerald-500 to-sky-500 h-3 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${project.progress}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0, transition: { delay: 0.1 } }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold text-foreground">Accesos rapidos</h2>

          {highlightCards.map((card) => (
            <button
              type="button"
              key={card.title}
              onClick={card.onClick}
              className={`w-full text-left rounded-[24px] border border-white/80 bg-gradient-to-br ${card.tone} p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-2xl shadow-sm">
                    <card.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold">{card.title}</p>
                    <p className="text-sm text-muted-foreground">{card.helper}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>

              <div className="mt-6 flex items-end justify-between">
                <span className="text-4xl font-bold">{card.value}</span>
                <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground/70">Abrir</span>
              </div>
            </button>
          ))}

          <div className="rounded-[24px] border border-[hsl(var(--sage-green)/0.16)] bg-[hsl(var(--sage-green)/0.12)] p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-white shadow-sm">
                <AlertCircle className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold">Seguimiento centralizado</p>
                <p className="text-sm text-muted-foreground">
                  Desde aqui puedes revisar obra, pagos, materiales y galeria sin salir del proyecto.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <WorkProgressWidget phases={project.phases} />
    </div>
  );
};

export default ProjectHome;
