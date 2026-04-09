import React from 'react';
import { motion } from 'framer-motion';
import { ListTodo, Hammer, CheckSquare } from 'lucide-react';

const WorkProgressWidget = ({ phases }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckSquare className="w-5 h-5 text-green-500" />;
      case 'active':
        return <Hammer className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <ListTodo className="w-5 h-5 text-gray-300" />;
    }
  };

  const activePhase = phases.find((phase) => phase.status === 'active') || phases.find((phase) => phase.status === 'pending') || null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
      className="surface-panel p-5 sm:p-6 xl:p-8 rounded-[26px]"
    >
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-6">
        <h2 className="text-xl font-bold text-foreground">Proceso de obra</h2>
        {activePhase && (
          <span className="text-sm font-semibold bg-blue-100 text-blue-800 px-3 py-1 rounded-full w-fit">
            Fase actual: {activePhase.name}
          </span>
        )}
      </div>

      <div className="relative pl-4 sm:pl-5">
        <div className="absolute left-6 top-0 bottom-0 w-px bg-gradient-to-b from-[hsl(var(--sage-green)/0.1)] via-border to-transparent -translate-x-1/2"></div>
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <motion.div
              key={phase.id}
              className="relative flex items-start gap-4 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="z-10 bg-card p-2 rounded-2xl shadow-sm">
                {getStatusIcon(phase.status)}
              </div>

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <h3 className="font-semibold text-foreground">{phase.name}</h3>
                  <span
                    className={`text-xs font-semibold uppercase tracking-[0.18em] ${
                      phase.status === 'completed'
                        ? 'text-emerald-600'
                        : phase.status === 'active'
                          ? 'text-sky-600'
                          : 'text-muted-foreground'
                    }`}
                  >
                    {phase.status === 'completed' ? 'Completada' : phase.status === 'active' ? 'En curso' : 'Pendiente'}
                  </span>
                </div>

                {phase.date && (
                  <p className="text-sm text-muted-foreground">
                    {new Date(phase.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default WorkProgressWidget;
