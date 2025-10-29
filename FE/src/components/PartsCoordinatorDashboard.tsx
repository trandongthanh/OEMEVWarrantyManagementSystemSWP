import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Package, Warehouse, ArrowRightCircle, Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface StockRow {
  stock_id: string;
  warehouse_name: string;
  component_name: string;
  sku?: string;
  category?: string;
  in_stock: number;
  reserved: number;
}

interface TransferRequest {
  id: string;
  fromWarehouse: string;
  toWarehouse: string;
  typeComponentName: string;
  qty: number;
  status: string;
}

const PartsCoordinatorDashboard: React.FC = () => {
  const { getToken } = useAuth();
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Lightweight initial load: try to fetch inventory & requests from API if token exists.
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
        if (!token) {
          // fallback to mock data when not authenticated in dev
          setStocks(mockStocks());
          setTransferRequests(mockTransfers());
          setIsLoading(false);
          return;
        }

        // Example API endpoints - adjust if your backend uses different paths
        const [stocksRes, transfersRes] = await Promise.all([
          axios.get('http://localhost:3000/api/v1/stocks', { headers: { Authorization: `Bearer ${token}` } }),
          axios.get('http://localhost:3000/api/v1/stock-transfer-requests?limit=50', { headers: { Authorization: `Bearer ${token}` } })
        ]);

        if (cancelled) return;

        // Use unknown and defensive casts to avoid `any` in the codebase
        const stocksRaw = (((stocksRes.data as Record<string, unknown>)?.data) as unknown[]) || [];
        const stocksData = stocksRaw.map((s) => {
          const obj = s as Record<string, unknown>;
          const warehouse = obj['warehouse'] as Record<string, unknown> | undefined;
          const typeComp = obj['type_component'] as Record<string, unknown> | undefined;
          return {
            stock_id: String(obj['stock_id'] ?? obj['id'] ?? Date.now()),
            warehouse_name: String(warehouse?.['name'] ?? obj['warehouse_name'] ?? 'Unknown'),
            component_name: String(typeComp?.['name'] ?? obj['component_name'] ?? 'Unknown'),
            sku: typeComp?.['sku'] ? String(typeComp['sku']) : undefined,
            category: typeComp?.['category'] ? String(typeComp['category']) : undefined,
            in_stock: Number(obj['quantity_in_stock'] ?? 0),
            reserved: Number(obj['quantity_reserved'] ?? 0)
          } as StockRow;
        });

        const transfersRaw = (((transfersRes.data as Record<string, unknown>)?.data) as unknown[]) || [];
        const transfersData = transfersRaw.map((t) => {
          const obj = t as Record<string, unknown>;
          const fromW = obj['fromWarehouse'] as Record<string, unknown> | undefined;
          const toW = obj['toWarehouse'] as Record<string, unknown> | undefined;
          const typeComp = obj['typeComponent'] as Record<string, unknown> | undefined;
          return {
            id: String(obj['id'] ?? obj['requestId'] ?? Date.now()),
            fromWarehouse: String(fromW?.['name'] ?? obj['from'] ?? 'Unknown'),
            toWarehouse: String(toW?.['name'] ?? obj['to'] ?? 'Unknown'),
            typeComponentName: String(typeComp?.['name'] ?? obj['componentName'] ?? 'Unknown'),
            qty: Number(obj['quantity'] ?? obj['qty'] ?? 0),
            status: String(obj['status'] ?? 'pending')
          } as TransferRequest;
        });

        setStocks(stocksData);
        setTransferRequests(transfersData);
      } catch (err) {
        console.warn('PartsCoordinatorDashboard: failed to fetch data, using mock', err);
        setStocks(mockStocks());
        setTransferRequests(mockTransfers());
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();

    return () => { cancelled = true; };
  }, [getToken]);

  const approveTransfer = async (id: string) => {
    // Approve is typically done by EMV staff — this button will attempt the approve endpoint and show result/error
    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) return alert('Authentication required');
      const res = await axios.patch(`http://localhost:3000/api/v1/stock-transfer-requests/${id}/approve`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert('Approved: ' + (res.data?.message || 'OK'));
      // refresh
      refreshTransfers();
    } catch (err: unknown) {
      alert('Approve failed: ' + getErrorMessage(err));
    }
  };

  const getErrorMessage = (err: unknown): string => {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    const maybe = err as { response?: { data?: { message?: unknown } } };
    const msg = maybe?.response?.data?.message;
    if (typeof msg === 'string') return msg;
    try {
      return JSON.stringify(maybe).slice(0, 200);
    } catch {
      return String(err);
    }
  };

  const rejectTransfer = async (id: string) => {
    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) return alert('Authentication required');
      const body = { rejectionReason: 'Rejected by parts coordinator' };
      const res = await axios.patch(`http://localhost:3000/api/v1/stock-transfer-requests/${id}/reject`, body, { headers: { Authorization: `Bearer ${token}` } });
      alert('Rejected: ' + (res.data?.message || 'OK'));
      refreshTransfers();
    } catch (err: unknown) {
      alert('Reject failed: ' + getErrorMessage(err));
    }
  };

  const receiveTransfer = async (id: string) => {
    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) return alert('Authentication required');
      const res = await axios.patch(`http://localhost:3000/api/v1/stock-transfer-requests/${id}/receive`, {}, { headers: { Authorization: `Bearer ${token}` } });
      alert('Received: ' + (res.data?.message || 'OK'));
      refreshTransfers();
    } catch (err: unknown) {
      alert('Receive failed: ' + getErrorMessage(err));
    }
  };

  const refreshTransfers = async () => {
    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) return;
      const res = await axios.get('http://localhost:3000/api/v1/stock-transfer-requests?limit=50', { headers: { Authorization: `Bearer ${token}` } });
      const transfersRaw = (((res.data as Record<string, unknown>)?.data) as unknown[]) || [];
      const transfersData = transfersRaw.map((t) => {
        const obj = t as Record<string, unknown>;
        const fromW = obj['requestingWarehouse'] as Record<string, unknown> | undefined;
        const items = obj['items'] as unknown[] | undefined;
        const firstItem = Array.isArray(items) && items.length > 0 ? (items[0] as Record<string, unknown>) : undefined;
        return {
          id: String(obj['id'] ?? obj['requestId'] ?? Date.now()),
          fromWarehouse: String(fromW?.['name'] ?? obj['from'] ?? 'Unknown'),
          toWarehouse: String(obj['requestingWarehouse']?.['name'] ?? obj['to'] ?? 'Unknown'),
          typeComponentName: String(firstItem?.['typeComponentName'] ?? firstItem?.['typeComponent'] ?? 'Multiple'),
          qty: Number(firstItem?.['quantityRequested'] ?? firstItem?.['quantity'] ?? 0),
          status: String(obj['status'] ?? 'pending')
        } as TransferRequest;
      });
      setTransferRequests(transfersData);
    } catch (err) {
      console.warn('refreshTransfers failed', err);
    }
  };

  return (
    <div className="min-h-screen w-full">
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4" /> Inventory</CardTitle>
              <CardDescription>Quick overview of stocks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stocks.reduce((s, r) => s + r.in_stock, 0)}</div>
              <div className="text-sm text-muted-foreground">Total items in stock</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Truck className="h-4 w-4" /> Transfers</CardTitle>
              <CardDescription>Pending transfer requests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{transferRequests.filter(t => t.status === 'pending').length}</div>
              <div className="text-sm text-muted-foreground">Pending requests</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Warehouse className="h-4 w-4" /> Warehouses</CardTitle>
              <CardDescription>Number of warehouses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Array.from(new Set(stocks.map(s => s.warehouse_name))).length}</div>
              <div className="text-sm text-muted-foreground">Active warehouses</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Transfer Requests</CardTitle>
              <CardDescription>Approve or reject transfers between warehouses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Component</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transferRequests.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">No transfer requests</TableCell>
                      </TableRow>
                    )}

                    {transferRequests.map(tr => (
                      <TableRow key={tr.id} className="hover:bg-muted/50">
                        <TableCell>{tr.fromWarehouse}</TableCell>
                        <TableCell>{tr.toWarehouse}</TableCell>
                        <TableCell>{tr.typeComponentName}</TableCell>
                        <TableCell>{tr.qty}</TableCell>
                        <TableCell>
                          <Badge variant={tr.status === 'pending' ? 'secondary' : tr.status === 'approved' ? 'success' : 'destructive'}>
                            {tr.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tr.status === 'pending' ? (
                            <div className="flex gap-2">
                              <Button size="sm" variant="default" onClick={() => approveTransfer(tr.id)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => rejectTransfer(tr.id)}>
                                Reject
                              </Button>
                            </div>
                          ) : tr.status === 'SHIPPED' || tr.status === 'shipped' ? (
                            <div className="flex gap-2">
                              <Button size="sm" variant="default" onClick={() => receiveTransfer(tr.id)}>
                                Mark Received
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => alert('View details - implement')}>
                                <ArrowRightCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button size="sm" variant="ghost" onClick={() => alert('View details - implement')}>
                              <ArrowRightCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Inventory</CardTitle>
              <CardDescription>Top components by shortage</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stocks.slice(0, 8).map(s => (
                  <div key={s.stock_id} className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{s.component_name}</div>
                      <div className="text-sm text-muted-foreground">{s.warehouse_name} · {s.sku || '—'}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{s.in_stock - s.reserved}</div>
                      <div className="text-sm text-muted-foreground">available</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

function mockStocks(): StockRow[] {
  return [
    { stock_id: 's1', warehouse_name: 'Main Warehouse', component_name: 'EV Battery Pack 75kWh', sku: 'BAT-EV-75K', category: 'Battery', in_stock: 15, reserved: 3 },
    { stock_id: 's2', warehouse_name: 'Main Warehouse', component_name: 'Electric Motor Controller', sku: 'MOT-CTL-001', category: 'Motor', in_stock: 5, reserved: 2 },
    { stock_id: 's3', warehouse_name: 'Emergency Stock', component_name: 'Brake Pad Set', sku: 'BRK-PAD-STD', category: 'Brake', in_stock: 40, reserved: 8 }
  ];
}

function mockTransfers(): TransferRequest[] {
  return [
    { id: 't1', fromWarehouse: 'Emergency Stock', toWarehouse: 'Main Warehouse', typeComponentName: 'Electric Motor Controller', qty: 2, status: 'pending' },
    { id: 't2', fromWarehouse: 'Main Warehouse', toWarehouse: 'Service Center HCM', typeComponentName: 'Brake Pad Set', qty: 10, status: 'approved' }
  ];
}

export default PartsCoordinatorDashboard;
