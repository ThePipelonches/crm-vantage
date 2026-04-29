import { useState } from 'react';
import { getCurrentUser, changePassword } from '@/services/storage';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export default function ChangePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const user = getCurrentUser();

  if (!user) return null;

  const handleSave = () => {
    if (password.length < 4) {
      alert('La contraseña debe tener mínimo 4 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }

    changePassword(user.id, password);

    // 🔥 CLAVE: refrescar contexto
    refreshUser();

    // 🔥 salir del loop
    navigate('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="card p-6 space-y-4 w-full max-w-sm">

        <h2 className="text-lg font-medium">
          Cambiar contraseña
        </h2>

        <p className="text-sm text-muted-foreground">
          Este es tu primer acceso. Debes crear una contraseña nueva.
        </p>

        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-white/5 border border-white/10"
        />

        <input
          type="password"
          placeholder="Confirmar contraseña"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 rounded bg-white/5 border border-white/10"
        />

        <button
          onClick={handleSave}
          className="w-full bg-cyan-500 py-2 rounded text-black font-medium"
        >
          Guardar
        </button>

      </div>
    </div>
  );
}