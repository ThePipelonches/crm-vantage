import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { PlusCircle, RefreshCw, MoreHorizontal, Phone, Mail, Calendar, MessageCircle, Trash2, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '../../components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

const COLUMNS = [
  { id: 'new', title: 'Nuevos', color: 'bg-blue-500' },
  { id: 'contacted', title: 'Contactados', color: 'bg-yellow-500' },
  { id: 'qualified', title: 'Calificados', color: 'bg-purple-500' },
  { id: 'scheduled', title: 'Agendados', color: 'bg-indigo-500' },
  { id: 'closed', title: 'Cerrados (Venta)', color: 'bg-green-500' },
  { id: 'lost', title: 'Perdidos', color: 'bg-red-500' },
];

interface Lead {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  status: string;
  notes?: string;
  created_at: string;
  is_converted?: boolean;
  sale_total?: number;
  cash_collected?: number;
  installments_count?: number;
  installment_value?: number;
}

function LeadCard({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleTotal, setSaleTotal] = useState('');
  const [cashCollected, setCashCollected] = useState('');
  const [installmentsCount, setInstallmentsCount] = useState('');
  const [installmentValue, setInstallmentValue] = useState('');

  const handleWhatsApp = () => {
    if (!lead.phone) return;
    let cleanPhone = lead.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('57')) cleanPhone = '57' + cleanPhone;
    const text = `Hola ${lead.full_name}, te contacto respecto a tu interÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â©s en Vantage.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDelete = async () => {
    if (!confirm('ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¿Eliminar lead?')) return;
    await supabase.from('leads').delete().eq('id', lead.id);
    onUpdate();
  };

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === 'closed' && !lead.is_converted) {
      // Si mueve a cerrados y no estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ convertido, abrir modal de venta
      setIsSaleModalOpen(true);
      // Pre-llenar valores si ya existen
      if (lead.sale_total) setSaleTotal(lead.sale_total.toString());
      if (lead.cash_collected) setCashCollected(lead.cash_collected.toString());
      if (lead.installments_count) setInstallmentsCount(lead.installments_count.toString());
      if (lead.installment_value) setInstallmentValue(lead.installment_value.toString());
    } else {
      // Cambio de estado normal
      await supabase.from('leads').update({ status: newStatus }).eq('id', lead.id);
      onUpdate();
    }
  };

  const handleSaveSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(saleTotal) || 0;
    const cash = parseFloat(cashCollected) || 0;
    const count = parseInt(installmentsCount) || 0;
    const value = parseFloat(installmentValue) || 0;

    // 1. Actualizar lead con datos financieros y marcar como convertido
    const { error } = await supabase.from('leads').update({
      sale_total: total,
      cash_collected: cash,
      installments_count: count,
      installment_value: value,
      is_converted: true,
      status: 'closed' // Asegurar estado
    }).eq('id', lead.id);

    if (error) {
      alert('Error al guardar la venta: ' + error.message);
      return;
    }

    // 2. Crear registro en tabla patients para notificaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n y asignaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n
    await supabase.from('patients').insert({
      lead_id: lead.id,
      full_name: lead.full_name,
      email: lead.email,
      phone: lead.phone,
      status: 'pending_assignment',
      notes: `Convertido desde Lead. Venta: $${total}, Cash: $${cash}`
    });

    setIsSaleModalOpen(false);
    onUpdate();
    alert('ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡Venta guardada! El paciente ha sido enviado a la bandeja de "Pacientes" para asignaciÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³n.');
  };

  // Si estÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ convertido, no mostramos tarjeta en el pipeline (se va a pacientes)
  if (lead.is_converted) return null;

  return (
    <>
      <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="mb-3 relative group">
        <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600 transition-all">
          <CardHeader className="p-3 pb-2">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-zinc-800 text-zinc-400">
                  {lead.full_name.charAt(0).toUpperCase()}
                </div>
                <CardTitle className="text-sm font-semibold text-white truncate">{lead.full_name}</CardTitle>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-6 w-6 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-zinc-900 border-zinc-800 text-white">
                  <DropdownMenuLabel className="text-xs text-zinc-500">Mover a...</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  {COLUMNS.map((col) => (
                    <DropdownMenuItem key={col.id} onClick={() => handleStatusChange(col.id)} className="cursor-pointer hover:bg-zinc-800">
                      <div className={`w-2 h-2 rounded-full mr-2 ${col.color}`} /> {col.title}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-zinc-800 my-2" />
                  {lead.status === 'new' && lead.phone && (
                    <DropdownMenuItem onClick={handleWhatsApp} className="text-green-400 hover:bg-green-900/30">
                      <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-zinc-800" />
                  <DropdownMenuItem onClick={handleDelete} className="text-red-400 hover:bg-red-900/30">
                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-2">
            {lead.email && <div className="flex items-center gap-2 text-xs text-zinc-400 truncate"><Mail className="w-3 h-3" /> {lead.email}</div>}
            {lead.phone && <div className="flex items-center gap-2 text-xs text-zinc-400"><Phone className="w-3 h-3" /> {lead.phone}</div>}
            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 mt-2">
              <div className="flex items-center gap-2 text-xs text-zinc-500"><Calendar className="w-3 h-3" /> {new Date(lead.created_at).toLocaleDateString()}</div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal de Venta */}
      <Dialog open={isSaleModalOpen} onOpenChange={setIsSaleModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500" /> Registrar Venta y Convertir</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveSale} className="space-y-4 mt-2">
            <div className="p-3 bg-green-900/20 border border-green-800 rounded-md text-xs text-green-300">
              Al guardar, este lead desaparecerÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ del pipeline y se crearÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¡ un perfil de paciente para asignar psicÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â³logo.
            </div>
            <div className="space-y-2">
              <Label>Valor Total del Plan ($)</Label>
              <Input type="number" value={saleTotal} onChange={(e) => setSaleTotal(e.target.value)} required placeholder="Ej: 1200000" className="bg-zinc-900 border-zinc-800 text-white" />
            </div>
            <div className="space-y-2">
              <Label>Cash Collect / Pago Inicial ($)</Label>
              <Input type="number" value={cashCollected} onChange={(e) => setCashCollected(e.target.value)} required placeholder="Ej: 400000" className="bg-zinc-900 border-zinc-800 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â° Cuotas</Label>
                <Input type="number" value={installmentsCount} onChange={(e) => setInstallmentsCount(e.target.value)} placeholder="Ej: 4" className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
              <div className="space-y-2">
                <Label>Valor por Cuota ($)</Label>
                <Input type="number" value={installmentValue} onChange={(e) => setInstallmentValue(e.target.value)} placeholder="Ej: 200000" className="bg-zinc-900 border-zinc-800 text-white" />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <button type="button" onClick={() => setIsSaleModalOpen(false)} className="h-9 px-4 text-zinc-400 hover:text-white">Cancelar</button>
              <button type="submit" className="h-9 px-4 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium">Confirmar Venta y Convertir</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const loadLeads = async () => {
    // Solo cargamos leads que NO han sido convertidos aÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Âºn
    const { data, error } = await supabase.from('leads')
      .select('*')
      .eq('is_converted', false) 
      .order('created_at', { ascending: false });
    
    if (!error && data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
    // Polling cada 5 segundos para evitar errores de realtime
    const interval = setInterval(loadLeads, 5000);
    return () => clearInterval(interval);
  }, []);

  const columnsData = COLUMNS.map(col => ({ ...col, items: leads.filter(l => l.status === col.id) }));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline de Leads</h1>
          <p className="text-sm text-zinc-400 mt-1">Gestiona tus leads. Al cerrar venta, se convierten en Pacientes.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadLeads} disabled={loading} className="border-zinc-700 text-zinc-300">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading && leads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col gap-2">
          <RefreshCw className="w-8 h-8 animate-spin" /><p>Cargando pipeline...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-4 min-w-[1200px] h-full">
            {columnsData.map((col) => (
              <div key={col.id} className="flex-1 min-w-[280px] max-w-xs flex flex-col bg-zinc-900/30 rounded-xl border border-zinc-800/50">
                <div className="p-3 border-b border-zinc-800/50 flex items-center justify-between sticky top-0 bg-zinc-900/95 rounded-t-xl z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <h3 className="font-semibold text-sm text-zinc-200">{col.title}</h3>
                    <span className="text-xs font-medium text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full">{col.items.length}</span>
                  </div>
                </div>
                <div className="p-2 flex-1 overflow-y-auto min-h-[150px]">
                  <AnimatePresence>
                    {col.items.map((lead) => (<LeadCard key={lead.id} lead={lead} onUpdate={loadLeads} />))}
                  </AnimatePresence>
                  {col.items.length === 0 && (<div className="h-24 flex items-center justify-center text-xs text-zinc-600 italic border-2 border-dashed border-zinc-800/50 rounded-lg m-1">Sin leads</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}