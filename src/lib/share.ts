export async function shareOrLink(text: string, phone?: string){
  const canShare = !!(navigator as any).share
  if(canShare && !phone){
    try { await (navigator as any).share({ text }); return } catch {}
  }
  const encoded = encodeURIComponent(text)
  const url = phone ? `https://wa.me/${phone.replace(/[^0-9+]/g,'')}?text=${encoded}` : `https://wa.me/?text=${encoded}`
  window.open(url, '_blank')
}
