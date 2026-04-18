import PDFDocument from 'pdfkit';
import { chatJson, getOpenAI } from '../../lib/openaiServer';
import { parseJsonObject } from '../../lib/jsonUtils';
import { PLAYBOOK_SYSTEM } from '../../lib/prompts/playbook';

function buildPdf(playbook) {
  const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const title = String(playbook.title || 'MyHustle playbook').trim();
    const intro = String(playbook.intro || '').trim();

    doc.fontSize(18).font('Helvetica-Bold').text(title, { width: 500 });
    doc.moveDown();
    doc.fontSize(11).font('Helvetica').fillColor('#202223').text(intro || 'A practical playbook based on your session.', {
      width: 500,
      align: 'left',
    });
    doc.moveDown(1.2);
    doc.fillColor('#202223');

    const steps = Array.isArray(playbook.steps) ? playbook.steps : [];
    steps.forEach((step, i) => {
      const st = String(step?.title || '').trim();
      const det = String(step?.detail || '').trim();
      if (!st && !det) return;
      doc.fontSize(12).font('Helvetica-Bold').text(`Step ${i + 1}: ${st}`, { width: 500 });
      doc.font('Helvetica').fontSize(10).text(det, { width: 500 });
      doc.moveDown(0.9);
    });

    doc.moveDown(0.5);
    doc.fontSize(12).font('Helvetica-Bold').text('Checklist', { width: 500 });
    doc.font('Helvetica').fontSize(10);
    const list = Array.isArray(playbook.checklist) ? playbook.checklist : [];
    list.forEach((line, i) => {
      const t = String(line || '').trim();
      if (!t) return;
      doc.text(`${i + 1}. ${t}`, { width: 500 });
    });

    doc.end();
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  if (!getOpenAI()) {
    return res.status(503).json({
      ok: false,
      error: 'MyHustle is not configured yet. Add OPENAI_API_KEY to .env.local.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const raw = await chatJson({
      system: PLAYBOOK_SYSTEM,
      user: JSON.stringify({
        user: body.user,
        memoryTail: body.memoryTail ?? [],
        topic: body.topic || 'Your playbook',
        context: body.context || '',
      }),
    });
    const playbook = parseJsonObject(raw);
    if (!playbook.title && !Array.isArray(playbook.steps)) {
      return res.status(500).json({ ok: false, error: 'Invalid playbook output' });
    }

    const pdfBuffer = await buildPdf(playbook);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="briefly-playbook.pdf"');
    return res.status(200).send(pdfBuffer);
  } catch (e) {
    return res.status(500).json({
      ok: false,
      error: e?.message || 'PDF generation failed',
    });
  }
}
