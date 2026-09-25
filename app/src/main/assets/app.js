let mode = 'text';
let imageDataUrl = null;
const historyKey = 'luffy_ai_history_v1';
const backendKey = 'luffy_ai_backend_v1';
const pollTimers = {};

const $ = id => document.getElementById(id);

function openTab(tab) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.bottom-nav button').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  $(tab + 'Page').classList.add('active');

  if (tab === 'home') renderRecent();
  if (tab === 'library') renderLibrary();
  if (tab === 'settings') $('backendUrl').value = getBackend();

  window.scrollTo(0, 0);
}

function setModeAndOpen(nextMode) {
  setMode(nextMode);
  openTab('create');
}

function setMode(nextMode) {
  mode = nextMode;
  $('modeText').classList.toggle('active', mode === 'text');
  $('modeImage').classList.toggle('active', mode === 'image');
  $('imageInputWrap').classList.toggle('hidden', mode !== 'image');
  $('aspectField').classList.toggle('hidden', mode === 'image');

  $('prompt').placeholder = mode === 'text'
    ? 'A tiny astronaut walks through a glowing forest at night, cinematic camera movement, soft fog...'
    : 'Describe the motion: slowly turn toward the camera, gentle breeze, cinematic push-in...';
}

function getBackend() {
  return (localStorage.getItem(backendKey) || '').replace(/\/$/, '');
}

function saveSettings() {
  const url = $('backendUrl').value.trim().replace(/\/$/, '');

  if (url && !/^https:\/\//i.test(url)) {
    toast('Use an HTTPS backend URL');
    return;
  }

  localStorage.setItem(backendKey, url);
  updateBackendStatus();
  toast(url ? 'Backend connected' : 'Backend removed');
}

function updateBackendStatus() {
  const connected = Boolean(getBackend());
  const el = $('backendStatus');
  el.classList.toggle('connected', connected);
  el.querySelector('span').textContent = connected ? 'Connected' : 'Not connected';
}

function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => el.classList.remove('show'), 2300);
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(historyKey) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(historyKey, JSON.stringify(items.slice(0, 50)));
}

function addHistory(item) {
  const items = getHistory();
  items.unshift(item);
  saveHistory(items);
  renderRecent();
  renderLibrary();
}

function updateHistory(id, patch) {
  const items = getHistory().map(item => item.id === id ? {...item, ...patch} : item);
  saveHistory(items);
  renderRecent();
  renderLibrary();
}

function escapeHtml(value = '') {
  return value.replace(/[&<>'"]/g, c => ({
    '&':'&amp;',
    '<':'&lt;',
    '>':'&gt;',
    "'":'&#39;',
    '"':'&quot;'
  }[c]));
}

function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ago';
  if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ago';
  return new Date(timestamp).toLocaleDateString();
}

function itemHtml(item) {
  const statusClass = item.status === 'COMPLETED'
    ? 'done'
    : item.status === 'FAILED' ? 'failed' : 'processing';

  const statusLabel = item.status === 'COMPLETED'
    ? 'Ready'
    : item.status === 'FAILED'
      ? 'Failed'
      : item.status === 'IN_QUEUE' ? 'Queued' : 'Generating';

  const media = item.videoUrl
    ? '<video src="' + item.videoUrl + '" muted playsinline preload="metadata"></video>'
    : (item.mode === 'image' ? '▧' : '✦');

  const actions = item.videoUrl
    ? '<div class="row-actions">' +
        '<a href="' + item.videoUrl + '" target="_blank">Play</a>' +
        '<a href="' + item.videoUrl + '" download>Download</a>' +
        '<button onclick="copyVideo(\'' + item.videoUrl + '\')">Copy link</button>' +
      '</div>'
    : '';

  return '<div class="generation-item">' +
    '<div class="generation-thumb">' + media + '</div>' +
    '<div class="generation-content">' +
      '<strong>' + escapeHtml(item.prompt) + '</strong>' +
      '<div class="generation-meta">' +
        '<span>' + (item.mode === 'image' ? 'Image → Video' : 'Text → Video') + '</span>' +
        '<span>•</span>' +
        '<span>' + item.duration + 's</span>' +
        '<span>•</span>' +
        '<span>' + timeAgo(item.createdAt) + '</span>' +
        '<span class="badge ' + statusClass + '">' + statusLabel + '</span>' +
      '</div>' +
      actions +
    '</div>' +
  '</div>';
}

function renderRecent() {
  const items = getHistory().slice(0, 3);
  $('recentList').innerHTML = items.length
    ? items.map(itemHtml).join('')
    : '<div class="empty">Your generated videos will appear here.</div>';
}

function renderLibrary() {
  const items = getHistory();
  $('libraryList').innerHTML = items.length
    ? items.map(itemHtml).join('')
    : '<div class="empty">No generations yet. Create your first AI video.</div>';
}

function clearFinished() {
  const pending = getHistory().filter(x => x.status !== 'COMPLETED' && x.status !== 'FAILED');
  saveHistory(pending);
  renderLibrary();
  renderRecent();
  toast('Finished items cleared');
}

async function copyVideo(url) {
  try {
    await navigator.clipboard.writeText(url);
    toast('Video link copied');
  } catch {
    window.open(url, '_blank');
  }
}

function enhancePrompt() {
  const box = $('prompt');
  let prompt = box.value.trim();

  if (!prompt) {
    toast('Write a basic idea first');
    return;
  }

  const addition = mode === 'text'
    ? ' Cinematic composition, natural realistic motion, detailed lighting, subtle depth of field, smooth camera movement, consistent subject appearance, high visual coherence.'
    : ' Preserve the subject identity and facial features. Natural realistic movement, subtle secondary motion, smooth cinematic camera movement, stable background details and consistent lighting.';

  if (!prompt.toLowerCase().includes('cinematic')) {
    prompt += addition;
  }

  box.value = prompt.slice(0, 1500);
  toast('Prompt enhanced');
}

function clearImage() {
  imageDataUrl = null;
  $('imageInput').value = '';
  $('imagePreview').src = '';
  $('imagePreview').classList.add('hidden');
  $('imagePlaceholder').classList.remove('hidden');
  $('removeImage').classList.add('hidden');
}

async function resizeImage(file) {
  const source = await fileToDataUrl(file);
  const img = new Image();

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const maxSide = 1280;
      let width = img.width;
      let height = img.height;

      if (Math.max(width, height) > maxSide) {
        const scale = maxSide / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.84));
    };

    img.onerror = reject;
    img.src = source;
  });
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function generateVideo() {
  const backend = getBackend();
  const prompt = $('prompt').value.trim();

  if (!backend) {
    openTab('settings');
    toast('Connect your backend first');
    return;
  }

  if (!prompt) {
    toast('Write a prompt first');
    return;
  }

  if (mode === 'image' && !imageDataUrl) {
    toast('Choose an image first');
    return;
  }

  const button = $('generateBtn');
  button.disabled = true;
  button.innerHTML = '<span>◌</span> Submitting...';

  const localId = 'local_' + Date.now();
  const item = {
    id: localId,
    requestId: null,
    prompt,
    mode,
    duration: Number($('duration').value),
    resolution: $('resolution').value,
    aspectRatio: $('aspectRatio').value,
    status: 'IN_QUEUE',
    createdAt: Date.now(),
    videoUrl: null
  };

  addHistory(item);

  try {
    const response = await fetch(backend + '/api/submit', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        mode,
        prompt,
        duration: item.duration,
        resolution: item.resolution,
        aspectRatio: item.aspectRatio,
        imageDataUrl: mode === 'image' ? imageDataUrl : undefined
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Generation could not be submitted');
    }

    updateHistory(localId, {
      requestId: data.requestId,
      status: 'IN_QUEUE'
    });

    toast('Generation started');
    openTab('library');
    startPolling(localId, data.requestId, mode);
  } catch (error) {
    updateHistory(localId, {
      status: 'FAILED',
      error: error.message
    });
    toast(error.message || 'Generation failed');
  } finally {
    button.disabled = false;
    button.innerHTML = '<span>✦</span> Generate video';
  }
}

function startPolling(localId, requestId, itemMode) {
  if (!requestId || pollTimers[localId]) return;

  const check = async () => {
    const backend = getBackend();
    if (!backend) return;

    try {
      const url = backend + '/api/status?id=' +
        encodeURIComponent(requestId) +
        '&mode=' + encodeURIComponent(itemMode);

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Status check failed');
      }

      if (data.status === 'COMPLETED') {
        clearInterval(pollTimers[localId]);
        delete pollTimers[localId];

        if (data.videoUrl) {
          updateHistory(localId, {
            status: 'COMPLETED',
            videoUrl: data.videoUrl
          });
          toast('Your video is ready');
        } else {
          updateHistory(localId, {status: 'FAILED'});
          toast('Video finished without an output URL');
        }
      } else if (data.status === 'FAILED') {
        clearInterval(pollTimers[localId]);
        delete pollTimers[localId];
        updateHistory(localId, {status: 'FAILED'});
        toast('Generation failed');
      } else {
        updateHistory(localId, {status: data.status || 'IN_PROGRESS'});
      }
    } catch (error) {
      console.log('Polling error', error);
    }
  };

  check();
  pollTimers[localId] = setInterval(check, 5000);
}

function resumePending() {
  getHistory()
    .filter(item => item.requestId && item.status !== 'COMPLETED' && item.status !== 'FAILED')
    .forEach(item => startPolling(item.id, item.requestId, item.mode));
}

$('imageInput').addEventListener('change', async event => {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    toast('Preparing image...');
    imageDataUrl = await resizeImage(file);
    $('imagePreview').src = imageDataUrl;
    $('imagePreview').classList.remove('hidden');
    $('imagePlaceholder').classList.add('hidden');
    $('removeImage').classList.remove('hidden');
    toast('Image ready');
  } catch {
    clearImage();
    toast('Could not read that image');
  }
});

setMode('text');
renderRecent();
renderLibrary();
updateBackendStatus();
resumePending();
