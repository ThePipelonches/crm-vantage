import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Users, TrendingDown, Activity, Calendar, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ClinicalDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  
  // Estados Métricas
  const [totalPatients, setTotalPatients] = useState(0);
  const [deserterCount, setDeserterCount] = useState(0);
  const [deserterPercentage, setDeserterPercentage] = useState(0);
  const [sessionsThisMonth, setSessionsThisMonth] = useState(0);
  const [quarterlyData, setQuarterlyData] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 1. Total Pacientes y Desertores
      const { data: patients, error: pError } = await supabase.from('patients').select('id, status');
      if (pError) throw pError;

      const total = patients.length;
      const deserters = patients.filter(p => p.status === 'deserter').length;
      
      setTotalPatients(total);
      setDeserterCount(deserters);
      setDeserterPercentage(total > 0 ? Math.round((deserters / total) * 100) : 0);

      // 2. Sesiones del Mes Actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      
      const { count, error: sError } = await supabase
        .from('patient_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth);
      
      if (sError) console.error("Error sesiones:", sError);
      else setSessionsThisMonth(count || 0);

      // 3. Ingresos por Trimestre (Año actual)
      const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString();
      const { data: newPatients, error: qError } = await supabase
        .from('patients')
        .select('created_at')
        .gte('created_at', startOfYear);

      if (qError) throw qError;

      // Calcular Q1, Q2, Q3, Q4
      const quarters = [
        { name: 'Q1', count: 0, color: '#3b82f6' }, // Azul
        { name: 'Q2', count: 0, color: '#8b5cf6' }, // Violeta
        { name: 'Q3', count: 0, color: '#10b981' }, // Verde
        { name: 'Q4', count: 0, color: '#f59e0b' }  // Naranja
      ];

      newPatients?.forEach(p => {
        const month = new Date(p.created_at).getMonth(); // 0-11
        if (month >= 0 && month <= 2) quarters[0].count++;
        else if (month >= 3 && month <= 5) quarters[1].count++;
        else if (month >= 6 && month <= 8) quarters[2].count++;
        else if (month >= 9 && month <= 11) quarters[3].count++;
      });

      setQuarterlyData(quarters);

    } catch (err: any) {
      console.error("Error dashboard:", err);
      alert("Error cargando datos: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-white text-center">Cargando métricas clínicas...</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" onClick={() => navigate('/')} className="text-zinc-400 hover:text-white">
          <ArrowLeft className="w-5 h-5 mr-2" /> Volver
        </Button>
        <h1 className="text-2xl font-bold text-white">Dashboard Clínico</h1>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total Pacientes */}
        <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalPatients}</div>
            <p className="text-xs text-zinc-500 mt-1">Pacientes activos e inactivos</p>
          </CardContent>
        </Card>

        {/* % Desertores */}
        <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Tasa de Deserción</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{deserterPercentage}%</div>
            <p className="text-xs text-zinc-500 mt-1">{deserterCount} pacientes desertores totales</p>
          </CardContent>
        </Card>

        {/* Sesiones del Mes */}
        <Card className="bg-zinc-900 border-zinc-800 border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Sesiones este Mes</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{sessionsThisMonth}</div>
            <p className="text-xs text-zinc-500 mt-1">Actividad clínica actual</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfica Trimestral */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-purple-500" /> Ingresos de Pacientes por Trimestre ({new Date().getFullYear()})
          </CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
              <XAxis dataKey="name" stroke="#999" tick={{fill: '#999'}} />
              <YAxis stroke="#999" tick={{fill: '#999'}} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#333', color: '#fff' }}
                itemStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {quarterlyData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}

// Componente Button simple si no se importa (por seguridad)
function Button({ children, variant, onClick, className }: any) {
  const baseStyle = "px-4 py-2 rounded font-medium transition-colors";
  const styles = variant === 'ghost' ? "hover:bg-zinc-800 text-zinc-400" : "bg-blue-600 text-white hover:bg-blue-700";
  return <button onClick={onClick} className={`${baseStyle} ${styles} ${className}`}>{children}</button>;
}