import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { 
  PlusCircle, RefreshCw, MoreHorizontal, Phone, Mail, Calendar, 
  MessageCircle, Trash2, CheckCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

const COLUMNS = [
  { id: 'new', title: 'Nuevos', color: 'bg-blue-500' },
  { id: 'contacted', title: 'Contactados', color: 'bg-yellow-500' },
  { id: 'qualified', title: 'Calificados', color: 'bg-purple-500' },
  { id: 'scheduled', title: 'Agendados', color: 'bg-indigo-500' },
  { id: 'closed', title: 'Cerrados', color: 'bg-green-500' },
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

// LeadCard ahora recibe onMove como prop
function LeadCard({ lead, onMove }: { lead: Lead; onMove: (id: string, status: string) => void }) {
  const handleWhatsApp = () => {
    if (!lead.phone) return;
    let cleanPhone = lead.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('57')) cleanPhone = '57' + cleanPhone;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${lead.full_name}, te contacto...`)}`, '_blank');
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar?')) return;
    await supabase.from('leads').delete().eq('id', lead.id);
    // Recargar padre
    onMove(lead.id, 'delete'); 
  };

  return (
    <motion.div layout className="mb-3">
      <Card className="bg-zinc-900 border-zinc-800 hover:border-zinc-600">
        <CardHeader className="p-3 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold text-zinc-400">
                {lead.full_name.charAt(0)}
              </div>
              <CardTitle className="text-sm font-semibold text-white truncate">{lead.full_name}</CardTitle>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-6 w-6 text-zinc-500 hover:text-white"><MoreHorizontal className="w-4 h-4"/></button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-zinc-900 border-zinc-800 text-white">
                <DropdownMenuLabel>Mover a...</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-zinc-800"/>
                {COLUMNS.map(col => (
                  <DropdownMenuItem key={col.id} onClick={() => onMove(lead.id, col.id)} className="hover:bg-zinc-800 cursor-pointer">
                    <div className={`w-2 h-2 rounded-full mr-2 ${col.color}`}/>{col.title}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator className="bg-zinc-800"/>
                {lead.phone && <DropdownMenuItem onClick={handleWhatsApp} className="text-green-400 hover:bg-green-900/30"><MessageCircle className="w-3 h-3 mr-2"/>WhatsApp</DropdownMenuItem>}
                <DropdownMenuSeparator className="bg-zinc-800"/>
                <DropdownMenuItem onClick={handleDelete} className="text-red-400 hover:bg-red-900/30"><Trash2 className="w-3 h-3 mr-2"/>Eliminar</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0 text-xs text-zinc-400 space-y-1">
           {lead.email && <div className="truncate">{lead.email}</div>}
           {lead.phone && <div>{lead.phone}</div>}
           {lead.status === 'closed' && lead.sale_total && (
             <div className="mt-2 pt-2 border-t border-zinc-800 text-green-400">
               <div>Venta: ${lead.sale_total.toLocaleString()}</div>
               {lead.installments_count ? <div>Cuotas: {lead.installments_count} x ${lead.installment_value?.toLocaleString()}</div> : null}
               <div className="flex items-center gap-1 mt-1"><CheckCircle className="w-3 h-3"/> Listo para paciente</div>
             </div>
           )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [saleTotal, setSaleTotal] = useState<number | ''>('');
  const [cashCollected, setCashCollected] = useState<number | ''>('');
  const [installmentsCount, setInstallmentsCount] = useState<number | ''>('');
  const [installmentValue, setInstallmentValue] = useState<number | ''>('');

  const loadLeads = async () => {
    const { data } = await supabase.from('leads').select('*').eq('is_converted', false).order('created_at', { ascending: false });
    if (data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => { loadLeads(); const i = setInterval(loadLeads, 5000); return () => clearInterval(i); }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    await supabase.from('leads').insert({ full_name: newName, email: newEmail||undefined, phone: newPhone||undefined, source: 'manual', status: 'new', setter_id: user?.id });
    setIsDialogOpen(false); setNewName(''); setNewEmail(''); setNewPhone('');
  };

  const handleMove = async (id: string, status: string) => {
    if (status === 'delete') {
      await supabase.from('leads').delete().eq('id', id);
      loadLeads();
      return;
    }
    if (status === 'closed') {
      setSelectedLeadId(id);
      setIsCloseModalOpen(true);
    } else {
      await supabase.from('leads').update({ status }).eq('id', id);
      loadLeads();
    }
  };

  const handleCloseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId || !saleTotal) return;
    
    // 1. Update Lead
    await supabase.from('leads').update({
      status: 'closed',
      sale_total: Number(saleTotal),
      cash_collected: Number(cashCollected)||0,
      installments_count: Number(installmentsCount)||0,
      installment_value: Number(installmentValue)||0,
      is_converted: true // Mark as converted to hide from pipeline
    }).eq('id', selectedLeadId);

    // 2. Get Lead Data to create Patient
    const { data: leadData } = await supabase.from('leads').select('*').eq('id', selectedLeadId).single();
    if (leadData) {
      await supabase.from('patients').insert({
        full_name: leadData.full_name,
        email: leadData.email,
        phone: leadData.phone,
        status: 'pending_assignment',
        notes: `Venta: $${saleTotal}. Pago: $${cashCollected}. Cuotas: ${installmentsCount} x $${installmentValue}.`,
        source_lead_id: leadData.id
      });
    }

    setIsCloseModalOpen(false);
    setSelectedLeadId(null);
    setSaleTotal(''); setCashCollected(''); setInstallmentsCount(''); setInstallmentValue('');
    loadLeads();
    alert("Paciente creado y asignado correctamente.");
  };

  const columnsData = COLUMNS.map(col => ({ ...col, items: leads.filter(l => l.status === col.id) }));

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div><h1 className="text-2xl font-bold text-white">Pipeline</h1><p className="text-sm text-zinc-400">Gestiona tus leads</p></div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadLeads}><RefreshCw className={`w-4 h-4 ${loading?'animate-spin':''}`}/></Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild><button className="h-9 px-4 bg-white text-black rounded-md text-sm font-medium flex items-center gap-2"><PlusCircle className="w-4 h-4"/>Nuevo Lead</button></DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
              <DialogHeader><DialogTitle>Nuevo Lead</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateLead} className="space-y-4 mt-2">
                <Input value={newName} onChange={e=>setNewName(e.target.value)} required placeholder="Nombre" className="bg-zinc-900 border-zinc-800 text-white"/>
                <Input type="email" value={newEmail} onChange={e=>setNewEmail(e.target.value)} placeholder="Email" className="bg-zinc-900 border-zinc-800 text-white"/>
                <Input value={newPhone} onChange={e=>setNewPhone(e.target.value)} placeholder="Teléfono" className="bg-zinc-900 border-zinc-800 text-white"/>
                <DialogFooter><button type="submit" className="h-9 px-4 bg-white text-black rounded-md font-medium">Guardar</button></DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[1200px] h-full">
          {columnsData.map(col => (
            <div key={col.id} className="flex-1 min-w-[280px] flex flex-col bg-zinc-900/30 rounded-xl border border-zinc-800/50">
              <div className="p-3 border-b border-zinc-800 flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col.color}`}/>
                <h3 className="font-semibold text-sm text-zinc-200">{col.title}</h3>
                <span className="ml-auto text-xs bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400">{col.items.length}</span>
              </div>
              <div className="p-2 flex-1 overflow-y-auto">
                {col.items.map(lead => <LeadCard key={lead.id} lead={lead} onMove={handleMove}/>)}
                {col.items.length === 0 && <div className="h-20 flex items-center justify-center text-xs text-zinc-600">Vacío</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Cierre */}
      <Dialog open={isCloseModalOpen} onOpenChange={setIsCloseModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white">
          <DialogHeader><DialogTitle>Finalizar Venta</DialogTitle></DialogHeader>
          <form onSubmit={handleCloseSubmit} className="space-y-4 mt-4">
            <div className="space-y-2"><Label>Valor Total ($)</Label><Input type="number" value={saleTotal} onChange={e=>setSaleTotal(Number(e.target.value))} required className="bg-zinc-900 border-zinc-800 text-white"/></div>
            <div className="space-y-2"><Label>Pago Inicial ($)</Label><Input type="number" value={cashCollected} onChange={e=>setCashCollected(Number(e.target.value))} className="bg-zinc-900 border-zinc-800 text-white"/></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Cuotas</Label><Input type="number" value={installmentsCount} onChange={e=>setInstallmentsCount(Number(e.target.value))} className="bg-zinc-900 border-zinc-800 text-white"/></div>
              <div className="space-y-2"><Label>Valor/Cuota ($)</Label><Input type="number" value={installmentValue} onChange={e=>setInstallmentValue(Number(e.target.value))} className="bg-zinc-900 border-zinc-800 text-white"/></div>
            </div>
            <DialogFooter><button type="submit" className="h-9 px-4 bg-green-600 text-white rounded-md font-medium">Confirmar y Crear Paciente</button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}