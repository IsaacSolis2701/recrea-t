import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setProfileForm({ name: user.name || '', email: user.email || '' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  }, [isOpen, user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const response = await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: { name: profileForm.name, email: profileForm.email },
      });
      onUpdate(response.user);
      toast({ title: 'Perfil actualizado', description: 'Tus datos han sido guardados.' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Error', description: 'Las contraseñas nuevas no coinciden.', variant: 'destructive' });
      return;
    }
    setSavingPassword(true);
    try {
      await apiRequest('/auth/password', {
        method: 'PATCH',
        body: { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword },
      });
      toast({ title: 'Contraseña actualizada', description: 'Tu contraseña ha sido cambiada.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const PasswordInput = ({ id, value, onChange, show, onToggle, placeholder }) => (
    <div className="relative">
      <Input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required
        minLength={6}
        className="pr-10"
      />
      <button
        type="button"
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        onClick={onToggle}
        tabIndex={-1}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-card border max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Mi perfil</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 py-2">
          <div className="w-14 h-14 rounded-full bg-[hsl(var(--sage-green))] flex items-center justify-center text-white text-xl font-bold flex-shrink-0 select-none">
            {initials}
          </div>
          <div>
            <p className="font-semibold text-lg leading-tight">{user?.name}</p>
            <p className="text-sm text-muted-foreground capitalize">{user?.role === 'admin' ? 'Administrador' : 'Cliente'}</p>
          </div>
        </div>

        <div className="border-t pt-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <User className="w-3.5 h-3.5" /> Datos personales
          </p>
          <form onSubmit={handleSaveProfile} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="profile-name">Nombre</Label>
              <Input
                id="profile-name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="profile-email">Correo electrónico</Label>
              <Input
                id="profile-email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                required
              />
            </div>
            <Button type="submit" disabled={savingProfile} className="w-full bg-[#b3c1b3] hover:bg-[#9aab9a] text-white">
              {savingProfile ? 'Guardando...' : 'Guardar datos'}
            </Button>
          </form>
        </div>

        <div className="border-t pt-5 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Lock className="w-3.5 h-3.5" /> Cambiar contraseña
          </p>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="current-pw">Contraseña actual</Label>
              <PasswordInput
                id="current-pw"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                show={showPw.current}
                onToggle={() => setShowPw((p) => ({ ...p, current: !p.current }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="new-pw">Nueva contraseña</Label>
              <PasswordInput
                id="new-pw"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                show={showPw.new}
                onToggle={() => setShowPw((p) => ({ ...p, new: !p.new }))}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirm-pw">Confirmar contraseña</Label>
              <PasswordInput
                id="confirm-pw"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                show={showPw.confirm}
                onToggle={() => setShowPw((p) => ({ ...p, confirm: !p.confirm }))}
              />
            </div>
            <Button type="submit" disabled={savingPassword} variant="outline" className="w-full">
              {savingPassword ? 'Actualizando...' : 'Cambiar contraseña'}
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
