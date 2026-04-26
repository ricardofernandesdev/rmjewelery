/**
 * Format a EUR price for the frontend.
 * Returns "Preço sob consulta" when the price is missing, zero, or negative.
 */
export function formatPrice(price: number | null | undefined): string {
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    return 'Preço sob consulta'
  }
  return price.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR' })
}
