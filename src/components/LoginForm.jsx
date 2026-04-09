import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';

const LoginForm = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async e => {
    e.preventDefault();
    setIsLoading(true);
    const { error } = await signIn(formData);
    if (error) {
      toast({ title: "Error de acceso", description: "Usuario o contraseña incorrectos.", variant: "destructive" });
    } else {
      toast({ title: "¡Bienvenido de nuevo!", description: "Has iniciado sesión correctamente." });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-end sm:justify-center relative overflow-hidden">

      {/* Background image full-screen */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url('/images/login-bg.jpg')`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
        }}
      />
      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-black/75" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

      {/* Branding visible on mobile above card */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 pb-8 sm:hidden">
        <motion.img
          src="/images/logo.png"
          alt="ReCrea-T"
          className="w-20 h-20 drop-shadow-2xl mb-4"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        />
        <motion.h1
          className="text-white text-4xl font-bold"
          style={{ fontFamily: 'Inter, sans-serif', letterSpacing: '-0.02em' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          ReCrea-T
        </motion.h1>
        <motion.p
          className="text-white/60 text-sm mt-1 tracking-[0.2em] uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          Reforme Disfrutando
        </motion.p>
      </div>

      {/* Card — bottom sheet on mobile, centered card on desktop */}
      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full sm:max-w-md sm:mx-4 sm:mb-0"
      >
        <div
          className="bg-white sm:rounded-3xl rounded-t-[2.5rem] px-8 pt-6 shadow-[0_-20px_80px_rgba(0,0,0,0.35)] sm:shadow-2xl border-0 sm:border sm:border-white/60"
          style={{ paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom, 2rem))' }}
        >
          {/* Drag handle on mobile */}
          <div className="flex justify-center mb-6 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-gray-200" />
          </div>

          {/* Logo + title on desktop */}
          <div className="hidden sm:flex flex-col items-center mb-8">
            <img
              src="/images/logo.png"
              alt="ReCrea-T Logo"
              className="w-20 h-20 mb-4"
            />
            <h1 className="text-3xl font-bold text-foreground">ReCrea-T</h1>
            <p className="text-muted-foreground text-sm mt-1">Reforme Disfrutando</p>
          </div>

          {/* Title on mobile */}
          <h2 className="text-2xl font-bold text-foreground mb-7 sm:hidden">Accede a tu obra</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-semibold text-foreground/80">Usuario</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Tu usuario"
                  value={formData.username}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="pl-10 h-12 text-base rounded-xl bg-gray-50 border-gray-200 focus:bg-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold text-foreground/80">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 h-12 text-base rounded-xl bg-gray-50 border-gray-200 focus:bg-white"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-14 text-base font-bold rounded-2xl mt-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-black/10 transition-all duration-300 active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? 'Iniciando sesión...' : 'Acceder'}
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-muted-foreground/70 space-y-0.5">
            <p>Accede con las credenciales asignadas por el administrador.</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
