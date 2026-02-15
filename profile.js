// Script para página de PROFILE

let currentUser = null;
let currentRank = null;
let currentRankComplete = null;
let currentCustomRanks = [];
let currentUserPostCount = 0;
let currentUserLikeCount = 0;
let isRankOrderMode = false;
let canOrderFixedRanks = false;
let notificationTimeout = null;
let selectedProfileRankIds = [];
const MAX_SELECTED_PROFILE_RANKS = 3;
let isApplyingNotificationSettings = false;
let isSavingNotificationSettings = false;
let previousAllNotificationsToggleState = false;
const POST_ACHIEVEMENT_RANKS = [
    { minPosts: 5, name: 'Autor de Bronze', color: '#60A5FA' },
    { minPosts: 10, name: 'Autor de Prata', color: '#93C5FD' },
    { minPosts: 15, name: 'Autor de Ouro', color: '#FBBF24' },
    { minPosts: 20, name: 'Autor de Platina', color: '#A78BFA' },
    { minPosts: 25, name: 'Autor Diamante', color: '#22D3EE' },
    { minPosts: 30, name: 'Autor Elite', color: '#34D399' },
    { minPosts: 35, name: 'Autor Supremo', color: '#F472B6' },
    { minPosts: 40, name: 'Autor Lendario', color: '#FB7185' },
    { minPosts: 45, name: 'Autor Mitico', color: '#C084FC' },
    { minPosts: 50, name: 'Autor Imortal', color: '#F59E0B' }
];
const LIKE_ACHIEVEMENT_RANKS = [
    { minLikes: 3, name: 'Reacao Inicial', color: '#38BDF8' },
    { minLikes: 5, name: 'Apreciado', color: '#60A5FA' },
    { minLikes: 8, name: 'Bem Curtido', color: '#818CF8' },
    { minLikes: 11, name: 'Em Alta', color: '#A78BFA' },
    { minLikes: 14, name: 'Popular', color: '#C084FC' },
    { minLikes: 17, name: 'Destaque', color: '#E879F9' },
    { minLikes: 20, name: 'Queridinho', color: '#F472B6' },
    { minLikes: 24, name: 'Influente', color: '#FB7185' },
    { minLikes: 28, name: 'Em Evidencia', color: '#F97316' },
    { minLikes: 32, name: 'Notavel', color: '#FB923C' },
    { minLikes: 36, name: 'Famoso', color: '#F59E0B' },
    { minLikes: 40, name: 'Viral', color: '#FACC15' },
    { minLikes: 45, name: 'Icone da Comunidade', color: '#A3E635' },
    { minLikes: 50, name: 'Fenomeno', color: '#4ADE80' },
    { minLikes: 60, name: 'Estrela da Guilda', color: '#22D3EE' },
    { minLikes: 70, name: 'Lenda dos Likes', color: '#06B6D4' },
    { minLikes: 80, name: 'Dominio Social', color: '#14B8A6' },
    { minLikes: 90, name: 'Aura Magnetica', color: '#10B981' },
    { minLikes: 95, name: 'Supremo dos Likes', color: '#84CC16' },
    { minLikes: 100, name: 'Soberano dos Likes', color: '#EAB308' }
];
const PROFILE_TAGLINE_SUGGESTIONS = [
    'Vivendo um dia de cada vez',
    'Energia boa atrai coisa boa',
    'Menos drama mais café',
    'Sorriso é meu cartão de visita',
    'Sonhador(a) em tempo integral',
    'Simplicidade é meu luxo favorito',
    'Sempre em busca de novas histórias',
    'Paz na alma brilho no olhar',
    'O mundo é grande demais para ficar parado',
    'Gratidão é meu estilo de vida',
    'Criando memórias não desculpas',
    'Quem tem luz própria não precisa de holofote',
    'Amante de pequenos detalhes',
    'Errando aprendendo evoluindo',
    'Liberdade é meu combustível',
    'Risadas são meu idioma favorito',
    'Colecionando momentos não coisas',
    'A vida é curta demais para não ser intensa',
    'Sempre pronto(a) para a próxima aventura',
    'Autenticidade acima de tudo'
];

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

function withCacheBuster(url) {
    if (!url) return '';
    return `${url}${url.includes('?') ? '&' : '?'}t=${Date.now()}`;
}

function normalizeRankOrderKey(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return `n:${value}`;
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return '';

        // Já está normalizado
        if (trimmed.startsWith('n:')) {
            const id = Number(trimmed.slice(2));
            return Number.isFinite(id) ? `n:${id}` : '';
        }
        if (trimmed.startsWith('s:')) {
            const key = trimmed.slice(2).trim();
            return key ? `s:${key}` : '';
        }

        const asNumber = Number(trimmed);
        if (Number.isFinite(asNumber)) {
            return `n:${asNumber}`;
        }

        return `s:${trimmed}`;
    }

    const asNumber = Number(value);
    if (Number.isFinite(asNumber)) {
        return `n:${asNumber}`;
    }

    return '';
}

function rankOrderKeyToPayload(key) {
    if (!key) return null;
    if (key.startsWith('n:')) {
        const id = Number(key.slice(2));
        return Number.isFinite(id) ? id : null;
    }
    if (key.startsWith('s:')) {
        const value = key.slice(2);
        return value ? value : null;
    }
    return null;
}

function rankOrderKeyToNumericId(key) {
    if (!key || !key.startsWith('n:')) return null;
    const id = Number(key.slice(2));
    return Number.isFinite(id) ? id : null;
}

function getDisplayedRankOrderPayload() {
    const badges = Array.from(document.querySelectorAll('#selectedAchievementsDisplay .selected-conquista-badge'));
    if (badges.length === 0) return [];

    return badges
        .map((badge) => normalizeRankOrderKey(badge.dataset.rankId))
        .filter(Boolean)
        .map((key) => rankOrderKeyToPayload(key))
        .filter((value) => value !== null);
}

function getRankOrderKeyFromRank(rank) {
    return normalizeRankOrderKey(rank?.id);
}

function isFixedRankEntry(rank) {
    const rankId = String(rank?.id || '');
    return Boolean(rank?.isFixed) || Number(rank?.isVisible) === 0 || rankId.startsWith('fixed:');
}

function getFixedRankNameKey(rank) {
    if (!isFixedRankEntry(rank)) return '';
    const name = String(rank?.name || '').trim().toLowerCase();
    return name ? `fixed-name:${name}` : '';
}

function syncUnifiedRankStripMode(enabled) {
    const rankBadge = document.getElementById('rankBadge');
    const autoRanks = document.getElementById('automaticRanksInline');
    const customRanks = document.getElementById('customRanksInline');

    if (rankBadge) {
        rankBadge.style.display = enabled ? 'none' : '';
    }
    if (autoRanks) {
        autoRanks.style.display = enabled ? 'none' : '';
    }
    if (customRanks) {
        customRanks.style.display = enabled ? 'none' : '';
    }
}

function getEffectiveProfileTagline() {
    const customTagline = String(currentUser?.profileTagline || '').trim();
    return customTagline;
}

function syncEmailToggleButton() {
    const emailDisplay = document.getElementById('profileEmail');
    const toggleEmailBtn = document.getElementById('toggleEmailBtn');
    if (!emailDisplay || !toggleEmailBtn) return;

    const isHidden = emailDisplay.getAttribute('data-hidden') === 'true';
    toggleEmailBtn.textContent = isHidden ? 'Mostrar' : 'Ocultar';
}

// Sistema de notificação customizada
function showNotification(message, type = 'success') {
    const toast = document.getElementById('notificationToast');
    
    // Remover classe de hide se existir
    toast.classList.remove('hide');
    
    // Definir tipo e mensagem
    toast.className = type;
    toast.textContent = message;
    
    // Mostrar
    toast.style.display = 'block';
    
    // Limpar timeout anterior
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
    }
    
    // Esconder após 4 segundos
    notificationTimeout = setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => {
            toast.style.display = 'none';
        }, 300);
    }, 4000);
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Profile DOMContentLoaded fired');
    
    const token = AuthAPI.getToken();
    console.log('Token found:', token ? 'YES (length: ' + token.length + ')' : 'NO');
    
    if (!token) {
        window.location.href = 'login.html?message=' + encodeURIComponent('Faça login para acessar seu perfil');
        return;
    } else {
        console.log('Token exists, loading profile directly...');
        loadProfile();
    }
});

// Carregar perfil
async function loadProfile() {
    console.log('[PROFILE] Starting loadProfile...');
    
    try {
        console.log('[PROFILE] Calling AuthAPI.getProfile()...');
        const result = await AuthAPI.getProfile();
        console.log('[PROFILE] Profile response received:', result);

        if (!result.success || !result.user) {
            const shouldForceLogin = result?.banned || /token|autorizado|autenticado|login|sess[aã]o/i.test(String(result?.message || ''));
            if (shouldForceLogin) {
                AuthAPI.removeToken();
                window.location.href = 'login.html?message=' + encodeURIComponent(result?.message || 'Sessão inválida. Faça login novamente.');
                return;
            }
            throw new Error(result.message || 'Failed to load profile');
        }

        currentUser = result.user;
        currentRank = result.rank;
        canOrderFixedRanks = Boolean(result?.user?.canOrderFixedRanks);
        console.log('[PROFILE] User loaded:', currentUser.firstName, currentUser.lastName);

        // Renderizar dados do usuário
        console.log('[PROFILE] Calling renderProfileData...');
        await renderProfileData(result);
        
        console.log('[PROFILE] About to show profileContent...');
        // Mostrar conteúdo IMEDIATAMENTE
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('profileContent').style.display = 'block';
        
        console.log('[PROFILE] profileContent is now visible');
        
        // Anexar event listeners DEPOIS que os dados são renderizados
        console.log('[PROFILE] Attaching event listeners...');
        attachEventListeners();
        
        // Carregar conquistas customizados SEM BLOQUEAR (fire and forget)
        // Isso permite que o perfil carregue rápido, depois os conquistas customizáveis carregam em background
        console.log('[PROFILE] Loading custom ranks (non-blocking)...');
        loadCustomRanks(currentUser.id).catch(err => {
            console.warn('[PROFILE] Custom ranks loading error (non-critical, ignored):', err.message);
        });

        // Verificar acesso a painel admin
        console.log('[PROFILE] Checking admin panel access...');
        checkAdminPanelAccess();
        
        console.log('[PROFILE] PROFILE LOADED SUCCESSFULLY!');
        
    } catch (error) {
        console.error('[PROFILE] Error loading profile:', error);
        showError('Error loading profile: ' + error.message);
    }
}

async function renderProfileData(result) {
    console.log('Rendering profile data...');
    
    try {
        currentRankComplete = result.rankComplete || null;

        // Dados básicos
        document.getElementById('profileUsername').textContent = currentUser.nickname || (currentUser.firstName + ' ' + currentUser.lastName);
        
        // Email
        const emailDisplay = document.getElementById('profileEmail');
        if (emailDisplay && currentUser.email) {
            emailDisplay.textContent = '*'.repeat(currentUser.email.length);
            emailDisplay.setAttribute('data-hidden', 'true');
            syncEmailToggleButton();
        }
        
        // Email verification
        const verificationBadge = document.getElementById('emailVerificationStatus');
        if (currentUser.emailVerified) {
            verificationBadge.innerHTML = '<img src="https://guildholiday.discloud.app/imagens/Verificado.png" alt="Verificado" style="width: 28px; height: 28px; cursor: pointer;" title="E-mail Verificado">';
            verificationBadge.className = 'verification-badge verified';
        } else {
            verificationBadge.textContent = 'Não Verificado';
            verificationBadge.className = 'verification-badge unverified';
        }
        
        // Bio (seção opcional)
        const profileBio = document.getElementById('profileBio');
        if (profileBio) {
            profileBio.textContent = currentUser.bio || 'Nenhuma bio configurada.';
        }
        document.getElementById('profileJoined').textContent = 'Membro desde: ' + formatDate(currentUser.createdAt);

        // Avatar
        if (currentUser.avatar) {
            document.getElementById('profileAvatar').style.backgroundImage = `url(${resolveMediaUrl(currentUser.avatar)})`;
        }

        // Banner
        if (currentUser.banner) {
            document.getElementById('profileBanner').style.backgroundImage = `url(${resolveMediaUrl(currentUser.banner)})`;
        }

        // Rank
        if (result.rankComplete && result.rankComplete.current) {
            const currentRankData = result.rankComplete.current;
            document.getElementById('rankName').textContent = currentRankData.name;
            document.querySelector('.rank-badge').style.borderColor = currentRankData.color;
            document.querySelector('.rank-badge span').style.color = currentRankData.color;
        }
        document.getElementById('rankDescription').textContent = getEffectiveProfileTagline();

        // Renderizar conquistas automáticos (se existirem e forem diferentes do conquista principal)
        if (result.rankComplete && result.rankComplete.automatic) {
            const autoRank = result.rankComplete.automatic;
            const currentRank = result.rankComplete.current;
            
            // Renderizar conquista automático se ele for diferente do conquista principal
            if (autoRank && autoRank.name !== currentRank.name) {
                const autoRanksContainer = document.getElementById('automaticRanksInline');
                if (autoRanksContainer) {
                    const rankBadge = document.createElement('div');
                    rankBadge.className = 'automatic-rank-badge';
                    rankBadge.style.color = autoRank.color;
                    rankBadge.style.borderColor = autoRank.color;
                    rankBadge.style.backgroundColor = `${autoRank.color}33`; // 20% opacity
                    rankBadge.textContent = autoRank.name;
                    autoRanksContainer.appendChild(rankBadge);
                    console.log('conquista automatico renderizado:', autoRank.name);
                }
            }
        }

        // Admin button
        if (currentUser.id === 1) {
            const adminBtn = document.getElementById('adminBtn');
            if (adminBtn) {
                adminBtn.style.display = 'block';
                adminBtn.addEventListener('click', () => {
                    window.location.href = 'admin.html';
                });
            }
        }

        // Inicializar currentCustomRanks como array vazio ANTES de renderizar histórico
        if (!currentCustomRanks) {
            currentCustomRanks = [];
        }

        // Rank history (renderizar com conquistas customizados vazios no início)
        const history = result.rankHistory || [];
        const rankProgress = result.rankProgress || {};
        renderRankHistory(history, rankProgress);
        
        // Form data
        const editProfileTagline = document.getElementById('editProfileTagline');
        if (editProfileTagline) {
            editProfileTagline.value = currentUser.profileTagline || '';
            updateTaglineCount();
        }
        
        console.log('Profile data rendered');
        
    } catch (err) {
        console.warn('Error rendering profile data (non-critical):', err.message);
    }
}

function renderRankHistory(history, rankProgress = {}) {
    const historyContainer = document.getElementById('ranksHistory');
    
    if (!historyContainer) {
        console.warn('ranksHistory container not found');
        return;
    }

    const ALL_RANKS = [
        { level: 1, name: 'Beta', minDays: 0, maxDays: 3, color: '#6B46C1', description: 'Bem-vindo! Você é um novo membro' },
        { level: 2, name: 'Alpha', minDays: 3, maxDays: 7, color: '#EC4899', description: 'Você está se adaptando à comunidade' },
        { level: 3, name: 'Initiate', minDays: 7, maxDays: 15, color: '#3B82F6', description: 'Iniciado nos mistérios da guild' },
        { level: 4, name: 'Apprentice', minDays: 15, maxDays: 30, color: '#06B6D4', description: 'Aprendiz dedicado' },
        { level: 5, name: 'Novice', minDays: 30, maxDays: 60, color: '#10B981', description: 'Novato em ascensão' },
        { level: 6, name: 'Adept', minDays: 60, maxDays: 90, color: '#8B5CF6', description: 'Mestre em aprendizado' },
        { level: 7, name: 'Expert', minDays: 90, maxDays: 120, color: '#F59E0B', description: 'Especialista da guild' },
        { level: 8, name: 'Master', minDays: 120, maxDays: 150, color: '#EF4444', description: 'Mestre guerreiro' },
        { level: 9, name: 'Grand Master', minDays: 150, maxDays: 180, color: '#DC2626', description: 'Grande Mestre' },
        { level: 10, name: 'Legendary', minDays: 180, maxDays: 220, color: '#FFD700', description: 'Lendário' },
        { level: 11, name: 'Mythic', minDays: 220, maxDays: 270, color: '#FF1493', description: 'Ser mítico' },
        { level: 12, name: 'Transcendent', minDays: 270, maxDays: 310, color: '#00CED1', description: 'Transcendente' },
        { level: 13, name: 'Eternal', minDays: 310, maxDays: 360, color: '#FFB6C1', description: 'Membro eterno' },
        { level: 14, name: 'Immortal', minDays: 360, maxDays: 99999, color: '#FF69B4', description: 'Imortal da guild' }
    ];

    const userCreatedDate = new Date(currentUser.createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - userCreatedDate);
    const userDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    console.log('DEBUG renderRankHistory:');
    console.log('  currentUser.createdAt:', currentUser.createdAt);
    console.log('  userDays calculated:', userDays);

    // conquistas automáticos
    const conquistasAutomaticas = ALL_RANKS.filter(rank => userDays >= rank.minDays && userDays < rank.maxDays);
    const conquistasPassadas = ALL_RANKS.filter(rank => userDays >= rank.maxDays);
    const disponiveis = ALL_RANKS.filter(rank => userDays < rank.minDays);
    
    console.log('  conquistasAutomaticas:', conquistasAutomaticas.map(r => r.name));
    console.log('  disponiveis:', disponiveis.map(r => r.name));
    
    // Função auxiliar para gerar URL da imagem
    function getImageUrl(rankName) {
        const baseFromApi = typeof API_URL === 'string'
            ? API_URL.replace(/\/api\/?$/i, '').replace(/\/+$/, '')
            : '';
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const fallbackBase = isLocalhost ? 'http://localhost:8080' : 'https://guildholiday.discloud.app';
        const imageBase = baseFromApi || fallbackBase;
        return `${imageBase}/imagens/${rankName}.png`;
    }

    // Função auxiliar para renderizar card com imagem de fundo
    function renderCard(rank, isCustom = false, status = 'available', userDays = 0, isVisible = true) {
        // status: 'available' = não conquistado, 'current' = conquista atual, 'created' = conta criada (Beta)
        let imageStyle = '';
        let imageUrl = getImageUrl(rank.name);
        const rankIdNumber = Number(rank?.id);
        const isSelectedForDisplay = Number.isFinite(rankIdNumber) && selectedProfileRankIds.includes(rankIdNumber);
        
        if (!isCustom) {
            imageStyle = `background-image: url('${imageUrl}'); background-size: contain; background-position: center; background-repeat: no-repeat; background-color: rgba(8, 12, 28, 0.9);`;
        } else {
            imageStyle = `background-image: url('${imageUrl}'); background-size: contain; background-position: center; background-repeat: no-repeat; background-color: rgba(8, 12, 28, 0.9);`;
        }

        const cardStyle = `border-color: ${rank.color}; ${imageStyle} position: relative;`;
        
        // Checkbox apenas para conquistas customizados que têm isVisible = true
        let checkbox = '';
        if (isCustom && isVisible) {
            checkbox = `<input type="checkbox" class="rank-checkbox" data-rank-id="${rank.id}" data-rank-group="${rank.rankGroup || ''}" ${isSelectedForDisplay ? 'checked' : ''} style="position: absolute; top: 8px; right: 8px; z-index: 3; width: 20px; height: 20px; cursor: pointer;">`;
        }

        if (status === 'available') {
            // conquista ainda não conquistado (Progressão) - SEM BARRA
            return `
                <div class="rank-card" style="${cardStyle}" data-rank-id="${rank.id || ''}" data-rank-name="${rank.name}">
                    <div class="rank-card-name" style="color: ${rank.color}; font-weight: 700; text-shadow: 0 0 10px rgba(0,0,0,0.8), 0 0 5px rgba(0,0,0,0.8); background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; display: inline-block;">${rank.name}</div>
                    <div class="rank-card-description" style="color: rgba(255,255,255,0.95); text-shadow: 0 0 8px rgba(0,0,0,0.8); background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; display: inline-block; font-size: 13px; margin-top: 8px;">${rank.description}</div>
                    <div class="rank-card-time" style="color: ${rank.color}; text-shadow: 0 0 8px rgba(0,0,0,0.8); background: rgba(0,0,0,0.4); padding: 4px 8px; border-radius: 4px; display: inline-block; font-size: 12px; margin-top: 8px;">${rank.minDays}-${rank.maxDays} dias</div>
                </div>
            `;
        } else if (status === 'created') {
            // Beta - Conta criada
            return `
                <div class="rank-card" style="${cardStyle}" data-rank-id="${rank.id || ''}" data-rank-name="${rank.name}">
                    ${checkbox}
                    <div class="rank-card-name" style="color: white; font-weight: 700; text-shadow: 0 0 10px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.9); background: rgba(0,0,0,0.5); padding: 6px 10px; border-radius: 4px; display: inline-block; position: relative; z-index: 2;">${rank.name}</div>
                    <div class="rank-card-description" style="color: white; text-shadow: 0 0 8px rgba(0,0,0,0.9); background: rgba(0,0,0,0.5); padding: 6px 10px; border-radius: 4px; display: inline-block; font-size: 13px; margin-top: 8px; position: relative; z-index: 2;">${rank.description || 'conquista especial'}</div>
                    <div class="rank-card-badge" style="background-color: #6B46C166; color: white; font-weight: 600; text-shadow: 0 0 8px rgba(0,0,0,0.8); padding: 6px 10px; border-radius: 4px; display: inline-block; font-size: 12px; margin-top: 8px; position: relative; z-index: 2;">Conta Criada</div>
                </div>
            `;
        } else if (status === 'completed') {
            // conquista já conquistado
            return `
                <div class="rank-card" style="${cardStyle}" data-rank-id="${rank.id || ''}" data-rank-name="${rank.name}">
                    <div class="rank-card-name" style="color: white; font-weight: 700; text-shadow: 0 0 10px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.9); background: rgba(0,0,0,0.5); padding: 6px 10px; border-radius: 4px; display: inline-block; position: relative; z-index: 2;">${rank.name}</div>
                    <div class="rank-card-description" style="color: white; text-shadow: 0 0 8px rgba(0,0,0,0.9); background: rgba(0,0,0,0.5); padding: 6px 10px; border-radius: 4px; display: inline-block; font-size: 13px; margin-top: 8px; position: relative; z-index: 2;">${rank.description || 'conquista especial'}</div>
                    <div class="rank-card-badge" style="background-color: ${rank.color}66; color: white; font-weight: 600; text-shadow: 0 0 8px rgba(0,0,0,0.8); padding: 6px 10px; border-radius: 4px; display: inline-block; font-size: 12px; margin-top: 8px; position: relative; z-index: 2;">Conquistado</div>
                </div>
            `;
        } else {
            // status === 'current' - conquista atual
            // Para conquistas customizados, mostrar com badge "conquista Atual" mas sem barra de dias
            if (isCustom) {
                const badgeText = isSelectedForDisplay ? 'conquista Atual' : 'Conquistado';
                return `
                    <div class="rank-card" style="${cardStyle}" data-rank-id="${rank.id || ''}" data-rank-name="${rank.name}">
                        ${checkbox}
                        <div class="rank-card-name" style="color: white; font-weight: 700; text-shadow: 0 0 10px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.9); background: rgba(0,0,0,0.5); padding: 6px 10px; border-radius: 4px; display: inline-block; position: relative; z-index: 2;">${rank.name}</div>
                        <div class="rank-card-description" style="color: white; text-shadow: 0 0 8px rgba(0,0,0,0.9); background: rgba(0,0,0,0.5); padding: 6px 10px; border-radius: 4px; display: inline-block; font-size: 13px; margin-top: 8px; position: relative; z-index: 2;">${rank.description || 'conquista especial'}</div>
                        <div class="rank-card-badge" style="background-color: ${rank.color}66; color: white; font-weight: 600; text-shadow: 0 0 8px rgba(0,0,0,0.8); padding: 6px 10px; border-radius: 4px; display: inline-block; font-size: 12px; margin-top: 8px; position: relative; z-index: 2;">${badgeText}</div>
                    </div>
                `;
            } else {
                // conquista automático (como Alpha, Initiate) - COM BARRA
                const daysProgress = userDays - rank.minDays;
                const totalDays = rank.maxDays - rank.minDays;
                const progressPercent = Math.max(0, Math.min(100, (daysProgress / totalDays) * 100));
                
                return `
                    <div class="rank-card" style="${cardStyle}" data-rank-id="${rank.id || ''}" data-rank-name="${rank.name}">
                        ${checkbox}
                        <div class="rank-card-name" style="color: white; font-weight: 700; text-shadow: 0 0 10px rgba(0,0,0,0.9), 0 0 5px rgba(0,0,0,0.9); background: rgba(0,0,0,0.5); padding: 6px 10px; border-radius: 4px; display: inline-block; position: relative; z-index: 2;">${rank.name}</div>
                        <div class="rank-card-description" style="color: white; text-shadow: 0 0 8px rgba(0,0,0,0.9); background: rgba(0,0,0,0.5); padding: 6px 10px; border-radius: 4px; display: inline-block; font-size: 13px; margin-top: 8px; position: relative; z-index: 2;">${rank.description || 'conquista especial'}</div>
                        <div style="margin-top: 12px; position: relative; width: 100%; height: 32px; background: rgba(0,0,0,0.3); border-radius: 6px; overflow: hidden; border: 1px solid ${rank.color}40; display: flex; align-items: center; justify-content: center;">
                            <div style="position: absolute; top: 0; left: 0; height: 100%; width: ${progressPercent}%; background: ${rank.color}; opacity: 0.5; transition: width 0.3s ease;"></div>
                            <div style="color: white; text-shadow: 0 0 8px rgba(0,0,0,0.8); font-size: 12px; font-weight: 600; position: relative; z-index: 2;">${daysProgress}/${totalDays} (${rank.minDays}-${rank.maxDays} dias)</div>
                        </div>
                    </div>
                `;
            }
        }
    }

    // CONQUISTAS: Mostrar conquista automatico atual + conquista fixo/manual + conquistas customizados
    const betaRank = ALL_RANKS.find(r => r.name === 'Beta');
    const eloAtual = conquistasAutomaticas[0]; // Pega o conquista em que o usuário está
    const manualRank = currentRankComplete && currentRankComplete.custom ? currentRankComplete.custom : null;
    
    console.log('DEBUG CONQUISTAS:');
    console.log('  eloAtual:', eloAtual?.name);
    console.log('  manualRank:', manualRank?.name);
    console.log('  currentCustomRanks:', currentCustomRanks.map(r => ({ id: r.id, name: r.name, isVisible: r.isVisible })));
    console.log('  userDays:', userDays);

    const fixedAndCustomRanks = [];
    const postAchievementCurrentRanks = [];
    const likeAchievementCurrentRanks = [];
    const seenAchievementNames = new Set();
    const pushUniqueAchievementRank = (rank, opts = {}) => {
        if (!rank || !rank.name) return;
        const nameKey = String(rank.name).trim().toLowerCase();
        if (seenAchievementNames.has(nameKey)) return;
        seenAchievementNames.add(nameKey);

        const group = opts.group || detectRankGroup(rank);
        const entry = { rank, ...opts, group };
        if (group === 'post_achievement') {
            postAchievementCurrentRanks.push(entry);
            return;
        }
        if (group === 'like_achievement') {
            likeAchievementCurrentRanks.push(entry);
            return;
        }
        fixedAndCustomRanks.push(entry);
    };

    if (eloAtual) {
        pushUniqueAchievementRank(eloAtual, { isCustom: false, isVisible: false });
    }
    if (manualRank) {
        // conquista manual/fixo sempre aparece em "Minhas conquistas" e nao tem checkbox.
        pushUniqueAchievementRank(manualRank, { isCustom: true, isVisible: false });
    }
    currentCustomRanks.forEach(rank => {
        const isVisible = rank.isVisible === 1 || rank.isVisible === true;
        pushUniqueAchievementRank(rank, {
            isCustom: true,
            isVisible,
            isFixed: !isVisible
        });
    });

    const sortedFixedAndCustom = [
        ...fixedAndCustomRanks.filter(item => item.isFixed || item.isCustom === false),
        ...fixedAndCustomRanks.filter(item => !(item.isFixed || item.isCustom === false))
    ];

    const renderMeusElosSection = (title, color, ranks, emptyMessage) => `
        <div style="margin-top: 20px; border-top: 1px solid ${color}55; padding-top: 14px;">
            <h4 style="margin: 0 0 12px 0; color: ${color}; font-size: 16px;">${title}</h4>
            <div class="ranks-grid-compact" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; width: 100%; padding: 0;">
                ${ranks.length > 0
                    ? ranks.map(({ rank, isCustom, isVisible }) => renderCard(rank, isCustom, 'current', userDays, isVisible)).join('')
                    : `<p style="margin: 0; color: rgba(255,255,255,0.55); font-size: 13px;">${emptyMessage}</p>`}
            </div>
        </div>
    `;

    const conquistasSectionHTML = `
        <div style="padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(236, 72, 153, 0.35); background: rgba(236, 72, 153, 0.08); color: #F9A8D4; font-size: 12px; font-weight: 600; margin-bottom: 16px;">
            Você só pode escolher um conquista de cada conquista (Postagens/Likes). conquistas personalizados são independentes.
        </div>
        ${renderMeusElosSection('conquistas Fixos e Personalizados', '#EC4899', sortedFixedAndCustom, 'Nenhum conquista disponível nesta seção.')}
        ${renderMeusElosSection('conquistas de Postagens', '#C084FC', postAchievementCurrentRanks, 'Você ainda não desbloqueou conquistas de postagens.')}
        ${renderMeusElosSection('conquistas de Likes', '#38BDF8', likeAchievementCurrentRanks, 'Você ainda não desbloqueou conquistas de likes.')}
    `;

    // PROGRESSÒO: Mostrar Beta + conquistas passados + conquista atual + conquistas não conquistados
    const progressaoRanks = Array.from(
        new Map(
            [betaRank, ...conquistasPassadas.filter(rank => rank.name !== 'Beta'), eloAtual, ...disponiveis]
                .filter(Boolean)
                .map(rank => [rank.name, rank])
        ).values()
    );
    const progressaoHTML = progressaoRanks.map(rank => {
        if (rank.name === 'Beta') {
            return renderCard(rank, false, 'created', userDays);
        } else if (rank === eloAtual) {
            return renderCard(rank, false, 'current', userDays);
        } else if (conquistasPassadas.some(passed => passed.name === rank.name)) {
            return renderCard(rank, false, 'completed', userDays);
        } else {
            return renderCard(rank, false, 'available', userDays);
        }
    }).join('');

    const postAchievementNames = new Set(
        (currentCustomRanks || [])
            .filter(rank => rank && rank.name)
            .map(rank => String(rank.name).trim().toLowerCase())
    );
    const postAchievementsHTML = POST_ACHIEVEMENT_RANKS.map(rank => {
        const achievedByCount = currentUserPostCount >= rank.minPosts;
        const achievedByRank = postAchievementNames.has(String(rank.name).trim().toLowerCase());
        const achieved = achievedByCount || achievedByRank;
        const badgeLabel = achieved ? 'Conquistado' : `Falta ${Math.max(0, rank.minPosts - currentUserPostCount)} post(s)`;

        return `
            <div style="
                border: 1px solid ${rank.color}80;
                border-radius: 12px;
                padding: 12px;
                background: linear-gradient(135deg, ${rank.color}${achieved ? '33' : '14'}, rgba(10, 10, 35, 0.55));
                opacity: ${achieved ? '1' : '0.75'};
            ">
                <div style="font-weight: 700; color: ${rank.color}; margin-bottom: 6px;">${rank.name}</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.85); margin-bottom: 8px;">${rank.minPosts} postagens</div>
                <div style="
                    display: inline-block;
                    font-size: 11px;
                    padding: 4px 8px;
                    border-radius: 999px;
                    border: 1px solid ${rank.color}99;
                    color: ${achieved ? '#fff' : rank.color};
                    background: ${achieved ? `${rank.color}55` : 'transparent'};
                ">${badgeLabel}</div>
            </div>
        `;
    }).join('');

    const likeAchievementNames = new Set(
        (currentCustomRanks || [])
            .filter(rank => rank && rank.name)
            .map(rank => String(rank.name).trim().toLowerCase())
    );
    const likeAchievementsHTML = LIKE_ACHIEVEMENT_RANKS.map(rank => {
        const achievedByCount = currentUserLikeCount >= rank.minLikes;
        const achievedByRank = likeAchievementNames.has(String(rank.name).trim().toLowerCase());
        const achieved = achievedByCount || achievedByRank;
        const badgeLabel = achieved ? 'Conquistado' : `Faltam ${Math.max(0, rank.minLikes - currentUserLikeCount)} like(s)`;

        return `
            <div style="
                border: 1px solid ${rank.color}80;
                border-radius: 12px;
                padding: 12px;
                background: linear-gradient(135deg, ${rank.color}${achieved ? '33' : '14'}, rgba(10, 10, 35, 0.55));
                opacity: ${achieved ? '1' : '0.75'};
            ">
                <div style="font-weight: 700; color: ${rank.color}; margin-bottom: 6px;">${rank.name}</div>
                <div style="font-size: 12px; color: rgba(255,255,255,0.85); margin-bottom: 8px;">${rank.minLikes} likes</div>
                <div style="
                    display: inline-block;
                    font-size: 11px;
                    padding: 4px 8px;
                    border-radius: 999px;
                    border: 1px solid ${rank.color}99;
                    color: ${achieved ? '#fff' : rank.color};
                    background: ${achieved ? `${rank.color}55` : 'transparent'};
                ">${badgeLabel}</div>
            </div>
        `;
    }).join('');

    const html = `
        <div class="ranks-tabs" style="display: flex; flex-direction: column; width: 100%; gap: 20px;">
            
            <div class="ranks-tab-buttons" style="display: flex; gap: 20px; border-bottom: 2px solid rgba(107, 70, 193, 0.2); padding-bottom: 15px; margin-bottom: 15px;">
                <button class="ranks-tab-btn active" data-tab="conquistas" style="background: none; border: none; color: #6B46C1; font-size: 15px; font-weight: 600; cursor: pointer; border-bottom: 3px solid #6B46C1; padding: 5px 15px;">Minhas conquistas</button>
                <button class="ranks-tab-btn" data-tab="disponiveis" style="background: none; border: none; color: rgba(255, 255, 255, 0.6); font-size: 15px; font-weight: 600; cursor: pointer; border-bottom: 3px solid transparent; padding: 5px 15px;">Progressão</button>
                    </div>
            
            <div class="ranks-tab-content active" id="tab-conquistas" style="display: block;">
                ${conquistasSectionHTML}
            </div>
            
            <div class="ranks-tab-content" id="tab-disponiveis" style="display: none;">
                <div class="ranks-grid-compact" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 15px; width: 100%; padding: 0;">
                    ${progressaoHTML}
                </div>
                <div style="margin-top: 22px; border-top: 1px solid rgba(107, 70, 193, 0.3); padding-top: 16px;">
                    <h4 style="margin: 0 0 12px 0; color: #C084FC; font-size: 16px;">conquistas de Postagem</h4>
                    <div class="ranks-grid-compact" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; width: 100%; padding: 0;">
                        ${postAchievementsHTML}
                    </div>
                </div>
                <div style="margin-top: 22px; border-top: 1px solid rgba(56, 189, 248, 0.28); padding-top: 16px;">
                    <h4 style="margin: 0 0 12px 0; color: #38BDF8; font-size: 16px;">conquistas de Likes</h4>
                    <div class="ranks-grid-compact" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 12px; width: 100%; padding: 0;">
                        ${likeAchievementsHTML}
                    </div>
                </div>
            </div>
        </div>
    `;

    historyContainer.innerHTML = html;

    // Event listeners para tabs
    document.querySelectorAll('.ranks-tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.ranks-tab-btn').forEach(b => {
                b.style.color = 'rgba(255, 255, 255, 0.6)';
                b.style.borderBottom = '3px solid transparent';
            });
            document.querySelectorAll('.ranks-tab-content').forEach(c => c.style.display = 'none');
            
            e.target.style.color = '#6B46C1';
            e.target.style.borderBottom = '3px solid #6B46C1';
            document.getElementById(`tab-${e.target.dataset.tab}`).style.display = 'block';
        });
    });

    console.log('Rank history rendered - User has ' + userDays + ' days');
}

async function loadCustomRanks(userId) {
    try {
        console.log('Loading custom ranks...');

        // Sincroniza conquistas de postagens e likes antes de buscar os conquistas do usuario
        await AuthAPI.syncPostAchievementRanks();
        await AuthAPI.syncLikeAchievementRanks();

        // Atualizar contagens para a aba de progressao
        const statsResult = await AuthAPI.getUserDownloadStats(userId);
        if (statsResult && statsResult.success && statsResult.stats) {
            currentUserPostCount = Number(statsResult.stats.totalPostages || 0);
            currentUserLikeCount = Number(statsResult.stats.totalLikes || 0);
        } else {
            currentUserPostCount = 0;
            currentUserLikeCount = 0;
        }
        
        const elosResult = await AuthAPI.getUserCustomRanks(userId);
        console.log('API Response:', elosResult);
        
        // Guardar os conquistas customizados na variável global
        currentCustomRanks = elosResult.success && elosResult.ranks ? elosResult.ranks : [];
        console.log('Custom ranks loaded from API:', currentCustomRanks.length);
        console.log('Custom ranks details:', currentCustomRanks.map(r => ({ id: r.id, name: r.name, isVisible: r.isVisible })));
        
        // Carregar conquistas selecionados para exibição ANTES de marcar checkboxes
        const selectedResult = await AuthAPI.getSelectedProfileRanks();
        console.log('Selected ranks result:', selectedResult);
        canOrderFixedRanks = Boolean(selectedResult?.canOrderFixedRanks || canOrderFixedRanks);
        selectedProfileRankIds = selectedResult.success && Array.isArray(selectedResult.rankIds)
            ? selectedResult.rankIds
                .map((id) => rankOrderKeyToNumericId(normalizeRankOrderKey(id)))
                .filter(Number.isFinite)
            : [];

        // RE-RENDERIZAR O HISTORICO PARA REFLETIR CHECKBOXES E BADGES DE EXIBICAO
        const historyContainer = document.getElementById('ranksHistory');
        if (historyContainer) {
            console.log('Re-rendering rank history with custom ranks and selected state...');
            const history = [];
            renderRankHistory(history);
            console.log('Rank history re-rendered');
        }

        // Adicionar event listeners aos checkboxes renderizados
        addCheckboxEventListeners();
        console.log('Checkbox event listeners added');
        
        // Chamar loadSelectedRanksDisplay novamente para renderizar a seção de conquistas
        await loadSelectedRanksDisplay();
        console.log('Selected ranks display loaded');
    } catch (err) {
        console.warn('Error loading custom ranks:', err.message);
        currentCustomRanks = [];
    }
}

function addCheckboxEventListeners() {
    // Adicionar event listeners aos checkboxes dos conquistas customizáveis
    document.querySelectorAll('.rank-checkbox').forEach(checkbox => {
        // Remover listeners antigos
        checkbox.replaceWith(checkbox.cloneNode(true));
    });
    
    // Readicionar listeners
    document.querySelectorAll('.rank-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            const detectGroup = (cb) => {
                let group = String(cb?.dataset?.rankGroup || '').trim();
                if (group) return group;
                const rankId = Number(cb?.dataset?.rankId);
                const rank = (currentCustomRanks || []).find(item => Number(item?.id) === rankId);
                const icon = String(rank?.icon || '').trim().toUpperCase();
                if (/^P\d+/.test(icon)) return 'post_achievement';
                if (/^L\d+/.test(icon)) return 'like_achievement';
                return '';
            };

            if (e.target.checked) {
                const targetGroup = detectGroup(e.target);
                if (targetGroup) {
                    const checkedNow = Array.from(document.querySelectorAll('.rank-checkbox:checked'));
                    let replaced = false;
                    checkedNow.forEach(cb => {
                        if (cb === e.target) return;
                        if (detectGroup(cb) === targetGroup) {
                            cb.checked = false;
                            replaced = true;
                        }
                    });
                    if (replaced) {
                        showNotification('Você só pode escolher um conquista de cada conquista. O anterior foi substituído.', 'success');
                    }
                }
            }

            const selectedCheckboxes = document.querySelectorAll('.rank-checkbox:checked');
            
            if (selectedCheckboxes.length > MAX_SELECTED_PROFILE_RANKS) {
                e.target.checked = false;
                showNotification(`Máximo de ${MAX_SELECTED_PROFILE_RANKS} conquistas selecionados`, 'error');
                return;
            }
            
            const selectedIds = Array.from(selectedCheckboxes)
                .map((cb) => parseInt(cb.dataset.rankId, 10))
                .filter(Number.isFinite);
            
            const result = await AuthAPI.selectProfileRanks(selectedIds);
            if (result.success) {
                selectedProfileRankIds = [...selectedIds];
                renderRankHistory([]);
                addCheckboxEventListeners();
                showNotification('conquistas selecionados para exibição!', 'success');
                await loadSelectedRanksDisplay();
            } else {
                showNotification('Erro ao salvar seleção', 'error');
                e.target.checked = !e.target.checked;
            }
        });
    });
    
    console.log('Event listeners added to ' + document.querySelectorAll('.rank-checkbox').length + ' checkboxes');
}

async function moveSelectedRankOrder(rankId, direction) {
    try {
        const selectedResult = await AuthAPI.getSelectedProfileRanks();
        if (!selectedResult.success || !Array.isArray(selectedResult.rankIds)) return;
        canOrderFixedRanks = Boolean(selectedResult?.canOrderFixedRanks || canOrderFixedRanks);

        const currentOrder = selectedResult.rankIds
            .map((id) => normalizeRankOrderKey(id))
            .filter(Boolean);
        const fetchedOrder = Array.isArray(selectedResult.ranks)
            ? selectedResult.ranks
                .map((rank) => getRankOrderKeyFromRank(rank))
                .filter(Boolean)
            : [];
        const fixedRankKeys = new Set(
            (Array.isArray(selectedResult.ranks) ? selectedResult.ranks : [])
                .filter((rank) => isFixedRankEntry(rank))
                .map((rank) => getRankOrderKeyFromRank(rank))
                .filter(Boolean)
        );

        const resolvedOrder = currentOrder.length > 0 ? [...currentOrder] : [...fetchedOrder];
        if (canOrderFixedRanks) {
            for (const key of fetchedOrder) {
                if (!resolvedOrder.includes(key)) resolvedOrder.push(key);
            }
        }

        const movable = canOrderFixedRanks
            ? [...resolvedOrder]
            : resolvedOrder.filter((key) => !fixedRankKeys.has(key));
        const targetRankKey = normalizeRankOrderKey(rankId);
        const index = movable.indexOf(targetRankKey);
        if (index < 0) return;

        const target = index + direction;
        if (target < 0 || target >= movable.length) return;

        [movable[index], movable[target]] = [movable[target], movable[index]];

        const reordered = canOrderFixedRanks ? movable : (() => {
            const mergedOrder = [];
            let movablePointer = 0;
            for (const key of resolvedOrder) {
                if (fixedRankKeys.has(key)) mergedOrder.push(key);
                else mergedOrder.push(movable[movablePointer++]);
            }
            return mergedOrder;
        })();

        const uniqueOrder = reordered.filter((key, idx, arr) => arr.indexOf(key) === idx);
        const payloadOrder = uniqueOrder
            .map((key) => rankOrderKeyToPayload(key))
            .filter((value) => value !== null);
        const saveResult = await AuthAPI.selectProfileRanks(payloadOrder);
        if (!saveResult.success) {
            showNotification('Erro ao mudar ordem dos conquistas', 'error');
            return;
        }

        await loadSelectedRanksDisplay();
    } catch (err) {
        console.warn('Error moving selected rank order:', err);
        showNotification('Erro ao mudar ordem dos conquistas', 'error');
    }
}

async function loadSelectedRanksDisplay() {
    try {
        const result = await AuthAPI.getSelectedProfileRanks();
        const section = document.getElementById('selectedAchievementsSection');
        const display = document.getElementById('selectedAchievementsDisplay');
        const label = document.getElementById('achievementsLabel');
        const orderBtn = document.getElementById('toggleRankOrderBtn');

        if (!section || !display) return;

        if (label) label.style.display = 'block';

        const selectedKeysOrdered = result.success && Array.isArray(result.rankIds)
            ? result.rankIds
                .map((id) => normalizeRankOrderKey(id))
                .filter(Boolean)
            : [];
        canOrderFixedRanks = Boolean(result?.canOrderFixedRanks || canOrderFixedRanks);
        const fetchedRanks = result.success && Array.isArray(result.ranks) ? result.ranks : [];
        const rankById = new Map(
            fetchedRanks
                .map((rank) => [getRankOrderKeyFromRank(rank), rank])
                .filter(([key]) => Boolean(key))
        );

        let orderedSelectedRanks = selectedKeysOrdered
            .map((key) => rankById.get(key))
            .filter(Boolean);

        fetchedRanks.forEach((rank) => {
            const rankKey = getRankOrderKeyFromRank(rank);
            if (!rankKey) return;
            if (!orderedSelectedRanks.some((item) => getRankOrderKeyFromRank(item) === rankKey)) {
                orderedSelectedRanks.push(rank);
            }
        });

        const mandatoryRanks = (currentCustomRanks || []).filter(rank => rank && rank.isVisible === 0);
        const selectedSet = new Set(
            orderedSelectedRanks
                .map((rank) => getRankOrderKeyFromRank(rank))
                .filter(Boolean)
        );
        const selectedFixedNameSet = new Set(
            orderedSelectedRanks
                .map((rank) => getFixedRankNameKey(rank))
                .filter(Boolean)
        );
        mandatoryRanks.forEach(rank => {
            const rankKey = getRankOrderKeyFromRank(rank);
            const fixedNameKey = getFixedRankNameKey(rank);
            if (fixedNameKey && selectedFixedNameSet.has(fixedNameKey)) {
                return;
            }
            if (rankKey && !selectedSet.has(rankKey)) {
                orderedSelectedRanks.push(rank);
                selectedSet.add(rankKey);
                if (fixedNameKey) {
                    selectedFixedNameSet.add(fixedNameKey);
                }
            }
        });

        // Fallback de segurança: remove duplicatas por chave e, para fixos, por nome.
        const dedupedRanks = [];
        const seenKeys = new Set();
        const seenFixedNames = new Set();
        for (const rank of orderedSelectedRanks) {
            const rankKey = getRankOrderKeyFromRank(rank);
            const fixedNameKey = getFixedRankNameKey(rank);
            if (rankKey && seenKeys.has(rankKey)) continue;
            if (fixedNameKey && seenFixedNames.has(fixedNameKey)) continue;
            if (rankKey) seenKeys.add(rankKey);
            if (fixedNameKey) seenFixedNames.add(fixedNameKey);
            dedupedRanks.push(rank);
        }
        orderedSelectedRanks = dedupedRanks;

        if (!canOrderFixedRanks) {
            orderedSelectedRanks.sort((a, b) => {
                const aFixed = isFixedRankEntry(a) ? 0 : 1;
                const bFixed = isFixedRankEntry(b) ? 0 : 1;
                if (aFixed !== bFixed) return aFixed - bFixed;
                return 0;
            });
        } else if (selectedKeysOrdered.length > 0) {
            // Com permissão para ordenar fixos, respeitar estritamente a ordem salva.
            const positionById = new Map(selectedKeysOrdered.map((id, index) => [id, index]));
            orderedSelectedRanks.sort((a, b) => {
                const aId = getRankOrderKeyFromRank(a);
                const bId = getRankOrderKeyFromRank(b);
                const aPos = positionById.has(aId) ? positionById.get(aId) : Number.MAX_SAFE_INTEGER;
                const bPos = positionById.has(bId) ? positionById.get(bId) : Number.MAX_SAFE_INTEGER;
                return aPos - bPos;
            });
        }

        const displayedRanksCount = orderedSelectedRanks.length;
        const shouldShowOrderButton = displayedRanksCount >= 2;

        if (!shouldShowOrderButton && isRankOrderMode) {
            isRankOrderMode = false;
        }

        console.log('loadSelectedRanksDisplay:', {
            selectedRanks: fetchedRanks.length,
            mandatoryRanks: mandatoryRanks.length,
            totalRanks: orderedSelectedRanks.length,
            displayedRanksCount
        });

        if (orderedSelectedRanks.length > 0) {
            section.style.display = 'flex';
            if (orderBtn) {
                orderBtn.style.display = shouldShowOrderButton ? 'inline-flex' : 'none';
                orderBtn.textContent = isRankOrderMode ? 'Concluir' : 'Ordenar';
                orderBtn.onclick = async () => {
                    if (isRankOrderMode) {
                        const payloadOrder = getDisplayedRankOrderPayload();
                        const saveResult = await AuthAPI.selectProfileRanks(payloadOrder);
                        if (!saveResult?.success) {
                            showNotification(saveResult?.message || 'Erro ao salvar ordem dos conquistas', 'error');
                            return;
                        }
                        showNotification('Ordem das conquistas salva com sucesso!', 'success');
                    }
                    isRankOrderMode = !isRankOrderMode;
                    await loadSelectedRanksDisplay();
                };
            }

        const fixedIds = new Set(
            orderedSelectedRanks
                .filter((rank) => isFixedRankEntry(rank))
                .map((rank) => getRankOrderKeyFromRank(rank))
                .filter(Boolean)
        );
        const displayedSelectedIds = orderedSelectedRanks
            .map((rank) => getRankOrderKeyFromRank(rank))
            .filter(Boolean);
        const resolvedSelectedIds = selectedKeysOrdered.length > 0
            ? [...selectedKeysOrdered]
            : [...displayedSelectedIds];
        if (canOrderFixedRanks) {
            for (const displayedId of displayedSelectedIds) {
                if (!resolvedSelectedIds.includes(displayedId)) {
                    resolvedSelectedIds.push(displayedId);
                }
            }
        }
        const movableSelectedIds = canOrderFixedRanks
            ? resolvedSelectedIds
            : resolvedSelectedIds.filter(id => !fixedIds.has(id));
            const html = orderedSelectedRanks.map(rank => {
                const rankKey = getRankOrderKeyFromRank(rank);
                if (!rankKey) return '';
                const rankId = String(rank?.id ?? '');
                const isFixed = fixedIds.has(rankKey);
                const movableIndex = movableSelectedIds.indexOf(rankKey);
                const canMoveUp = movableIndex > 0;
                const canMoveDown = movableIndex >= 0 && movableIndex < movableSelectedIds.length - 1;

                return `
                <div class="selected-conquista-badge" data-rank-id="${rankId}" style="
                    border-color: ${rank.color};
                    color: ${rank.color};
                    background-color: ${rank.color}33;
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                ">
                    <span>${rank.name}</span>
                    ${((!isFixed || canOrderFixedRanks) && isRankOrderMode && shouldShowOrderButton) ? `
                        <span style="display: inline-flex; gap: 4px;">
                            <button type="button" class="rank-order-btn rank-up" data-rank-id="${rankId}" ${canMoveUp ? '' : 'disabled'} style="padding: 2px 6px; border: 1px solid ${rank.color}66; background: transparent; color: ${rank.color}; border-radius: 4px; cursor: ${canMoveUp ? 'pointer' : 'not-allowed'}; opacity: ${canMoveUp ? '1' : '0.35'};">↑</button>
                            <button type="button" class="rank-order-btn rank-down" data-rank-id="${rankId}" ${canMoveDown ? '' : 'disabled'} style="padding: 2px 6px; border: 1px solid ${rank.color}66; background: transparent; color: ${rank.color}; border-radius: 4px; cursor: ${canMoveDown ? 'pointer' : 'not-allowed'}; opacity: ${canMoveDown ? '1' : '0.35'};">↓</button>
                        </span>
                    ` : ''}
                </div>
            `;
            }).join('');

            display.innerHTML = html;
            const hasFixedInUnifiedStrip = orderedSelectedRanks.some((rank) => isFixedRankEntry(rank));
            syncUnifiedRankStripMode(Boolean(canOrderFixedRanks && hasFixedInUnifiedStrip));
            display.querySelectorAll('.rank-order-btn.rank-up').forEach(btn => {
                btn.addEventListener('click', () => moveSelectedRankOrder(btn.dataset.rankId, -1));
            });
            display.querySelectorAll('.rank-order-btn.rank-down').forEach(btn => {
                btn.addEventListener('click', () => moveSelectedRankOrder(btn.dataset.rankId, 1));
            });
            console.log('Selected conquistas display rendered with', orderedSelectedRanks.length, 'ranks (selected + mandatory)');
        } else {
            syncUnifiedRankStripMode(false);
            section.style.display = 'none';
            display.innerHTML = '';
            if (orderBtn) {
                orderBtn.style.display = 'none';
            }
            console.log('No selected or mandatory ranks to display, but label remains visible');
        }
    } catch (err) {
        console.warn('Error loading selected ranks:', err.message);
    }
}

function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('pt-BR', options);
}

function attachEventListeners() {
    console.log('Attaching event listeners...');
    
    try {
        // ===== MODAL CLOSE BUTTONS =====
        document.querySelectorAll('.close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                e.target.closest('.modal').style.display = 'none';
            });
        });

        // ===== EDIT BUTTON & MODAL =====
        const editBtn = document.getElementById('editBtn');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                // Preencher campos com dados do usuário
                if (currentUser) {
                    document.getElementById('editFirstName').value = currentUser.firstName || '';
                    document.getElementById('editLastName').value = currentUser.lastName || '';
                    document.getElementById('editNickname').value = currentUser.nickname || '';
                    document.getElementById('editEmail').value = currentUser.email || '';
                    document.getElementById('editBirthDate').value = currentUser.birthDate || '';
                    document.getElementById('editProfileTagline').value = currentUser.profileTagline || '';
                    
                    // Atualizar o email no aviso do nickname
                    const nicknameWarning = document.querySelector('.nickname-warning em');
                    if (nicknameWarning) {
                        nicknameWarning.innerHTML = `Você também pode fazer login com seu email: <strong>${currentUser.email}</strong>`;
                    }
                    
                    updateTaglineCount();
                }
                
                // Abrir modal
                document.getElementById('editModal').style.display = 'block';
                
                // Reset para a primeira aba (Perfil)
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                document.querySelector('.tab-btn').classList.add('active');
                document.getElementById('edit-tab').classList.add('active');
                
                // Limpar mensagens de erro
                document.getElementById('editError').textContent = '';
                document.getElementById('passwordError').textContent = '';
            });
        }

        // ===== MODAL TABS FUNCTIONALITY =====
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tabName = btn.getAttribute('data-tab');
                
                // Remove active class de todas as abas
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                // Adiciona active no botão e conteúdo clicado
                btn.classList.add('active');
                document.getElementById(tabName).classList.add('active');
            });
        });

        // ===== CHANGE EMAIL BUTTON =====
        const changeEmailBtn = document.getElementById('changeEmailBtn');
        if (changeEmailBtn) {
            changeEmailBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // Preencher email atual no modal
                document.getElementById('currentEmailDisplay').value = currentUser.email || '';
                document.getElementById('newEmailInput').value = '';
                document.getElementById('emailVerificationCode').value = '';
                document.getElementById('changeEmailError').textContent = '';
                // Abrir modal
                document.getElementById('changeEmailModal').style.display = 'block';
            });
        }

        // ===== CLOSE CHANGE EMAIL MODAL =====
        const closeChangeEmailBtn = document.getElementById('closeChangeEmailModal');
        if (closeChangeEmailBtn) {
            closeChangeEmailBtn.addEventListener('click', () => {
                document.getElementById('changeEmailModal').style.display = 'none';
            });
        }

        // ===== SEND EMAIL VERIFICATION CODE =====
        const sendEmailCodeBtn = document.getElementById('sendEmailCodeBtn');
        if (sendEmailCodeBtn) {
            sendEmailCodeBtn.addEventListener('click', async (e) => {
                e.preventDefault();
                
                try {
                    sendEmailCodeBtn.disabled = true;
                    sendEmailCodeBtn.textContent = 'Enviando...';
                    
                    const result = await AuthAPI.sendEmailChangeCode(currentUser.email);
                    
                    if (result.success) {
                        showNotification('Código enviado para seu email! Verifique sua caixa de entrada.', 'success');
                        sendEmailCodeBtn.textContent = 'Código Enviado';
                        document.getElementById('changeEmailError').textContent = '';
                    } else {
                        document.getElementById('changeEmailError').textContent = 'Erro: ' + (result.message || 'Erro ao enviar código');
                        sendEmailCodeBtn.disabled = false;
                        sendEmailCodeBtn.textContent = 'Enviar Código';
                    }
                } catch (err) {
                    document.getElementById('changeEmailError').textContent = 'Erro ao enviar código';
                    sendEmailCodeBtn.disabled = false;
                    sendEmailCodeBtn.textContent = 'Enviar Código';
                    console.error(err);
                }
            });
        }

        // ===== CHANGE EMAIL FORM =====
        const changeEmailForm = document.getElementById('changeEmailForm');
        if (changeEmailForm) {
            changeEmailForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const newEmail = document.getElementById('newEmailInput').value;
                const code = document.getElementById('emailVerificationCode').value;
                
                if (!newEmail || !code) {
                    document.getElementById('changeEmailError').textContent = 'Preencha todos os campos';
                    return;
                }
                
                try {
                    const result = await AuthAPI.changeEmail(newEmail, code);
                    
                    if (result.success) {
                        // Atualizar email do usuário
                        currentUser.email = newEmail;
                        document.getElementById('editEmail').value = newEmail;
                        document.getElementById('profileEmail').textContent = '*'.repeat(newEmail.length);
                        document.getElementById('profileEmail').setAttribute('data-hidden', 'true');
                        syncEmailToggleButton();
                        
                        // Fechar modais
                        document.getElementById('changeEmailModal').style.display = 'none';
                        changeEmailForm.reset();
                        
                        showNotification('Email alterado com sucesso!', 'success');
                    } else {
                        document.getElementById('changeEmailError').textContent = 'Erro: ' + (result.message || 'Erro ao alterar email');
                    }
                } catch (err) {
                    document.getElementById('changeEmailError').textContent = 'Erro ao alterar email';
                    console.error(err);
                }
            });
        }

        const editProfileForm = document.getElementById('editProfileForm');
        if (editProfileForm) {
            editProfileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                // Coletar todos os dados do formulário (SEM email)
                const formData = new FormData();
                formData.append('firstName', document.getElementById('editFirstName').value);
                formData.append('lastName', document.getElementById('editLastName').value);
                formData.append('nickname', document.getElementById('editNickname').value);
                formData.append('birthDate', document.getElementById('editBirthDate').value);
                const customTaglineInput = document.getElementById('editProfileTagline');
                formData.append('profileTagline', String(customTaglineInput?.value || '').trim());

                try {
                    const result = await AuthAPI.updateProfile(formData);
                    if (result.success) {
                        // Atualizar dados no usuário atual
                        currentUser.firstName = result.user.firstName;
                        currentUser.lastName = result.user.lastName;
                        currentUser.nickname = result.user.nickname;
                        currentUser.email = result.user.email;
                        currentUser.birthDate = result.user.birthDate;
                        currentUser.profileTagline = String(result.user.profileTagline || '').trim();
                        
                        // Atualizar o perfil na página
                        document.getElementById('profileUsername').textContent = `${result.user.firstName} ${result.user.lastName}`;
                        document.getElementById('rankDescription').textContent = getEffectiveProfileTagline();
                        
                        // Reconexão ao email mascarado
                        const emailDisplay = document.getElementById('profileEmail');
                        emailDisplay.textContent = '*'.repeat(result.user.email.length);
                        emailDisplay.setAttribute('data-hidden', 'true');
                        syncEmailToggleButton();
                        
                        // Fechar modal e mostrar notificação
                        document.getElementById('editModal').style.display = 'none';
                        document.getElementById('editError').textContent = '';
                        showNotification('Perfil atualizado com sucesso!', 'success');
                    } else {
                        document.getElementById('editError').textContent = 'Erro: ' + (result.message || 'Erro desconhecido');
                    }
                } catch (err) {
                    document.getElementById('editError').textContent = 'Erro ao atualizar perfil';
                    console.error(err);
                }
            });
        }

        // ===== FRASE DO PERFIL =====
        const editProfileTagline = document.getElementById('editProfileTagline');
        if (editProfileTagline) {
            editProfileTagline.addEventListener('input', updateTaglineCount);
        }
        const randomTaglineBtn = document.getElementById('randomTaglineBtn');
        if (randomTaglineBtn) {
            randomTaglineBtn.addEventListener('click', applyRandomProfileTagline);
        }
        const clearTaglineBtn = document.getElementById('clearTaglineBtn');
        if (clearTaglineBtn) {
            clearTaglineBtn.addEventListener('click', clearProfileTagline);
        }

        // ===== NICKNAME WARNING (Dynamic) =====
        const editNickname = document.getElementById('editNickname');
        if (editNickname) {
            editNickname.addEventListener('focus', () => {
                // Verificar se já existe o aviso
                let warning = document.getElementById('nicknameWarning');
                if (!warning) {
                    warning = document.createElement('div');
                    warning.id = 'nicknameWarning';
                    warning.className = 'nickname-warning';
                    warning.innerHTML = `
                        <strong>Atenção:</strong>
                        Se alterar seu nickname, o seu login mudará para o novo nickname.<br>
                        <em>Você também pode fazer login com seu email: ${currentUser.email}</em>
                    `;
                    editNickname.parentElement.appendChild(warning);
                }
                warning.style.display = 'block';
            });
            
            editNickname.addEventListener('blur', () => {
                const warning = document.getElementById('nicknameWarning');
                if (warning) {
                    warning.style.display = 'none';
                }
            });
        }

        // ===== CHANGE PASSWORD FORM =====
        const changePasswordForm = document.getElementById('changePasswordForm');
        if (changePasswordForm) {
            changePasswordForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                try {
                    const result = await AuthAPI.changePassword(
                        document.getElementById('currentPassword').value,
                        document.getElementById('newPassword').value,
                        document.getElementById('confirmPassword').value
                    );

                    if (result.success) {
                        // Fechar modal
                        document.getElementById('editModal').style.display = 'none';
                        changePasswordForm.reset();
                        document.getElementById('passwordError').textContent = '';
                        showNotification('Senha alterada com sucesso!', 'success');
                    } else {
                        document.getElementById('passwordError').textContent = 'Erro: ' + (result.message || 'Erro desconhecido');
                    }
                } catch (err) {
                    document.getElementById('passwordError').textContent = 'Erro ao alterar senha';
                    console.error(err);
                }
            });
        }

        // ===== AVATAR UPLOAD =====
        const avatarInput = document.getElementById('avatarInput');
        if (avatarInput) {
            avatarInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    const formData = new FormData();
                    formData.append('avatar', file);

                    const result = await AuthAPI.updateProfile(formData);

                    if (result.success) {
                        currentUser.avatar = result.user?.avatar || currentUser.avatar;
                        if (currentUser.avatar) {
                            const avatarUrl = resolveMediaUrl(currentUser.avatar);
                            document.getElementById('profileAvatar').style.backgroundImage = `url(${withCacheBuster(avatarUrl)})`;
                        }
                        showNotification('Avatar atualizado com sucesso! (400x400px)', 'success');
                    } else {
                        showNotification('Erro ao atualizar avatar: ' + result.message, 'error');
                    }
                } catch (err) {
                    showNotification('Erro ao fazer upload do avatar', 'error');
                    console.error(err);
                }
                
                // Limpar input
                e.target.value = '';
            });
        }

        // ===== BANNER UPLOAD =====
        const bannerInput = document.getElementById('bannerInput');
        if (bannerInput) {
            bannerInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                try {
                    const formData = new FormData();
                    formData.append('banner', file);

                    const result = await AuthAPI.updateProfile(formData);

                    if (result.success) {
                        currentUser.banner = result.user?.banner || currentUser.banner;
                        if (currentUser.banner) {
                            const bannerUrl = resolveMediaUrl(currentUser.banner);
                            document.getElementById('profileBanner').style.backgroundImage = `url(${withCacheBuster(bannerUrl)})`;
                        }
                        showNotification('Banner atualizado com sucesso! (1200x250px)', 'success');
                    } else {
                        showNotification('Erro ao atualizar banner: ' + result.message, 'error');
                    }
                } catch (err) {
                    showNotification('Erro ao fazer upload do banner', 'error');
                    console.error(err);
                }
                
                // Limpar input
                e.target.value = '';
            });
        }

        // Logout da navbar e gerenciado globalmente no auth-manager.js

        // ===== TOGGLE EMAIL VISIBILITY =====
        const toggleEmailBtn = document.getElementById('toggleEmailBtn');
        if (toggleEmailBtn) {
            toggleEmailBtn.addEventListener('click', () => {
                const emailDisplay = document.getElementById('profileEmail');
                const isHidden = emailDisplay.getAttribute('data-hidden') === 'true';
                
                if (isHidden) {
                    emailDisplay.textContent = currentUser.email;
                    emailDisplay.setAttribute('data-hidden', 'false');
                } else {
                    emailDisplay.textContent = '*'.repeat(currentUser.email.length);
                    emailDisplay.setAttribute('data-hidden', 'true');
                }

                syncEmailToggleButton();
            });
        }

        // ===== ADMIN BUTTON =====
        const adminBtn = document.getElementById('adminBtn');
        if (adminBtn && adminBtn.style.display !== 'none') {
            adminBtn.addEventListener('click', () => {
                window.location.href = 'admin.html';
            });
        }

        console.log('Event listeners attached successfully');
    } catch (err) {
        console.warn('Error attaching listeners:', err.message);
    }
}

function updateTaglineCount() {
    const editProfileTagline = document.getElementById('editProfileTagline');
    const taglineCount = document.getElementById('taglineCount');
    if (editProfileTagline && taglineCount) {
        taglineCount.textContent = editProfileTagline.value.length + '/120';
    }
}

function applyRandomProfileTagline() {
    const editProfileTagline = document.getElementById('editProfileTagline');
    if (!editProfileTagline || PROFILE_TAGLINE_SUGGESTIONS.length === 0) {
        return;
    }

    const randomIndex = Math.floor(Math.random() * PROFILE_TAGLINE_SUGGESTIONS.length);
    editProfileTagline.value = PROFILE_TAGLINE_SUGGESTIONS[randomIndex];
    updateTaglineCount();
}

function clearProfileTagline() {
    const editProfileTagline = document.getElementById('editProfileTagline');
    if (!editProfileTagline) {
        return;
    }
    editProfileTagline.value = '';
    updateTaglineCount();
}

async function checkAdminPanelAccess() {
    try {
        console.log('[PROFILE] Checking admin panel access...');
        const result = await AuthAPI.checkAdminPermission();
        console.log('[PROFILE] Admin permission response:', result);
        
        if (result && result.success && result.hasAccess) {
            console.log('[PROFILE] User has admin access! Showing button...');
            // Mostrar botão de painel admin que já existe no HTML
            const adminBtn = document.getElementById('adminBtn');
            
            if (adminBtn) {
                adminBtn.style.display = 'block';
                adminBtn.textContent = result.isAdmin ? 'Painel Admin' : 'S-Admin';
                adminBtn.addEventListener('click', () => {
                    window.location.href = 'admin.html';
                });
                console.log('[PROFILE] Admin panel button shown successfully');
            } else {
                console.warn('[PROFILE] #adminBtn not found in DOM');
            }
        } else {
            console.log('[PROFILE] User does not have admin access', {
                success: result?.success,
                hasAccess: result?.hasAccess
            });
        }
    } catch (error) {
        console.error('[PROFILE] Error checking admin access:', error);
    }
}

function showError(message) {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('profileContent').style.display = 'block';
    document.getElementById('profileContent').innerHTML = `<p style="color: red; text-align: center; margin-top: 50px;">${message}</p>`;
}
// ========== MINHAS CONQUISTAS E POSTAGENS ==========

function detectRankGroup(rank) {
    if (!rank) return '';
    const explicit = String(rank.rankGroup || '').trim();
    if (explicit) return explicit;
    const icon = String(rank.icon || '').trim().toUpperCase();
    if (/^P\d+/.test(icon)) return 'post_achievement';
    if (/^L\d+/.test(icon)) return 'like_achievement';
    return 'general';
}

function getRankGroupLabel(rankGroup) {
    if (rankGroup === 'post_achievement') return 'conquista de Postagem';
    if (rankGroup === 'like_achievement') return 'conquista de Likes';
    return 'Conquista';
}

function getNotificationSettingElements() {
    return {
        disableCommentNotifications: document.getElementById('disableCommentNotifications'),
        disableLikeNotifications: document.getElementById('disableLikeNotifications'),
        disableAchievementNotifications: document.getElementById('disableAchievementNotifications'),
        disableAllNotifications: document.getElementById('disableAllNotifications')
    };
}

function applyNotificationDependencies(options = {}) {
    const { resetSpecificOnDisable = true } = options;
    const els = getNotificationSettingElements();
    const allToggle = els.disableAllNotifications;
    if (!allToggle) return;

    const specificKeys = [
        'disableCommentNotifications',
        'disableLikeNotifications',
        'disableAchievementNotifications'
    ];
    const allOn = Boolean(allToggle.checked);

    specificKeys.forEach((key) => {
        const input = els[key];
        if (!input) return;
        const label = input.closest('.notif-setting-item');

        if (allOn) {
            input.checked = true;
            input.disabled = true;
            if (label) label.classList.add('disabled');
        } else {
            if (previousAllNotificationsToggleState && resetSpecificOnDisable) {
                input.checked = false;
            }
            input.disabled = false;
            if (label) label.classList.remove('disabled');
        }
    });

    previousAllNotificationsToggleState = allOn;
}

function collectNotificationSettingsFromUI() {
    const els = getNotificationSettingElements();
    return {
        disableCommentNotifications: Boolean(els.disableCommentNotifications?.checked),
        disableLikeNotifications: Boolean(els.disableLikeNotifications?.checked),
        disableAchievementNotifications: Boolean(els.disableAchievementNotifications?.checked),
        disableAllNotifications: Boolean(els.disableAllNotifications?.checked)
    };
}

function applyNotificationSettingsToUI(settings) {
    const els = getNotificationSettingElements();
    if (!els.disableAllNotifications) return;

    isApplyingNotificationSettings = true;
    if (els.disableCommentNotifications) els.disableCommentNotifications.checked = Boolean(settings.disableCommentNotifications);
    if (els.disableLikeNotifications) els.disableLikeNotifications.checked = Boolean(settings.disableLikeNotifications);
    if (els.disableAchievementNotifications) els.disableAchievementNotifications.checked = Boolean(settings.disableAchievementNotifications);
    if (els.disableAllNotifications) els.disableAllNotifications.checked = Boolean(settings.disableAllNotifications);

    previousAllNotificationsToggleState = Boolean(settings.disableAllNotifications);
    applyNotificationDependencies({ resetSpecificOnDisable: false });
    isApplyingNotificationSettings = false;
}

async function saveNotificationSettings() {
    if (isSavingNotificationSettings) return;
    isSavingNotificationSettings = true;
    try {
        const payload = collectNotificationSettingsFromUI();
        const result = await AuthAPI.updateNotificationSettings(payload);
        if (result?.success) {
            applyNotificationSettingsToUI(result.settings || payload);
            showNotification('Configurações de notificações salvas', 'success');
        } else {
            showNotification(result?.message || 'Erro ao salvar notificações', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar configurações de notificações:', error);
        showNotification('Erro ao salvar notificações', 'error');
    } finally {
        isSavingNotificationSettings = false;
    }
}

async function loadNotificationSettings() {
    try {
        const result = await AuthAPI.getNotificationSettings();
        if (result?.success && result.settings) {
            applyNotificationSettingsToUI(result.settings);
        } else {
            applyNotificationSettingsToUI({
                disableCommentNotifications: false,
                disableLikeNotifications: false,
                disableAchievementNotifications: false,
                disableAllNotifications: false
            });
        }
    } catch (error) {
        console.error('Erro ao carregar configurações de notificações:', error);
    }
}

function initializeNotificationSettingsControls() {
    const els = getNotificationSettingElements();
    const allInputs = Object.values(els).filter(Boolean);
    if (allInputs.length === 0) return;

    allInputs.forEach((input) => {
        if (input.dataset.boundNotif === '1') return;
        input.dataset.boundNotif = '1';
        input.addEventListener('change', async () => {
            if (isApplyingNotificationSettings) return;
            applyNotificationDependencies();
            await saveNotificationSettings();
        });
    });

    loadNotificationSettings();
}

function setActiveEloSection(sectionId) {
    const options = document.querySelectorAll('#conquistas-tab .conquista-expand-btn');
    const sections = document.querySelectorAll('#conquistas-tab .conquista-expand-section');

    options.forEach((btn) => {
        if (btn.dataset.target === sectionId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    sections.forEach((section) => {
        if (section.id === sectionId) {
            section.classList.add('active');
        } else {
            section.classList.remove('active');
        }
    });
}

function initializeEloExpanders() {
    const tab = document.getElementById('conquistas-tab');
    if (!tab) return;

    const options = tab.querySelectorAll('.conquista-expand-btn');
    options.forEach((btn) => {
        if (btn.dataset.boundExpand === '1') return;
        btn.dataset.boundExpand = '1';
        btn.addEventListener('click', () => setActiveEloSection(btn.dataset.target));
    });

    const hasActiveSection = tab.querySelector('.conquista-expand-section.active');
    if (!hasActiveSection && options.length > 0) {
        setActiveEloSection(options[0].dataset.target);
    }
}

function renderModalConquestRanks(ranks) {
    const container = document.getElementById('myConquestsList');
    if (!container) return;

    if (!Array.isArray(ranks) || ranks.length === 0) {
        container.innerHTML = '<p style="margin: 0; color: rgba(255,255,255,0.55);">Nenhum conquista selecionado para exibição.</p>';
        return;
    }

    container.innerHTML = ranks.map((rank) => {
        const color = rank.color || '#EC4899';
        const group = detectRankGroup(rank);
        const groupLabel = getRankGroupLabel(group);
        const description = rank.description || rank.customText || 'conquista desbloqueado';

        return `
            <div class="conquista-conquista-card" style="border-color: ${color}66; background: linear-gradient(135deg, ${color}22, rgba(10,10,35,0.55));">
                <div class="conquista-conquista-name" style="color: ${color};">${rank.name || 'Sem nome'}</div>
                <div class="conquista-conquista-desc">${description}</div>
                <span class="conquista-conquista-badge" style="color: ${color};">${groupLabel}</span>
            </div>
        `;
    }).join('');
}

function calculateLikeRankInfo(totalLikes) {
    let current = null;
    let next = null;

    for (const rank of LIKE_ACHIEVEMENT_RANKS) {
        if (totalLikes >= rank.minLikes) {
            current = rank;
        } else {
            next = rank;
            break;
        }
    }

    if (!next && current) {
        next = current;
    }

    const baseline = current ? current.minLikes : 0;
    const target = next ? next.minLikes : baseline;
    const progressRange = Math.max(1, target - baseline);
    const progressValue = Math.max(0, totalLikes - baseline);
    const percentage = current && !next
        ? 100
        : Math.max(0, Math.min(100, Math.round((progressValue / progressRange) * 100)));

    return { current, next, percentage, baseline, target };
}

async function loadPostageAchievements() {
    if (!currentUser) return;

    try {
        initializeNotificationSettingsControls();
        initializeEloExpanders();

        await AuthAPI.syncPostAchievementRanks();
        await AuthAPI.syncLikeAchievementRanks();

        const [statsResponse, ranksResponse, selectedRanksResponse] = await Promise.all([
            AuthAPI.getUserDownloadStats(currentUser.id),
            AuthAPI.getPostageRanks(),
            AuthAPI.getSelectedProfileRanks()
        ]);

        if (selectedRanksResponse && selectedRanksResponse.success) {
            renderModalConquestRanks(selectedRanksResponse.ranks || []);
        } else {
            renderModalConquestRanks([]);
        }

        if (statsResponse.success) {
            const stats = statsResponse.stats;
            const rankInfo = statsResponse.rankInfo;
            const totalPosts = Number(stats.totalPostages || 0);
            const totalLikesHistorical = Number(stats.totalLikes || 0);
            const totalLikesCurrent = Number(stats.totalLikesCurrent || 0);
            const totalHearts = Number(stats.totalHearts || 0);

            currentUserPostCount = totalPosts;
            currentUserLikeCount = totalLikesHistorical;

            // Preencher estatísticas
            document.getElementById('totalPostages').textContent = totalPosts;
            document.getElementById('totalLikesReceived').textContent = totalLikesHistorical;
            document.getElementById('totalHeartsReceived').textContent = totalHearts;

            document.getElementById('totalLikesHistory').textContent = totalLikesHistorical;
            document.getElementById('totalLikesCurrent').textContent = totalLikesCurrent;
            document.getElementById('totalHeartsLikesTab').textContent = totalHearts;

            // conquista atual
            const currentRank = rankInfo.currentRank;
            document.getElementById('currentRankIcon').textContent = currentRank?.icon || '🏅';
            document.getElementById('currentRankName').textContent = currentRank?.name || 'Sem conquista';
            document.getElementById('currentRankDesc').textContent = currentRank?.description || 'Faça sua primeira postagem';

            // Progresso
            const progress = rankInfo.progress;
            document.getElementById('progressCurrent').textContent = progress.current;
            document.getElementById('progressNeeded').textContent = progress.needed;
            document.getElementById('progressBar').style.width = progress.percentage + '%';

            // Próximo conquista
            const nextPostageRankHint = document.getElementById('nextPostageRankHint');
            if (rankInfo.nextRank) {
                const nextRank = rankInfo.nextRank;
                nextPostageRankHint.textContent = `${nextRank.postagensNeeded} postagens faltam para ${nextRank.name}`;
            } else {
                nextPostageRankHint.textContent = 'Você já alcançou o maior conquista de postagens.';
            }

            if (ranksResponse.success) {
                const ranksContainer = document.getElementById('allPostageRanks');
                ranksContainer.innerHTML = ranksResponse.ranks.map(rank => `
                    <div style="background: linear-gradient(135deg, ${rank.color}22, ${rank.color}11); padding: 12px; border-radius: 8px; border: 1px solid ${rank.color}40; text-align: center;">
                        <div style="font-size: 24px; margin-bottom: 8px;">${rank.icon}</div>
                        <h5 style="margin: 0 0 5px 0; color: ${rank.color}; font-size: 12px;">${rank.name}</h5>
                        <small style="color: #999; font-size: 10px;">${rank.minPostages} posts</small>
                    </div>
                `).join('');
            }

            const likeRankInfo = calculateLikeRankInfo(totalLikesHistorical);
            const likeCurrent = likeRankInfo.current;
            const likeNext = likeRankInfo.next;

            document.getElementById('currentLikeRankIcon').textContent = likeCurrent ? `L${likeCurrent.minLikes}` : 'L0';
            document.getElementById('currentLikeRankName').textContent = likeCurrent ? likeCurrent.name : 'Sem conquista de Likes';
            document.getElementById('currentLikeRankName').style.color = likeCurrent?.color || '#38BDF8';
            document.getElementById('currentLikeRankDesc').textContent = likeCurrent
                ? `Conquistado com ${likeCurrent.minLikes} likes.`
                : 'Ganhe likes para desbloquear seus conquistas.';

            if (likeNext && totalLikesHistorical < likeNext.minLikes) {
                const remainingLikes = Math.max(0, likeNext.minLikes - totalLikesHistorical);
                document.getElementById('nextLikeRankHint').textContent = `${remainingLikes} likes faltam para ${likeNext.name}.`;
            } else {
                document.getElementById('nextLikeRankHint').textContent = 'Você já alcançou o maior conquista de likes.';
            }

            document.getElementById('likeProgressCurrent').textContent = totalLikesHistorical;
            document.getElementById('likeProgressNeeded').textContent = likeNext ? likeNext.minLikes : totalLikesHistorical;
            document.getElementById('likeProgressBar').style.width = `${likeRankInfo.percentage}%`;

            const allLikeRanksContainer = document.getElementById('allLikeRanks');
            allLikeRanksContainer.innerHTML = LIKE_ACHIEVEMENT_RANKS.map((rank) => {
                const achieved = totalLikesHistorical >= rank.minLikes;
                const badgeLabel = achieved
                    ? 'Conquistado'
                    : `Faltam ${Math.max(0, rank.minLikes - totalLikesHistorical)} like(s)`;
                return `
                    <div style="border: 1px solid ${rank.color}80; border-radius: 12px; padding: 12px; background: linear-gradient(135deg, ${rank.color}${achieved ? '33' : '14'}, rgba(10, 10, 35, 0.55)); opacity: ${achieved ? '1' : '0.75'};">
                        <div style="font-weight: 700; color: ${rank.color}; margin-bottom: 6px;">${rank.name}</div>
                        <div style="font-size: 12px; color: rgba(255,255,255,0.85); margin-bottom: 8px;">${rank.minLikes} likes</div>
                        <div style="display: inline-block; font-size: 11px; padding: 4px 8px; border-radius: 999px; border: 1px solid ${rank.color}99; color: ${achieved ? '#fff' : rank.color}; background: ${achieved ? `${rank.color}55` : 'transparent'};">${badgeLabel}</div>
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar conquistas:', error);
    }
}

async function loadMyPostages() {
    if (!currentUser) return;

    try {
        const response = await AuthAPI.getUserDownloads(currentUser.id);
        
        if (response.success && response.downloads) {
            const container = document.getElementById('myPostagesContainer');
            const downloads = response.downloads;

            if (downloads.length === 0) {
                container.innerHTML = `
                    <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #999;">
                        <p style="font-size: 18px; margin: 0;">Você ainda não postou nada</p>
                        <p style="margin: 10px 0 0 0;">Compartilhe seus programas com a comunidade!</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = downloads.map(download => `
                <div style="background: rgba(107, 70, 193, 0.1); border: 1px solid #EC4899; border-radius: 10px; padding: 15px;">
                    <h4 style="margin: 0 0 8px 0; color: #EC4899;">${download.name}</h4>
                    ${download.description ? `<p style="margin: 0 0 10px 0; color: #ccc; font-size: 13px;">${download.description}</p>` : ''}
                    
                    <div style="display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; font-size: 11px; font-weight: 600;">
                        <span style="padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(236, 72, 153, 0.45); color: #EC4899; background: rgba(236, 72, 153, 0.12);">Likes ${download.likes || 0}</span>
                        <span style="padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(192, 132, 252, 0.45); color: #C084FC; background: rgba(192, 132, 252, 0.12);">Corações ${download.hearts || 0}</span>
                        <span style="padding: 4px 8px; border-radius: 999px; border: 1px solid rgba(56, 189, 248, 0.45); color: #38BDF8; background: rgba(56, 189, 248, 0.12);">${new Date(download.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    <div style="display: flex; gap: 8px;">
                        <a href="${download.link}" target="_blank" style="flex: 1; padding: 8px; background: linear-gradient(135deg, #EC4899, #6B46C1); color: white; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; text-align: center; font-weight: 600; font-size: 12px;">Ver</a>
                        <button onclick="deletePostage(${download.id})" style="padding: 8px 12px; background: #EF4444; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600; font-size: 12px;">Excluir</button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Erro ao carregar postagens:', error);
        document.getElementById('myPostagesContainer').innerHTML = 
            '<p style="color: red; grid-column: 1/-1;">Erro ao carregar postagens</p>';
    }
}

async function deletePostage(downloadId) {
    if (!confirm('Tem certeza que deseja deletar esta postagem?')) return;

    try {
        const response = await AuthAPI.deleteDownload(downloadId);
        if (response.success) {
            showNotification('Postagem deletada com sucesso!', 'success');
            loadMyPostages();
        } else {
            showNotification('Erro ao deletar postagem', 'error');
        }
    } catch (error) {
        showNotification('Erro ao deletar postagem', 'error');
    }
}

// Carregar conquistas e postagens quando abrir as abas
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners para abas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const tabName = e.target.getAttribute('data-tab');
            
            // Remover active de todos
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Adicionar active ao clicado
            e.target.classList.add('active');
            const tab = document.getElementById(tabName);
            if (tab) {
                tab.classList.add('active');
                
                // Carregar dados específicos
                if (tabName === 'conquistas-tab') {
                    await loadPostageAchievements();
                } else if (tabName === 'postages-tab') {
                    await loadMyPostages();
                }
            }
        });
    });
});




