import { Product } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";

interface ProductTableProps {
  products: Product[];
  loading: boolean;
  page: number;
  setPage: (p: number) => void;
  totalPages: number;
  totalItems: number;
  onEdit: (product: Product) => void;
  onDelete: (id: number) => void;
}

export function ProductTable({ 
  products, loading, page, setPage, 
  totalPages, totalItems, onEdit, onDelete 
}: ProductTableProps) {
  return (
    <section className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      <Table>
        <TableHeader className="bg-slate-950">
          <TableRow className="border-slate-800 hover:bg-transparent">
            <TableHead className="w-[100px] text-slate-500 font-semibold uppercase text-xs">ID</TableHead>
            <TableHead className="text-slate-500 font-semibold uppercase text-xs">Entity Name</TableHead>
            <TableHead className="text-slate-500 font-semibold uppercase text-xs">Class</TableHead>
            <TableHead className="text-slate-500 font-semibold uppercase text-xs">Market Value</TableHead>
            <TableHead className="text-slate-500 font-semibold uppercase text-xs">Availability</TableHead>
            <TableHead className="text-right text-slate-500 font-semibold uppercase text-xs">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-slate-500 italic">Streaming data packets...</TableCell>
            </TableRow>
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-12 text-slate-500 italic">No artifacts found in current sector</TableCell>
            </TableRow>
          ) : products.map((p) => (
            <TableRow key={p.id} className="border-slate-800 hover:bg-slate-800/30 transition-colors">
              <TableCell className="font-mono text-blue-500">#{p.id}</TableCell>
              <TableCell className="font-semibold">{p.name}</TableCell>
              <TableCell>
                <span className="px-2 py-1 bg-slate-800 text-slate-300 rounded text-xs font-medium">
                  {p.category}
                </span>
              </TableCell>
              <TableCell>₹{p.price.toLocaleString()}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full ${p.stock > 10 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'}`} />
                   <span className={p.stock > 10 ? 'text-green-400' : 'text-red-400'}>{p.stock} units</span>
                </div>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-400" onClick={() => onEdit(p)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-400" onClick={() => onDelete(p.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-900/50">
        <div className="text-sm text-slate-500">
          Showing <span className="text-slate-300 font-mono">{(page - 1) * 10 + 1}-{Math.min(page * 10, totalItems)}</span> of <span className="text-slate-300 font-mono">{totalItems}</span> artifacts
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <div className="flex items-center px-4 text-sm font-mono text-blue-500">
            Sector {page} / {totalPages}
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </section>
  );
}
