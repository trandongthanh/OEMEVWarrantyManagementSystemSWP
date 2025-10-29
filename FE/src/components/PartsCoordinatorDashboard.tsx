import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Warehouse, Truck } from 'lucide-react';
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


const PartsCoordinatorDashboard: React.FC = () => {
  const { getToken } = useAuth();
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
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

    

    return () => { cancelled = true; };
  }, [getToken]);

  

  

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
