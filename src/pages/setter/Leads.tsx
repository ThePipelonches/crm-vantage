import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { getLeads, updateLeadStatus, createLead, type CreateLeadInput } from '../../services/leads';
import { useAuth } from '../../hooks/useAuth';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
// Importamos el Dialog pero usaremos un enfoque simplificado
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { 
  PlusCircle, RefreshCw, MoreHorizontal, Phone, Mail, Calendar, User, 
  MessageCircle, AlertCircle, Trash2 
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
}

function LeadCard({ lead, onUpdate }: { lead: Lead; onUpdate: () => void }) {
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    if (lead.status !== 'new') {
      setIsUrgent(false);
      return;
    }
    const checkUrgency = () => {
      const now = new Date();
      const created = new Date(lead.created_at);
      const diffMins = Math.floor((now.getTime() - created.getTime()) / 60000);
      setIsUrgent(diffMins >= 5);
    };
    checkUrgency();
    const interval = setInterval(checkUrgency, 60000);
    return () => clearInterval(interval);
  }, [lead.status, lead.created_at]);

  const handleWhatsApp = () => {
    if (!lead.phone) return;
    let cleanPhone = lead.phone.replace(/\D/g, '');
    if (cleanPhone.length === 10 && !cleanPhone.startsWith('57')) cleanPhone = '57' + cleanPhone;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hola ${lead.full_name}, te contacto sobre tu interés en Vantage.`)}`, '_blank');
  };

  const handleDelete = async () => {
    if (!confirm('¿Eliminar lead?')) return;
    try {
      await supabase.from('leads').delete().eq('id', lead.id);
      onUpdate();
    } catch (e) { alert('Error al eliminar'); }
  };

  const handleStatusChange = async (newStatus: string) => {
    try {
      await updateLeadStatus(lead.id, newStatus);
      onUpdate();
    } catch (e) { alert('Error al mover'); }
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="mb-3 relative group">
      {isUrgent && (
        <div className="absolute -top-2 -right-2 z-20 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg animate-pulse border-2 border-black flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> ¡LLAMAR YA!
        </div>
      )}
      <Card className={`bg-zinc-900 border-zinc-800 transition-all ${isUrgent ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'hover:border-zinc-600'}`}>
        <CardHeader className="p-3 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isUrgent ? 'bg-red-900 text-red-100' : 'bg-zinc-800 text-zinc-400'}`}>
                {lead.full_name.charAt(0).toUpperCase()}
              </div>
              <CardTitle className="text-sm font-semibold text-white truncate">{lead.full_name}</CardTitle>
            </div>
            
            {/* Dropdown Menu Simplificado */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="h-6 w-6 flex items-center justify-center rounded-md text-zinc-500 hover:text-white hover:bg-zinc-800 focus:outline-none">
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
                  <DropdownMenuItem onClick={handleWhatsApp} className="cursor-pointer hover:bg-green-900/30 text-green-400">
                    <MessageCircle className="w-4 h-4 mr-2" /> WhatsApp
                  </DropdownMenuItem>
                )}
                {lead.email && (
                  <DropdownMenuItem onClick={() => window.open(`mailto:${lead.email}`)} className="cursor-pointer hover:bg-blue-900/30 text-blue-400">
                    <Mail className="w-4 h-4 mr-2" /> Email
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-zinc-800" />
                <DropdownMenuItem onClick={handleDelete} className="cursor-pointer hover:bg-red-900/30 text-red-400">
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
            <div className="flex items-center gap-2 text-xs text-zinc-500">
              <Calendar className="w-3 h-3" /> {new Date(lead.created_at).toLocaleDateString()}
            </div>
            {lead.status === 'new' && lead.phone && (
              <button onClick={handleWhatsApp} className="h-6 px-2 text-[10px] bg-green-900/20 border border-green-800 text-green-400 hover:bg-green-900/40 rounded-md flex items-center gap-1">
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

  const loadLeads = async () => {
    try {
      const data = await getLeads();
      setLeads(data);
    } catch (error) { console.error(error); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    loadLeads();
    
    // SOLUCIÓN NUCLEAR: En lugar de usar canales de realtime propensos a errores en React 18 Strict Mode,
    // usamos un polling simple cada 10 segundos. Es menos "tiempo real" instantáneo, pero 100% estable.
    const intervalId = setInterval(loadLeads, 10000); 

    return () => clearInterval(intervalId);
  }, []);

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;
    try {
      await createLead({ full_name: newName, email: newEmail || undefined, phone: newPhone || undefined, source: 'web' });
      setIsDialogOpen(false);
      setNewName(''); setNewEmail(''); setNewPhone('');
      loadLeads(); // Recarga inmediata
    } catch (error) { alert('Error al crear lead'); }
  };

  const columnsData = COLUMNS.map(col => ({ ...col, items: leads.filter(l => l.status === col.id) }));

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-white">Pipeline de Leads</h1>
          <p className="text-sm text-zinc-400 mt-1">Gestiona tus leads. <span className="text-red-400 font-medium">Alerta si más de 5 min sin contactar.</span></p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadLeads} disabled={loading} className="h-9 px-4 bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800 rounded-md flex items-center gap-2 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          
          {/* Dialog Simplificado SIN asChild problemático */}
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
                  <Label className="text-zinc-300">Nombre Completo *</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} required placeholder="Ej: Juan Pérez" className="pl-10 bg-zinc-900 border-zinc-800 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="juan@ejemplo.com" className="pl-10 bg-zinc-900 border-zinc-800 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">Teléfono</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                    <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="+57 300 123 4567" className="pl-10 bg-zinc-900 border-zinc-800 text-white" />
                  </div>
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
          <RefreshCw className="w-8 h-8 animate-spin" />
          <p>Cargando pipeline...</p>
        </div>
      ) : (
        <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
          <div className="flex gap-4 min-w-[1200px] h-full">
            {columnsData.map((col) => (
              <div key={col.id} className="flex-1 min-w-[280px] max-w-xs flex flex-col bg-zinc-900/30 rounded-xl border border-zinc-800/50 backdrop-blur-sm">
                <div className="p-3 border-b border-zinc-800/50 flex items-center justify-between sticky top-0 bg-zinc-900/95 backdrop-blur rounded-t-xl z-10">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                    <h3 className="font-semibold text-sm text-zinc-200">{col.title}</h3>
                    <span className="text-xs font-medium text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-full border border-zinc-800">{col.items.length}</span>
                  </div>
                </div>
                <div className="p-2 flex-1 overflow-y-auto custom-scrollbar min-h-[150px]">
                  <AnimatePresence>
                    {col.items.map((lead) => (
                      <LeadCard key={lead.id} lead={lead} onUpdate={loadLeads} />
                    ))}
                  </AnimatePresence>
                  {col.items.length === 0 && (
                    <div className="h-24 flex flex-col items-center justify-center text-xs text-zinc-600 italic border-2 border-dashed border-zinc-800/50 rounded-lg m-1">
                      <span>Sin leads</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}