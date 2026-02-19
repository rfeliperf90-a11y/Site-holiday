let currentUser = null;
let allDownloads = [];
let userCanPost = false;
let userCanManageDownloads = false;
let showingFavoritesOnly = false;
let filteredDownloadsCache = [];
let currentDownloadsPage = 1;
const DOWNLOADS_PER_PAGE = 15;
const ANIMATED_PROFILE_CARD_THEMES = [
    'theme-aurora',
    'theme-prisma',
    'theme-pulse',
    'theme-comet',
    'theme-inferno',
    'theme-frost',
    'theme-voltage',
    'theme-emberstorm',
    'theme-blizzard',
    'theme-neon-grid',
    'theme-liquid-metal',
    'theme-void-rift',
    'theme-solar-flare',
    'theme-toxic-mist',
    'theme-crystal-cave',
    'theme-glitchwave'
];

const MAX_DOWNLOAD_LINKS = 3;
const DOWNLOAD_LINK_FORMAT_OPTIONS = [
    { value: 'auto', label: 'Auto (detectar)' },
    { value: 'apk', label: 'APK (.apk)' },
    { value: 'exe', label: 'EXE (.exe)' },
    { value: 'msi', label: 'MSI (.msi)' },
    { value: 'zip', label: 'ZIP (.zip)' },
    { value: 'rar', label: 'RAR (.rar)' },
    { value: '7z', label: '7Z (.7z)' },
    { value: 'pdf', label: 'PDF (.pdf)' },
    { value: 'doc', label: 'DOC/DOCX (.doc, .docx)' },
    { value: 'xls', label: 'XLS/XLSX (.xls, .xlsx)' },
    { value: 'ppt', label: 'PPT/PPTX (.ppt, .pptx)' },
    { value: 'txt', label: 'TXT (.txt)' },
    { value: 'jpg', label: 'JPG/JPEG (.jpg, .jpeg)' },
    { value: 'png', label: 'PNG (.png)' },
    { value: 'gif', label: 'GIF (.gif)' },
    { value: 'webp', label: 'WEBP (.webp)' },
    { value: 'svg', label: 'SVG (.svg)' },
    { value: 'mp3', label: 'MP3 (.mp3)' },
    { value: 'mp4', label: 'MP4 (.mp4)' },
    { value: 'iso', label: 'ISO (.iso)' },
    { value: 'software', label: 'Software' },
    { value: 'site', label: 'Site/Link' },
    { value: 'outro', label: 'Outro' }
];
const DOWNLOAD_LINK_FORMAT_LABELS = DOWNLOAD_LINK_FORMAT_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option.label;
    return acc;
}, {});
const DOWNLOAD_LINK_EXTENSION_FORMAT_MAP = {
    apk: 'apk',
    exe: 'exe',
    msi: 'msi',
    zip: 'zip',
    rar: 'rar',
    '7z': '7z',
    pdf: 'pdf',
    doc: 'doc',
    docx: 'doc',
    xls: 'xls',
    xlsx: 'xls',
    ppt: 'ppt',
    pptx: 'ppt',
    txt: 'txt',
    jpg: 'jpg',
    jpeg: 'jpg',
    png: 'png',
    gif: 'gif',
    webp: 'webp',
    svg: 'svg',
    mp3: 'mp3',
    mp4: 'mp4',
    iso: 'iso'
};

function getApiOrigin() {
    const baseFromApi = typeof API_URL === 'string'
        ? API_URL.replace(/\/api\/?$/i, '').replace(/\/+$/, '')
        : '';
    if (baseFromApi) return baseFromApi;
    return 'https://guildholiday.discloud.app';
}

function resolveMediaUrl(value, fallback = '') {
    const raw = String(value || '').trim();
    if (!raw) return fallback;
    if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;

    const origin = getApiOrigin();
    if (raw.startsWith('/')) return `${origin}${raw}`;
    return `${origin}/${raw.replace(/^\/+/, '')}`;
}

function escapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function hashSeed(value) {
    const text = String(value ?? '');
    let hash = 0;
    for (let i = 0; i < text.length; i += 1) {
        hash = (hash * 31 + text.charCodeAt(i)) | 0;
    }
    return Math.abs(hash);
}

function supportsAdvancedCardFx() {
    try {
        return Boolean(window?.matchMedia?.('(pointer:fine)').matches);
    } catch {
        return false;
    }
}

function bindCardFx(cardElement) {
    if (!cardElement || cardElement.dataset.fxBound === '1') return;
    if (!supportsAdvancedCardFx()) return;

    cardElement.dataset.fxBound = '1';
    cardElement.style.setProperty('--mx', '50%');
    cardElement.style.setProperty('--my', '50%');
    cardElement.style.setProperty('--rx', '0deg');
    cardElement.style.setProperty('--ry', '0deg');

    const onMove = (event) => {
        const rect = cardElement.getBoundingClientRect();
        if (!rect.width || !rect.height) return;

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const px = (x / rect.width) * 100;
        const py = (y / rect.height) * 100;

        const maxTilt = 7;
        const rotateY = ((x / rect.width) - 0.5) * (maxTilt * 2);
        const rotateX = (0.5 - (y / rect.height)) * (maxTilt * 2);

        cardElement.style.setProperty('--mx', `${px.toFixed(2)}%`);
        cardElement.style.setProperty('--my', `${py.toFixed(2)}%`);
        cardElement.style.setProperty('--rx', `${rotateX.toFixed(2)}deg`);
        cardElement.style.setProperty('--ry', `${rotateY.toFixed(2)}deg`);
        cardElement.classList.add('fx-active');
    };

    const onLeave = () => {
        cardElement.style.setProperty('--mx', '50%');
        cardElement.style.setProperty('--my', '50%');
        cardElement.style.setProperty('--rx', '0deg');
        cardElement.style.setProperty('--ry', '0deg');
        cardElement.classList.remove('fx-active');
    };

    cardElement.addEventListener('pointermove', onMove);
    cardElement.addEventListener('pointerleave', onLeave);
}

function attachInteractiveCardEffects(scope = document) {
    const root = scope && scope.querySelectorAll ? scope : document;
    root.querySelectorAll('.animated-download-card, .mini-profile-card').forEach(bindCardFx);
}

function resolveAnimatedThemeClass(seedValue) {
    const preferredTheme = arguments.length > 1 ? String(arguments[1] || '').trim() : '';
    if (ANIMATED_PROFILE_CARD_THEMES.includes(preferredTheme)) {
        return preferredTheme;
    }
    const index = hashSeed(seedValue) % ANIMATED_PROFILE_CARD_THEMES.length;
    return ANIMATED_PROFILE_CARD_THEMES[index];
}

function normalizeAnimatedGifUrl(rawValue) {
    const raw = String(rawValue || '').trim();
    if (!raw) return '';
    if (/^https?:\/\//i.test(raw)) return raw;
    if (raw.startsWith('/')) return resolveMediaUrl(raw, '');
    return '';
}

function buildAnimatedCardConfig(seedValue, themeValue, visualModeValue, gifUrlValue) {
    const visualMode = String(visualModeValue || 'theme').trim().toLowerCase();
    const gifUrl = normalizeAnimatedGifUrl(gifUrlValue);

    if (visualMode === 'gif' && gifUrl) {
        return {
            className: 'animated-profile-gif',
            inlineStyle: `--animated-card-gif-url: url('${gifUrl.replace(/'/g, "\\'")}');`
        };
    }

    return {
        className: resolveAnimatedThemeClass(seedValue, themeValue),
        inlineStyle: ''
    };
}

function normalizeDownloadLinkFormat(value) {
    const normalized = String(value || '').trim().toLowerCase();
    const isValid = DOWNLOAD_LINK_FORMAT_OPTIONS.some(option => option.value === normalized);
    return isValid ? normalized : 'auto';
}

function inferFormatFromUrl(url) {
    const rawUrl = String(url || '').trim();
    if (!rawUrl) return '';

    let pathName = rawUrl;
    try {
        pathName = new URL(rawUrl).pathname || '';
    } catch {
        pathName = rawUrl.split(/[?#]/)[0] || '';
    }

    const lowerPath = pathName.toLowerCase();
    const lastDot = lowerPath.lastIndexOf('.');
    if (lastDot < 0 || lastDot === lowerPath.length - 1) return '';

    const extension = lowerPath.slice(lastDot + 1);
    return DOWNLOAD_LINK_EXTENSION_FORMAT_MAP[extension] || '';
}

function getDownloadLinkFormatLabel(linkItem) {
    const explicitFormat = normalizeDownloadLinkFormat(linkItem?.format);
    if (explicitFormat && explicitFormat !== 'auto') {
        return DOWNLOAD_LINK_FORMAT_LABELS[explicitFormat] || explicitFormat.toUpperCase();
    }

    const inferred = inferFormatFromUrl(linkItem?.url || '');
    if (!inferred) return '';
    return DOWNLOAD_LINK_FORMAT_LABELS[inferred] || inferred.toUpperCase();
}

function parseDownloadLinks(download) {
    const parsed = [];
    if (download?.links_json) {
        try {
            const rawLinks = JSON.parse(download.links_json);
            if (Array.isArray(rawLinks)) {
                rawLinks.forEach((entry) => {
                    if (typeof entry === 'string') {
                        const url = entry.trim();
                        if (!url) return;
                        parsed.push({ url, format: 'auto' });
                        return;
                    }

                    if (entry && typeof entry === 'object') {
                        const url = String(entry.url || entry.link || '').trim();
                        if (!url) return;
                        parsed.push({
                            url,
                            format: normalizeDownloadLinkFormat(entry.format)
                        });
                    }
                });
            }
        } catch {
            // Ignorar JSON inv�lido e usar fallback.
        }
    }

    if (parsed.length === 0 && download?.link) {
        const url = String(download.link).trim();
        if (url) parsed.push({ url, format: 'auto' });
    }

    return parsed.slice(0, MAX_DOWNLOAD_LINKS);
}

function getFormatOptionsHtml(selectedFormat = 'auto') {
    const selected = normalizeDownloadLinkFormat(selectedFormat);
    return DOWNLOAD_LINK_FORMAT_OPTIONS
        .map(option => `<option value="${option.value}" ${option.value === selected ? 'selected' : ''}>${option.label}</option>`)
        .join('');
}

function buildPostLinkRowHtml(withRemoveButton = true) {
    return `
        <div class="download-link-row" style="display: flex; gap: 10px; margin-bottom: 10px;">
            <div style="flex: 1;">
                <input type="url" class="downloadLink" placeholder="https://..." style="width: 100%; padding: 10px; border: 1px solid #EC4899; border-radius: 5px; box-sizing: border-box; background: rgba(0,0,0,0.3); color: white;">
            </div>
            <div style="width: 180px;">
                <select class="downloadLinkFormat" style="width: 100%; padding: 10px; border: 1px solid #EC4899; border-radius: 5px; box-sizing: border-box; background: rgba(0,0,0,0.3); color: white;">
                    ${getFormatOptionsHtml('auto')}
                </select>
            </div>
            ${withRemoveButton ? '<button type="button" class="btnRemoveLink" style="align-self: flex-end; padding: 8px 12px; background: #EF4444; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">- Link</button>' : ''}
        </div>
    `;
}

function getPostLinksPayload() {
    return Array.from(document.querySelectorAll('#linksContainer .download-link-row'))
        .map((row) => {
            const url = String(row.querySelector('.downloadLink')?.value || '').trim();
            const format = normalizeDownloadLinkFormat(row.querySelector('.downloadLinkFormat')?.value || 'auto');
            if (!url) return null;
            return { url, format };
        })
        .filter(Boolean);
}

function resetPostLinksUi() {
    const linksContainer = document.getElementById('linksContainer');
    if (!linksContainer) return;

    const rows = Array.from(linksContainer.querySelectorAll('.download-link-row'));
    rows.forEach((row, idx) => {
        const urlInput = row.querySelector('.downloadLink');
        const formatSelect = row.querySelector('.downloadLinkFormat');
        if (idx === 0) {
            if (urlInput) urlInput.value = '';
            if (formatSelect) formatSelect.value = 'auto';
            return;
        }
        row.remove();
    });
}

function syncPostButtonAvailability() {
    const postButton = document.getElementById('btnPostDownload');
    if (!postButton) return;
    postButton.style.display = userCanPost ? 'inline-block' : 'none';
}

function openPostDownloadModal() {
    if (!userCanPost) {
        showNotification('Voce nao tem permissao para postar downloads', 'error');
        return;
    }

    const postModal = document.getElementById('postDownloadModal');
    if (!postModal) return;

    const errorDiv = document.getElementById('postErrorMessage');
    if (errorDiv) errorDiv.style.display = 'none';
    postModal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closePostDownloadModal() {
    const postModal = document.getElementById('postDownloadModal');
    if (!postModal) return;
    postModal.style.display = 'none';
    const formatHelpTooltip = document.getElementById('formatHelpTooltip');
    if (formatHelpTooltip) formatHelpTooltip.style.display = 'none';
    document.body.style.overflow = '';
}

function setupFormatHelpTooltip() {
    const wrapper = document.getElementById('formatHelpWrapper');
    const toggle = document.getElementById('formatHelpToggle');
    const tooltip = document.getElementById('formatHelpTooltip');
    if (!wrapper || !toggle || !tooltip) return;

    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const isVisible = tooltip.style.display === 'block';
        tooltip.style.display = isVisible ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
        if (tooltip.style.display !== 'block') return;
        if (wrapper.contains(e.target)) return;
        tooltip.style.display = 'none';
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            tooltip.style.display = 'none';
        }
    });
}

// Carregar usu�rio autenticado ao abrir p�gina
async function loadCurrentUser() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const response = await AuthAPI.getProfile();
        if (response.success) {
            currentUser = response.user;
            
            // Verificar se pode postar downloads
            const permResponse = await AuthAPI.checkCanPostDownloads();
            if (permResponse.success) {
                userCanPost = permResponse.canPost;
                syncPostButtonAvailability();
            }

            // Verificar se pode gerenciar downloads (editar/excluir outros)
            const manageResponse = await AuthAPI.checkCanManageDownloads();
            if (manageResponse.success) {
                userCanManageDownloads = manageResponse.canManage;
            }
            
            // Notificacoes globais ficam no auth-manager.js
        }
    } catch (error) {
        console.error('Erro ao carregar usu�rio:', error);
    }
}

// Carregar downloads com conquistas
async function loadDownloads() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    
    try {
        const response = await AuthAPI.getDownloadsWithRanks();
        if (response.success) {
            allDownloads = response.downloads || [];
            filterAndRender();
        }
    } catch (error) {
        console.error('Erro ao carregar downloads:', error);
        allDownloads = [];
    } finally {
        if (loadingSpinner) loadingSpinner.style.display = 'none';
    }
}

// Abrir um post especifico vindo de notificacao (query string)
function handleNotificationDeepLink() {
    const params = new URLSearchParams(window.location.search);
    const downloadId = params.get('downloadId');
    const openComments = params.get('openComments') === '1';

    if (!downloadId) return;

    let targetCard = document.querySelector(`.download-card[data-id="${downloadId}"]`);
    if (!targetCard && filteredDownloadsCache.length > 0) {
        const targetIndex = filteredDownloadsCache.findIndex((item) => String(item.id) === String(downloadId));
        if (targetIndex >= 0) {
            const targetPage = Math.floor(targetIndex / DOWNLOADS_PER_PAGE) + 1;
            if (targetPage !== currentDownloadsPage) {
                currentDownloadsPage = targetPage;
                renderDownloads(filteredDownloadsCache, { preservePage: true });
                targetCard = document.querySelector(`.download-card[data-id="${downloadId}"]`);
            }
        }
    }
    if (!targetCard) return;

    targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });

    const previousTransition = targetCard.style.transition;
    targetCard.style.transition = 'box-shadow 0.25s ease, border-color 0.25s ease';
    targetCard.style.boxShadow = '0 0 0 2px rgba(236, 72, 153, 0.75), 0 0 22px rgba(236, 72, 153, 0.45)';
    targetCard.style.borderColor = 'rgba(236, 72, 153, 0.9)';

    setTimeout(() => {
        targetCard.style.boxShadow = '';
        targetCard.style.borderColor = '';
        targetCard.style.transition = previousTransition;
    }, 2200);

    if (openComments && currentUser) {
        setTimeout(() => {
            showCommentForm(downloadId);
        }, 450);
    }

    params.delete('downloadId');
    params.delete('openComments');
    const rest = params.toString();
    const cleanUrl = `${window.location.pathname}${rest ? `?${rest}` : ''}`;
    window.history.replaceState({}, document.title, cleanUrl);
}

function resolveRenderStateForPage(downloadsToRender) {
    const totalItems = Array.isArray(downloadsToRender) ? downloadsToRender.length : 0;
    const totalPages = Math.max(1, Math.ceil(totalItems / DOWNLOADS_PER_PAGE));
    if (currentDownloadsPage > totalPages) currentDownloadsPage = totalPages;
    if (currentDownloadsPage < 1) currentDownloadsPage = 1;

    const startIndex = (currentDownloadsPage - 1) * DOWNLOADS_PER_PAGE;
    const endIndex = startIndex + DOWNLOADS_PER_PAGE;
    const pageItems = downloadsToRender.slice(startIndex, endIndex);

    return { totalItems, totalPages, startIndex, endIndex, pageItems };
}

function renderDownloadsPagination(totalItems, totalPages) {
    const paginationContainer = document.getElementById('downloadsPagination');
    if (!paginationContainer) return;

    if (totalItems <= DOWNLOADS_PER_PAGE) {
        paginationContainer.innerHTML = '';
        paginationContainer.style.display = 'none';
        return;
    }

    paginationContainer.style.display = 'flex';
    const pagesHtml = Array.from({ length: totalPages }, (_, idx) => {
        const page = idx + 1;
        const isActive = page === currentDownloadsPage;
        return `<button type="button" class="downloads-page-btn ${isActive ? 'active' : ''}" data-page="${page}">${page}</button>`;
    }).join('');

    paginationContainer.innerHTML = `
        <button type="button" class="downloads-page-btn" data-page="prev" ${currentDownloadsPage === 1 ? 'disabled' : ''}>Anterior</button>
        ${pagesHtml}
        <button type="button" class="downloads-page-btn" data-page="next" ${currentDownloadsPage === totalPages ? 'disabled' : ''}>Pr�xima</button>
    `;

    paginationContainer.querySelectorAll('.downloads-page-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const action = String(btn.dataset.page || '').trim();
            if (!action) return;
            if (action === 'prev') {
                currentDownloadsPage = Math.max(1, currentDownloadsPage - 1);
            } else if (action === 'next') {
                currentDownloadsPage = Math.min(totalPages, currentDownloadsPage + 1);
            } else {
                const nextPage = Number(action);
                if (!Number.isFinite(nextPage)) return;
                currentDownloadsPage = Math.min(totalPages, Math.max(1, nextPage));
            }
            renderDownloads(filteredDownloadsCache, { preservePage: true });
            window.scrollTo({ top: document.getElementById('downloads')?.offsetTop || 0, behavior: 'smooth' });
        });
    });
}

// Filtrar e renderizar downloads
async function filterAndRender(options = {}) {
    const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
    const sortType = document.getElementById('sortSelect')?.value || 'date-desc';
    const preservePage = Boolean(options.preservePage);

    if (!preservePage) {
        currentDownloadsPage = 1;
    }

    let filtered = allDownloads.filter(download => 
        download.name.toLowerCase().includes(searchTerm) ||
        (download.description && download.description.toLowerCase().includes(searchTerm)) ||
        download.nickname.toLowerCase().includes(searchTerm)
    );

    filtered = sortDownloads(filtered, sortType);
    filteredDownloadsCache = filtered;
    renderDownloads(filtered, { preservePage: true });
}

// Fun��o para lidar com rea��es (like/cora��o)
async function handleReaction(e) {
    if (!currentUser) {
        showNotification('Voc� deve estar logado para reagir', 'error');
        return;
    }

    const button = e.currentTarget;
    const downloadId = button.dataset.id;
    const reactionType = button.dataset.type; // 'like' ou 'heart'
    
    console.log(`Adicionando reacao: ${reactionType} no download ${downloadId}`);
    
    try {
        const response = await AuthAPI.addDownloadReaction(downloadId, reactionType);
        
        if (response.success) {
            console.log('Reacao adicionada/removida com sucesso');
            console.log('Resposta:', response);
            
            // Atualizar o bot�o visualmente
            if (response.userReactions) {
                const likeBtn = document.querySelector(`[data-type="like"][data-id="${downloadId}"]`);
                const heartBtn = document.querySelector(`[data-type="heart"][data-id="${downloadId}"]`);
                
                if (likeBtn) {
                    if (response.userReactions.hasLike) {
                        likeBtn.style.background = '#EC4899';
                        likeBtn.style.color = 'white';
                    } else {
                        likeBtn.style.background = 'transparent';
                        likeBtn.style.color = '#EC4899';
                    }
                    likeBtn.querySelector('.count').textContent = response.reactions.likes || 0;
                }
                
                if (heartBtn) {
                    if (response.userReactions.hasHeart) {
                        heartBtn.style.background = '#EC4899';
                        heartBtn.style.color = 'white';
                    } else {
                        heartBtn.style.background = 'transparent';
                        heartBtn.style.color = '#EC4899';
                    }
                    heartBtn.querySelector('.count').textContent = response.reactions.hearts || 0;
                }
            }
            
            showNotification(`${reactionType === 'like' ? 'Like' : 'Cora��o'} ${response.isAdded ? 'adicionado' : 'removido'}!`, 'success');
        } else {
            showNotification(response.message || 'Erro ao adicionar rea��o', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar rea��o:', error);
        showNotification('Erro ao processar rea��o', 'error');
    }
}

function sortDownloads(downloadsToSort, sortType) {
    const sorted = [...downloadsToSort];

    function dateToTimestamp(dateStr) {
        if (!dateStr) return 0;
        return new Date(dateStr).getTime();
    }

    switch (sortType) {
        case 'date-desc':
            sorted.sort((a, b) => dateToTimestamp(b.createdAt) - dateToTimestamp(a.createdAt));
            break;
        case 'date-asc':
            sorted.sort((a, b) => dateToTimestamp(a.createdAt) - dateToTimestamp(b.createdAt));
            break;
        case 'likes':
            sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            break;
        case 'name':
            sorted.sort((a, b) => a.name.localeCompare(b.name));
            break;
    }

    return sorted;
}

function renderDownloads(downloadsToRender = allDownloads, options = {}) {
    const grid = document.getElementById('downloads');
    const notFound = document.getElementById('notFound');

    if (downloadsToRender.length === 0) {
        grid.innerHTML = '';
        notFound.style.display = 'block';
        renderDownloadsPagination(0, 1);
        return;
    }

    notFound.style.display = 'none';
    const { totalItems, totalPages, pageItems, startIndex } = resolveRenderStateForPage(downloadsToRender);
    renderDownloadsPagination(totalItems, totalPages);

    grid.innerHTML = pageItems.map((download, idx) => {
        const dateObj = new Date(download.createdAt);
        const formattedDate = dateObj.toLocaleDateString('pt-BR', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric'
        });

        // Renderizar conquistas respeitando ordem salva do perfil
        const achievementRanks = [];
        const pushUniqueRank = (rank) => {
            if (!rank || !rank.name) return;
            const normalized = String(rank.name).trim().toLowerCase();
            if (!normalized) return;
            if (achievementRanks.some(existing => String(existing.name).trim().toLowerCase() === normalized)) return;
            achievementRanks.push(rank);
        };

        if (Array.isArray(download.authorDisplayRanks) && download.authorDisplayRanks.length > 0) {
            download.authorDisplayRanks.forEach(pushUniqueRank);
        } else {
            // Fallback de compatibilidade para dados antigos
            const rankComplete = download.authorRankComplete || null;
            if (rankComplete && rankComplete.current) {
                pushUniqueRank(rankComplete.current);
            }
            if (
                rankComplete &&
                rankComplete.automatic &&
                (!rankComplete.current || rankComplete.automatic.name !== rankComplete.current.name)
            ) {
                pushUniqueRank(rankComplete.automatic);
            }
            if (Array.isArray(download.userSelectedRanks)) {
                download.userSelectedRanks.forEach(pushUniqueRank);
            }
        }

        const achievementsHTML = achievementRanks.length > 0
            ? achievementRanks.map(rank => {
                const color = rank.color || '#6B46C1';
                return `
                    <p style="margin: 2px 0 0 0; font-size: 11px; background: ${color}20; color: ${color}; padding: 3px 8px; border-radius: 3px; display: inline-block; border: 1px solid ${color}40; font-weight: 600;">
                        ${rank.name}
                    </p>
                `;
            }).join('')
            : '<p style="margin: 0; font-size: 12px; color: #999;">Sem conquista</p>';

        const links = parseDownloadLinks(download);
        const canUseAnimatedProfile = Boolean(download.authorCanUseAnimatedProfile) && Boolean(download.authorAnimatedDownloadCardEnabled ?? download.authorAnimatedProfileEnabled);
        const animatedCardConfig = canUseAnimatedProfile
            ? buildAnimatedCardConfig(
                `${download.userId || 0}-${download.id || 0}`,
                download.authorAnimatedProfileTheme,
                download.authorAnimatedProfileVisualMode,
                download.authorAnimatedProfileGifUrl
            )
            : { className: '', inlineStyle: '' };
        const animatedCardClass = canUseAnimatedProfile
            ? `animated-download-card ${animatedCardConfig.className}`.trim()
            : '';
        const animatedStyleAttr = canUseAnimatedProfile && animatedCardConfig.inlineStyle
            ? ` style="${animatedCardConfig.inlineStyle}"`
            : '';
        const downloadButtonsHTML = links.map((linkItem, idx) => {
            const formatLabel = getDownloadLinkFormatLabel(linkItem);
            const baseLabel = links.length > 1 ? `LINK ${idx + 1}` : 'DOWNLOAD';
            const buttonLabel = formatLabel ? `${baseLabel} - ${formatLabel}` : baseLabel;
            return `
            <a href="${escapeHtml(linkItem.url)}" target="_blank" class="btn-download" style="display: inline-block; margin-top: 5px; margin-right: 8px; margin-bottom: 5px; padding: 8px 16px; background: linear-gradient(135deg, #EC4899, #6B46C1); color: white; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; font-weight: 600; font-size: 12px;">${escapeHtml(buttonLabel)}</a>
            `;
        }).join('');

        return `
            <div class="download-card ${animatedCardClass}" data-id="${download.id}"${animatedStyleAttr}>
                <div class="download-header">
                    <div class="user-info">
                        <img src="${resolveMediaUrl(download.avatar, '/imagens/login.png')}" alt="Avatar" class="user-avatar" style="width: 40px; height: 40px; border-radius: 50%; cursor: pointer;" data-user-id="${download.userId}">
                        <div>
                            <strong class="user-name" style="cursor: pointer; color: #EC4899;" data-user-id="${download.userId}">@${escapeHtml(download.nickname)}</strong>
                            <div style="margin-top: 4px;">
                                ${achievementsHTML}
                            </div>
                        </div>
                    </div>
                    ${(currentUser && (currentUser.id === download.userId || userCanManageDownloads)) ? `
                        <div style="display: flex; gap: 8px;">
                            <button class="btn-edit-download" data-id="${download.id}" style="background: linear-gradient(135deg, #6B46C1 0%, #8B5CF6 100%); border: 1px solid #EC4899; color: white; cursor: pointer; font-size: 12px; padding: 6px 12px; border-radius: 4px; font-weight: 600; transition: all 0.3s; box-shadow: 0 0 10px rgba(236, 72, 153, 0.3);">Editar</button>
                            <button class="btn-delete-download" data-id="${download.id}" style="background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); border: 1px solid #EC4899; color: white; cursor: pointer; font-size: 12px; padding: 6px 12px; border-radius: 4px; font-weight: 600; transition: all 0.3s; box-shadow: 0 0 10px rgba(236, 72, 153, 0.3);">Excluir</button>
                        </div>
                    ` : ''}
                </div>

                <div class="download-content">
                    <h3>${escapeHtml(download.name)}</h3>
                    <div class="download-description-scroll">${download.description ? escapeHtml(download.description) : ''}</div>
                    <div class="download-meta-bottom">
                        <p style="margin: 10px 0; font-size: 12px; color: #999;">DATA: ${formattedDate}</p>
                        <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 5px;">
                            ${downloadButtonsHTML}
                        </div>
                    </div>
                </div>

                <div class="download-reactions" style="display: flex; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #333;">
                    <button class="btn-reaction like-btn" data-type="like" data-id="${download.id}" style="flex: 1; padding: 8px; border: 1px solid #EC4899; border-radius: 5px; background: transparent; color: #EC4899; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 5px;">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23EC4899' style='width: 18px; height: 18px;'%3E%3Cpath d='M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z'/%3E%3C/svg%3E" alt="Like" style="width: 16px; height: 16px;"> <span class="count">${download.likes || 0}</span>
                    </button>
                    <button class="btn-reaction heart-btn" data-type="heart" data-id="${download.id}" style="flex: 1; padding: 8px; border: 1px solid #EC4899; border-radius: 5px; background: transparent; color: #EC4899; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 5px;">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23EC4899' style='width: 18px; height: 18px;'%3E%3Cpath d='M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z'/%3E%3C/svg%3E" alt="Cora��o" style="width: 16px; height: 16px;"> <span class="count">${download.hearts || 0}</span>
                    </button>
                    <button class="btn-comment" data-id="${download.id}" style="flex: 1; padding: 8px; border: 1px solid #6B46C1; border-radius: 5px; background: transparent; color: #6B46C1; cursor: pointer; font-size: 14px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 5px;">
                        <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236B46C1' style='width: 18px; height: 18px;'%3E%3Cpath d='M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z'/%3E%3C/svg%3E" alt="Comentar" style="width: 16px; height: 16px;"> <span class="count">${download.comments || 0}</span>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Adicionar event listeners para rea��es
    document.querySelectorAll('.btn-reaction').forEach(btn => {
        btn.addEventListener('click', handleReaction);
    });

    // Adicionar event listeners para coment�rios
    document.querySelectorAll('.btn-comment').forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!currentUser) {
                showNotification('Voc� deve estar logado para comentar', 'error');
                return;
            }
            const downloadId = e.currentTarget.dataset.id;
            showCommentForm(downloadId);
        });
    });

    // Adicionar event listeners para usu�rios
    document.querySelectorAll('.user-name, .user-avatar').forEach(el => {
        el.addEventListener('click', (e) => {
            const userId = e.currentTarget.dataset.userId;
            showUserMiniProfile(userId);
        });
    });

    // Adicionar event listeners para deletar
    document.querySelectorAll('.btn-delete-download').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const downloadId = e.currentTarget.dataset.id;
            
            // Criar modal de confirma��o
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10001;
            `;
            
            const content = document.createElement('div');
            content.style.cssText = `
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #EC4899;
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                text-align: center;
                color: white;
                box-shadow: 0 0 30px rgba(236, 72, 153, 0.3);
            `;
            
            content.innerHTML = `
                <h3 style="color: #EC4899; margin-bottom: 15px; font-size: 20px;">Deletar Download?</h3>
                <p style="color: rgba(255,255,255,0.8); margin-bottom: 30px;">Esta a��o n�o pode ser desfeita. Tem certeza?</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button id="cancelDelete" style="padding: 10px 20px; background: linear-gradient(135deg, #6B46C1 0%, #8B5CF6 100%); color: white; border: 1px solid #6B46C1; border-radius: 5px; cursor: pointer; font-weight: 600; transition: all 0.3s;">Cancelar</button>
                    <button id="confirmDelete" style="padding: 10px 20px; background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); color: white; border: 1px solid #EC4899; border-radius: 5px; cursor: pointer; font-weight: 600; transition: all 0.3s;">Confirmar Delete</button>
                </div>
            `;
            
            modal.appendChild(content);
            document.body.appendChild(modal);
            
            const cancelBtn = document.getElementById('cancelDelete');
            const confirmBtn = document.getElementById('confirmDelete');
            
            // Efeitos hover para bot�o cancelar
            cancelBtn.addEventListener('mouseenter', () => {
                cancelBtn.style.background = 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)';
                cancelBtn.style.transform = 'translateY(-2px)';
                cancelBtn.style.boxShadow = '0 5px 15px rgba(236, 72, 153, 0.5)';
            });
            
            cancelBtn.addEventListener('mouseleave', () => {
                cancelBtn.style.background = 'linear-gradient(135deg, #6B46C1 0%, #8B5CF6 100%)';
                cancelBtn.style.transform = 'translateY(0)';
                cancelBtn.style.boxShadow = '0 0 0px rgba(236, 72, 153, 0)';
            });
            
            // Efeitos hover para bot�o confirmar
            confirmBtn.addEventListener('mouseenter', () => {
                confirmBtn.style.background = 'linear-gradient(135deg, #DB2777 0%, #EC4899 100%)';
                confirmBtn.style.transform = 'translateY(-2px)';
                confirmBtn.style.boxShadow = '0 5px 15px rgba(236, 72, 153, 0.5)';
            });
            
            confirmBtn.addEventListener('mouseleave', () => {
                confirmBtn.style.background = 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)';
                confirmBtn.style.transform = 'translateY(0)';
                confirmBtn.style.boxShadow = '0 0 0px rgba(236, 72, 153, 0)';
            });
            
            cancelBtn.addEventListener('click', () => {
                modal.remove();
            });
            
            confirmBtn.addEventListener('click', async () => {
                const response = await AuthAPI.deleteDownload(downloadId);
                if (response.success) {
                    showNotification('Download deletado com sucesso!', 'success');
                    modal.remove();
                    loadDownloads();
                } else {
                    showNotification(response.message || 'Erro ao deletar download', 'error');
                    modal.remove();
                }
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        });
    });

    // Adicionar event listeners para editar
    document.querySelectorAll('.btn-edit-download').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            const downloadId = e.currentTarget.dataset.id;
            const download = allDownloads.find(d => d.id == downloadId);
            if (download) {
                showEditDownloadForm(download);
            }
        });
        
        // Efeito de hover para bot�o de editar
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)';
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 5px 15px rgba(236, 72, 153, 0.5)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'linear-gradient(135deg, #6B46C1 0%, #8B5CF6 100%)';
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 0 10px rgba(236, 72, 153, 0.3)';
        });
    });
    
    // Adicionar efeito de hover para bot�o de excluir
    document.querySelectorAll('.btn-delete-download').forEach(btn => {
        btn.addEventListener('mouseenter', () => {
            btn.style.background = 'linear-gradient(135deg, #DB2777 0%, #EC4899 100%)';
            btn.style.transform = 'translateY(-2px)';
            btn.style.boxShadow = '0 5px 15px rgba(236, 72, 153, 0.5)';
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.background = 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)';
            btn.style.transform = 'translateY(0)';
            btn.style.boxShadow = '0 0 10px rgba(236, 72, 153, 0.3)';
        });
    });

    attachInteractiveCardEffects(grid);
}

// Mostrar formul�rio de coment�rios
async function showCommentForm(downloadId) {
    // Carregar coment�rios existentes
    const commentsResponse = await AuthAPI.getDownloadComments(downloadId);
    const comments = commentsResponse.success ? commentsResponse.comments : [];
    
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        overflow-y: auto;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #6B46C1;
        border-radius: 12px;
        padding: 24px;
        width: min(92vw, 760px);
        max-width: 760px;
        max-height: 88vh;
        overflow-y: auto;
        color: white;
        margin: 16px;
    `;
    
    let commentsHTML = '';
    if (comments.length > 0) {
        commentsHTML = comments.map((comment, index) => `
            <div style="background: linear-gradient(135deg, rgba(107, 70, 193, 0.1) 0%, rgba(236, 72, 153, 0.05) 100%); padding: 15px; border-radius: 8px; margin-bottom: 12px; border: 2px solid #6B46C1; border-left: 5px solid #EC4899;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
                    <div style="flex: 1;">
                        <strong style="color: #EC4899; font-size: 14px;">@${comment.nickname}</strong>
                        <p style="margin: 4px 0 0 0; color: #999; font-size: 11px;">Comentario ${index + 1}</p>
                    </div>
                    <span style="font-size: 11px; color: #999; background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 4px;">${new Date(comment.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                <p style="margin: 0 0 10px 0; color: #ddd; font-size: 13px; line-height: 1.5;">${comment.content}</p>
                <button class="btn-reply-comment" data-comment-id="${comment.id}" data-user-nickname="@${comment.nickname}" style="background: linear-gradient(135deg, #6B46C1 0%, #8B5CF6 100%); color: white; border: 1px solid #EC4899; padding: 5px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 600; transition: all 0.3s;">Responder</button>
            </div>
        `).join('');
    } else {
        commentsHTML = `
            <div style="display: flex; align-items: center; justify-content: center; min-height: 120px; border: 1px dashed rgba(107, 70, 193, 0.55); border-radius: 8px;">
                <p style="color: #999; text-align: center; padding: 20px; margin: 0;">Nenhum coment�rio ainda. Seja o primeiro a comentar!</p>
            </div>
        `;
    }
    
    content.innerHTML = `
        <div style="text-align: center;">
            <h3 style="color: #EC4899; margin: 0 0 10px 0; font-size: 22px; font-weight: 700;">Comentarios</h3>
            <p style="color: #999; margin: 0 0 20px 0; font-size: 12px;">${comments.length} coment�rio(s)</p>
        </div>
        
        <div style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 100%); padding: 15px; border-radius: 8px; min-height: 160px; max-height: 36vh; overflow-y: auto; margin-bottom: 20px; border: 1px solid #6B46C1;">
            ${commentsHTML}
        </div>
        
        <div id="replySection" style="display: none; background: linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(107, 70, 193, 0.1) 100%); padding: 12px; border-radius: 6px; margin-bottom: 15px; border: 2px solid #EC4899;">
            <p style="margin: 0 0 10px 0; color: #EC4899; font-size: 12px; font-weight: 600;">Respondendo para: <span id="replyUserName"></span></p>
            <textarea id="replyContent" placeholder="Digite sua resposta..." style="width: 100%; padding: 10px; background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 100%); border: 2px solid #EC4899; border-radius: 6px; color: white; font-family: inherit; height: 80px; resize: vertical; font-size: 13px;" maxlength="500"></textarea>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                <span style="font-size: 11px; color: #999;" id="replyCharCount">0/500</span>
                <div style="display: flex; gap: 8px;">
                    <button id="cancelReply" style="background: linear-gradient(135deg, #6B46C1 0%, #8B5CF6 100%); color: white; border: 1px solid #EC4899; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 600;">Cancelar</button>
                    <button id="submitReply" style="background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); color: white; border: 1px solid #EC4899; padding: 6px 12px; border-radius: 4px; font-size: 11px; cursor: pointer; font-weight: 600;">Responder</button>
                </div>
            </div>
        </div>
        
        <form id="commentForm" style="display: flex; flex-direction: column; gap: 10px; margin-top: 15px; padding-top: 15px; border-top: 2px solid #6B46C1;">
            <div>
                <label style="color: #EC4899; font-size: 12px; font-weight: 600; display: block; margin-bottom: 8px;">Adicione seu comentario:</label>
                <textarea id="commentContent" placeholder="Digite seu coment�rio aqui..." style="width: 100%; padding: 12px; background: linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, rgba(0, 0, 0, 0.2) 100%); border: 2px solid #6B46C1; border-radius: 6px; color: white; font-family: inherit; height: 100px; resize: vertical; font-size: 13px;" maxlength="500"></textarea>
            </div>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; color: #999;" id="charCount">0/500</span>
                <div style="display: flex; gap: 10px; align-items: center;">
                    <button type="submit" style="padding: 10px 20px; background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); color: white; border: 1px solid #EC4899; border-radius: 5px; cursor: pointer; font-weight: 600; transition: all 0.3s; box-shadow: 0 0 10px rgba(236, 72, 153, 0.3);">Enviar Coment�rio</button>
                    <button id="closeComments" type="button" style="padding: 10px 20px; background: linear-gradient(135deg, #6B46C1 0%, #8B5CF6 100%); color: white; border: 1px solid #EC4899; border-radius: 5px; cursor: pointer; font-weight: 600; transition: all 0.3s; box-shadow: 0 0 10px rgba(236, 72, 153, 0.3);">Fechar</button>
                </div>
            </div>
        </form>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Atualizar contador de caracteres
    const textarea = document.getElementById('commentContent');
    const charCount = document.getElementById('charCount');
    textarea.addEventListener('input', () => {
        charCount.textContent = `${textarea.value.length}/500`;
    });
    
    // Enviar coment�rio
    document.getElementById('commentForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = textarea.value.trim();
        
        if (!content) {
            showNotification('Coment�rio n�o pode estar vazio', 'error');
            return;
        }
        
        const response = await AuthAPI.addDownloadComment(downloadId, content);
        if (response.success) {
            showNotification('Coment�rio adicionado com sucesso!', 'success');
            // Recarregar downloads para atualizar contador de coment�rios
            await loadDownloads();
            modal.remove();
        } else {
            showNotification(response.message || 'Erro ao adicionar coment�rio', 'error');
        }
    });
    
    // Fechar
    document.getElementById('closeComments').addEventListener('click', () => {
        modal.remove();
    });
    
    // Event listeners para bot�es de responder
    document.querySelectorAll('.btn-reply-comment').forEach(btn => {
        btn.addEventListener('click', () => {
            const replySection = document.getElementById('replySection');
            const replyUserName = document.getElementById('replyUserName');
            const replyContent = document.getElementById('replyContent');
            
            replyUserName.textContent = btn.dataset.userNickname;
            replyContent.value = '';
            document.getElementById('replyCharCount').textContent = '0/500';
            replySection.style.display = 'block';
            replyContent.focus();
        });
    });
    
    // Contador de caracteres da resposta
    const replyContent = document.getElementById('replyContent');
    const replyCharCount = document.getElementById('replyCharCount');
    if (replyContent) {
        replyContent.addEventListener('input', () => {
            replyCharCount.textContent = `${replyContent.value.length}/500`;
        });
    }
    
    // Cancelar resposta
    document.getElementById('cancelReply').addEventListener('click', () => {
        document.getElementById('replySection').style.display = 'none';
        replyContent.value = '';
        replyCharCount.textContent = '0/500';
    });
    
    // Enviar resposta
    document.getElementById('submitReply').addEventListener('click', async () => {
        const content = replyContent.value.trim();
        const replyTo = (document.getElementById('replyUserName')?.textContent || '').trim();
        
        if (!content) {
            showNotification('Resposta n�o pode estar vazia', 'error');
            return;
        }
        
        const finalContent = replyTo ? `${replyTo} ${content}` : content;
        const response = await AuthAPI.addDownloadComment(downloadId, finalContent);
        if (response.success) {
            showNotification('Resposta adicionada com sucesso!', 'success');
            await loadDownloads();
            modal.remove();
        } else {
            showNotification(response.message || 'Erro ao adicionar resposta', 'error');
        }
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// Mostrar formul�rio de editar download
function showEditDownloadForm(download) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10001;
        overflow-y: auto;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
        border: 2px solid #6B46C1;
        border-radius: 12px;
        padding: 30px;
        max-width: 500px;
        color: white;
        margin: 20px;
    `;
    
    content.innerHTML = `
        <h3 style="color: #EC4899; margin-bottom: 20px; font-size: 20px;">Editar Download</h3>
        <form id="editDownloadForm" style="display: flex; flex-direction: column; gap: 15px;">
            <div>
                <label style="color: #EC4899; font-size: 12px; display: block; margin-bottom: 5px;">Nome do Programa</label>
                <input type="text" id="editDownloadName" style="width: 100%; box-sizing: border-box; padding: 10px; background: rgba(0, 0, 0, 0.3); border: 1px solid #EC4899; border-radius: 5px; color: white;">
            </div>
            <div>
                <label style="color: #EC4899; font-size: 12px; display: block; margin-bottom: 5px;">Descri��o</label>
                <textarea id="editDownloadDescription" style="width: 100%; box-sizing: border-box; padding: 10px; background: rgba(0, 0, 0, 0.3); border: 1px solid #EC4899; border-radius: 5px; color: white; font-family: inherit; height: 100px; resize: vertical;"></textarea>
            </div>
            <div>
                <label style="color: #EC4899; font-size: 12px; display: block; margin-bottom: 8px;">Links do Download</label>
                <div id="editLinksContainer" style="display: flex; flex-direction: column; gap: 10px;"></div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px;">
                    <small style="color: #A78BFA;">M�ximo de ${MAX_DOWNLOAD_LINKS} links</small>
                    <button id="editBtnAddLink" type="button" style="padding: 7px 12px; background: #6B46C1; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">+ Link</button>
                </div>
            </div>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                <button id="cancelEdit" type="button" style="padding: 10px 20px; background: #666; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">Cancelar</button>
                <button id="saveEdit" type="submit" style="padding: 10px 20px; background: #6B46C1; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">Salvar</button>
            </div>
        </form>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    const editDownloadName = document.getElementById('editDownloadName');
    const editDownloadDescription = document.getElementById('editDownloadDescription');
    const editLinksContainer = document.getElementById('editLinksContainer');
    const editBtnAddLink = document.getElementById('editBtnAddLink');

    if (editDownloadName) editDownloadName.value = download.name || '';
    if (editDownloadDescription) editDownloadDescription.value = download.description || '';

    const buildEditLinkRow = (linkData = { url: '', format: 'auto' }) => {
        const row = document.createElement('div');
        row.className = 'edit-download-link-row';
        row.style.cssText = 'display: flex; gap: 10px; align-items: flex-end;';
        row.innerHTML = `
            <div style="flex: 1;">
                <input type="url" class="editDownloadLinkInput" placeholder="https://..." style="width: 100%; box-sizing: border-box; padding: 10px; background: rgba(0, 0, 0, 0.3); border: 1px solid #EC4899; border-radius: 5px; color: white;">
            </div>
            <div style="width: 180px;">
                <select class="editDownloadLinkFormat" style="width: 100%; box-sizing: border-box; padding: 10px; background: rgba(0, 0, 0, 0.3); border: 1px solid #EC4899; border-radius: 5px; color: white;">
                    ${getFormatOptionsHtml(linkData.format || 'auto')}
                </select>
            </div>
            <button type="button" class="btnRemoveEditLink" style="padding: 8px 12px; background: #EF4444; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">- Link</button>
        `;
        row.querySelector('.editDownloadLinkInput').value = linkData.url || '';
        return row;
    };

    const syncEditLinksState = () => {
        const rows = Array.from(editLinksContainer.querySelectorAll('.edit-download-link-row'));
        const maxReached = rows.length >= MAX_DOWNLOAD_LINKS;
        if (editBtnAddLink) {
            editBtnAddLink.disabled = maxReached;
            editBtnAddLink.style.opacity = maxReached ? '0.65' : '1';
            editBtnAddLink.style.cursor = maxReached ? 'not-allowed' : 'pointer';
        }
        rows.forEach((row) => {
            const removeBtn = row.querySelector('.btnRemoveEditLink');
            if (!removeBtn) return;
            const canRemove = rows.length > 1;
            removeBtn.disabled = !canRemove;
            removeBtn.style.opacity = canRemove ? '1' : '0.45';
            removeBtn.style.cursor = canRemove ? 'pointer' : 'not-allowed';
        });
    };

    const appendEditLinkRow = (linkData = { url: '', format: 'auto' }) => {
        const row = buildEditLinkRow(linkData);
        row.querySelector('.btnRemoveEditLink')?.addEventListener('click', () => {
            row.remove();
            syncEditLinksState();
        });
        editLinksContainer.appendChild(row);
        syncEditLinksState();
    };

    const existingLinks = parseDownloadLinks(download);
    if (existingLinks.length === 0) {
        appendEditLinkRow({ url: String(download.link || '').trim(), format: 'auto' });
    } else {
        existingLinks.forEach(linkItem => appendEditLinkRow(linkItem));
    }

    editBtnAddLink?.addEventListener('click', () => {
        const rowCount = editLinksContainer.querySelectorAll('.edit-download-link-row').length;
        if (rowCount >= MAX_DOWNLOAD_LINKS) {
            showNotification(`M�ximo de ${MAX_DOWNLOAD_LINKS} links por postagem`, 'error');
            syncEditLinksState();
            return;
        }
        appendEditLinkRow({ url: '', format: 'auto' });
    });

    document.getElementById('cancelEdit').addEventListener('click', () => {
        modal.remove();
    });
    
    document.getElementById('editDownloadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('editDownloadName').value.trim();
        const description = document.getElementById('editDownloadDescription').value;
        const links = Array.from(document.querySelectorAll('#editLinksContainer .edit-download-link-row'))
            .map((row) => {
                const url = String(row.querySelector('.editDownloadLinkInput')?.value || '').trim();
                const format = normalizeDownloadLinkFormat(row.querySelector('.editDownloadLinkFormat')?.value || 'auto');
                if (!url) return null;
                return { url, format };
            })
            .filter(Boolean);
        
        if (!name || links.length === 0) {
            showNotification('Nome e pelo menos um link s�o obrigat�rios', 'error');
            return;
        }
        
        if (links.length > MAX_DOWNLOAD_LINKS) {
            showNotification(`M�ximo de ${MAX_DOWNLOAD_LINKS} links permitidos`, 'error');
            return;
        }

        const response = await AuthAPI.updateDownload(download.id, { name, description, links });
        if (response.success) {
            showNotification('Download atualizado com sucesso!', 'success');
            modal.remove();
            loadDownloads();
        } else {
            showNotification(response.message || 'Erro ao atualizar download', 'error');
        }
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

function updateAddLinkButtonState() {
    const container = document.getElementById('linksContainer');
    const addLinkBtn = document.getElementById('btnAddLink');
    if (!container || !addLinkBtn) return;

    const linkCount = container.querySelectorAll('.download-link-row').length;
    const maxReached = linkCount >= MAX_DOWNLOAD_LINKS;

    addLinkBtn.disabled = maxReached;
    addLinkBtn.style.opacity = maxReached ? '0.65' : '1';
    addLinkBtn.style.cursor = maxReached ? 'not-allowed' : 'pointer';
    addLinkBtn.title = maxReached ? `M�ximo de ${MAX_DOWNLOAD_LINKS} links por postagem` : '';
}

// Adicionar bot�o de adicionar link
document.getElementById('btnAddLink')?.addEventListener('click', (e) => {
    e.preventDefault();
    const container = document.getElementById('linksContainer');
    if (!container) return;

    const linkCount = container.querySelectorAll('.download-link-row').length;
    if (linkCount >= MAX_DOWNLOAD_LINKS) {
        showNotification(`M�ximo de ${MAX_DOWNLOAD_LINKS} links por postagem`, 'error');
        updateAddLinkButtonState();
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = buildPostLinkRowHtml(true).trim();
    const appendedRow = wrapper.firstElementChild;
    if (!appendedRow) return;
    container.appendChild(appendedRow);

    // Evento para remover link
    appendedRow.querySelector('.btnRemoveLink')?.addEventListener('click', (event) => {
        event.preventDefault();
        appendedRow.remove();
        updateAddLinkButtonState();
    });

    updateAddLinkButtonState();
});

// Fechar mini perfil
document.getElementById('closeMiniProfileModal')?.addEventListener('click', () => {
    document.getElementById('miniProfileModal').style.display = 'none';
});

// Mostrar mensagem de erro no modal
function showErrorMessage(message) {
    const errorDiv = document.getElementById('postErrorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
}

// Mostrar notifica��o toast
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        background: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// Event listeners para busca e ordena��o
document.getElementById('searchInput')?.addEventListener('keyup', filterAndRender);
document.getElementById('sortSelect')?.addEventListener('change', filterAndRender);

// Inicializar p�gina
// Enviar novo download
async function submitDownload() {
    const name = document.getElementById('downloadName').value.trim();
    const description = document.getElementById('downloadDesc').value;
    const links = getPostLinksPayload();
    const errorDiv = document.getElementById('postErrorMessage');

    if (errorDiv) errorDiv.style.display = 'none';

    if (!name || links.length === 0) {
        errorDiv.textContent = 'Nome e pelo menos um link s�o obrigat�rios!';
        errorDiv.style.display = 'block';
        return;
    }

    if (links.length > MAX_DOWNLOAD_LINKS) {
        errorDiv.textContent = `M�ximo de ${MAX_DOWNLOAD_LINKS} links permitidos!`;
        errorDiv.style.display = 'block';
        return;
    }

    try {
        const response = await AuthAPI.createDownload(name, description, links);

        if (response.success) {
            showNotification('Download postado com sucesso!', 'success');
            if (Array.isArray(response.gainedPostAchievementRanks) && response.gainedPostAchievementRanks.length > 0) {
                const names = response.gainedPostAchievementRanks.map(rank => rank.name).join(', ');
                showNotification(`Novo conquista conquistado: ${names}. V� no perfil e marque para exibir.`, 'info');
            }
            
            // Limpar formul�rio
            document.getElementById('postDownloadForm').reset();
            closePostDownloadModal();
            resetPostLinksUi();
            updateAddLinkButtonState();
            
            // Recarregar downloads
            await loadDownloads();
        } else {
            errorDiv.textContent = response.message || 'Erro ao postar download';
            errorDiv.style.display = 'block';
        }
    } catch (error) {
        console.error('Erro ao postar download:', error);
        errorDiv.textContent = 'Erro ao conectar ao servidor';
        errorDiv.style.display = 'block';
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    setupFormatHelpTooltip();
    await loadCurrentUser();
    syncPostButtonAvailability();
    await loadDownloads();
    handleNotificationDeepLink();
    updateAddLinkButtonState();

    const postButton = document.getElementById('btnPostDownload');
    const closePostFormButton = document.getElementById('closeBtnPostForm');
    const postModal = document.getElementById('postDownloadModal');

    postButton?.addEventListener('click', () => {
        openPostDownloadModal();
    });

    closePostFormButton?.addEventListener('click', () => {
        closePostDownloadModal();
    });

    postModal?.addEventListener('click', (e) => {
        if (e.target === postModal) {
            closePostDownloadModal();
        }
    });
    
    // Configurar formul�rio de postagem
    const postDownloadForm = document.getElementById('postDownloadForm');
    if (postDownloadForm) {
        postDownloadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await submitDownload();
        });
    }
    
    // Atualizacao de notificacoes feita globalmente no auth-manager.js
});

// Fallback antigo: formulario inline (mantido apenas para referencia)
function showCommentInlineForm(downloadId) {
    const card = document.querySelector(`.download-card[data-id="${downloadId}"]`);
    if (!card) return;
    
    // Verificar se j� existe um formul�rio aberto
    let commentForm = card.querySelector('.comment-form-inline');
    if (commentForm) {
        commentForm.remove();
        return;
    }
    
    // Criar e inserir formul�rio inline
    const formHTML = `
        <div class="comment-form-inline" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #333;">
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                <textarea id="commentInput-${downloadId}" placeholder="Digite seu coment�rio..." maxlength="500" style="flex: 1; padding: 10px; border: 1px solid #6B46C1; border-radius: 5px; background: rgba(0,0,0,0.3); color: white; font-family: inherit; resize: vertical; min-height: 60px;"></textarea>
            </div>
            <div style="display: flex; gap: 10px; justify-content: flex-end;">
                <button class="btn-cancel-comment" data-id="${downloadId}" style="padding: 8px 16px; border: 1px solid #666; border-radius: 5px; background: transparent; color: #999; cursor: pointer; font-weight: 600;">Cancelar</button>
                <button class="btn-submit-comment" data-id="${downloadId}" style="padding: 8px 16px; background: linear-gradient(135deg, #EC4899, #6B46C1); border: none; border-radius: 5px; color: white; cursor: pointer; font-weight: 600;">Comentar</button>
            </div>
        </div>
    `;
    
    // Inserir depois das rea��es
    const reactionsDiv = card.querySelector('.download-reactions');
    if (reactionsDiv) {
        reactionsDiv.insertAdjacentHTML('afterend', formHTML);
        
        // Adicionar eventos
        const submitBtn = card.querySelector('.btn-submit-comment');
        const cancelBtn = card.querySelector('.btn-cancel-comment');
        
        if (submitBtn) {
            submitBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                const textarea = card.querySelector(`#commentInput-${downloadId}`);
                const content = textarea.value.trim();
                
                if (content.length === 0) {
                    showNotification('Coment�rio n�o pode estar vazio', 'error');
                    return;
                }
                
                if (content.length > 500) {
                    showNotification('Coment�rio muito longo (m�ximo 500 caracteres)', 'error');
                    return;
                }
                
                await submitInlineComment(downloadId, content);
                card.querySelector('.comment-form-inline').remove();
                // Atualizar contagem de coment�rios
                await loadDownloads();
            });
        }
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                card.querySelector('.comment-form-inline').remove();
            });
        }
        
        // Focus na textarea
        const textarea = card.querySelector(`#commentInput-${downloadId}`);
        if (textarea) {
            setTimeout(() => textarea.focus(), 0);
        }
    }
}

// Enviar comentario inline (fallback antigo)
async function submitInlineComment(downloadId, content) {
    const response = await AuthAPI.addDownloadComment(downloadId, content);
    
    if (response.success) {
        showNotification('Coment�rio adicionado com sucesso!', 'success');
        // Recarregar a p�gina de downloads para atualizar contadores
        await loadDownloads();
    } else {
        showNotification(response.message || 'Erro ao adicionar coment�rio', 'error');
    }
}

// Mostrar mini perfil do usu�rio
async function showUserMiniProfile(userId) {
    try {
        // Buscar informa��es do usu�rio
        const response = await AuthAPI.getUserMiniProfile(userId);
        
        if (!response.success || !response.profile) {
            showNotification('Erro ao carregar perfil do usu�rio', 'error');
            return;
        }

        const profile = response.profile;
        
        // Criar modal com perfil
        const modal = document.createElement('div');
        modal.id = 'miniProfileModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;
        
        const content = document.createElement('div');
        const canUseAnimatedProfile = Boolean(profile.canUseAnimatedProfile) && Boolean(profile.animatedMiniProfileEnabled ?? profile.animatedProfileEnabled);
        const miniCardConfig = canUseAnimatedProfile
            ? buildAnimatedCardConfig(
                `mini-${userId || 0}`,
                profile.animatedProfileTheme,
                profile.animatedProfileVisualMode,
                profile.animatedProfileGifUrl
            )
            : { className: '', inlineStyle: '' };
        content.className = `mini-profile-card${miniCardConfig.className ? ` ${miniCardConfig.className}` : ''}`;
        if (miniCardConfig.inlineStyle) {
            content.style.cssText = miniCardConfig.inlineStyle;
        }
        
        const miniRanks = [];
        const addMiniRank = (rank) => {
            if (!rank || !rank.name) return;
            const key = String(rank.name).trim().toLowerCase();
            if (!key) return;
            if (miniRanks.some(item => String(item.name).trim().toLowerCase() === key)) return;
            miniRanks.push(rank);
        };

        // Ordem oficial do perfil (mesma do perfil principal)
        if (Array.isArray(profile.displayRanks) && profile.displayRanks.length > 0) {
            profile.displayRanks.forEach(addMiniRank);
        } else {
            // Fallback de compatibilidade para dados antigos
            if (profile.currentRank) {
                addMiniRank(profile.currentRank);
            }
            if (Array.isArray(profile.selectedRanks) && profile.selectedRanks.length > 0) {
                profile.selectedRanks.forEach(addMiniRank);
            }
            if (profile.autoRank) {
                addMiniRank(profile.autoRank);
            }
        }

        const ranksHTML = miniRanks.length > 0
            ? `
                <div style="display: flex; gap: 10px; margin-bottom: 15px; flex-wrap: wrap; justify-content: center;">
                    ${miniRanks.map(rank => `
                        <div style="background: ${(rank.color || '#6B46C1')}20; color: ${rank.color || '#6B46C1'}; padding: 8px 12px; border-radius: 5px; border: 1px solid ${(rank.color || '#6B46C1')}40; font-weight: 600;">
                            ${rank.name}
                        </div>
                    `).join('')}
                </div>
            `
            : '<p style="margin: 10px 0 15px; font-size: 12px; color: #999;">Sem conquista</p>';
        
        content.innerHTML = `
            <div style="text-align: center;">
                <img src="${resolveMediaUrl(profile.avatar, '/imagens/login.png')}" alt="${profile.nickname}" style="width: 80px; height: 80px; border-radius: 50%; margin-bottom: 15px; border: 3px solid #EC4899;">
                <h3 style="margin: 10px 0; color: #EC4899;">@${profile.nickname}</h3>
                <p style="margin: 5px 0; font-size: 14px; color: #ccc;">${profile.firstName} ${profile.lastName}</p>
                ${((profile.profileTagline || profile.currentRank?.description) ? `<p style="margin: 8px 0 10px; font-size: 13px; color: #F9A8D4; font-style: italic;">${profile.profileTagline || profile.currentRank?.description}</p>` : '')}
                
                ${profile.bio ? `<p style="margin: 10px 0; font-size: 13px; color: #aaa; font-style: italic;">"${profile.bio}"</p>` : ''}
                
                ${ranksHTML}
                
                ${profile.stats ? `
                    <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(236, 72, 153, 0.2);">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div style="background: rgba(236, 72, 153, 0.1); padding: 10px; border-radius: 5px;">
                                <div style="font-size: 18px; font-weight: bold; color: #EC4899;">${profile.stats.postCount || 0}</div>
                                <div style="font-size: 12px; color: #999;">Postagens</div>
                            </div>
                            <div style="background: rgba(107, 70, 193, 0.1); padding: 10px; border-radius: 5px;">
                                <div style="font-size: 18px; font-weight: bold; color: #6B46C1;">${profile.stats.totalLikes || 0}</div>
                                <div style="font-size: 12px; color: #999;">Likes</div>
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                <button class="mini-profile-close-btn" onclick="document.getElementById('miniProfileModal').remove();">Fechar</button>
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        attachInteractiveCardEffects(modal);
        
        // Fechar ao clicar no fundo
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    } catch (error) {
        console.error('Erro ao carregar perfil:', error);
        showNotification('Erro ao carregar perfil do usu�rio', 'error');
    }
}

// Fechar modais ao clicar fora
document.addEventListener('click', (e) => {
    const postModal = document.getElementById('postDownloadModal');
    const miniModal = document.getElementById('miniProfileModal');

    if (e.target === postModal) {
        closePostDownloadModal();
    }

    if (e.target === miniModal) {
        miniModal.style.display = 'none';
    }
});




