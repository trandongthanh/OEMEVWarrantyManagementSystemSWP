import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Warehouse, ArrowRightCircle, Truck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { componentReservationService, PickupResponse } from '@/services/componentReservationService';

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

interface Technician {
  id: string;
  name: string;
  username?: string;
  service_center_id?: string;
}

const PartsCoordinatorDashboard: React.FC = () => {
  const { getToken } = useAuth();
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [assignTargetId, setAssignTargetId] = useState<string>('');
  // Pickup reserved components (for parts coordinator)
  const [reservationIdInput, setReservationIdInput] = useState<string>('');
  const [pickupResult, setPickupResult] = useState<PickupResponse | null>(null);
  const [isPicking, setIsPicking] = useState<boolean>(false);
  // Install component on vehicle
  const [installResult, setInstallResult] = useState<Record<string, unknown> | null>(null);
  const [isInstalling, setIsInstalling] = useState<boolean>(false);
  // Return old component after replacement
  const [returnResult, setReturnResult] = useState<Record<string, unknown> | null>(null);
  const [isReturning, setIsReturning] = useState<boolean>(false);

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

    // also fetch technicians for this service center (best-effort)
    const loadTechs = async () => {
      try {
        const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
        if (!token) return setTechnicians([]);
        const res = await axios.get('http://localhost:3000/api/v1/users?role=technician&limit=200', { headers: { Authorization: `Bearer ${token}` } });
        const data = (((res.data as Record<string, unknown>)?.data) as unknown[]) || [];
        const techs = data.map((u) => {
          const obj = u as Record<string, unknown>;
          return {
            id: String(obj['id'] ?? obj['user_id'] ?? obj['uuid'] ?? obj['userId'] ?? obj['userId'] ?? Date.now()),
            name: String(obj['name'] ?? obj['fullName'] ?? obj['username'] ?? 'Technician'),
            username: obj['username'] ? String(obj['username']) : undefined,
            service_center_id: obj['service_center_id'] ? String(obj['service_center_id']) : undefined
          } as Technician;
        });
        setTechnicians(techs);
      } catch (err) {
        // ignore; keep empty list
        setTechnicians([]);
      }
    };

    loadTechs();

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

  const assignToTechnician = async () => {
    if (!assignTargetId) return alert('Please enter the processing/caseline id to assign');
    if (!selectedTech) return alert('Please select a technician');
    try {
      const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
      if (!token) return alert('Authentication required');

      // Try assignment endpoint. Adjust path/body if your backend expects different fields.
      const body = { technicianId: selectedTech };
      // first try processing-records assignment
      try {
        const res = await axios.patch(
          `http://localhost:3000/api/v1/processing-records/${assignTargetId}/assignment`,
          body,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Assigned: ' + (res.data?.message || 'OK'));
      } catch (innerErr) {
        // fallback: try case-line allocation endpoint
        const res2 = await axios.post(
          `http://localhost:3000/api/v1/case-lines/${assignTargetId}/allocate-stock`,
          { technicianId: selectedTech },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert('Assigned via allocate endpoint: ' + (res2.data?.message || 'OK'));
      }

      // refresh relevant lists
      refreshTransfers();
    } catch (err: unknown) {
      alert('Assign failed: ' + getErrorMessage(err));
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

        {/* Pickup / Install tabs (Parts Coordinator) */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Reservation Actions</CardTitle>
              <CardDescription>Pickup reserved components or install them on vehicle (use reservation id)</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="pickup">
                <TabsList>
                  <TabsTrigger value="pickup">Pickup</TabsTrigger>
                    <TabsTrigger value="install">Install on Vehicle</TabsTrigger>
                    <TabsTrigger value="return">Return Old Component</TabsTrigger>
                </TabsList>

                <TabsContent value="pickup">
                  <div className="flex gap-2 items-center">
                    <input className="rounded-md border px-3 py-2 flex-1" placeholder="Reservation ID" value={reservationIdInput} onChange={(e) => setReservationIdInput(e.target.value)} />
                    <Button disabled={!reservationIdInput || isPicking} onClick={async () => {
                      try {
                        setIsPicking(true);
                        setPickupResult(null);
                        const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
                        if (!token) return alert('Authentication required');
                        const data = await componentReservationService.pickupReservation(reservationIdInput.trim());
                        setPickupResult(data as PickupResponse);
                        alert('Pickup success: ' + (data?.reservation?.reservationId ?? 'OK'));
                      } catch (err) {
                        console.error('Pickup failed', err);
                        alert('Pickup failed: ' + (err instanceof Error ? err.message : String(err)));
                      } finally {
                        setIsPicking(false);
                      }
                    }}>{isPicking ? 'Picking...' : 'Pickup'}</Button>
                    <Button variant="outline" onClick={() => { setReservationIdInput(''); setPickupResult(null); }}>Reset</Button>
                  </div>

                  {pickupResult && (
                    <div className="mt-4">
                      <h4 className="font-medium">Reservation</h4>
                      <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(pickupResult.reservation, null, 2)}</pre>
                      <h4 className="font-medium mt-2">Component</h4>
                      <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(pickupResult.component, null, 2)}</pre>
                      {pickupResult.caseLine && (
                        <>
                          <h4 className="font-medium mt-2">Case Line</h4>
                          <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(pickupResult.caseLine, null, 2)}</pre>
                        </>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="install">
                  <div className="flex gap-2 items-center">
                    <input className="rounded-md border px-3 py-2 flex-1" placeholder="Reservation ID" value={reservationIdInput} onChange={(e) => setReservationIdInput(e.target.value)} />
                    <Button variant="secondary" disabled={!reservationIdInput || isInstalling} onClick={async () => {
                      try {
                        setIsInstalling(true);
                        setInstallResult(null);
                        const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
                        if (!token) return alert('Authentication required');
                        const data = await componentReservationService.installComponent(reservationIdInput.trim());
                        setInstallResult(data as Record<string, unknown>);
                        alert('Install success: ' + (data?.reservation?.reservationId ?? 'OK'));
                      } catch (err) {
                        console.error('Install failed', err);
                        alert('Install failed: ' + (err instanceof Error ? err.message : String(err)));
                      } finally {
                        setIsInstalling(false);
                      }
                    }}>{isInstalling ? 'Installing...' : 'Install on Vehicle'}</Button>
                    <Button variant="outline" onClick={() => { setReservationIdInput(''); setInstallResult(null); }}>Reset</Button>
                  </div>

                  {installResult && (
                    <div className="mt-4">
                      <h4 className="font-medium">Install Result - Reservation</h4>
                      <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(installResult?.reservation ?? installResult, null, 2)}</pre>
                      <h4 className="font-medium mt-2">Install Result - Component</h4>
                      <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(installResult?.component ?? installResult, null, 2)}</pre>
                      {installResult?.caseLine && (
                        <>
                          <h4 className="font-medium mt-2">Install Result - Case Line</h4>
                          <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(installResult?.caseLine, null, 2)}</pre>
                        </>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="return">
                  <div className="flex gap-2 items-center">
                    <input className="rounded-md border px-3 py-2 flex-1" placeholder="Reservation ID" value={reservationIdInput} onChange={(e) => setReservationIdInput(e.target.value)} />
                    <Button variant="destructive" disabled={!reservationIdInput || isReturning} onClick={async () => {
                      try {
                        setIsReturning(true);
                        setReturnResult(null);
                        const token = typeof getToken === 'function' ? getToken() : localStorage.getItem('ev_warranty_token');
                        if (!token) return alert('Authentication required');
                        const data = await componentReservationService.returnComponent(reservationIdInput.trim());
                        setReturnResult(data as Record<string, unknown>);
                        alert('Return success: ' + (data?.reservation?.reservationId ?? 'OK'));
                      } catch (err) {
                        console.error('Return failed', err);
                        alert('Return failed: ' + (err instanceof Error ? err.message : String(err)));
                      } finally {
                        setIsReturning(false);
                      }
                    }}>{isReturning ? 'Returning...' : 'Return Component'}</Button>
                    <Button variant="outline" onClick={() => { setReservationIdInput(''); setReturnResult(null); }}>Reset</Button>
                  </div>

                  {returnResult && (
                    <div className="mt-4">
                      <h4 className="font-medium">Return Result - Reservation</h4>
                      <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(returnResult?.reservation ?? returnResult, null, 2)}</pre>
                      <h4 className="font-medium mt-2">Return Result - Component</h4>
                      <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(returnResult?.component ?? returnResult, null, 2)}</pre>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
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
              <CardTitle>Assign to Technician</CardTitle>
              <CardDescription>Select a technician and assign a processing record or caseline</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Technician</label>
                  <select
                    value={selectedTech ?? ''}
                    onChange={(e) => setSelectedTech(e.target.value || null)}
                    className="rounded-md border px-3 py-2"
                  >
                    <option value="">-- Select technician --</option>
                    {technicians.map(t => (
                      <option key={t.id} value={t.id}>{t.name}{t.username ? ` (${t.username})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium">Processing record / Caseline ID</label>
                  <input
                    value={assignTargetId}
                    onChange={(e) => setAssignTargetId(e.target.value)}
                    placeholder="Enter processing-record id or caseline id"
                    className="rounded-md border px-3 py-2"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="default" onClick={assignToTechnician}>Assign</Button>
                  <Button size="sm" variant="outline" onClick={() => { setAssignTargetId(''); setSelectedTech(null); }}>Reset</Button>
                </div>

                <div className="text-xs text-muted-foreground">Tip: paste the processing-record id from the case or the caseline id to allocate stock and assign.</div>
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
