import { useWorkspaceStore } from '@/stores/workspace.store'
import { useProducts } from '@/modules/wms/features/products/hooks/use-products'
import { useWarehouses } from '@/modules/wms/features/warehouses/hooks/use-warehouses'
import { useInventoryItems } from '@/modules/wms/features/inventory/hooks/use-inventory-items'
import { useSuppliers } from '@/modules/wms/features/suppliers/hooks/use-suppliers'
import type { InventoryItem } from '@/modules/wms/features/inventory/hooks/use-inventory-items'

interface WmsStats {
  totalProducts: number
  totalWarehouses: number
  totalInventoryItems: number
  totalSuppliers: number
}

export function useWmsStats() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId)
  const wsId = activeWorkspaceId ?? ''

  const productsQuery = useProducts(wsId, { page_size: 1 })
  const warehousesQuery = useWarehouses(wsId, { page_size: 1 })
  const inventoryQuery = useInventoryItems(wsId, { page_size: 5 })
  const suppliersQuery = useSuppliers(wsId, { page_size: 1 })

  const stats: WmsStats = {
    totalProducts: productsQuery.data?.total ?? 0,
    totalWarehouses: warehousesQuery.data?.total ?? 0,
    totalInventoryItems: inventoryQuery.data?.total ?? 0,
    totalSuppliers: suppliersQuery.data?.total ?? 0,
  }

  const topInventoryItems: InventoryItem[] = (inventoryQuery.data?.items ?? [])
    .slice(0, 5)
    .sort((a, b) => b.quantity - a.quantity)

  const isLoading =
    productsQuery.isLoading ||
    warehousesQuery.isLoading ||
    inventoryQuery.isLoading ||
    suppliersQuery.isLoading

  return { stats, topInventoryItems, isLoading }
}
