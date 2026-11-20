/** Reveal an active thumbnail without scrolling the document or other ancestor containers. */
export function revealGalleryThumbnail(list: HTMLElement, thumbnail: HTMLElement): void {
  if (!list.isConnected || !thumbnail.isConnected || !list.clientWidth || !list.clientHeight) return;
  const viewport = list.getBoundingClientRect();
  const item = thumbnail.getBoundingClientRect();
  const top = viewport.top + list.clientTop;
  const left = viewport.left + list.clientLeft;
  const bottom = top + list.clientHeight;
  const right = left + list.clientWidth;
  const dy = list.scrollHeight > list.clientHeight
    ? item.top < top ? item.top - top : item.bottom > bottom ? item.bottom - bottom : 0
    : 0;
  const dx = list.scrollWidth > list.clientWidth
    ? item.left < left ? item.left - left : item.right > right ? item.right - right : 0
    : 0;
  if (dx || dy) list.scrollBy({ left: dx, top: dy, behavior: 'smooth' });
}
