import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Product } from '@/types';

interface ProductDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  productForm: Partial<Product>;
  setProductForm: (p: Partial<Product>) => void;
  onSubmit: (e: React.FormEvent) => void;
  editingId: number | null;
}

export function ProductDialog({
  isOpen, onOpenChange, productForm, setProductForm, onSubmit, editingId
}: ProductDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Refactor Entity' : 'Ingest New Entity'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input 
            placeholder="Name" 
            value={productForm.name} 
            onChange={e => setProductForm({ ...productForm, name: e.target.value })} 
            className="bg-slate-800 border-slate-700" 
            required 
          />
          <div className="grid grid-cols-2 gap-4">
            <Input 
              placeholder="Price (₹)" 
              type="number" 
              value={productForm.price} 
              onChange={e => setProductForm({ ...productForm, price: parseFloat(e.target.value) })} 
              className="bg-slate-800 border-slate-700" 
              required 
            />
            <Input 
              placeholder="Stock" 
              type="number" 
              value={productForm.stock} 
              onChange={e => setProductForm({ ...productForm, stock: parseInt(e.target.value) })} 
              className="bg-slate-800 border-slate-700" 
              required 
            />
          </div>
          <Input 
            placeholder="Category" 
            value={productForm.category} 
            onChange={e => setProductForm({ ...productForm, category: e.target.value })} 
            className="bg-slate-800 border-slate-700" 
            required 
          />
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500">Commit Changes</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
