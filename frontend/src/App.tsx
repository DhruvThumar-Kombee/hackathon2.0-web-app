import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, toast } from "sonner";
import api from '@/lib/api';
import { Product } from '@/types';
import { formatError } from '@/lib/utils';
import { AuthForm } from '@/components/auth/AuthForm';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ProductDialog } from '@/components/dashboard/ProductDialog';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '', price: 0, category: '', stock: 0, description: ''
  });

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/api/products', {
        params: { search, page, size: pageSize }
      });
      if (data.items) {
        setProducts(data.items);
        setTotalItems(data.total);
        setTotalPages(data.pages);
      } else {
        setProducts(data);
        setTotalItems(data.length);
        setTotalPages(1);
      }
    } catch (err: unknown) {
      toast.error(formatError(err));
    } finally {
      setLoading(false);
    }
  }, [search, page, pageSize]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) fetchProducts();
  }, [fetchProducts]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/api/products/${editingId}`, productForm);
        toast.success("Product updated");
      } else {
        await api.post(`/api/products`, productForm);
        toast.success("Product created");
      }
      setIsDialogOpen(false);
      setEditingId(null);
      setProductForm({ name: '', price: 0, category: '', stock: 0, description: '' });
      fetchProducts();
    } catch (err: unknown) {
      toast.error(formatError(err));
    }
  };

  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      await api.delete(`/api/products/${id}`);
      toast.success("Entity removed from grid");
      fetchProducts();
    } catch (err: unknown) {
      toast.error(formatError(err));
    }
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setProductForm(p);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Toaster position="top-right" theme="dark" />
      <Routes>
        <Route path="/login" element={<AuthForm view="login" onSuccess={fetchProducts} />} />
        <Route path="/register" element={<AuthForm view="register" onSuccess={() => {}} />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={
            <Dashboard 
              products={products}
              loading={loading}
              search={search}
              setSearch={(s) => { setSearch(s); setPage(1); }}
              page={page}
              setPage={setPage}
              totalPages={totalPages}
              totalItems={totalItems}
              onLogout={handleLogout}
              onNewProduct={() => {
                setEditingId(null);
                setProductForm({ name: '', price: 0, category: '', stock: 0, description: '' });
                setIsDialogOpen(true);
              }}
              onEditProduct={openEdit}
              onDeleteProduct={handleDeleteProduct}
            />
          } />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      <ProductDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        productForm={productForm}
        setProductForm={setProductForm}
        onSubmit={handleSaveProduct}
        editingId={editingId}
      />
    </>
  );
}
