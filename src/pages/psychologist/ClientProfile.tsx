import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientById, getSessionsByClient, getTestsByClient, addSession, addTest, getUsers, updateClient } from '@/services/storage';
import { PACKAGE_TYPE_LABELS, PAYMENT_STATUS_LABELS, TEST_TYPE_LABELS } from '@/types';
import type { TestType, TestCategory } from '@/types';
import { getDASS21StressLevel, getDASS21AnxietyLevel, getDASS21DepressionLevel, getMBIExhaustionLevel, getMBIDepersonalizationLevel, getMBIPersonalAccomplishmentLevel, getPCQLevel, calculateDASS21, calculateMBI, calculatePCQ } from '@/types';
import {
  ArrowLeft, User, Phone, Mail, Brain, Save, X, Plus, FileText,
  CalendarDays, FlaskConical, Package, CreditCard, TrendingUp, BarChart3,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Tab = 'profile' | 'package' | 'psychometric' | 'sessions';

export function ClientProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [, setRefresh] = useState(0);

  if (!id) return null;
  const client = getClientById(id);
  if (!client) return <div className="text-center py-12 text-muted-foreground"><p>Cliente no encontrado</p><button onClick={() => navigate('/clients')} className="text-cyan-400 text-sm mt-2">Volver</button></div>;

  const tabs: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'profile', label: 'Perfil', icon: User },
    { key: 'package', label: 'Paquete', icon: Package },
    { key: 'psychometric', label: 'Evaluación Psicométrica', icon: BarChart3 },
    { key: 'sessions', label: 'Historial de Sesiones', icon: CalendarDays },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/clients')} className="p-2 rounded-lg hover:bg-white/5 transition-colors"><ArrowLeft className="w-4 h-4" /></button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400/20 to-blue-500/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-cyan-400">{client.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2)}</span>
          </div>
          <div>
            <h2 className="text-lg font-medium">{client.fullName}</h2>
            <p className="text-sm text-muted-foreground">{client.phone}</p>
          </div>
        </div>
        <div className="flex-1" />
        <span className={`inline-flex items-center rounded-full border text-[10px] px-2 py-0.5 font-medium ${
          client.rolRisk === 'green' ? 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20' :
          client.rolRisk === 'yellow' ? 'bg-amber-400/10 text-amber-400 border-amber-400/20' :
          'bg-red-400/10 text-red-400 border-red-400/20'
        }`}>ROL: {client.rolRisk === 'green' ? 'Verde' : client.rolRisk === 'yellow' ? 'Amarillo' : 'Rojo'}</span>
      </div>

      <div className="flex gap-1 p-1 rounded-lg bg-white/5 border border-white/10">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.key ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white hover:bg-white/5'
            }`}>
            <tab.icon className="w-4 h-4" /><span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {activeTab === 'profile' && <ProfileTab client={client} onUpdate={() => setRefresh(r => r + 1)} />}
      {activeTab === 'package' && <PackageTab client={client} onUpdate={() => setRefresh(r => r + 1)} />}
      {activeTab === 'psychometric' && <PsychometricTab clientId={id} />}
      {activeTab === 'sessions' && <SessionsTab clientId={id} />}
    </div>
  );
}

// ============== PROFILE TAB ==============
function ProfileTab({ client, onUpdate }: { client: NonNullable<ReturnType<typeof getClientById>>; onUpdate: () => void }) {
  const psychologists = getUsers().filter((u) => u.role === 'psychologist');
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ fullName: client.fullName, phone: client.phone, email: client.email, psychologistId: client.psychologistId, consultationReason: client.consultationReason });

  const handleSave = () => {
    const psy = psychologists.find((p) => p.id === form.psychologistId);
    updateClient(client.id, { ...form, psychologistName: psy?.name || client.psychologistName });
    setIsEditing(false);
    onUpdate();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="card-surface rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-medium">Perfil</h3>
          </div>
          <button onClick={() => setIsEditing(!isEditing)} className="text-xs text-cyan-400 hover:text-cyan-300">{isEditing ? 'Cancelar' : 'Editar'}</button>
        </div>
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Nombre</label>
              <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Teléfono</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Email</label>
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Psicólogo asignado</label>
              <select value={form.psychologistId} onChange={(e) => setForm({ ...form, psychologistId: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50">
                {psychologists.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Motivo de consulta</label>
              <textarea value={form.consultationReason} onChange={(e) => setForm({ ...form, consultationReason: e.target.value })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50 resize-none h-20" />
            </div>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400 text-black text-sm font-medium"><Save className="w-4 h-4" />Guardar</button>
          </div>
        ) : (
          <div className="space-y-3">
            <InfoRow label="Nombre" value={client.fullName} />
            <InfoRow label="Teléfono" value={client.phone} icon={<Phone className="w-3.5 h-3.5" />} />
            <InfoRow label="Email" value={client.email} icon={<Mail className="w-3.5 h-3.5" />} />
            <InfoRow label="Psicólogo" value={client.psychologistName} icon={<Brain className="w-3.5 h-3.5" />} />
          </div>
        )}
      </div>
      <div className="card-surface rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-medium">Motivo de consulta</h3>
        </div>
        {isEditing ? (
          <p className="text-sm text-muted-foreground">Edite el motivo de consulta en el perfil.</p>
        ) : (
          <p className="text-sm text-white/80 leading-relaxed bg-white/5 rounded-lg p-4">{client.consultationReason || 'No registrado'}</p>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1.5">
        {icon && <span className="text-muted-foreground">{icon}</span>}
        <span className="text-sm font-medium">{value}</span>
      </div>
    </div>
  );
}

// ============== PACKAGE TAB ==============
function PackageTab({ client, onUpdate }: { client: NonNullable<ReturnType<typeof getClientById>>; onUpdate: () => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({ totalSessions: client.totalSessions, completedSessions: client.completedSessions, packageType: client.packageType, paymentStatus: client.paymentStatus, rolRisk: client.rolRisk });
  const remaining = client.totalSessions - client.completedSessions;
  const progress = client.totalSessions > 0 ? (client.completedSessions / client.totalSessions) * 100 : 0;

  const handleSave = () => {
    updateClient(client.id, { ...form });
    setIsEditing(false);
    onUpdate();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="card-surface rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2"><Package className="w-4 h-4 text-cyan-400" /><h3 className="text-sm font-medium">Información del Paquete</h3></div>
          <button onClick={() => setIsEditing(!isEditing)} className="text-xs text-cyan-400 hover:text-cyan-300">{isEditing ? 'Cancelar' : 'Editar'}</button>
        </div>
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Tipo de paquete</label>
              <select value={form.packageType} onChange={(e) => setForm({ ...form, packageType: e.target.value as typeof form.packageType })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50">
                {Object.entries(PACKAGE_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Sesiones totales</label>
              <input type="number" value={form.totalSessions} onChange={(e) => setForm({ ...form, totalSessions: parseInt(e.target.value) || 0 })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono-tech focus:outline-none focus:border-cyan-400/50" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Sesiones realizadas</label>
              <input type="number" value={form.completedSessions} onChange={(e) => setForm({ ...form, completedSessions: parseInt(e.target.value) || 0 })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm font-mono-tech focus:outline-none focus:border-cyan-400/50" />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Estado de pago</label>
              <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value as typeof form.paymentStatus })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50">
                {Object.entries(PAYMENT_STATUS_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Riesgo ROL</label>
              <select value={form.rolRisk} onChange={(e) => setForm({ ...form, rolRisk: e.target.value as typeof form.rolRisk })} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50">
                <option value="green">Verde — Bajo riesgo</option>
                <option value="yellow">Amarillo — Riesgo moderado</option>
                <option value="red">Rojo — Alto riesgo</option>
              </select>
            </div>
            <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400 text-black text-sm font-medium"><Save className="w-4 h-4" />Guardar</button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-lg font-mono-tech text-cyan-400">{client.totalSessions}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-lg font-mono-tech text-emerald-400">{client.completedSessions}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Realizadas</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white/5">
                <p className="text-lg font-mono-tech text-amber-400">{remaining}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Faltantes</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
            </div>
            <p className="text-xs text-muted-foreground text-center">{Math.round(progress)}% completado</p>
            <div className="pt-3 border-t border-white/5 space-y-2">
              <InfoRow label="Tipo de paquete" value={PACKAGE_TYPE_LABELS[client.packageType]} />
              <InfoRow label="Estado de pago" value={PAYMENT_STATUS_LABELS[client.paymentStatus]} icon={<CreditCard className="w-3.5 h-3.5" />} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============== PSYCHOMETRIC TAB ==============
function PsychometricTab({ clientId }: { clientId: string }) {
  const [tests, setTests] = useState(getTestsByClient(clientId));
  const [showForm, setShowForm] = useState(false);
  const [testType, setTestType] = useState<TestType>('dass21');
  const [category, setCategory] = useState<TestCategory>('pre');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [chartFilter, setChartFilter] = useState<'all' | TestType>('all');

  // DASS-21 form state
  const [dassItems, setDassItems] = useState<number[]>(new Array(21).fill(0));
  // MBI form state
  const [mbiItems, setMbiItems] = useState<number[]>(new Array(22).fill(0));
  // PCQ form state
  const [pcqItems, setPcqItems] = useState<number[]>(new Array(24).fill(3));

  const preTests = tests.filter((t) => t.category === 'pre');
  const postTests = tests.filter((t) => t.category === 'post');

  const handleSave = () => {
    const psychologists = getUsers().filter((u) => u.role === 'psychologist');
    const psyId = psychologists[0]?.id || 'u4';

    let newTest: typeof tests[0] = {
      id: `t_${Date.now()}`, clientId, psychologistId: psyId, name: testType, category, date, createdAt: new Date().toISOString(),
    };

    if (testType === 'dass21') {
      const scores = calculateDASS21(dassItems);
      newTest = { ...newTest, dassStress: scores.stress, dassAnxiety: scores.anxiety, dassDepression: scores.depression, dassItems };
    } else if (testType === 'mbi') {
      const scores = calculateMBI(mbiItems);
      newTest = { ...newTest, mbiExhaustion: scores.exhaustion, mbiDepersonalization: scores.depersonalization, mbiPersonalAccomplishment: scores.personalAccomplishment, mbiItems };
    } else if (testType === 'pcq') {
      const scores = calculatePCQ(pcqItems);
      newTest = { ...newTest, pcqSelfEfficacy: scores.selfEfficacy, pcqHope: scores.hope, pcqResilience: scores.resilience, pcqOptimism: scores.optimism, pcqItems };
    }

    addTest(newTest);
    setTests(getTestsByClient(clientId));
    setShowForm(false);
    setDassItems(new Array(21).fill(0));
    setMbiItems(new Array(22).fill(0));
    setPcqItems(new Array(24).fill(3));
  };

  // Build chart data
  const chartData = useMemo(() => {
    const data: Array<Record<string, string | number>> = [];
    const types: TestType[] = chartFilter === 'all' ? ['dass21', 'mbi', 'pcq'] : [chartFilter];

    types.forEach((type) => {
      const pre = preTests.find((t) => t.name === type);
      const post = postTests.find((t) => t.name === type);

      if (type === 'dass21') {
        if (pre?.dassStress !== undefined || post?.dassStress !== undefined) {
          data.push({
            name: 'DASS-21 Estrés', pre: pre?.dassStress ?? 0, post: post?.dassStress ?? 0,
            preLevel: pre ? getDASS21StressLevel(pre.dassStress || 0) : '', postLevel: post ? getDASS21StressLevel(post.dassStress || 0) : '',
          });
        }
        if (pre?.dassAnxiety !== undefined || post?.dassAnxiety !== undefined) {
          data.push({ name: 'DASS-21 Ansiedad', pre: pre?.dassAnxiety ?? 0, post: post?.dassAnxiety ?? 0 });
        }
        if (pre?.dassDepression !== undefined || post?.dassDepression !== undefined) {
          data.push({ name: 'DASS-21 Depresión', pre: pre?.dassDepression ?? 0, post: post?.dassDepression ?? 0 });
        }
      } else if (type === 'mbi') {
        if (pre?.mbiExhaustion !== undefined || post?.mbiExhaustion !== undefined) {
          data.push({ name: 'MBI Agotamiento', pre: pre?.mbiExhaustion ?? 0, post: post?.mbiExhaustion ?? 0 });
        }
        if (pre?.mbiDepersonalization !== undefined || post?.mbiDepersonalization !== undefined) {
          data.push({ name: 'MBI Despersonalización', pre: pre?.mbiDepersonalization ?? 0, post: post?.mbiDepersonalization ?? 0 });
        }
        if (pre?.mbiPersonalAccomplishment !== undefined || post?.mbiPersonalAccomplishment !== undefined) {
          data.push({ name: 'MBI Realización Personal', pre: pre?.mbiPersonalAccomplishment ?? 0, post: post?.mbiPersonalAccomplishment ?? 0 });
        }
      } else if (type === 'pcq') {
        if (pre?.pcqSelfEfficacy !== undefined || post?.pcqSelfEfficacy !== undefined) {
          data.push({ name: 'PCQ Autoeficacia', pre: Math.round((pre?.pcqSelfEfficacy || 0) * 10), post: Math.round((post?.pcqSelfEfficacy || 0) * 10) });
        }
        if (pre?.pcqHope !== undefined || post?.pcqHope !== undefined) {
          data.push({ name: 'PCQ Esperanza', pre: Math.round((pre?.pcqHope || 0) * 10), post: Math.round((post?.pcqHope || 0) * 10) });
        }
        if (pre?.pcqResilience !== undefined || post?.pcqResilience !== undefined) {
          data.push({ name: 'PCQ Resiliencia', pre: Math.round((pre?.pcqResilience || 0) * 10), post: Math.round((post?.pcqResilience || 0) * 10) });
        }
        if (pre?.pcqOptimism !== undefined || post?.pcqOptimism !== undefined) {
          data.push({ name: 'PCQ Optimismo', pre: Math.round((pre?.pcqOptimism || 0) * 10), post: Math.round((post?.pcqOptimism || 0) * 10) });
        }
      }
    });
    return data;
  }, [tests, chartFilter, preTests, postTests]);

  const renderDassForm = () => (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-2">Ingrese la puntuación de cada ítem (0-3):</p>
      <div className="grid grid-cols-7 gap-2">
        {dassItems.map((val, i) => (
          <div key={i} className="text-center">
            <label className="text-[10px] text-muted-foreground">{i + 1}</label>
            <input type="number" min={0} max={3} value={val} onChange={(e) => {
              const newItems = [...dassItems];
              newItems[i] = Math.min(3, Math.max(0, parseInt(e.target.value) || 0));
              setDassItems(newItems);
            }} className="w-full bg-white/5 border border-white/10 rounded px-1 py-1 text-sm text-center font-mono-tech focus:outline-none focus:border-cyan-400/50" />
          </div>
        ))}
      </div>
      <div className="p-3 rounded-lg bg-white/5 text-xs space-y-1">
        <p>Estrés (auto): {calculateDASS21(dassItems).stress} — {getDASS21StressLevel(calculateDASS21(dassItems).stress)}</p>
        <p>Ansiedad (auto): {calculateDASS21(dassItems).anxiety} — {getDASS21AnxietyLevel(calculateDASS21(dassItems).anxiety)}</p>
        <p>Depresión (auto): {calculateDASS21(dassItems).depression} — {getDASS21DepressionLevel(calculateDASS21(dassItems).depression)}</p>
      </div>
    </div>
  );

  const renderMbiForm = () => (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-2">Ingrese la puntuación de cada ítem (0-6):</p>
      <div className="grid grid-cols-7 gap-2">
        {mbiItems.map((val, i) => (
          <div key={i} className="text-center">
            <label className="text-[10px] text-muted-foreground">{i + 1}</label>
            <input type="number" min={0} max={6} value={val} onChange={(e) => {
              const newItems = [...mbiItems];
              newItems[i] = Math.min(6, Math.max(0, parseInt(e.target.value) || 0));
              setMbiItems(newItems);
            }} className="w-full bg-white/5 border border-white/10 rounded px-1 py-1 text-sm text-center font-mono-tech focus:outline-none focus:border-cyan-400/50" />
          </div>
        ))}
      </div>
      <div className="p-3 rounded-lg bg-white/5 text-xs space-y-1">
        <p>Agotamiento: {calculateMBI(mbiItems).exhaustion} — {getMBIExhaustionLevel(calculateMBI(mbiItems).exhaustion)}</p>
        <p>Despersonalización: {calculateMBI(mbiItems).depersonalization} — {getMBIDepersonalizationLevel(calculateMBI(mbiItems).depersonalization)}</p>
        <p>Realización Personal: {calculateMBI(mbiItems).personalAccomplishment} — {getMBIPersonalAccomplishmentLevel(calculateMBI(mbiItems).personalAccomplishment)}</p>
      </div>
    </div>
  );

  const renderPcqForm = () => (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground mb-2">Ingrese la puntuación de cada ítem (1-6):</p>
      <div className="grid grid-cols-8 gap-2">
        {pcqItems.map((val, i) => (
          <div key={i} className="text-center">
            <label className="text-[10px] text-muted-foreground">{i + 1}</label>
            <input type="number" min={1} max={6} value={val} onChange={(e) => {
              const newItems = [...pcqItems];
              newItems[i] = Math.min(6, Math.max(1, parseInt(e.target.value) || 1));
              setPcqItems(newItems);
            }} className="w-full bg-white/5 border border-white/10 rounded px-1 py-1 text-sm text-center font-mono-tech focus:outline-none focus:border-cyan-400/50" />
          </div>
        ))}
      </div>
      <div className="p-3 rounded-lg bg-white/5 text-xs space-y-1">
        {(() => { const s = calculatePCQ(pcqItems); return (<>
          <p>Autoeficacia: {s.selfEfficacy.toFixed(1)} — {getPCQLevel(s.selfEfficacy)}</p>
          <p>Esperanza: {s.hope.toFixed(1)} — {getPCQLevel(s.hope)}</p>
          <p>Resiliencia: {s.resilience.toFixed(1)} — {getPCQLevel(s.resilience)}</p>
          <p>Optimismo: {s.optimism.toFixed(1)} — {getPCQLevel(s.optimism)}</p>
        </>); })()}
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2"><FlaskConical className="w-4 h-4 text-cyan-400" />Evaluación Psicométrica</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs hover:bg-cyan-400/20 transition-colors">
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}{showForm ? 'Cancelar' : 'Nueva evaluación'}
        </button>
      </div>

      {/* Existing tests summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {tests.map((test) => (
          <div key={test.id} className="card-surface rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${test.category === 'pre' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                <span className="text-sm font-medium">{TEST_TYPE_LABELS[test.name]}</span>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${test.category === 'pre' ? 'bg-blue-400/10 text-blue-400 border-blue-400/20' : 'bg-emerald-400/10 text-emerald-400 border-emerald-400/20'}`}>
                {test.category === 'pre' ? 'Pre' : 'Post'}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{test.date}</p>
            {test.name === 'dass21' && test.dassStress !== undefined && (
              <div className="space-y-1 text-xs">
                <p>Estrés: <span className="font-mono-tech text-cyan-400">{test.dassStress}</span> — {getDASS21StressLevel(test.dassStress)}</p>
                <p>Ansiedad: <span className="font-mono-tech text-cyan-400">{test.dassAnxiety}</span> — {getDASS21AnxietyLevel(test.dassAnxiety || 0)}</p>
                <p>Depresión: <span className="font-mono-tech text-cyan-400">{test.dassDepression}</span> — {getDASS21DepressionLevel(test.dassDepression || 0)}</p>
              </div>
            )}
            {test.name === 'mbi' && test.mbiExhaustion !== undefined && (
              <div className="space-y-1 text-xs">
                <p>Agotamiento: <span className="font-mono-tech text-cyan-400">{test.mbiExhaustion}</span> — {getMBIExhaustionLevel(test.mbiExhaustion)}</p>
                <p>Despersonalización: <span className="font-mono-tech text-cyan-400">{test.mbiDepersonalization}</span> — {getMBIDepersonalizationLevel(test.mbiDepersonalization || 0)}</p>
                <p>Realización Personal: <span className="font-mono-tech text-cyan-400">{test.mbiPersonalAccomplishment}</span> — {getMBIPersonalAccomplishmentLevel(test.mbiPersonalAccomplishment || 0)}</p>
              </div>
            )}
            {test.name === 'pcq' && test.pcqSelfEfficacy !== undefined && (
              <div className="space-y-1 text-xs">
                <p>Autoeficacia: <span className="font-mono-tech text-cyan-400">{test.pcqSelfEfficacy.toFixed(1)}</span> — {getPCQLevel(test.pcqSelfEfficacy)}</p>
                <p>Esperanza: <span className="font-mono-tech text-cyan-400">{test.pcqHope?.toFixed(1)}</span> — {getPCQLevel(test.pcqHope || 0)}</p>
                <p>Resiliencia: <span className="font-mono-tech text-cyan-400">{test.pcqResilience?.toFixed(1)}</span> — {getPCQLevel(test.pcqResilience || 0)}</p>
                <p>Optimismo: <span className="font-mono-tech text-cyan-400">{test.pcqOptimism?.toFixed(1)}</span> — {getPCQLevel(test.pcqOptimism || 0)}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <div className="card-surface rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium flex items-center gap-2"><TrendingUp className="w-4 h-4 text-cyan-400" />Comparativo Pre vs Post Tratamiento</h3>
            <select value={chartFilter} onChange={(e) => setChartFilter(e.target.value as typeof chartFilter)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-cyan-400/50">
              <option value="all">Todas las pruebas</option>
              {Object.entries(TEST_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
            </select>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <YAxis tick={{ fill: '#94A3B8', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B0F19', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '12px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="pre" name="Pre-tratamiento" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="post" name="Post-tratamiento" fill="#22D3EE" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card-surface rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-medium">Registrar nueva evaluación</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Prueba</label>
              <select value={testType} onChange={(e) => setTestType(e.target.value as TestType)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50">
                {Object.entries(TEST_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Momento</label>
              <select value={category} onChange={(e) => setCategory(e.target.value as TestCategory)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50">
                <option value="pre">Pre-tratamiento</option>
                <option value="post">Post-tratamiento</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50" />
            </div>
          </div>
          {testType === 'dass21' && renderDassForm()}
          {testType === 'mbi' && renderMbiForm()}
          {testType === 'pcq' && renderPcqForm()}
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400 text-black text-sm font-medium hover:opacity-90 transition-opacity">
            <Save className="w-4 h-4" />Guardar evaluación
          </button>
        </div>
      )}
    </div>
  );
}

// ============== SESSIONS TAB ==============
function SessionsTab({ clientId }: { clientId: string }) {
  const [sessions, setSessions] = useState(getSessionsByClient(clientId));
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [evolutionNotes, setEvolutionNotes] = useState('');
  const [tasks, setTasks] = useState('');

  const handleSave = () => {
    if (!date || !evolutionNotes) return;
    addSession({ id: `s_${Date.now()}`, clientId, psychologistId: 'u4', date, evolutionNotes, tasks, createdAt: new Date().toISOString() });
    setSessions(getSessionsByClient(clientId));
    setShowForm(false);
    setEvolutionNotes('');
    setTasks('');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium flex items-center gap-2"><CalendarDays className="w-4 h-4 text-cyan-400" />Historial de Sesiones ({sessions.length})</h3>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs hover:bg-cyan-400/20 transition-colors">
          {showForm ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}{showForm ? 'Cancelar' : 'Nueva sesión'}
        </button>
      </div>
      {showForm && (
        <div className="card-surface rounded-xl p-5 space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Fecha</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400/50" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Notas de evolución</label>
            <textarea value={evolutionNotes} onChange={(e) => setEvolutionNotes(e.target.value)} placeholder="Observaciones clínicas..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 resize-none h-24" />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Tareas / Acuerdos</label>
            <textarea value={tasks} onChange={(e) => setTasks(e.target.value)} placeholder="Compromisos del cliente..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm placeholder:text-white/30 focus:outline-none focus:border-cyan-400/50 resize-none h-20" />
          </div>
          <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400 text-black text-sm font-medium"><Save className="w-4 h-4" />Guardar</button>
        </div>
      )}
      <div className="space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="card-surface rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">{session.date}</span>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Notas de evolución</p>
                <p className="text-sm text-white/80 leading-relaxed">{session.evolutionNotes}</p>
              </div>
              {session.tasks && (
                <div className="pt-3 border-t border-white/5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Tareas / Acuerdos</p>
                  <p className="text-sm text-cyan-400/80">{session.tasks}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
