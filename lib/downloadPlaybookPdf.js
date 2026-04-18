export async function downloadPlaybookPdf({ user, memory, topic, context }) {
  const res = await fetch('/api/playbook-pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user,
      memoryTail: memory.slice(0, 10),
      topic,
      context: (context || '').slice(0, 2800),
    }),
  });
  const ctype = res.headers.get('content-type') || '';
  if (!res.ok) {
    if (ctype.includes('application/json')) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || 'Could not generate PDF');
    }
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Could not generate PDF');
  }
  if (!ctype.includes('application/pdf')) {
    throw new Error('Unexpected response from server');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'myhustle-playbook.pdf';
  a.click();
  URL.revokeObjectURL(url);
}
