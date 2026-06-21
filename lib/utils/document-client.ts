export function openDocumentFile(fileUrl: string): void {
  // Navigate directly while the click gesture is still active so pop-up blockers
  // do not interfere. Same-origin requests include the session cookie automatically.
  const opened = window.open(fileUrl, '_blank', 'noopener,noreferrer');
  if (!opened) {
    window.location.assign(fileUrl);
  }
}

export function downloadDocumentFile(fileUrl: string, filename: string): void {
  const separator = fileUrl.includes('?') ? '&' : '?';
  const anchor = document.createElement('a');
  anchor.href = `${fileUrl}${separator}download=1`;
  anchor.download = filename;
  anchor.rel = 'noopener noreferrer';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
