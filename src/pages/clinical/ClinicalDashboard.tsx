import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, TrendingDown, Activity, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function ClinicalDashboard() {
  const [stats, setStats] = useState({
    totalPatients: 0,
    deserterCount: 0,
    deserterPercentage: 0,
    sessionsThisMonth: 0
  });
  const [quarterlyData, setQuarterlyData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    fetchQuarterlyData();
  }, []);

  const fetchStats = async () => {
    try {
      // 1. Total Pacientes y Desertores
      const { data: patients, error: pErr } = await supabase.from('patients').select('status');
      if (pErr) throw pErr;
      
      const total = patients.length;
      const deserters = patients.filter((p: any) => p.status === 'deserter').length;
      const percentage = total > 0 ? ((deserters / total) * 100).toFixed(1) : 0;

      // 2. Sesiones del Mes Actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const { count, error: sErr } = await supabase
        .from('patient_sessions')
        .select('*', { head: true, count: 'exact' })
        .gte('created_at', startOfMonth);
      
      if (sErr) throw sErr;

      setStats({
        totalPatients: total,
        deserterCount: deserters,
        deserterPercentage: parseFloat(percentage),
        sessionsThisMonth: count || 0
      });
    } catch (err) {
      console.error("Error stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchQuarterlyData = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const startOfYear = new Date(currentYear, 0, 1).toISOString();
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59).toISOString();

      const { data, error } = await supabase
        .from('patients')
        .select('created_at')
        .gte('created_at', startOfYear)
        .lte('created_at', endOfYear);

      if (error) throw error;

      // Agrupar por trimestres
      const quarters = [
        { name: 'Q1 (Ene-Mar)', count: 0, color: '#3b82f6' },
        { name: 'Q2 (Abr-Jun)', count: 0, color: '#8b5cf6' },
        { name: 'Q3 (Jul-Sep)', count: 0, color: '#10b981' },
        { name: 'Q4 (Oct-Dic)', count: 0, color: '#f59e0b' }
      ];

      data.forEach((p: any) => {
        const month = new Date(p.created_at).getMonth(); // 0-11
        if (month >= 0 && month <= 2) quarters[0].count++;
        else if (month >= 3 && month <= 5) quarters[1].count++;
        else if (month >= 6 && month <= 8) quarters[2].count++;
        else if (month >= 9 && month <= 11) quarters[3].count++;
      });

      setQuarterlyData(quarters);
    } catch (err) {
      console.error("Error trimestres:", err);
    }
  };

  if (loading) return <div className="p-6 text-white">Cargando dashboard...</div>;

  return (
    <div className="p-6 space-y-6 animate-in fade-in">
      <h1 className="text-3xl font-bold text-white mb-6">Dashboard ClÃƒÂ­nico</h1>

      {/* Tarjetas Superiores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Total Pacientes</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalPatients}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Tasa de DeserciÃƒÂ³n</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.deserterPercentage}%</div>
            <p className="text-xs text-zinc-500 mt-1">{stats.deserterCount} pacientes desertores</p>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Sesiones (Mes)</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.sessionsThisMonth}</div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">AÃƒÂ±o Actual</CardTitle>
            <Calendar className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{new Date().getFullYear()}</div>
            <p className="text-xs text-zinc-500 mt-1">Ingresos por Trimestre</p>
          </CardContent>
        </Card>
      </div>

      {/* GrÃƒÂ¡fica Trimestral */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Pacientes Ingresados por Trimestre</CardTitle>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quarterlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#999" />
              <YAxis stroke="#999" allowDecimals={false} />
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