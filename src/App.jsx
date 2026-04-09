import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Plus, LogOut, Boxes, UserCog, Banknote, Bell, MoreVertical, Settings } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import ProfileModal from '@/components/ProfileModal';
import { getStoredToken, storeAuthSession } from '@/lib/apiClient';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import LoginForm from '@/components/LoginForm';
import Dashboard from '@/components/Dashboard';
import ProjectDetail from '@/components/ProjectDetail';
import ProjectFormModal from '@/components/ProjectFormModal';
import UserManagement from '@/components/UserManagement';
import MaterialsCatalog from '@/components/MaterialsCatalog';
import PaymentGateway from '@/components/PaymentGateway';
import AdminPaymentDashboard from '@/components/AdminPaymentDashboard';
import AdminReminderDashboard from '@/components/AdminReminderDashboard';
import WatermarkBackground from '@/components/WatermarkBackground';
import { useAuth } from '@/contexts/AuthContext';
import { apiRequest } from '@/lib/apiClient';

function App() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [appUser, setAppUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [view, setView] = useState('dashboard'); // dashboard, projectDetail, users, catalog, payment, adminPayments, adminReminders
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const defaultPhases = [
    { id: 'phase1', name: 'PreReforma', status: 'pending', date: null },
    { id: 'phase2', name: 'Inicio de Obra', status: 'pending', date: null },
    { id: 'phase3', name: 'Demolición', status: 'pending', date: null },
    { id: 'phase4', name: 'Tabiquería', status: 'pending', date: null },
    { id: 'phase5', name: 'Instalaciones', status: 'pending', date: null },
    { id: 'phase6', name: 'Acabados', status: 'pending', date: null },
    { id: 'phase7', name: 'Entrega', status: 'pending', date: null }
  ];

  const fetchAppData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const currentUserData = {
      id: user.id,
      name: user.name,
      role: user.role,
      email: user.email,
      username: user.username,
    };
    setAppUser(currentUserData);

    try {
      if (currentUserData.role === 'admin') {
        const usersResponse = await apiRequest('/users');
        setUsers(usersResponse.users || []);
      } else {
        setUsers([currentUserData]);
      }

      const projectsResponse = await apiRequest('/projects');
      const projectsData = projectsResponse.projects || [];
      setProjects(projectsData);

      if (currentUserData.role === 'client' && view === 'dashboard') {
        const clientProject = projectsData.find((project) => project.client_id === currentUserData.id);
        if (clientProject) {
          setSelectedProject(clientProject);
          setView('projectDetail');
        } else {
          setView('no-project');
        }
      }
    } catch (error) {
      toast({ title: "Error", description: error.message || "No se pudieron cargar los datos.", variant: "destructive" });
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAppData();

    const params = new URLSearchParams(window.location.search);
    if (params.get('payment') === 'success') {
      toast({ title: 'Pago Exitoso', description: 'El pago se ha procesado correctamente.', variant: 'default' });
      window.history.replaceState({}, document.title, "/");
    } else if (params.get('payment') === 'cancelled') {
      toast({ title: 'Pago Cancelado', description: 'El proceso de pago fue cancelado.', variant: 'destructive' });
      window.history.replaceState({}, document.title, "/");
    }
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    setAppUser(null);
    setSelectedProject(null);
    setProjects([]);
    setUsers([]);
    setView('dashboard');
    toast({
      title: "Sesión cerrada",
      description: "Hasta pronto",
    });
  };

  const handleSaveProject = async (projectData) => {
    const selectedClient = users.find(u => u.id === projectData.clientId);

    if (editingProject) {
      try {
        const response = await apiRequest(`/projects/${editingProject.id}`, {
          method: 'PUT',
          body: {
            ...editingProject,
            name: projectData.name,
            description: projectData.description,
            location: projectData.location,
            start_date: projectData.start_date,
            client_id: projectData.clientId,
            client_name: selectedClient ? selectedClient.name : editingProject.client_name,
          },
        });

        await fetchAppData();
        setSelectedProject(response.project);
        toast({ title: "¡Proyecto actualizado! ✅", description: `${response.project.name} ha sido modificado.` });
      } catch (error) {
        toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
      }
    } else {
      const newProjectPayload = {
        name: projectData.name,
        description: projectData.description,
        location: projectData.location,
        start_date: projectData.start_date,
        client_id: projectData.clientId,
        client_name: selectedClient ? selectedClient.name : 'N/A',
        status: 'planning',
        progress: 0,
        phases: defaultPhases,
        invoices: [], budgets: [], certifications: [], gallery: [], materials: []
      };
      try {
        const response = await apiRequest('/projects', {
          method: 'POST',
          body: newProjectPayload,
        });

        await fetchAppData();
        toast({ title: "¡Proyecto creado! 🏗️", description: `${response.project.name} ha sido añadido.` });
      } catch (error) {
        toast({ title: "Error al crear", description: error.message, variant: "destructive" });
      }
    }

    setIsProjectModalOpen(false);
    setEditingProject(null);
  };

  const handleUpdateProject = async (updatedProject) => {
    let projectToUpdate = { ...updatedProject };

    if (projectToUpdate.phases) {
      const completedPhases = projectToUpdate.phases.filter(p => p.status === 'completed').length;
      const totalPhases = projectToUpdate.phases.length;
      projectToUpdate.progress = totalPhases > 0 ? Math.round((completedPhases / totalPhases) * 100) : 0;
    }

    try {
      const response = await apiRequest(`/projects/${projectToUpdate.id}`, {
        method: 'PUT',
        body: projectToUpdate,
      });

      await fetchAppData();
      setSelectedProject(response.project);
    } catch (error) {
      toast({ title: "Error al actualizar", description: error.message, variant: "destructive" });
    }
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await apiRequest(`/projects/${projectId}`, { method: 'DELETE' });
      await fetchAppData();
      setSelectedProject(null);
      setView('dashboard');
      toast({ title: "Proyecto eliminado", description: "El proyecto ha sido removido." });
    } catch (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
    }
  };

  const openCreateModal = () => {
    setEditingProject(null);
    setIsProjectModalOpen(true);
  };

  const openEditModal = (project) => {
    setEditingProject(project);
    setIsProjectModalOpen(true);
  };

  const handleProfileUpdate = (updatedUser) => {
    const token = getStoredToken();
    storeAuthSession({ token, user: updatedUser });
    setAppUser({
      id: updatedUser.id,
      name: updatedUser.name,
      role: updatedUser.role,
      email: updatedUser.email,
      username: updatedUser.username,
    });
  };

  const handleNavigateToPayment = (certification, projectId) => {
    setPaymentData({ ...certification, project_id: projectId });
    setView('payment');
  };

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Cargando...</div>;
  }

  if (!user) {
    return (
      <>
        <Helmet>
          <title>ReCrea-T - Acceso</title>
          <meta name="description" content="Sistema de gestión y seguimiento de proyectos de construcción" />
        </Helmet>
        <LoginForm />
      </>
    );
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-background">Cargando...</div>
  }

  const navigateTo = (newView) => {
    if (appUser?.role === 'client' && newView === 'dashboard') {
      const clientProject = projects.find(p => p.client_id === appUser.id);
      if (clientProject) {
        setView('projectDetail');
        setSelectedProject(clientProject);
      } else {
        setView('no-project');
      }
      return;
    }
    setSelectedProject(null);
    setView(newView);
  }

  const clientProject = appUser?.role === 'client' ? projects.find(p => p.client_id === appUser.id) : null;
  const isClientExperience = appUser?.role === 'client';
  const isProjectFocusedView = isClientExperience && ['projectDetail', 'payment', 'no-project'].includes(view);
  const mainContainerClass = isProjectFocusedView
    ? 'w-full px-4 pb-32 pt-4 sm:px-6 sm:pt-6 lg:px-8 xl:px-12 2xl:px-16'
    : 'w-full px-4 py-4 sm:px-6 sm:py-8 lg:px-8 xl:px-12 2xl:px-16';

  const renderContent = () => {
    switch (view) {
      case 'projectDetail':
        return (
          <ProjectDetail
            key="project-detail"
            project={selectedProject || clientProject}
            onBack={() => navigateTo('dashboard')}
            onUpdate={handleUpdateProject}
            onDelete={handleDeleteProject}
            onEdit={openEditModal}
            userRole={appUser?.role}
            onNavigateToPayment={handleNavigateToPayment}
          />
        );
      case 'dashboard':
        return (
          <Dashboard
            key="dashboard"
            projects={projects}
            onSelectProject={(project) => {
              setSelectedProject(project);
              setView('projectDetail');
            }}
            userRole={appUser?.role}
            onProjectsLoaded={fetchAppData}
          />
        );
      case 'users':
        if (appUser?.role === 'admin') {
          return (
            <UserManagement
              key="user-management"
              users={users}
              onUsersUpdate={fetchAppData}
              projects={projects}
            />
          );
        }
        return null;
      case 'catalog':
        if (appUser?.role === 'admin') {
          return (
            <MaterialsCatalog
              key="catalog"
              onBack={() => navigateTo('dashboard')}
            />
          );
        }
        return null;
      case 'payment':
        return (
          <PaymentGateway
            key="payment"
            certification={paymentData}
            onBack={() => {
              setPaymentData(null);
              setView('projectDetail');
            }}
          />
        );
      case 'adminPayments':
        if (appUser?.role === 'admin') {
          return <AdminPaymentDashboard key="adminPayments" />;
        }
        return null;
      case 'adminReminders':
        if (appUser?.role === 'admin') {
          return <AdminReminderDashboard key="adminReminders" />;
        }
        return null;
      case 'no-project':
      default:
        return (
          <div key="no-project-client" className="client-shell relative overflow-hidden rounded-[32px] p-8 sm:p-10 lg:p-14 text-center max-w-3xl mx-auto mt-8">
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-[hsl(var(--sage-green)/0.16)] to-transparent" />
            <Building2 className="relative w-16 h-16 text-foreground/70 mx-auto mb-5" />
            <h2 className="relative text-3xl sm:text-4xl font-bold">Todavía no tienes una obra asignada</h2>
            <p className="relative text-muted-foreground mt-3 text-base sm:text-lg max-w-xl mx-auto">
              En cuanto el administrador te vincule a tu proyecto, aquí podrás ver los detalles dl seguimiento, documentos, certificaciones e imágenes.
            </p>
          </div>
        );
    }
  }

  return (
    <>
      <Helmet>
        <title>ReCrea-T - Dashboard</title>
        <meta name="description" content="Panel de control para gestión de proyectos de construcción" />
      </Helmet>

      <div className="app-shell min-h-screen text-foreground relative z-0">
        <WatermarkBackground />

        <header className="bg-background/72 backdrop-blur-2xl border-b border-white/50 sticky top-0 z-50 shadow-[0_10px_30px_rgba(57,69,45,0.06)]">
          <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
            <div className="flex justify-between items-center h-16 sm:h-20">
              <motion.div
                className="flex items-center gap-3 cursor-pointer"
                onClick={() => navigateTo('dashboard')}
                whileHover={{ scale: 1.05 }}
              >
                <img src="/images/logo.png" alt="ReCrea-T Logo" className="w-11 h-11 sm:w-12 sm:h-12 drop-shadow-sm" />
                <div className="hidden sm:block">
                  <span className="text-xl sm:text-2xl font-bold text-foreground block" data-display="serif">
                    ReCrea-T
                  </span>
                  {isClientExperience && clientProject && (
                    <span className="text-xs uppercase tracking-[0.24em] text-muted-foreground">
                      Portal de cliente
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold text-foreground sm:hidden" data-display="serif">
                  ReCrea-T
                </span>
              </motion.div>

              <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-4">
                {appUser?.role === 'admin' && (
                  <>
                    <Button
                      onClick={openCreateModal}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all"
                      size="sm"
                    >
                      <Plus className="w-4 h-4 sm:mr-2" />
                      <span className="hidden sm:inline">Nueva Obra</span>
                    </Button>

                    {/* Desktop: individual icon buttons */}
                    <Button variant="ghost" size="icon" onClick={() => navigateTo('catalog')} title="Catálogo de materiales" className="hidden sm:inline-flex">
                      <Boxes className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigateTo('adminPayments')} title="Control de Pagos" className="hidden sm:inline-flex">
                      <Banknote className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigateTo('adminReminders')} title="Recordatorios" className="hidden sm:inline-flex">
                      <Bell className="w-5 h-5" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => navigateTo('users')} title="Gestión de Usuarios" className="hidden sm:inline-flex">
                      <UserCog className="w-5 h-5" />
                    </Button>

                    {/* Mobile: collapsed dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="sm:hidden">
                          <MoreVertical className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onClick={() => navigateTo('catalog')}>
                          <Boxes className="w-4 h-4 mr-2" /> Catálogo
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigateTo('adminPayments')}>
                          <Banknote className="w-4 h-4 mr-2" /> Control de Pagos
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigateTo('adminReminders')}>
                          <Bell className="w-4 h-4 mr-2" /> Recordatorios
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigateTo('users')}>
                          <UserCog className="w-4 h-4 mr-2" /> Usuarios
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}

                {/* Avatar con dropdown de perfil */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="w-9 h-9 rounded-full bg-[hsl(var(--sage-green))] flex items-center justify-center text-white font-bold text-sm hover:opacity-85 active:scale-95 transition-all select-none flex-shrink-0">
                      {appUser?.name?.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase() || '?'}
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2.5 border-b mb-1">
                      <p className="font-semibold text-sm truncate">{appUser?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{appUser?.email}</p>
                    </div>
                    <DropdownMenuItem onClick={() => setIsProfileModalOpen(true)}>
                      <Settings className="w-4 h-4 mr-2" /> Mi perfil
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500">
                      <LogOut className="w-4 h-4 mr-2" /> Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <main className={`${mainContainerClass} mx-auto relative z-10`}>
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </main>

        <ProjectFormModal
          isOpen={isProjectModalOpen}
          onClose={() => setIsProjectModalOpen(false)}
          onSubmit={handleSaveProject}
          clients={users.filter(u => u.role === 'client')}
          project={editingProject}
        />

        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={appUser}
          onUpdate={handleProfileUpdate}
        />
      </div>
    </>
  );
}

export default App;
