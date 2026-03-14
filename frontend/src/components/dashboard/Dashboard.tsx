import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Plus, Search, Package, ShoppingCart, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductTable } from './ProductTable';
import { Product } from '@/types';
import { Background3D } from './Background3D';
import api from '@/lib/api';

interface AnomalyStatus {
  inject_delay: boolean;
  inject_slow_query: boolean;
  inject_random_500: boolean;
}

interface DashboardProps {
  products: Product[];
  loading: boolean;
  search: string;
  setSearch: (s: string) => void;
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  totalItems: number;
  onLogout: () => void;
  onNewProduct: () => void;
  onEditProduct: (p: Product) => void;
  onDeleteProduct: (id: number) => void;
}

export function Dashboard({
  products, loading, search, setSearch,
  page, setPage, totalPages, totalItems,
  onLogout, onNewProduct, onEditProduct, onDeleteProduct
}: DashboardProps) {
  const [throughput, setThroughput] = useState(1.2);
  const [anomalyStatus, setAnomalyStatus] = useState<AnomalyStatus | null>(null);
  const productList = Array.isArray(products) ? products : [];
  const totalValuation = productList.reduce((acc, p) => acc + ((p?.price || 0) * (p?.stock || 0)), 0);

  useEffect(() => {
    const fetchAnomalies = async () => {
      try {
        const { data } = await api.get('/api/anomalies/status');
        setAnomalyStatus(data);
      } catch (e) { console.error("Health check failed", e); }
    };
    fetchAnomalies();
    
    const interval = setInterval(() => {
      setThroughput(1.2 + Math.random() * 0.05);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen relative text-slate-100 font-sans pb-12">
      <Background3D />
      <nav className="border-b border-slate-800 bg-slate-900/40 backdrop-blur-xl sticky top-0 z-20 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Package className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Hackathon 2.0 <span className="text-blue-500">Ops</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-slate-950/50 rounded-full border border-slate-800">
             <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${anomalyStatus?.inject_delay ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`} />
               <span className="text-xs font-medium text-slate-400">Latency</span>
             </div>
             <div className="w-px h-3 bg-slate-800" />
             <div className="flex items-center gap-2">
               <div className={`w-2 h-2 rounded-full ${anomalyStatus?.inject_random_500 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
               <span className="text-xs font-medium text-slate-400">Integrity</span>
             </div>
          </div>
          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={onLogout}>
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </Button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Inventory Console</h2>
            <p className="text-slate-400 mt-1">Manage artifacts and monitor system state</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Deep Search..."
                className="pl-9 bg-slate-900 border-slate-800 focus:ring-blue-500"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-500" onClick={onNewProduct}>
              <Plus className="w-4 h-4 mr-2" /> New Entry
            </Button>
          </div>
        </header>

        <ProductTable 
          products={products} 
          loading={loading} 
          page={page}
          setPage={setPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onEdit={onEditProduct} 
          onDelete={onDeleteProduct} 
        />

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm group hover:border-blue-500/50 transition-all duration-300">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-blue-400">System Throughput</CardTitle>
               <div className="relative flex h-3 w-3">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
               </div>
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                 {throughput.toFixed(2)} GB/s
               </div>
               <p className="text-xs text-slate-500 mt-1 flex items-center">
                 <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mr-2"></span>
                 Packet streaming active
               </p>
             </CardContent>
           </Card>
           <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm group hover:border-green-500/50 transition-all duration-300">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-green-400">Active Nodes</CardTitle>
               <Package className="w-4 h-4 text-green-500 group-hover:scale-110 transition-transform" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-green-400">{totalItems} Units</div>
               <p className="text-xs text-slate-500 mt-1 flex items-center">
                 <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-2"></span>
                 Registered in current sector
               </p>
             </CardContent>
           </Card>
           <Card className="bg-slate-900/50 border-slate-800/50 backdrop-blur-sm group hover:border-purple-500/50 transition-all duration-300">
             <CardHeader className="flex flex-row items-center justify-between pb-2">
               <CardTitle className="text-sm font-medium text-slate-400 group-hover:text-purple-400">Total Valuation</CardTitle>
               <ShoppingCart className="w-4 h-4 text-purple-500 group-hover:rotate-12 transition-transform" />
             </CardHeader>
             <CardContent>
               <div className="text-3xl font-bold text-purple-400">₹{totalValuation.toLocaleString()}</div>
               <p className="text-xs text-slate-500 mt-1 flex items-center">
                 <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mr-2"></span>
                 Aggregated market value
               </p>
             </CardContent>
           </Card>
        </section>
      </main>
    </div>
  );
}
