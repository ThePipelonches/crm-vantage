import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Eye, EyeOff, Shield, Mail, RefreshCw } from 'lucide-react';

export function LoginPage() {
  const { login, verify, resendCode, loginStep, verificationCode } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setTimeout(() => {
      const success = login(email, password);
      if (!success && loginStep === 'credentials') {
        setError('Credenciales incorrectas. Intente de nuevo.');
      }
      setIsLoading(false);
    }, 600);
  };

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = verify(code);
    if (!success) setError('Código incorrecto o expirado.');
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
              <span className="text-black font-bold text-lg">V</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Vantage</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Executive Wellness</p>
            </div>
          </div>
        </div>

        {/* Verification Step */}
        {loginStep === 'verification' ? (
          <div className="card-surface rounded-xl p-8">
            <div className="flex items-center gap-2 mb-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-medium text-white/90">Verificación de identidad</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-6">
              Como es tu primer ingreso, hemos enviado un código de verificación a tu correo.
              Ingrésalo abajo para continuar.
            </p>

            {/* Simulated email display */}
            <div className="mb-6 p-4 rounded-lg bg-amber-400/5 border border-amber-400/20">
              <p className="text-[10px] text-amber-400 uppercase tracking-wider mb-1">Simulación de correo enviado</p>
              <p className="text-xs text-muted-foreground mb-2">En producción, esto llegaría al inbox del usuario:</p>
              <div className="bg-black rounded-lg p-3 border border-white/10">
                <p className="text-xs text-white font-mono-tech">Código: <span className="text-cyan-400 text-lg">{verificationCode}</span></p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Código de 6 dígitos</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all text-center font-mono-tech tracking-[0.5em] text-lg"
                  placeholder="______"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity text-sm"
              >
                Verificar e ingresar
              </button>
              <button
                type="button"
                onClick={() => { resendCode(); }}
                className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-white transition-colors py-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Reenviar código
              </button>
            </form>
          </div>
        ) : (
          /* Credentials Step */
          <div className="card-surface rounded-xl p-8">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-medium text-white/90">Acceso Seguro</h2>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Correo electrónico</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all"
                  placeholder="usuario@metodovantage.com"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Contraseña</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20 transition-all pr-10"
                    placeholder="••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Autenticando...' : 'Ingresar'}
              </button>
            </form>

            {/* Quick login */}
            <div className="mt-6 pt-4 border-t border-white/10">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-3">Usuarios de acceso</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Setter', email: 'setter@metodovantage.com', color: 'text-cyan-400', desc: 'Sin verificación' },
                  { label: 'Cerrador', email: 'isabel@metodovantage.com', color: 'text-amber-400', desc: 'Verificación primer ingreso' },
                  { label: 'Psicólogo', email: 'christian@metodovantage.com', color: 'text-blue-400', desc: 'Verificación primer ingreso' },
                  { label: 'Admin', email: 'andresclinicapsicologica@gmail.com', color: 'text-emerald-400', desc: 'Verificación primer ingreso' },
                ].map((u) => (
                  <button
                    key={u.email}
                    onClick={() => { setEmail(u.email); setPassword('vantage2024'); }}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-left"
                  >
                    <div>
                      <span className={`text-xs font-medium ${u.color}`}>{u.label}</span>
                      <p className="text-[10px] text-muted-foreground">{u.email}</p>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{u.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
