import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { 
  PlusCircle, RefreshCw, MoreHorizontal, Phone, Mail, Calendar, User, 
  MessageCircle, Trash2, DollarSign, CreditCard 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Switch } from '../../components/ui/switch';

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
  meta?: any;
}

// Modal para detalles de venta (Solo al cerrar)
function CloseDealModal({ isOpen, onClose, onSave, lead }: any) {
  const [totalValue, setTotalValue] = useState('');
  const [cashCollected, setCashCollected] = useState('');
  const [isInstallments, setIsInstallments] = useState(false);
  const [installmentCount, setInstallmentCount] = useState('');
  const [installmentValue, setInstallmentValue] = useState('');

  // Resetear valores al abrir
  useEffect(() => {
    if (isOpen && lead?.meta) {
      setTotalValue(lead.meta.total_value || '');
      setCashCollected(lead.meta.cash_collected || '');
      setIsInstallments(lead.meta.is_installments || false);
      setInstallmentCount(lead.meta.installment_count || '');
      setInstallmentValue(lead.meta.installment_value || '');
    } else if (isOpen) {
      setTotalValue(''); setCashCollected(''); setIsInstallments(false);
      setInstallmentCount(''); setInstallmentValue('');
    }
  }, [isOpen, lead]);

  const handleSave = () => {
    onSave({
      total_value: parseFloat(totalValue) || 0,
      cash_collected: parseFloat(cashCollected) || 0,
      is_installments: isInstallments,
      installment_count: isInstallments ? parseInt(installmentCount) : 0,
      installment_value: isInstallments ? parseFloat(installmentValue) : 0
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-400">
            <DollarSign className="w-5 h-5" /> Finalizar Venta: {lead?.full_name}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Valor Total Plan ($)</Label>
              <Input type="number" value={totalValue} onChange={(e) => setTotalValue(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" placeholder="0" />
            </div>
            <div className="space-y-2">
              <Label>Cash Collect ($)</Label>
              <Input type="number" value={cashCollected} onChange={(e) => setCashCollected(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" placeholder="0" />
            </div>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-zinc-400" />
              <Label className="m-0 cursor-pointer">¿Paga a cuotas?</Label>
            </div>
            <Switch checked={isInstallments} onCheckedChange={setIsInstallments} />
          </div>

          {isInstallments && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="grid grid-cols-2 gap-4 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
              <div className="space-y-2">
                <Label>Número de Cuotas</Label>
                <Input type="number" value={installmentCount} onChange={(e) => setInstallmentCount(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" placeholder="Ej: 3" />
              </div>
              <div className="space-y-2">
                <Label>Valor por Cuota ($)</Label>
                <Input type="number" value={installmentValue} onChange={(e) => setInstallmentValue(e.target.value)} className="bg-zinc-900 border-zinc-800 text-white" placeholder="0" />
              </div>
            </motion.div>
          )}
        </div>
        <DialogFooter>
          <button type="button" onClick={onClose} className="h-9 px-4 text-zinc-400 hover:text-white">Cancelar</button>
          <button onClick={handleSave} className="h-9 px-4 bg-green-600 text-white hover:bg-green-700 rounded-md font-medium">Guardar Venta</button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LeadCard({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
  const [showCloseModal, setShowCloseModal] = useState(false);

  const handleWhatsApp = () => {
    if (!lead.phone) return;
    let cleanPhone = lead.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('57')) cleanPhone = '57' + cleanPhone;
    const text = `Hola ${lead.full_name}, te contacto respecto a tu interés en Vantage.`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar lead?')) return;
    await supabase.from('leads').delete().eq('id', lead.id);
    onUpdate();
  };

  const handleStatusChange = async (newStatus: string) => {
    // Si movemos a 'closed', abrimos el modal primero
    if (newStatus === 'closed') {
      setShowCloseModal(true);
    } else {
      // Movimiento normal sin modal
      await supabase.from('leads').update({ status: newStatus }).eq('id', lead.id);
      onUpdate();
    }
  };

  const saveDealDetails = async (details: any) => {
    // Actualizamos estado Y metadatos financieros
    const newMeta = { ...(lead.meta || {}), ...details };
    await supabase.from('leads').update({ 
      status: 'closed',
      meta: newMeta
    }).eq('id', lead.id);
    
    setShowCloseModal(false);
    onUpdate();
  };

  // Formatear moneda
  const fmt = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

  return (
    <>
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
            
            {/* Mostrar resumen financiero si está cerrado */}
            {lead.status === 'closed' && lead.meta && (
              <div className="mt-3 pt-2 border-t border-zinc-800 space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Total:</span>
                  <span className="text-green-400 font-medium">{fmt(lead.meta.total_value)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-zinc-500">Cash:</span>
                  <span className="text-blue-400 font-medium">{fmt(lead.meta.cash_collected)}</span>
                </div>
                {lead.meta.is_installments && (
                  <div className="flex justify-between text-xs bg-zinc-800/50 p-1 rounded mt-1">
                    <span className="text-zinc-400">{lead.meta.installment_count} x {fmt(lead.meta.installment_value)}</span>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t border-zinc-800 mt-2">
              <div className="flex items-center gap-2 text-xs text-zinc-500"><Calendar className="w-3 h-3" /> {new Date(lead.created_at).toLocaleDateString()}</div>
              {lead.status === 'new' && lead.phone && (
                <button onClick={handleWhatsApp} className="h-6 px-2 text-[10px] bg-green-900/20 border border-green-800 text-green-400 rounded-md flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> WhatsApp
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal de Cierre */}
      <CloseDealModal 
        isOpen={showCloseModal} 
        onClose={() => setShowCloseModal(false)} 
        onSave={saveDealDetails}
        lead={lead}
      />
    </>
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
  
  // Ref para evitar doble suscripción
  const channelRef = useRef<any>(null);

  const loadLeads = async () => {
    const { data, error } = await supabase.from('leads').select('*').order('created_at', { ascending: false });
    if (!error && data) setLeads(data);
    setLoading(false);
  };

  useEffect(() => {
    loadLeads();
    
    // Suscribirse solo si no existe un canal activo
    if (!channelRef.current) {
      channelRef.current = supabase.channel('public:leads')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => loadLeads())
        .subscribe();
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
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
  };

  const columnsData = COLUMNS.map(col => ({ ...col, items: leads.filter(l => l.status === col.id) }));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline de Leads</h1>
          <p className="text-sm text-zinc-400 mt-1">Gestiona tus leads y cierra ventas.</p>
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
                <div className="space-y-2">
                  <Label>Nombre Completo *</Label>
                  <Input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Ej: Juan Pérez" className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="juan@ejemplo.com" className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+57 300 123 4567" className="bg-zinc-900 border-zinc-800 text-white" />
                </div>
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