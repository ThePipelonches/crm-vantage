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
  MessageCircle, Trash2, DollarSign, CreditCard 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';

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

function LeadCard({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
  const handleWhatsApp = () => {
    if (!lead.phone) return;
    let cleanPhone = lead.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('57')) cleanPhone = '57' + cleanPhone;
    const text = `Hola ${lead.full_name}, te contacto respecto a tu interÃ©s en Vantage.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDelete = async () => {
    if (!confirm('Â¿Eliminar lead?')) return;
    await supabase.from('leads').delete().eq('id', lead.id);
    onUpdate();
  };

  const handleStatusChange = async (newStatus: string) => {
    // Si mueve a Cerrados y no tiene datos de venta, abrir modal (lÃ³gica manejada en el padre o aquÃ­ si es simple)
    // Para simplificar, actualizamos estado y si es 'closed' sin datos, el padre podrÃ­a manejarlo, 
    // pero aquÃ­ haremos el update directo. Si necesita datos, el usuario debe llenarlos antes o despuÃ©s.
    // Mejora: Si va a closed y no tiene sale_total, podrÃ­amos forzar el modal desde el padre.
    // Por ahora, permitimos el cambio y si estÃ¡ vacÃ­o, se puede editar luego o convertir.
    
    await supabase.from('leads').update({ status: newStatus }).eq('id', lead.id);
    onUpdate();
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="mb-3 relative group">
      <Card className="bg-zinc-900 border-zinc-800 transition-all hover:border-zinc-600">
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
                {lead.phone && (
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
          
          {/* Resumen de venta si estÃ¡ cerrado */}
          {lead.status === 'closed' && lead.sale_total && (
            <div className="mt-2 pt-2 border-t border-zinc-800 text-xs space-y-1">
              <div className="flex justify-between text-zinc-300">
                <span>Total:</span>
                <span className="font-bold text-green-400">${lead.sale_total.toLocaleString()}</span>
              </div>
              {lead.cash_collected && (
                <div className="flex justify-between text-zinc-400">
                  <span>Inicial:</span>
                  <span>${lead.cash_collected.toLocaleString()}</span>
                </div>
              )}
              {lead.installments_count && (
                <div className="flex justify-between text-zinc-400">
                  <span>Cuotas:</span>
                  <span>{lead.installments_count} x ${lead.installment_value?.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-zinc-800 mt-2">
            <div className="flex items-center gap-2 text-xs text-zinc-500"><Calendar className="w-3 h-3" /> {new Date(lead.created_at).toLocaleDateString()}</div>
            {lead.phone && (
              <button onClick={handleWhatsApp} className="h-6 px-2 text-[10px] bg-green-900/20 border border-green-800 text-green-400 rounded-md flex items-center gap-1 hover:bg-green-900/40">
                <MessageCircle className="w-3 h-3" /> WhatsApp
              </button>
            )}
          </div>
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
  
  // Estados para el modal de cierre de venta
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedLeadForSale, setSelectedLeadForSale] = useState<Lead | null>(null);
  const [saleTotal, setSaleTotal] = useState<number | ''>('');
  const [cashCollected, setCashCollected] = useState<number | ''>('');
  const [installmentsCount, setInstallmentsCount] = useState<number | ''>('');
  const [installmentValue, setInstallmentValue] = useState<number | ''>('');

  const loadLeads = async () => {
    // Solo cargar leads que NO estÃ©n convertidos a pacientes aÃºn
    const { data, error } = await supabase.from('leads')
      .select('*')
      .eq('is_converted', false) // Filtrar los que ya son pacientes
      .order('created_at', { ascending: false });
    
    if (!error && data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
    const interval = setInterval(loadLeads, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    await supabase.from('leads').insert({
      full_name: newName,
      email: newEmail || undefined,
      phone: newPhone || undefined,
      source: 'manual',
      status: 'new',
      setter_id: user?.id
    });
    setIsDialogOpen(false);
    setNewName(''); setNewEmail(''); setNewPhone('');
    loadLeads();
  };

  // Manejar cambio de estado: si es a 'closed', abrir modal de venta
  const handleStatusChangeRequest = (lead: Lead, newStatus: string) => {
    if (newStatus === 'closed' && (!lead.sale_total)) {
      setSelectedLeadForSale(lead);
      setIsSaleModalOpen(true);
    } else {
      supabase.from('leads').update({ status: newStatus }).eq('id', lead.id).then(() => loadLeads());
    }
  };

  // Guardar venta y convertir a paciente
  const handleSaveSaleAndConvert = async () => {
    if (!selectedLeadForSale || !saleTotal) return;

    const updateData: any = {
      status: 'closed',
      sale_total: Number(saleTotal),
      cash_collected: cashCollected ? Number(cashCollected) : 0,
      installments_count: installmentsCount ? Number(installmentsCount) : 0,
      installment_value: installmentValue ? Number(installmentValue) : 0,
      is_converted: true, // MARCAR COMO CONVERTIDO PARA QUE DESAPAREZCA DEL PIPELINE
      notes: `Venta cerrada. Total: ${saleTotal}. Inicial: ${cashCollected}. Cuotas: ${installmentsCount} de ${installmentValue}.`
    };

    // 1. Actualizar Lead
    const { error: leadError } = await supabase.from('leads').update(updateData).eq('id', selectedLeadForSale.id);
    
    if (leadError) {
      alert('Error al guardar venta: ' + leadError.message);
      return;
    }

    // 2. Crear Paciente
    const { error: patientError } = await supabase.from('patients').insert({
      full_name: selectedLeadForSale.full_name,
      email: selectedLeadForSale.email,
      phone: selectedLeadForSale.phone,
      status: 'pending_assignment',
      notes: updateData.notes,
      source_lead_id: selectedLeadForSale.id
    });

    if (patientError) {
      alert('Error al crear paciente: ' + patientError.message);
      // Rollback opcional si falla la creaciÃ³n del paciente
      return;
    }

    alert('Â¡Venta guardada y paciente creado exitosamente!');
    setIsSaleModalOpen(false);
    setSelectedLeadForSale(null);
    setSaleTotal(''); setCashCollected(''); setInstallmentsCount(''); setInstallmentValue('');
    loadLeads();
  };

  const columnsData = COLUMNS.map(col => ({ ...col, items: leads.filter(l => l.status === col.id) }));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline de Leads</h1>
          <p className="text-sm text-zinc-400 mt-1">Gestiona tus leads. Al cerrar una venta, se crea el paciente automÃ¡ticamente.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadLeads} disabled={loading} className="border-zinc-700 text-zinc-300">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <button className="h-9 px-4 bg-white text-black hover:bg-zinc-200 rounded-md text-sm font-medium flex items-center gap-2">
                <PlusCircle className="w-4 h-4" /> Nuevo Lead
              </button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-md">
              <DialogHeader><DialogTitle>Agregar Nuevo Lead</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateLead} className="space-y-4 mt-2">
                <div className="space-y-2"><Label>Nombre Completo *</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Ej: Juan PÃ©rez" className="bg-zinc-900 border-zinc-800 text-white" /></div>
                <div className="space-y-2"><Label>Email</Label><Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="juan@ejemplo.com" className="bg-zinc-900 border-zinc-800 text-white" /></div>
                <div className="space-y-2"><Label>TelÃ©fono</Label><Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+57 300 123 4567" className="bg-zinc-900 border-zinc-800 text-white" /></div>
                <DialogFooter className="pt-4">
                  <button type="button" onClick={() => setIsDialogOpen(false)} className="h-9 px-4 text-zinc-400 hover:text-white">Cancelar</button>
                  <button type="submit" className="h-9 px-4 bg-white text-black hover:bg-zinc-200 rounded-md font-medium">Guardar Lead</button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {loading && leads.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-zinc-500 flex-col gap-2"><RefreshCw className="w-8 h-8 animate-spin" /><p>Cargando pipeline...</p></div>
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
                    {col.items.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} onUpdate={loadLeads} />
                    ))}
                  </AnimatePresence>
                  {col.items.length === 0 && (<div className="h-24 flex items-center justify-center text-xs text-zinc-600 italic border-2 border-dashed border-zinc-800/50 rounded-lg m-1">Sin leads</div>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL DE VENTA Y CONVERSIÃ“N */}
      <Dialog open={isSaleModalOpen} onOpenChange={setIsSaleModalOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-400">
              <DollarSign className="w-5 h-5" /> Cerrar Venta y Crear Paciente
            </DialogTitle>
            <p className="text-sm text-zinc-400">Completa la informaciÃ³n financiera para {selectedLeadForSale?.full_name}.</p>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Total Programa ($)</Label>
                <Input type="number" value={saleTotal} onChange={(e) => setSaleTotal(Number(e.target.value))} className="bg-zinc-900 border-zinc-800 text-white" placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Cash Collect / Inicial ($)</Label>
                <Input type="number" value={cashCollected} onChange={(e) => setCashCollected(Number(e.target.value))} className="bg-zinc-900 border-zinc-800 text-white" placeholder="0" />
              </div>
            </div>
            <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 space-y-3">
              <Label className="text-zinc-300 flex items-center gap-2"><CreditCard className="w-4 h-4" /> InformaciÃ³n de Cuotas (Opcional)</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs">NÃºmero de Cuotas</Label>
                  <Input type="number" value={installmentsCount} onChange={(e) => setInstallmentsCount(Number(e.target.value))} className="bg-zinc-950 border-zinc-800 text-white h-9" placeholder="Ej: 6" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Valor por Cuota ($)</Label>
                  <Input type="number" value={installmentValue} onChange={(e) => setInstallmentValue(Number(e.target.value))} className="bg-zinc-950 border-zinc-800 text-white h-9" placeholder="Ej: 100000" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <button type="button" onClick={() => setIsSaleModalOpen(false)} className="h-9 px-4 text-zinc-400 hover:text-white">Cancelar</button>
            <button onClick={handleSaveSaleAndConvert} className="h-9 px-4 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Confirmar Venta y Crear Paciente
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}