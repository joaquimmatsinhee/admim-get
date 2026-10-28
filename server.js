/**
 * Painel Admin — Node.js + Express + Neon
 * Deploy no Render: npm install && npm start
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { neon } from '@neondatabase/serverless';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

const DATABASE_URL = (
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  'postgresql://neondb_owner:npg_LTZUw8pq5ixa@ep-bitter-credit-b5f2a23q-pooler.c-7.us-east-2.aws.neon.tech/neondb?sslmode=require'
).replace(/&channel_binding=[^&]+/g, '');

const sql = neon(DATABASE_URL);
const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

function mapVideo(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    price: Number(row.price) || 0,
    video_url: row.video_url,
    thumbnail_url: row.thumbnail_url || '',
    duration: row.duration || '10 min',
    category: row.category || 'Geral',
    views_count: row.views_count ?? 0,
    is_published: row.is_published ?? true,
    created_at: row.created_at || new Date().toISOString(),
  };
}

// LIST
app.get('/api/videos', async (_req, res) => {
  try {
    const rows = await sql`SELECT * FROM videos ORDER BY created_at DESC`;
    res.json({ success: true, videos: (rows || []).map(mapVideo) });
  } catch (err) {
    console.error('[GET /api/videos]', err);
    res.status(500).json({ success: false, error: err.message, videos: [] });
  }
});

// CREATE
app.post('/api/videos', async (req, res) => {
  try {
    const b = req.body || {};
    const title = String(b.title || '').trim();
    const description = String(b.description || '').trim();
    const price = Number(b.price) || 0;
    const video_url = String(b.video_url || '').trim();
    const thumbnail_url = String(b.thumbnail_url || '').trim();
    const duration = String(b.duration || '10 min').trim();
    const category = String(b.category || 'Geral').trim();
    const is_published = b.is_published !== false && b.is_published !== 'false';

    if (!title || !video_url) {
      return res.status(400).json({ success: false, error: 'title e video_url são obrigatórios' });
    }

    const rows = await sql`
      INSERT INTO videos (title, description, price, video_url, thumbnail_url, duration, category, is_published)
      VALUES (${title}, ${description}, ${price}, ${video_url}, ${thumbnail_url}, ${duration}, ${category}, ${is_published})
      RETURNING *
    `;
    res.json({ success: true, video: mapVideo(rows[0]) });
  } catch (err) {
    console.error('[POST /api/videos]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// UPDATE
app.put('/api/videos/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body || {};
    const title = String(b.title || '').trim();
    const description = String(b.description || '').trim();
    const price = Number(b.price) || 0;
    const video_url = String(b.video_url || '').trim();
    const thumbnail_url = String(b.thumbnail_url || '').trim();
    const duration = String(b.duration || '10 min').trim();
    const category = String(b.category || 'Geral').trim();
    const is_published = b.is_published !== false && b.is_published !== 'false';

    const rows = await sql`
      UPDATE videos SET
        title = ${title},
        description = ${description},
        price = ${price},
        video_url = ${video_url},
        thumbnail_url = ${thumbnail_url},
        duration = ${duration},
        category = ${category},
        is_published = ${is_published}
      WHERE id = ${id}
      RETURNING *
    `;
    if (!rows?.[0]) {
      return res.status(404).json({ success: false, error: 'Vídeo não encontrado' });
    }
    res.json({ success: true, video: mapVideo(rows[0]) });
  } catch (err) {
    console.error('[PUT /api/videos]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE
app.delete('/api/videos/:id', async (req, res) => {
  try {
    await sql`DELETE FROM videos WHERE id = ${req.params.id}`;
    res.json({ success: true });
  } catch (err) {
    console.error('[DELETE /api/videos]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// TELEGRAM GET
app.get('/api/settings/telegram', async (_req, res) => {
  try {
    const rows = await sql`
      SELECT telegram_group_url FROM app_settings WHERE id = 'default' LIMIT 1
    `;
    res.json({
      success: true,
      telegram_group_url: rows?.[0]?.telegram_group_url || '',
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, telegram_group_url: '' });
  }
});

// TELEGRAM SAVE
app.post('/api/settings/telegram', async (req, res) => {
  try {
    const url = String(req.body?.telegram_group_url || '').trim();
    await sql`
      INSERT INTO app_settings (id, telegram_group_url, updated_at)
      VALUES ('default', ${url}, NOW())
      ON CONFLICT (id) DO UPDATE
      SET telegram_group_url = ${url}, updated_at = NOW()
    `;
    res.json({ success: true, telegram_group_url: url });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'get-access-admin-node', time: new Date().toISOString() });
});

app.use(express.static(path.join(__dirname, 'public'), {
  extensions: ['html'],
  maxAge: process.env.NODE_ENV === 'production' ? '1h' : 0,
}));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[DIGITAL SELLER Admin] http://0.0.0.0:${PORT}`);
  console.log(`[DIGITAL SELLER Admin] Neon: ${new URL(DATABASE_URL).hostname}`);
});
