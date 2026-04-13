import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { apiRequest } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';
import { User, Lock, Eye, EyeOff, Send, CheckCircle, KeyRound } from 'lucide-react';

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

const ProfileModal = ({ isOpen, onClose, user, onUpdate }) => {
  // Admin-only profile edit
  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Client change request
  const [changeForm, setChangeForm] = useState({ name: '', username: '', email: '', password: '', confirmPassword: '' });
  const [showReqPw, setShowReqPw] = useState({ pw: false, confirm: false });
  const [sendingRequest, setSendingRequest] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Password change (all users)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false });
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      setProfileForm({ name: user.name || '', email: user.email || '' });
      setChangeForm({ name: '', username: '', email: '', password: '', confirmPassword: '' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setRequestSent(false);
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

  const handleSendChangeRequest = async (e) => {
    e.preventDefault();
    const nameVal = changeForm.name.trim();
    const usernameVal = changeForm.username.trim();
    const emailVal = changeForm.email.trim();
    const passwordRequested = changeForm.password.trim().length > 0;

    if (!nameVal && !usernameVal && !emailVal && !passwordRequested) {
      toast({ title: 'Sin cambios', description: 'Rellena al menos un campo para enviar la solicitud.', variant: 'destructive' });
      return;
    }
    if (passwordRequested && changeForm.password !== changeForm.confirmPassword) {
      toast({ title: 'Error', description: 'Las contraseñas nuevas no coinciden.', variant: 'destructive' });
      return;
    }
    if (passwordRequested && changeForm.password.length < 6) {
      toast({ title: 'Error', description: 'La contraseña debe tener al menos 6 caracteres.', variant: 'destructive' });
      return;
    }
    setSendingRequest(true);
    try {
      await apiRequest('/profile-change-requests', {
        method: 'POST',
        body: {
          name: nameVal || undefined,
          username: usernameVal || undefined,
          email: emailVal || undefined,
          password: passwordRequested ? changeForm.password : undefined,
        },
      });
      setRequestSent(true);
      toast({ title: 'Solicitud enviada', description: 'Un administrador revisará tu solicitud y recibirás un email con la confirmación.' });
    } catch (err) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSendingRequest(false);
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

  const isAdmin = user?.role === 'admin';

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
            <p className="text-sm text-muted-foreground capitalize">{isAdmin ? 'Administrador' : 'Cliente'}</p>
          </div>
        </div>

        {/* Admin: edición directa */}
        {isAdmin && (
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
        )}

        {/* Cliente: datos en solo lectura + solicitud de cambio */}
        {!isAdmin && (
          <div className="border-t pt-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <User className="w-3.5 h-3.5" /> Datos personales
            </p>

            {requestSent ? (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
                <p className="font-medium">Solicitud enviada</p>
                <p className="text-sm text-muted-foreground">Un administrador revisará tu solicitud y aplicará los cambios.</p>
                <Button variant="outline" size="sm" onClick={() => setRequestSent(false)}>Modificar solicitud</Button>
              </div>
            ) : (
              <form onSubmit={handleSendChangeRequest} className="space-y-3">
                <p className="text-xs text-muted-foreground">Rellena solo los campos que quieras cambiar.</p>
                <div className="space-y-1.5">
                  <Label htmlFor="req-name">Nuevo nombre</Label>
                  <Input
                    id="req-name"
                    value={changeForm.name}
                    placeholder={user?.name}
                    onChange={(e) => setChangeForm({ ...changeForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="req-username">Nuevo usuario de acceso</Label>
                  <Input
                    id="req-username"
                    value={changeForm.username}
                    placeholder={user?.username}
                    onChange={(e) => setChangeForm({ ...changeForm, username: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="req-email">Nuevo correo electrónico</Label>
                  <Input
                    id="req-email"
                    type="email"
                    value={changeForm.email}
                    placeholder={user?.email}
                    onChange={(e) => setChangeForm({ ...changeForm, email: e.target.value })}
                  />
                </div>
                <div className="border-t pt-3 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5 mb-2">
                    <KeyRound className="w-3.5 h-3.5" /> Nueva contraseña (opcional)
                  </p>
                  <PasswordInput
                    id="req-pw"
                    value={changeForm.password}
                    onChange={(e) => setChangeForm({ ...changeForm, password: e.target.value })}
                    show={showReqPw.pw}
                    onToggle={() => setShowReqPw((p) => ({ ...p, pw: !p.pw }))}
                    placeholder="Minimo 6 caracteres"
                  />
                  {changeForm.password.length > 0 && (
                    <PasswordInput
                      id="req-pw-confirm"
                      value={changeForm.confirmPassword}
                      onChange={(e) => setChangeForm({ ...changeForm, confirmPassword: e.target.value })}
                      show={showReqPw.confirm}
                      onToggle={() => setShowReqPw((p) => ({ ...p, confirm: !p.confirm }))}
                      placeholder="Confirmar nueva contraseña"
                    />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">Al aprobar la solicitud recibirás un email con tus nuevos datos.</p>
                <Button type="submit" disabled={sendingRequest} className="w-full bg-[#b3c1b3] hover:bg-[#9aab9a] text-white">
                  {sendingRequest ? 'Enviando...' : <><Send className="w-3.5 h-3.5 mr-2" />Solicitar cambio</>}
                </Button>
              </form>
            )}
          </div>
        )}

        {/* Cambio de contraseña — solo admins */}
        {isAdmin && <div className="border-t pt-5 space-y-4">
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
        </div>}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;
