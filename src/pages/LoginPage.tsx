import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Shield } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const success = login(email, password);

      if (!success) {
        setError('Credenciales incorrectas. Intente de nuevo.');
      }

      setIsLoading(false);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        
        {/* LOGO */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <span className="text-black font-bold text-lg">V</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Vantage</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Executive Wellness
              </p>
            </div>
          </div>
        </div>

        {/* CARD */}
        <div className="card-surface rounded-xl p-8">
          
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-medium text-white/90">
              Acceso Seguro
            </h2>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* EMAIL */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50"
                placeholder="usuario@metodovantage.com"
                required
              />
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">
                Contraseña
              </label>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white pr-10 focus:outline-none focus:border-cyan-400/50"
                  placeholder="••••••••"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-medium py-2.5 rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
            >
              {isLoading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          {/* QUICK LOGIN */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">
              Usuarios de acceso
            </p>

            <div className="space-y-1.5">
              {[
                { label: 'Setter', email: 'setter@metodovantage.com' },
                { label: 'Closer', email: 'isabel@metodovantage.com' },
                { label: 'Psicólogo', email: 'christian@metodovantage.com' },
                { label: 'Admin', email: 'andresclinicapsicologica@gmail.com' },
              ].map((u) => (
                <button
                  key={u.email}
                  onClick={() => {
                    setEmail(u.email);
                    setPassword('1234');
                  }}
                  className="w-full text-left p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-xs"
                >
                  <strong>{u.label}</strong>
                  <div className="text-muted-foreground">{u.email}</div>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}