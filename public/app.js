/**
 * Painel Admin — HTML/CSS/JS + API Node (Render)
 * Todas as operações passam por /api no servidor (Neon no backend).
 */

const PAYMENT_LINKS_MAP = {
  5: 'https://pay.trywalled.com/18e51104-a9f5-4d1e-9c6a-e90b90bda8d3',
  10: 'https://pay.trywalled.com/10d7830d-98ed-4ae5-a1c7-e1d2b9803c5d',
  15: 'https://pay.trywalled.com/b05c54d1-a9ca-4bf0-8829-2fed6bf3e3b1',
  25: 'https://pay.trywalled.com/3b3dcc87-15a0-4775-bf61-9e5eb49a5846',
  30: 'https://pay.trywalled.com/56ad3d76-33f0-4e4b-b11b-2abaefebb7d8',
  35: 'https://pay.trywalled.com/fc16edb5-d9ab-46e7-bf2f-d854531fdfb6',
  40: 'https://pay.trywalled.com/48173dd8-f799-47e9-8ef0-8df8e1785ee1',
  45: 'https://pay.trywalled.com/6c8a1ebe-27df-477a-b9f8-3b0c96a467e7',
  50: 'https://pay.trywalled.com/643aba9e-072b-47d9-9978-8630b0e64ba5',
  55: 'https://pay.trywalled.com/e6e3a829-2ad7-4d00-ac75-80b2ba7135b3',
  60: 'https://pay.trywalled.com/2a368967-2356-4940-b20c-2c8553feefe1',
  65: 'https://pay.trywalled.com/4ab71b06-e9d2-4d10-8fca-c133b63f480f',
  70: 'https://pay.trywalled.com/5366ffad-9767-43bc-85de-c949e3786acf',
  75: 'https://pay.trywalled.com/2a01fe63-da42-49a9-94df-bf118a3eadce',
  80: 'https://pay.trywalled.com/8d943004-5ca2-41bf-b362-b2203b20006c',
  85: 'https://pay.trywalled.com/161f369b-966d-4702-80ae-b6e512ba803f',
  100: 'https://pay.trywalled.com/334ea898-3980-4ddd-bc5f-76c9727ea20a',
  110: 'https://pay.trywalled.com/a5f27d0a-dfb5-4676-b3f0-d66d7963c55e',
  125: 'https://pay.trywalled.com/1adf096e-8b81-4f45-a6df-cc56fba5631a',
  150: 'https://pay.trywalled.com/3400dcce-113a-4c91-881d-efd0f01cd596',
  180: 'https://pay.trywalled.com/94ac1bdf-74bf-434d-9627-f736a8005355',
  250: 'https://pay.trywalled.com/8f674064-9f83-4e8e-9789-f4aee26a6306',
  350: 'https://pay.trywalled.com/5de120e6-eb83-4919-9ea9-b64008f69cc1',
};

const AVAILABLE_PRICES = Object.keys(PAYMENT_LINKS_MAP).map(Number).sort((a, b) => a - b);

function getPaymentLinkForPrice(price) {
  const n = Number(price);
  if (PAYMENT_LINKS_MAP[n]) return PAYMENT_LINKS_MAP[n];
  const closest = AVAILABLE_PRICES.reduce(
    (prev, curr) => (Math.abs(curr - n) < Math.abs(prev - n) ? curr : prev),
    25
  );
  return PAYMENT_LINKS_MAP[closest];
}

function escapeHtml(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function mapRow(item) {
  const price = Number(item.price) || 0;
  return {
    id: item.id,
    title: item.title,
    description: item.description || '',
    price,
    video_url: item.video_url,
    thumbnail_url: item.thumbnail_url || '',
    duration: item.duration || '10 min',
    category: item.category || 'Geral',
    views_count: item.views_count ?? 0,
    is_published: item.is_published ?? true,
    created_at: item.created_at || new Date().toISOString(),
    payment_url: getPaymentLinkForPrice(price),
  };
}

// ——— API do servidor Node (mesmo domínio no Render) ———
async function fetchVideos() {
  const res = await fetch('/api/videos', { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao listar vídeos');
  return (data.videos || []).map(mapRow);
}

async function createVideo(form) {
  const res = await fetch('/api/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao cadastrar');
  return mapRow(data.video);
}

async function updateVideo(id, form) {
  const res = await fetch('/api/videos/' + encodeURIComponent(id), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(form),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao atualizar');
  return mapRow(data.video);
}

async function deleteVideo(id) {
  const res = await fetch('/api/videos/' + encodeURIComponent(id), { method: 'DELETE' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao apagar');
}

async function fetchTelegramLink() {
  const res = await fetch('/api/settings/telegram', { cache: 'no-store' });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao ler Telegram');
  return data.telegram_group_url || '';
}

async function saveTelegramLink(url) {
  const res = await fetch('/api/settings/telegram', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ telegram_group_url: url }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Falha ao salvar Telegram');
}

// ——— State ———
let videos = [];
let telegramLink = '';
let isLoading = true;
let editingVideo = null;
let deletingVideo = null;
let searchTerm = '';
let statusFilter = 'ALL';
let sortBy = 'newest';
let toastTimer = null;

// ——— UI helpers ———
function showToast(message, type = 'success') {
  const root = document.getElementById('toast-root');
  root.innerHTML =
    '<div class="toast toast-' +
    type +
    '"><span>' +
    escapeHtml(message) +
    '</span><button type="button" class="btn-ghost" id="toast-close">✕</button></div>';
  document.getElementById('toast-close').onclick = () => (root.innerHTML = '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (root.innerHTML = ''), 4000);
}

function openModal(id) {
  document.getElementById(id).hidden = false;
}
function closeModal(id) {
  document.getElementById(id).hidden = true;
  if (id === 'player-modal') {
    const v = document.getElementById('player-video');
    v.pause();
    v.removeAttribute('src');
    v.load();
  }
}

function fillPriceSelect(selected) {
  const sel = document.getElementById('price-select');
  sel.innerHTML = AVAILABLE_PRICES.map(
    (p) =>
      '<option value="' +
      p +
      '"' +
      (Number(selected) === p ? ' selected' : '') +
      '>$' +
      p +
      '</option>'
  ).join('');
  updatePaymentPreview();
}

function updatePaymentPreview() {
  const price = Number(document.getElementById('price-select').value);
  const url = getPaymentLinkForPrice(price);
  document.getElementById('payment-preview').innerHTML =
    '<strong>Link de pagamento (TryWalled):</strong><br><a href="' +
    escapeHtml(url) +
    '" target="_blank" rel="noopener" class="text-indigo-600 break-all">' +
    escapeHtml(url) +
    '</a>';
}

function getFilteredVideos() {
  return videos
    .filter((v) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        !q ||
        (v.title || '').toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q);
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'published'
          ? v.is_published
          : !v.is_published;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });
}

function render() {
  const app = document.getElementById('app');
  const filtered = getFilteredVideos();

  const rowsHtml = filtered
    .map((v) => {
      const thumb = v.thumbnail_url
        ? '<img class="thumb" src="' + escapeHtml(v.thumbnail_url) + '" alt="" />'
        : '<div class="thumb"></div>';
      const status = v.is_published
        ? '<span class="badge badge-green">Publicado</span>'
        : '<span class="badge badge-gray">Rascunho</span>';
      const date = v.created_at
        ? new Date(v.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';
      return (
        '<tr data-id="' +
        escapeHtml(v.id) +
        '">' +
        '<td>' + thumb + '</td>' +
        '<td><div class="font-semibold text-gray-900">' + escapeHtml(v.title) +
        '</div><div class="text-xs text-gray-500 line-clamp-1">' + escapeHtml(v.description || '') +
        '</div></td>' +
        '<td class="font-bold text-indigo-700">$' + Number(v.price).toFixed(2) + '</td>' +
        '<td>' + status + '</td>' +
        '<td class="text-xs text-gray-500">' + escapeHtml(v.duration || '') + '</td>' +
        '<td class="text-xs text-gray-500">' + date + '</td>' +
        '<td><div class="flex flex-wrap gap-1">' +
        '<button type="button" class="btn-ghost" data-action="preview" data-id="' + escapeHtml(v.id) + '" title="Preview">▶</button>' +
        '<button type="button" class="btn-ghost" data-action="copy" data-id="' + escapeHtml(v.id) + '" title="Copiar">📋</button>' +
        '<a class="btn-ghost" href="' + escapeHtml(v.payment_url) + '" target="_blank" rel="noopener" title="Pagamento">↗</a>' +
        '<button type="button" class="btn-ghost" data-action="edit" data-id="' + escapeHtml(v.id) + '" title="Editar">✎</button>' +
        '<button type="button" class="btn-ghost text-rose-600" data-action="delete" data-id="' + escapeHtml(v.id) + '" title="Apagar">🗑</button>' +
        '</div></td></tr>'
      );
    })
    .join('');

  const cardsHtml = filtered
    .map((v) => {
      const thumb = v.thumbnail_url
        ? '<img class="thumb" src="' + escapeHtml(v.thumbnail_url) + '" alt="" />'
        : '<div class="thumb"></div>';
      const status = v.is_published
        ? '<span class="badge badge-green">Publicado</span>'
        : '<span class="badge badge-gray">Rascunho</span>';
      const date = v.created_at
        ? new Date(v.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—';
      return (
        '<article class="video-card" data-id="' + escapeHtml(v.id) + '">' +
        '<div class="video-card-top">' + thumb +
        '<div class="video-card-meta"><h3>' + escapeHtml(v.title) + '</h3>' +
        '<p class="video-card-desc">' + escapeHtml(v.description || '') + '</p></div></div>' +
        '<div class="video-card-row">' + status +
        '<strong class="text-indigo-700">$' + Number(v.price).toFixed(2) + '</strong>' +
        '<span>' + escapeHtml(v.duration || '') + '</span>' +
        '<span>' + date + '</span></div>' +
        '<div class="video-card-actions">' +
        '<button type="button" data-action="preview" data-id="' + escapeHtml(v.id) + '">▶ Ver</button>' +
        '<button type="button" data-action="copy" data-id="' + escapeHtml(v.id) + '">📋 Link</button>' +
        '<button type="button" data-action="edit" data-id="' + escapeHtml(v.id) + '">✎ Editar</button>' +
        '<button type="button" class="act-danger" data-action="delete" data-id="' + escapeHtml(v.id) + '">🗑</button>' +
        '</div></article>'
      );
    })
    .join('');

  app.innerHTML =
    '<header class="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">' +
    '<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">' +
    '<div class="admin-header-inner flex items-center justify-between h-16 sm:h-20 gap-4">' +
    '<div class="flex items-center gap-3">' +
    '<div class="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md text-lg">▶</div>' +
    '<div><h1 class="text-lg sm:text-xl font-bold tracking-tight">DIGITAL SELLER Admin</h1>' +
    '<p class="text-xs text-gray-500">Cadastro, gerenciamento e monetização · Node/Render</p></div></div>' +
    '<div class="admin-header-actions flex items-center gap-2 sm:gap-3">' +
    '<button type="button" id="btn-telegram" class="flex items-center gap-2 px-3 py-2 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-800 text-xs font-bold">' +
    '➤ Telegram <span class="w-2 h-2 rounded-full ' +
    (telegramLink ? 'bg-emerald-500' : 'bg-gray-400') +
    '"></span></button>' +
    '<button type="button" id="btn-refresh" class="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs font-semibold' +
    (isLoading ? ' opacity-50' : '') +
    '">↻ Atualizar</button>' +
    '<button type="button" id="btn-new" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">+ Cadastrar Vídeo</button>' +
    '</div></div></div></header>' +
    '<main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">' +
    (isLoading
      ? '<div class="flex flex-col items-center justify-center py-28 space-y-4 text-gray-500"><div class="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full spin"></div><p class="text-sm font-medium">Carregando vídeos do Neon...</p></div>'
      : '<div class="space-y-5">' +
        '<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">' +
        '<div><h2 class="text-xl sm:text-2xl font-extrabold tracking-tight">Vídeos Cadastrados</h2>' +
        '<p class="text-xs sm:text-sm text-gray-500">Defina preço de US$ 5 a US$ 200 e gerencie o catálogo.</p></div>' +
        '<button type="button" id="btn-new-2" class="self-start flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold">+ Novo Vídeo</button></div>' +
        '<div class="bg-white border border-gray-200 p-4 rounded-2xl shadow-sm space-y-3">' +
        '<div class="grid grid-cols-1 sm:grid-cols-12 gap-3">' +
        '<div class="sm:col-span-6"><input id="search-input" type="search" class="input" placeholder="Buscar por título ou descrição..." value="' +
        escapeHtml(searchTerm) +
        '" /></div>' +
        '<div class="sm:col-span-3"><select id="status-filter" class="input">' +
        '<option value="ALL"' +
        (statusFilter === 'ALL' ? ' selected' : '') +
        '>Status: Todos</option>' +
        '<option value="published"' +
        (statusFilter === 'published' ? ' selected' : '') +
        '>Publicados</option>' +
        '<option value="draft"' +
        (statusFilter === 'draft' ? ' selected' : '') +
        '>Rascunhos</option></select></div>' +
        '<div class="sm:col-span-3"><select id="sort-by" class="input">' +
        '<option value="newest"' +
        (sortBy === 'newest' ? ' selected' : '') +
        '>Mais recentes</option>' +
        '<option value="price-desc"' +
        (sortBy === 'price-desc' ? ' selected' : '') +
        '>Maior Preço</option>' +
        '<option value="price-asc"' +
        (sortBy === 'price-asc' ? ' selected' : '') +
        '>Menor Preço</option></select></div></div>' +
        '<div class="text-xs text-gray-500">Exibindo <strong class="text-gray-900">' +
        filtered.length +
        '</strong> de <strong>' +
        videos.length +
        '</strong> vídeos</div></div>' +
        '<div class="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden table-wrap desktop-only">' +
        (filtered.length === 0
          ? '<div class="p-12 text-center text-gray-500 text-sm">Nenhum vídeo encontrado.</div>'
          : '<table class="admin-table desktop-only"><thead><tr><th></th><th>Vídeo</th><th>Preço</th><th>Status</th><th>Duração</th><th>Data</th><th>Ações</th></tr></thead><tbody>' +
            rowsHtml +
            '</tbody></table>') +
        '</div>' +
        '<div class="video-cards mobile-only">' +
        (filtered.length === 0
          ? '<div class="p-8 text-center text-gray-500 text-sm">Nenhum vídeo encontrado. Toque em <strong>Cadastrar</strong>.</div>'
          : cardsHtml) +
        '</div></div>') +
    '</main>';

  bindMainEvents();
}

function bindMainEvents() {
  document.getElementById('btn-telegram')?.addEventListener('click', () => {
    document.getElementById('telegram-input').value = telegramLink;
    openModal('telegram-modal');
  });
  document.getElementById('btn-refresh')?.addEventListener('click', () => loadData());
  document.getElementById('btn-new')?.addEventListener('click', openNewModal);
  document.getElementById('btn-new-2')?.addEventListener('click', openNewModal);

  document.getElementById('search-input')?.addEventListener('input', (e) => {
    searchTerm = e.target.value;
    clearTimeout(e.target._t);
    e.target._t = setTimeout(render, 150);
  });
  document.getElementById('status-filter')?.addEventListener('change', (e) => {
    statusFilter = e.target.value;
    render();
  });
  document.getElementById('sort-by')?.addEventListener('change', (e) => {
    sortBy = e.target.value;
    render();
  });

  document.querySelectorAll('[data-action]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const action = btn.getAttribute('data-action');
      const video = videos.find((v) => String(v.id) === String(id));
      if (!video) return;
      if (action === 'preview') openPlayer(video);
      if (action === 'edit') openEditModal(video);
      if (action === 'delete') openDeleteModal(video);
      if (action === 'copy') {
        navigator.clipboard.writeText(video.payment_url || '').then(
          () => showToast('Link de pagamento copiado!', 'success'),
          () => showToast('Não foi possível copiar', 'error')
        );
      }
    });
  });
}

function openNewModal() {
  editingVideo = null;
  document.getElementById('video-modal-title').textContent = 'Cadastrar Vídeo';
  document.getElementById('video-form').reset();
  document.getElementById('is_published').checked = true;
  fillPriceSelect(25);
  openModal('video-modal');
}

function openEditModal(video) {
  editingVideo = video;
  document.getElementById('video-modal-title').textContent = 'Editar Vídeo';
  const form = document.getElementById('video-form');
  form.title.value = video.title || '';
  form.description.value = video.description || '';
  form.duration.value = video.duration || '10 min';
  form.category.value = video.category || 'Coleções';
  form.video_url.value = video.video_url || '';
  form.thumbnail_url.value = video.thumbnail_url || '';
  document.getElementById('is_published').checked = !!video.is_published;
  fillPriceSelect(video.price);
  openModal('video-modal');
}

function openDeleteModal(video) {
  deletingVideo = video;
  document.getElementById('delete-title').textContent = video.title;
  openModal('delete-modal');
}

function openPlayer(video) {
  document.getElementById('player-title').textContent = video.title;
  const vid = document.getElementById('player-video');
  vid.src = video.video_url || '';
  if (video.thumbnail_url) vid.poster = video.thumbnail_url;
  openModal('player-modal');
}

async function loadData() {
  isLoading = true;
  render();
  try {
    const [list, tg] = await Promise.all([fetchVideos(), fetchTelegramLink().catch(() => '')]);
    videos = list;
    telegramLink = tg || '';
  } catch (err) {
    console.error(err);
    showToast('Erro ao carregar dados do Neon: ' + (err.message || err), 'error');
  } finally {
    isLoading = false;
    render();
  }
}

function initModals() {
  document.querySelectorAll('[data-close]').forEach((btn) => {
    btn.addEventListener('click', () => closeModal(btn.getAttribute('data-close')));
  });
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeModal(overlay.id);
    });
  });

  document.getElementById('price-select').addEventListener('change', updatePaymentPreview);

  document.getElementById('thumb-file').addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('Imagem muito grande (máx. 2MB para base64)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      document.querySelector('#video-form [name=thumbnail_url]').value = reader.result;
      showToast('Thumbnail carregada (base64)', 'info');
    };
    reader.readAsDataURL(file);
  });

  document.getElementById('video-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = {
      title: form.title.value,
      description: form.description.value,
      price: Number(form.price.value),
      duration: form.duration.value,
      category: form.category.value,
      video_url: form.video_url.value,
      thumbnail_url: form.thumbnail_url.value,
      is_published: form.is_published.checked,
    };
    const btn = document.getElementById('video-submit-btn');
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    try {
      if (editingVideo) {
        const updated = await updateVideo(editingVideo.id, data);
        videos = videos.map((v) => (v.id === updated.id ? updated : v));
        showToast('Vídeo atualizado com sucesso!', 'success');
      } else {
        const created = await createVideo(data);
        videos = [created, ...videos];
        showToast('Vídeo cadastrado com sucesso!', 'success');
      }
      closeModal('video-modal');
      render();
    } catch (err) {
      console.error(err);
      showToast('Erro ao salvar: ' + (err.message || err), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Salvar';
    }
  });

  document.getElementById('telegram-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const url = document.getElementById('telegram-input').value;
    try {
      await saveTelegramLink(url);
      telegramLink = url.trim();
      closeModal('telegram-modal');
      showToast('Link do Telegram atualizado!', 'success');
      render();
    } catch (err) {
      showToast('Erro ao salvar Telegram: ' + (err.message || err), 'error');
    }
  });

  document.getElementById('delete-confirm-btn').addEventListener('click', async () => {
    if (!deletingVideo) return;
    const btn = document.getElementById('delete-confirm-btn');
    btn.disabled = true;
    btn.textContent = 'Apagando...';
    try {
      await deleteVideo(deletingVideo.id);
      videos = videos.filter((v) => v.id !== deletingVideo.id);
      showToast('Vídeo apagado com sucesso!', 'success');
      closeModal('delete-modal');
      deletingVideo = null;
      render();
    } catch (err) {
      showToast('Erro ao apagar: ' + (err.message || err), 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Apagar';
    }
  });
}

fillPriceSelect(25);
initModals();
loadData();
