export function paginateDocument(
  height: number,
  pageHeight: number,
  rows: { top: number; bottom: number }[]
): { offset: number; height: number }[] {
  if (!Number.isFinite(height) || height < 0 || !Number.isFinite(pageHeight) || pageHeight < 1) {
    throw new RangeError('Invalid document dimensions.');
  }
  const pages = [];
  for (let offset = 0; offset < height;) {
    let end = Math.min(offset + pageHeight, height);
    const crossing = rows.find((row) => row.top > offset && row.top < end && row.bottom > end);
    if (crossing && Math.floor(crossing.top) > offset) end = Math.floor(crossing.top);
    pages.push({ offset, height: end - offset });
    offset = end;
  }
  return pages;
}
