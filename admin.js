// Script para Painel Admin - Nova Vers�o com conquistas Customiz�veis

document.addEventListener('DOMContentLoaded', async function() {
    console.log('Admin pages loaded');

    if (typeof RouteGuard !== 'undefined') {
        const allowed = await RouteGuard.requireAuth({
            loginMessage: 'Fa�a login para acessar o painel administrativo',
            invalidSessionMessage: 'Sess�o inv�lida. Fa�a login novamente.',
            validateSession: true
        });
        if (!allowed) return;
    } else {
        const token = AuthAPI.getToken();
        if (!token) {
            window.location.href = 'login.html?message=' + encodeURIComponent('Fa�a login para acessar o painel administrativo');
            return;
        }
    }

    attachEventListeners();
    const activeTab = document.querySelector('.tab-btn.active')?.dataset?.tab || 'ranks';
    await loadTabData(activeTab);
});

const OWNER_EMAIL_VIEWER = 'sustmanrft@hotmail.com';
const USERS_PER_PAGE = 6;
const loadedTabs = new Set();
let canRevealEmails = false;
const rawEmailByUserId = new Map();
const userLabelByUserId = new Map();
let cachedUsers = [];
let currentUsersPage = 1;

function isExampleEmail(userOrEmail) {
    if (typeof userOrEmail === 'object' && userOrEmail !== null) {
        if (typeof userOrEmail.isExampleEmail === 'boolean') {
            return userOrEmail.isExampleEmail;
        }
        return String(userOrEmail.email || '').trim().toLowerCase().endsWith('@example.com');
    }
    return String(userOrEmail || '').trim().toLowerCase().endsWith('@example.com');
}

function maskEmail(email) {
    const raw = String(email || '').trim();
    const atIndex = raw.indexOf('@');
    if (atIndex <= 0 || atIndex === raw.length - 1) return '***';

    const local = raw.slice(0, atIndex);
    const domain = raw.slice(atIndex + 1);

    const localStart = local.slice(0, 2);
    const localEnd = local.length > 2 ? local.slice(-1) : '';
    const domainParts = domain.split('.');
    const mainDomain = domainParts[0] || '';
    const tld = domainParts.slice(1).join('.') || '';

    const maskedLocal = `${localStart}${'*'.repeat(Math.max(2, local.length - 3))}${localEnd}`;
    const maskedDomain = mainDomain.length > 2
        ? `${mainDomain[0]}${'*'.repeat(mainDomain.length - 2)}${mainDomain.slice(-1)}`
        : `${mainDomain[0] || '*'}*`;

    return `${maskedLocal}@${maskedDomain}${tld ? '.' + tld : ''}`;
}

async function loadTabData(tabName, { force = false } = {}) {
    const key = String(tabName || '').trim();
    if (!key) return;
    if (!force && loadedTabs.has(key)) return;

    if (key === 'ranks') {
        await Promise.all([loadDefaultRanks(), loadCustomRanks(), loadSocialLinks()]);
        loadedTabs.add(key);
        return;
    }

    if (key === 'users') {
        await loadUsers();
        loadedTabs.add(key);
        return;
    }

    if (key === 'post-permissions') {
        await Promise.all([loadPostPermissions(), loadPostageRanks()]);
        loadedTabs.add(key);
        return;
    }

    if (key === 'bans') {
        await loadBans();
        loadedTabs.add(key);
    }
}

// ===================== EVENT LISTENERS =====================
function attachEventListeners() {
    // Voltar para o perfil sem encerrar sessao
    const backToProfileBtn = document.getElementById('backToProfileBtn');
    if (backToProfileBtn) {
        backToProfileBtn.addEventListener('click', () => {
            window.location.href = 'profile.html';
        });
    }

    // Criar novo conquista
    const createRankForm = document.getElementById('createRankForm');
    if (createRankForm) {
        createRankForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('rankName').value;
            const color = document.getElementById('rankColor').value;
            const description = document.getElementById('rankDescription').value;
            const customText = document.getElementById('rankCustomText').value;
            const backgroundImageUrl = document.getElementById('rankBackgroundImage').value.trim();
            const backgroundImageFile = document.getElementById('rankBackgroundImageFile').files[0];
            const enableAdminPanel = document.getElementById('rankEnableAdminPanel').checked;
            const isVisible = document.getElementById('rankIsVisible').checked;
            const canManageDownloads = document.getElementById('rankCanManageDownloads').checked;
            const canOrderAllRanks = document.getElementById('rankCanOrderAllRanks')?.checked || false;
            const canUseAnimatedProfile = document.getElementById('rankCanUseAnimatedProfile')?.checked || false;
            
            if (!name || !color || !description || !customText) {
                showMessage('Preencha todos os campos obrigat�rios', 'error');
                return;
            }
            
            try {
                const resolvedBackgroundImageUrl = await resolveImageUrlFromInputs(backgroundImageUrl, backgroundImageFile);
                const result = await AuthAPI.createCustomRank(
                    name,
                    color,
                    description,
                    customText,
                    resolvedBackgroundImageUrl,
                    backgroundImageFile,
                    enableAdminPanel,
                    isVisible,
                    canManageDownloads,
                    canOrderAllRanks,
                    canUseAnimatedProfile
                );
                if (result.success) {
                    showMessage('conquista criado com sucesso!', 'success');
                    document.getElementById('rankName').value = '';
                    document.getElementById('rankColor').value = '#6B46C1';
                    document.getElementById('rankDescription').value = '';
                    document.getElementById('rankCustomText').value = '';
                    document.getElementById('rankBackgroundImage').value = '';
                    document.getElementById('rankBackgroundImageFile').value = '';
                    document.getElementById('rankEnableAdminPanel').checked = false;
                    document.getElementById('rankCanManageDownloads').checked = false;
                    const canOrderAllRanksInput = document.getElementById('rankCanOrderAllRanks');
                    if (canOrderAllRanksInput) canOrderAllRanksInput.checked = false;
                    const canUseAnimatedProfileInput = document.getElementById('rankCanUseAnimatedProfile');
                    if (canUseAnimatedProfileInput) canUseAnimatedProfileInput.checked = false;
                    document.getElementById('rankIsVisible').checked = true;
                    loadCustomRanks();
                } else {
                    showMessage('Erro: ' + result.message, 'error');
                }
            } catch (error) {
                showMessage('Erro ao criar conquista: ' + error.message, 'error');
            }
        });
    }

    // Salvar links do WhatsApp/Discord
    const socialLinksForm = document.getElementById('socialLinksForm');
    if (socialLinksForm) {
        socialLinksForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const whatsappUrl = document.getElementById('adminWhatsappUrl')?.value?.trim();
            const discordUrl = document.getElementById('adminDiscordUrl')?.value?.trim();

            if (!whatsappUrl || !discordUrl) {
                showMessage('Preencha as duas URLs da comunidade', 'error');
                return;
            }

            try {
                const result = await AuthAPI.updateSocialLinks(whatsappUrl, discordUrl);
                if (result.success) {
                    showMessage('Links da comunidade atualizados com sucesso!', 'success');
                    if (result.links) {
                        if (document.getElementById('adminWhatsappUrl')) {
                            document.getElementById('adminWhatsappUrl').value = result.links.whatsappUrl || whatsappUrl;
                        }
                        if (document.getElementById('adminDiscordUrl')) {
                            document.getElementById('adminDiscordUrl').value = result.links.discordUrl || discordUrl;
                        }
                    }
                } else {
                    showMessage('Erro: ' + (result.message || 'Falha ao salvar links'), 'error');
                }
            } catch (error) {
                showMessage('Erro ao salvar links: ' + error.message, 'error');
            }
        });
    }

    // Banimento de usu�rios
    const banForm = document.getElementById('banForm');
    if (banForm) {
        banForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userToBan = document.getElementById('userToBan').value;
            const banType = document.getElementById('banType').value;
            const banDays = parseInt(document.getElementById('banDays').value);
            const banReason = document.getElementById('banReason').value;
            
            if (!userToBan || !banReason) {
                showMessage('Preencha todos os campos', 'error');
                return;
            }
            
            if (banType === 'suspension' && !banDays) {
                showMessage('Especifique os dias de suspens�o', 'error');
                return;
            }

            const banDescription = banType === 'suspension'
                ? `suspender "${userToBan}" por ${banDays} dia(s)`
                : `banir permanentemente "${userToBan}"`;
            const keyword = banType === 'suspension' ? 'SUSPENDER' : 'BANIR';
            const confirmed = await confirmCriticalAction({
                title: 'Confirmar banimento',
                message: `Voc� est� prestes a ${banDescription}.`,
                keyword,
                confirmText: banType === 'suspension' ? 'Suspender usu�rio' : 'Banir usu�rio'
            });
            if (!confirmed) {
                showMessage('Opera��o cancelada', 'error');
                return;
            }
            
            try {
                const result = await AuthAPI.banUser(userToBan, banType, banDays, banReason);
                if (result.success) {
                    showMessage(`Usu�rio ${banType === 'suspension' ? 'suspenso' : 'banido'} com sucesso!`, 'success');
                    document.getElementById('userToBan').value = '';
                    document.getElementById('banDays').value = '';
                    document.getElementById('banReason').value = '';
                    loadBans();
                } else {
                    showMessage('Erro: ' + result.message, 'error');
                }
            } catch (error) {
                showMessage('Erro ao banir: ' + error.message, 'error');
            }
        });

        // Alterar UI quando mudar o tipo de ban
        document.getElementById('banType').addEventListener('change', (e) => {
            const daysDiv = document.getElementById('daysDiv');
            const banDaysInput = document.getElementById('banDays');
            if (e.target.value === 'suspension') {
                daysDiv.style.display = 'block';
                banDaysInput.required = true;
            } else {
                daysDiv.style.display = 'none';
                banDaysInput.required = false;
            }
        });
    }

    // Gerenciar permiss�es de postagem
    const grantPermissionForm = document.getElementById('grantPermissionForm');
    if (grantPermissionForm) {
        grantPermissionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('userForPermission').value;
            
            if (!username) {
                showMessage('Digite um nickname ou email', 'error');
                return;
            }

            await saveIndividualPermissions(username);
        });
    }

    // Abas
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            // Remove active de todos os bot�es e conte�dos
            tabBtns.forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Adiciona active ao clicado
            btn.classList.add('active');
            const tabContent = document.getElementById(tabName + '-tab');
            if (tabContent) {
                tabContent.classList.add('active');
                loadTabData(tabName).catch((error) => {
                    console.error('Erro ao carregar aba:', tabName, error);
                });
            }
        });
    });
}

async function loadSocialLinks() {
    const whatsappInput = document.getElementById('adminWhatsappUrl');
    const discordInput = document.getElementById('adminDiscordUrl');

    if (!whatsappInput || !discordInput) return;

    try {
        const result = await AuthAPI.getSocialLinks();
        if (result.success && result.links) {
            whatsappInput.value = result.links.whatsappUrl || '';
            discordInput.value = result.links.discordUrl || '';
        }
    } catch (error) {
        console.warn('Erro ao carregar links da comunidade:', error);
    }
}

// ===================== CONQUISTAS PADR�O =====================
async function loadDefaultRanks() {
    const container = document.getElementById('defaultRanksContainer');
    try {
        const result = await AuthAPI.getDefaultRanks();
        if (result.success && result.ranks) {
            renderRanksList(container, result.ranks, true);
        }
    } catch (error) {
        container.innerHTML = '<p style="color: red;">Erro ao carregar conquistas padr�o</p>';
    }
}

// ===================== CONQUISTAS CUSTOMIZ�VEIS =====================
async function loadCustomRanks() {
    const container = document.getElementById('customRanksContainer');
    try {
        console.log('Carregando conquistas customiz�veis...');
        const result = await AuthAPI.getAllCustomRanks();
        console.log('Resultado da API:', result);
        
        if (result.success) {
            if (!result.ranks || result.ranks.length === 0) {
                container.innerHTML = '<p style="text-align: center; color: #999;">Nenhum conquista customiz�vel criado ainda</p>';
                return;
            }
            console.log('Renderizando', result.ranks.length, 'conquistas customiz�veis');
            renderRanksList(container, result.ranks, false);
        } else {
            console.log('API retornou success: false', result.message);
            container.innerHTML = '<p style="color: red;">Erro ao carregar conquistas: ' + (result.message || 'Erro desconhecido') + '</p>';
        }
    } catch (error) {
        console.error('Erro na fun��o loadCustomRanks:', error);
        container.innerHTML = '<p style="color: red;">Erro ao carregar conquistas: ' + error.message + '</p>';
    }
}

function detectCustomRankGroup(rank) {
    const explicit = String(rank?.rankGroup || '').trim();
    if (explicit) return explicit;

    const icon = String(rank?.icon || '').trim().toUpperCase();
    if (/^P\d+/.test(icon)) return 'post_achievement';
    if (/^L\d+/.test(icon)) return 'like_achievement';
    return 'general';
}

function renderRankCardHtml(rank, isDefault, canManage = !isDefault) {
    return `
        <div class="rank-card" data-rank-id="${rank.id}" data-rank-name="${rank.name}" ${rank.backgroundImage ? `style="background-image: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('${rank.backgroundImage}'); background-size: cover; background-position: center;"` : ''}>
            ${rank.isVisible === 0 ? '<div style="position: absolute; top: 10px; right: 10px; background: rgba(255,0,0,0.9); color: white; padding: 5px 10px; border-radius: 20px; font-size: 11px; font-weight: 600;">Oculto</div>' : ''}
            <div class="rank-icon" style="background-color: ${rank.color}; color: white;">
                ${rank.icon || rank.name.substring(0, 3).toUpperCase()}
            </div>
            <div class="rank-info">
                <h3>${rank.name}</h3>
                ${rank.description ? `<p class="rank-description">${rank.description}</p>` : ''}
                ${rank.customText ? `<p class="rank-custom-text">${rank.customText}</p>` : ''}
            </div>
            ${!isDefault && canManage ? `
                <div class="rank-actions">
                    <button class="edit-btn">Editar</button>
                    <button class="delete-btn delete">Deletar</button>
                </div>
            ` : (!isDefault ? `
                <div class="rank-actions" style="pointer-events: none; opacity: 0.7;">
                    <span style="padding: 5px 10px; font-size: 11px; border-radius: 3px; color: rgba(255,255,255,0.8); border: 1px solid rgba(255,255,255,0.2);">Padr�o</span>
                </div>
            ` : '')}
        </div>
    `;
}

function renderRanksList(container, ranks, isDefault) {
    if (!isDefault) {
        // Para customiz�veis queremos se��es empilhadas; o grid fica apenas dentro de cada se��o.
        container.style.display = 'block';
        container.style.gridTemplateColumns = 'none';
        container.style.gap = '0';
        container.style.marginTop = '15px';

        const groups = {
            general: [],
            post_achievement: [],
            like_achievement: []
        };

        ranks.forEach((rank) => {
            const group = detectCustomRankGroup(rank);
            if (group === 'post_achievement') {
                groups.post_achievement.push(rank);
                return;
            }
            if (group === 'like_achievement') {
                groups.like_achievement.push(rank);
                return;
            }
            groups.general.push(rank);
        });

        const sections = [
            {
                key: 'general',
                title: 'conquistas Personalizados',
                color: '#EC4899',
                emptyMessage: 'Nenhum conquista personalizado criado.'
            },
            {
                key: 'post_achievement',
                title: 'conquistas de Postagens',
                color: '#C084FC',
                emptyMessage: 'Nenhum conquista de postagem encontrado.'
            },
            {
                key: 'like_achievement',
                title: 'conquistas de Likes',
                color: '#38BDF8',
                emptyMessage: 'Nenhum conquista de likes encontrado.'
            }
        ];

        const groupedHtml = sections.map((section) => {
            const list = groups[section.key] || [];
            const canManageSection = section.key === 'general';
            const cardsHtml = list.length > 0
                ? list.map((rank) => renderRankCardHtml(rank, false, canManageSection)).join('')
                : `<p style="margin: 0; color: rgba(255,255,255,0.55); font-size: 13px;">${section.emptyMessage}</p>`;

            return `
                <div style="margin-bottom: 18px; border: 1px solid ${section.color}44; border-radius: 10px; padding: 12px;">
                    <h3 style="margin: 0 0 10px 0; color: ${section.color}; font-size: 15px; font-weight: 700;">
                        ${section.title} <span style="opacity: .75; font-weight: 500;">(${list.length})</span>
                    </h3>
                    <div class="ranks-list">
                        ${cardsHtml}
                    </div>
                </div>
            `;
        }).join('');

        container.innerHTML = groupedHtml;
    } else {
        // Restaurar comportamento padr�o (grid) para os conquistas n�o remov�veis.
        container.style.display = '';
        container.style.gridTemplateColumns = '';
        container.style.gap = '';
        container.style.marginTop = '';
        container.innerHTML = ranks.map((rank) => renderRankCardHtml(rank, true)).join('');
    }
    
    // Attach event listeners
    if (!isDefault) {
        container.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.rank-card');
                const rankId = card.dataset.rankId;
                const rankName = card.dataset.rankName;
                deleteRank(rankId, rankName);
            });
        });
        
        container.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const card = e.target.closest('.rank-card');
                const rankId = card.dataset.rankId;
                const rankName = card.dataset.rankName;
                editRank(rankId, rankName);
            });
        });
    }
}

async function deleteRank(rankId, rankName) {
    const confirmed = await showThemeConfirm(
        'Excluir conquista',
        `Tem certeza que deseja deletar a conquista "${rankName}"?`,
        { confirmText: 'Excluir', cancelText: 'Cancelar', danger: true }
    );

    if (!confirmed) {
        return;
    }
    
    try {
        const result = await AuthAPI.deleteCustomRank(rankId);
        if (result.success) {
            showMessage('conquista deletado com sucesso!', 'success');
            loadCustomRanks();
        } else {
            showMessage('Erro: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage('Erro ao deletar conquista: ' + error.message, 'error');
    }
}

async function editRank(rankId, rankName) {
    try {
        const allRanks = await AuthAPI.getAllCustomRanks();
        const rankData = allRanks.ranks?.find(r => r.id == rankId);
        if (!rankData) {
            showMessage('conquista n�o encontrado', 'error');
            return;
        }

        const enableAdminPanelEnabled = Number(rankData?.enableAdminPanel) === 1 || rankData?.enableAdminPanel === true;
        const canManageDownloadsEnabled = Number(rankData?.canManageDownloads) === 1 || rankData?.canManageDownloads === true;
        const canOrderAllRanksEnabled = Number(rankData?.canOrderAllRanks) === 1 || rankData?.canOrderAllRanks === true;
        const canUseAnimatedProfileEnabled = Number(rankData?.canUseAnimatedProfile) === 1 || rankData?.canUseAnimatedProfile === true;

        const modal = document.createElement('div');
        modal.id = 'editRankModal';
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

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #6B46C1;
                border-radius: 15px;
                padding: 30px;
                max-width: 560px;
                width: 92%;
                max-height: 90vh;
                overflow-y: auto;
            ">
                <h2 style="color: #EC4899; margin-top: 0; text-align: center;">Editar conquista: ${rankName}</h2>
                <form id="editRankForm">
                    <div style="margin-bottom: 15px;">
                        <label style="color: white; display: block; margin-bottom: 5px;">Nome *</label>
                        <input type="text" id="editRankName" placeholder="Nome do conquista" value="${rankData.name || ''}" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid #6B46C1; color: white; border-radius: 5px;">
                        <small style="color: #10B981;">A imagem sera renomeada automaticamente se existir arquivo com o nome antigo</small>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="color: white; display: block; margin-bottom: 5px;">Cor *</label>
                        <input type="color" id="editRankColor" value="${rankData.color || '#6B46C1'}" style="width: 100%; height: 50px; padding: 5px; background: rgba(0,0,0,0.3); border: 1px solid #6B46C1; border-radius: 5px; cursor: pointer;">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="color: white; display: block; margin-bottom: 5px;">Descri��o *</label>
                        <textarea id="editRankDescription" placeholder="Descri��o" style="width: 100%; height: 70px; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid #6B46C1; color: white; border-radius: 5px; resize: none;">${rankData.description || ''}</textarea>
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="color: white; display: block; margin-bottom: 5px;">Texto Customiz�vel *</label>
                        <input type="text" id="editRankCustomText" placeholder="Texto customiz�vel" value="${rankData.customText || ''}" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid #6B46C1; color: white; border-radius: 5px;">
                    </div>

                    <div style="margin-bottom: 15px;">
                        <label style="color: white; display: block; margin-bottom: 5px;">Imagem de Fundo (URL ou upload)</label>
                        <input type="text" id="editRankBackgroundImage" placeholder="Cole a URL da imagem ou deixe em branco" value="${rankData.backgroundImage || ''}" style="width: 100%; padding: 10px; background: rgba(0,0,0,0.3); border: 1px solid #6B46C1; color: white; border-radius: 5px; margin-bottom: 8px;">
                        <input type="file" id="editRankBackgroundImageFile" accept="image/*" style="width: 100%; padding: 8px; background: rgba(0,0,0,0.3); border: 1px solid #6B46C1; border-radius: 5px; color: white;">
                        <small style="color: rgba(255,255,255,0.65); display: block; margin-top: 6px;">Se selecionar arquivo, ele ter� prioridade sobre a URL.</small>
                    </div>

                    <div style="margin: 20px 0; padding: 15px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.4); border-radius: 5px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: #10B981; font-weight: 600;">
                            <input type="checkbox" id="editRankEnableAdminPanel" ${enableAdminPanelEnabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Habilitar Painel Admin para esta conquista</span>
                        </label>
                        <small style="color: rgba(16, 185, 129, 0.85); display: block; margin-top: 8px;">Usu�rios com esta conquista poder�o acessar o painel de administra��o com permiss�es limitadas</small>
                    </div>

                    <div style="margin: 20px 0; padding: 15px; background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.4); border-radius: 5px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: #3B82F6; font-weight: 600;">
                            <input type="checkbox" id="editRankIsVisible" ${rankData.isVisible !== 0 ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Permitir Usu�rio Escolher (Exibir/Ocultar)</span>
                        </label>
                        <small style="color: rgba(59, 130, 246, 0.8); display: block; margin-top: 8px;">Marcado: usu�rio pode escolher exibir ou n�o a conquista. Desmarcado: conquista fica fixa nas conquistas</small>
                    </div>

                    <div style="margin: 20px 0; padding: 15px; background: rgba(236, 72, 153, 0.1); border: 1px solid rgba(236, 72, 153, 0.4); border-radius: 5px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: #EC4899; font-weight: 600;">
                            <input type="checkbox" id="editRankCanManageDownloads" ${canManageDownloadsEnabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Permitir Editar/Excluir Downloads</span>
                        </label>
                        <small style="color: rgba(236, 72, 153, 0.85); display: block; margin-top: 8px;">Usu�rios com esta conquista poder�o editar e excluir seus pr�prios downloads e tamb�m os de outros usu�rios</small>
                    </div>

                    <div style="margin: 20px 0; padding: 15px; background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 5px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: #F59E0B; font-weight: 600;">
                            <input type="checkbox" id="editRankCanOrderAllRanks" ${canOrderAllRanksEnabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Permitir Usu�rio Ordenar Todos os conquistas (incluindo fixos)</span>
                        </label>
                        <small style="color: rgba(245, 158, 11, 0.85); display: block; margin-top: 8px;">Com esta conquista, o usu�rio pode reordenar tamb�m conquistas fixas no perfil.</small>
                    </div>

                    <div style="margin: 20px 0; padding: 15px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.45); border-radius: 5px;">
                        <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: #38BDF8; font-weight: 600;">
                            <input type="checkbox" id="editRankCanUseAnimatedProfile" ${canUseAnimatedProfileEnabled ? 'checked' : ''} style="width: 18px; height: 18px; cursor: pointer;">
                            <span>Permitir usu�rio tenha Card animado</span>
                        </label>
                        <small style="color: rgba(56, 189, 248, 0.85); display: block; margin-top: 8px;">Mostra o bot�o "Perfil Animado" no perfil do usu�rio.</small>
                    </div>

                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button type="submit" style="flex: 1; padding: 10px; background: linear-gradient(135deg, #EC4899 0%, #6B46C1 100%); color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: 600;">Salvar</button>
                        <button type="button" id="closeEditModal" style="flex: 1; padding: 10px; background: rgba(255,0,0,0.2); color: white; border: 1px solid red; border-radius: 5px; cursor: pointer; font-weight: 600;">Cancelar</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('closeEditModal').addEventListener('click', () => {
            modal.remove();
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        document.getElementById('editRankForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('editRankName').value.trim();
            const color = document.getElementById('editRankColor').value;
            const description = document.getElementById('editRankDescription').value.trim();
            const customText = document.getElementById('editRankCustomText').value.trim();
            const backgroundImageUrl = document.getElementById('editRankBackgroundImage').value.trim();
            const backgroundImageFile = document.getElementById('editRankBackgroundImageFile').files[0];
            const enableAdminPanel = document.getElementById('editRankEnableAdminPanel').checked;
            const isVisible = document.getElementById('editRankIsVisible').checked;
            const canManageDownloads = document.getElementById('editRankCanManageDownloads').checked;
            const canOrderAllRanks = document.getElementById('editRankCanOrderAllRanks')?.checked || false;
            const canUseAnimatedProfile = document.getElementById('editRankCanUseAnimatedProfile')?.checked || false;

            if (!name || !color || !description || !customText) {
                showMessage('Preencha todos os campos obrigat�rios', 'error');
                return;
            }

            try {
                const resolvedBackgroundImageUrl = await resolveImageUrlFromInputs(backgroundImageUrl, backgroundImageFile);
                const result = await AuthAPI.updateCustomRank(
                    rankId,
                    name,
                    color,
                    description,
                    customText,
                    resolvedBackgroundImageUrl,
                    enableAdminPanel,
                    isVisible,
                    canManageDownloads,
                    canOrderAllRanks,
                    canUseAnimatedProfile
                );

                if (result.success) {
                    showMessage('conquista atualizado com sucesso!', 'success');
                    modal.remove();
                    loadCustomRanks();
                } else {
                    showMessage('Erro: ' + result.message, 'error');
                }
            } catch (error) {
                showMessage('Erro ao atualizar conquista: ' + error.message, 'error');
            }
        });
    } catch (error) {
        showMessage('Erro ao carregar dados do conquista: ' + error.message, 'error');
    }
}

// ===================== USU�RIOS E SEUS CONQUISTAS =====================
async function loadUsers() {
    const container = document.getElementById('usersContainer');
    try {
        const result = await AuthAPI.getAdminUsers();
        canRevealEmails = result?.canManageSensitiveAccounts === true;

        if (!result.success || !result.users || result.users.length === 0) {
            cachedUsers = [];
            currentUsersPage = 1;
            container.innerHTML = '<p>Nenhum usu�rio encontrado</p>';
            return;
        }

        const visibleUsers = result.users.filter((user) => !isExampleEmail(user));
        cachedUsers = visibleUsers;
        currentUsersPage = 1;

        if (cachedUsers.length === 0) {
            container.innerHTML = '<p>Nenhum usu�rio encontrado</p>';
            return;
        }

        renderUsersPage(container);
    } catch (error) {
        cachedUsers = [];
        currentUsersPage = 1;
        container.innerHTML = '<p style="color: red;">Erro ao carregar usu�rios: ' + error.message + '</p>';
    }
}

function renderUsersPage(container) {
    const totalUsers = cachedUsers.length;
    if (!totalUsers) {
        container.innerHTML = '<p>Nenhum usu�rio encontrado</p>';
        return;
    }

    const totalPages = Math.max(1, Math.ceil(totalUsers / USERS_PER_PAGE));
    currentUsersPage = Math.min(Math.max(1, currentUsersPage), totalPages);

    const start = (currentUsersPage - 1) * USERS_PER_PAGE;
    const end = start + USERS_PER_PAGE;
    const users = cachedUsers.slice(start, end);

    renderUsersList(container, users);

    if (totalPages <= 1) return;

    const controls = document.createElement('div');
    controls.className = 'users-pagination';
    controls.innerHTML = `
        <button type="button" class="users-page-btn" data-move="prev" ${currentUsersPage === 1 ? 'disabled' : ''}>Anterior</button>
        <span class="users-page-label">P�gina ${currentUsersPage} de ${totalPages}</span>
        <button type="button" class="users-page-btn" data-move="next" ${currentUsersPage === totalPages ? 'disabled' : ''}>Pr�xima</button>
    `;

    controls.querySelectorAll('.users-page-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
            const move = btn.getAttribute('data-move');
            if (move === 'prev' && currentUsersPage > 1) {
                currentUsersPage -= 1;
                renderUsersPage(container);
                return;
            }
            if (move === 'next' && currentUsersPage < totalPages) {
                currentUsersPage += 1;
                renderUsersPage(container);
            }
        });
    });

    container.appendChild(controls);
}

function renderUsersList(container, users) {
    rawEmailByUserId.clear();
    userLabelByUserId.clear();

    let html = `
        <div class="users-table-wrap">
            <table class="users-table">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Nickname</th>
                        <th>E-mail</th>
                        <th>conquistas Customiz�veis</th>
                        <th>Ordenar Todos</th>
                        <th>A��es</th>
                    </tr>
                </thead>
                <tbody>
    `;

    users.forEach(user => {
        const userId = String(user.id);
        const rawEmail = String(user.email || '').trim();
        const isOwnerAccount = Boolean(user.isOwnerAccount) || rawEmail.toLowerCase() === OWNER_EMAIL_VIEWER;
        const displayName = `${user.firstName} ${user.lastName}`.trim();
        userLabelByUserId.set(userId, displayName || user.nickname || `ID ${userId}`);

        if (canRevealEmails) {
            rawEmailByUserId.set(userId, rawEmail);
        }

        const emailCell = canRevealEmails
            ? `
                <div class="email-reveal-wrap">
                    <span id="emailText-${userId}" data-visible="false">${maskEmail(rawEmail)}</span>
                    <button type="button" class="toggle-email-btn" data-user-id="${userId}">Mostrar</button>
                </div>
            `
            : rawEmail;

        const deleteAction = canRevealEmails && !isOwnerAccount
            ? `<button class="delete-account-btn" data-user-id="${user.id}">Excluir conta</button>`
            : '';

        html += `
            <tr>
                <td>${user.firstName} ${user.lastName}</td>
                <td><strong>${user.nickname}</strong></td>
                <td>${emailCell}</td>
                <td id="ranks-${user.id}"><span class="loading">Carregando...</span></td>
                <td>
                    <span style="font-size:12px; color:${user.canOrderFixedRanks ? '#10B981' : '#999'}; font-weight:600;">
                        ${user.canOrderFixedRanks ? 'Permitido' : 'Bloqueado'}
                    </span>
                </td>
                <td>
                    <div class="user-actions-stack">
                        <div class="rank-select">
                            <select id="rankSelect-${user.id}">
                                <option value="">-- Adicionar conquista --</option>
                            </select>
                            <button class="add-rank-btn" data-user-id="${user.id}">Adicionar</button>
                        </div>
                        ${deleteAction}
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
    `;
    container.innerHTML = html;

    container.querySelectorAll('.toggle-email-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = String(e.currentTarget.dataset.userId || '');
            toggleEmailVisibility(userId);
        });
    });

    container.querySelectorAll('.add-rank-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.target.dataset.userId;
            addUserRank(userId);
        });
    });

    container.querySelectorAll('.delete-account-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const userId = e.currentTarget.dataset.userId;
            deleteUserAccount(userId);
        });
    });

    users.forEach(user => {
        loadUserRanks(user.id);
        loadRankSelectOptions(user.id);
    });
}

function toggleEmailVisibility(userId) {
    if (!canRevealEmails) return;

    const emailTextEl = document.getElementById(`emailText-${userId}`);
    const buttonEl = document.querySelector(`.toggle-email-btn[data-user-id="${userId}"]`);
    const rawEmail = rawEmailByUserId.get(String(userId));

    if (!emailTextEl || !buttonEl || !rawEmail) return;

    const isVisible = emailTextEl.dataset.visible === 'true';
    if (isVisible) {
        emailTextEl.textContent = maskEmail(rawEmail);
        emailTextEl.dataset.visible = 'false';
        buttonEl.textContent = 'Mostrar';
        return;
    }

    emailTextEl.textContent = rawEmail;
    emailTextEl.dataset.visible = 'true';
    buttonEl.textContent = 'Ocultar';
}

function renderUserRankBadge(userId, rank) {
    return `
        <span class="user-rank-badge" style="background-color: ${rank.color}40; border-color: ${rank.color}; color: ${rank.color};" data-user-id="${userId}" data-rank-id="${rank.id}">
            ${rank.icon ? `<span class="user-rank-icon">${rank.icon}</span>` : ''}
            <span class="user-rank-label" title="${rank.name}">${rank.name}</span>
            <button class="remove-rank-btn" style="background: none; border: none; color: ${rank.color}; cursor: pointer; padding: 0; margin-left: 4px; font-weight: bold;">�</button>
        </span>
    `;
}

async function loadUserRanks(userId) {
    try {
        const result = await AuthAPI.getUserCustomRanks(userId);
        const container = document.getElementById(`ranks-${userId}`);
        if (!container) return;
        
        if (result.success && result.ranks && result.ranks.length > 0) {
            const compactLimit = 4;
            const visibleRanks = result.ranks.slice(0, compactLimit);
            const hiddenRanks = result.ranks.slice(compactLimit);

            let html = `<div class="user-ranks">${visibleRanks.map((rank) => renderUserRankBadge(userId, rank)).join('')}</div>`;

            if (hiddenRanks.length > 0) {
                html += `
                    <button type="button" class="toggle-user-ranks-btn" data-user-id="${userId}" data-expanded="false">
                        +${hiddenRanks.length} mais
                    </button>
                    <div id="hiddenRanks-${userId}" class="user-ranks user-ranks-hidden" style="display: none;">
                        ${hiddenRanks.map((rank) => renderUserRankBadge(userId, rank)).join('')}
                    </div>
                `;
            }

            container.innerHTML = html;
            
            // Attach remove buttons listeners
            container.querySelectorAll('.remove-rank-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const badge = e.target.closest('.user-rank-badge');
                    const userId = badge.dataset.userId;
                    const rankId = badge.dataset.rankId;
                    removeUserRank(userId, rankId);
                });
            });

            const toggleBtn = container.querySelector('.toggle-user-ranks-btn');
            if (toggleBtn) {
                toggleBtn.addEventListener('click', () => {
                    const hiddenContainer = container.querySelector(`#hiddenRanks-${userId}`);
                    if (!hiddenContainer) return;

                    const expanded = toggleBtn.dataset.expanded === 'true';
                    if (expanded) {
                        hiddenContainer.style.display = 'none';
                        toggleBtn.dataset.expanded = 'false';
                        toggleBtn.textContent = `+${hiddenRanks.length} mais`;
                        return;
                    }

                    hiddenContainer.style.display = 'flex';
                    toggleBtn.dataset.expanded = 'true';
                    toggleBtn.textContent = 'Ocultar';
                });
            }
        } else {
            container.innerHTML = '<p style="color: #999; font-size: 12px;">Nenhum conquista atribu�do</p>';
        }
    } catch (error) {
        console.error('Erro ao carregar conquistas do usu�rio:', error);
    }
}

async function loadRankSelectOptions(userId) {
    try {
        const result = await AuthAPI.getAllCustomRanks();
        const select = document.getElementById(`rankSelect-${userId}`);
        if (!select) return;
        
        if (result.success && result.ranks) {
            result.ranks.forEach(rank => {
                const option = document.createElement('option');
                option.value = rank.id;
                option.textContent = rank.name;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar op��es de conquistas:', error);
    }
}

async function addUserRank(userId) {
    const select = document.getElementById(`rankSelect-${userId}`);
    const customRankId = select.value;
    
    if (!customRankId) {
        showMessage('Selecione um conquista primeiro', 'error');
        return;
    }
    
    try {
        const result = await AuthAPI.addUserCustomRank(userId, customRankId);
        if (result.success) {
            showMessage('conquista atribu�do com sucesso!', 'success');
            loadUserRanks(userId);
            select.value = '';
        } else {
            showMessage('Erro: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage('Erro ao atribuir conquista: ' + error.message, 'error');
    }
}

async function removeUserRank(userId, customRankId) {
    if (!confirm('Tem certeza que deseja remover este conquista do usu�rio?')) {
        return;
    }
    
    try {
        const result = await AuthAPI.removeUserCustomRank(userId, customRankId);
        if (result.success) {
            showMessage('conquista removido com sucesso!', 'success');
            loadUserRanks(userId);
        } else {
            showMessage('Erro: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage('Erro ao remover conquista: ' + error.message, 'error');
    }
}

async function deleteUserAccount(userId) {
    if (!canRevealEmails) {
        showMessage('Somente o dono da conta pode excluir usu�rios', 'error');
        return;
    }

    const normalizedId = Number(userId);
    if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
        showMessage('ID de usu�rio inv�lido', 'error');
        return;
    }

    const label = userLabelByUserId.get(String(normalizedId)) || `ID ${normalizedId}`;
    const confirmed = await confirmCriticalAction({
        title: 'Excluir conta',
        message: `Tem certeza que deseja excluir completamente a conta de ${label}? Esta a��o remove perfil, conquistas, downloads e hist�rico relacionado.`,
        confirmText: 'Excluir conta',
        keyword: 'EXCLUIR'
    });

    if (!confirmed) return;

    try {
        const result = await AuthAPI.deleteUserAccount(normalizedId);
        if (result.success) {
            showMessage(result.message || 'Conta exclu�da com sucesso!', 'success');
            await loadUsers();
            loadBans();
            loadPostPermissions();
        } else {
            showMessage('Erro: ' + (result.message || 'Falha ao excluir conta'), 'error');
        }
    } catch (error) {
        showMessage('Erro ao excluir conta: ' + error.message, 'error');
    }
}

// ===================== UTILIT�RIOS =====================
function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve('');
            return;
        }

        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = () => reject(new Error('Erro ao ler arquivo de imagem'));
        reader.readAsDataURL(file);
    });
}

async function resolveImageUrlFromInputs(urlValue, fileValue) {
    const cleanUrl = String(urlValue || '').trim();
    if (fileValue) {
        return await readFileAsDataUrl(fileValue);
    }
    return cleanUrl;
}

function showThemeConfirm(title, message, options = {}) {
    return new Promise((resolve) => {
        const {
            confirmText = 'Confirmar',
            cancelText = 'Cancelar',
            danger = false
        } = options;

        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(2, 6, 23, 0.74);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 20000;
            padding: 16px;
        `;

        const confirmBg = danger
            ? 'linear-gradient(135deg, #EC4899 0%, #DB2777 100%)'
            : 'linear-gradient(135deg, #6B46C1 0%, #8B5CF6 100%)';

        overlay.innerHTML = `
            <div style="
                width: 100%;
                max-width: 460px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(236, 72, 153, 0.55);
                border-radius: 14px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.45);
                padding: 22px;
                color: #fff;
            ">
                <h3 style="margin: 0 0 10px 0; font-size: 22px; color: #EC4899;">${title}</h3>
                <p style="margin: 0 0 18px 0; line-height: 1.45; color: rgba(255,255,255,0.9);">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button type="button" id="themeConfirmCancel" style="padding: 10px 16px; border-radius: 8px; border: 1px solid rgba(236,72,153,0.45); background: transparent; color: #fff; cursor: pointer; font-weight: 600;">${cancelText}</button>
                    <button type="button" id="themeConfirmOk" style="padding: 10px 16px; border-radius: 8px; border: none; background: ${confirmBg}; color: #fff; cursor: pointer; font-weight: 700;">${confirmText}</button>
                </div>
            </div>
        `;

        const cleanup = (result) => {
            overlay.remove();
            resolve(result);
        };

        overlay.querySelector('#themeConfirmCancel')?.addEventListener('click', () => cleanup(false));
        overlay.querySelector('#themeConfirmOk')?.addEventListener('click', () => cleanup(true));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(false);
        });

        document.body.appendChild(overlay);
    });
}

function showKeywordConfirm(title, message, keyword) {
    return new Promise((resolve) => {
        const expected = String(keyword || '').trim().toUpperCase();
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(2, 6, 23, 0.78);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 21000;
            padding: 16px;
        `;

        overlay.innerHTML = `
            <div style="
                width: 100%;
                max-width: 460px;
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 1px solid rgba(236, 72, 153, 0.55);
                border-radius: 14px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.45);
                padding: 22px;
                color: #fff;
            ">
                <h3 style="margin: 0 0 10px 0; font-size: 22px; color: #EC4899;">${title}</h3>
                <p style="margin: 0 0 12px 0; line-height: 1.45; color: rgba(255,255,255,0.9);">${message}</p>
                <p style="margin: 0 0 10px 0; color: #FBCFE8; font-size: 13px;">Digite <strong>${expected}</strong> para confirmar:</p>
                <input id="keywordConfirmInput" type="text" autocomplete="off" style="width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid rgba(236,72,153,0.45); background: rgba(15, 23, 42, 0.65); color: #fff; outline: none;">
                <div style="display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px;">
                    <button type="button" id="keywordConfirmCancel" style="padding: 10px 16px; border-radius: 8px; border: 1px solid rgba(236,72,153,0.45); background: transparent; color: #fff; cursor: pointer; font-weight: 600;">Cancelar</button>
                    <button type="button" id="keywordConfirmOk" style="padding: 10px 16px; border-radius: 8px; border: none; background: linear-gradient(135deg, #EC4899 0%, #DB2777 100%); color: #fff; cursor: pointer; font-weight: 700;" disabled>Confirmar</button>
                </div>
            </div>
        `;

        const input = overlay.querySelector('#keywordConfirmInput');
        const confirmBtn = overlay.querySelector('#keywordConfirmOk');

        const cleanup = (result) => {
            overlay.remove();
            resolve(result);
        };

        input?.addEventListener('input', () => {
            const current = String(input.value || '').trim().toUpperCase();
            confirmBtn.disabled = current !== expected;
        });

        overlay.querySelector('#keywordConfirmCancel')?.addEventListener('click', () => cleanup(false));
        confirmBtn?.addEventListener('click', () => cleanup(true));
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) cleanup(false);
        });

        document.body.appendChild(overlay);
        input?.focus();
    });
}

async function confirmCriticalAction(options = {}) {
    const {
        title = 'Confirmar a��o',
        message = 'Tem certeza que deseja continuar?',
        confirmText = 'Confirmar',
        keyword = ''
    } = options;

    const firstStep = await showThemeConfirm(title, message, {
        confirmText,
        cancelText: 'Cancelar',
        danger: true
    });
    if (!firstStep) return false;

    const normalizedKeyword = String(keyword || '').trim();
    if (!normalizedKeyword) return true;

    return showKeywordConfirm(
        'Confirma��o adicional',
        'A��o cr�tica detectada.',
        normalizedKeyword
    );
}

function showMessage(message, type) {
    const messageDiv = document.getElementById('message');
    messageDiv.className = 'message ' + type;
    messageDiv.textContent = message;
    messageDiv.style.display = 'block';
    
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// ===================== BANIMENTOS =====================
async function loadBans() {
    const container = document.getElementById('bansListContainer');
    try {
        const result = await AuthAPI.getBans();
        if (result.success && result.bans && result.bans.length > 0) {
            let html = '';
            result.bans.forEach(ban => {
                if (isExampleEmail(ban.email)) {
                    return;
                }

                const banDate = new Date(ban.createdAt).toLocaleDateString('pt-BR');
                const expiryDate = ban.banType === 'suspension' && ban.expiresAt ? 
                    new Date(ban.expiresAt).toLocaleDateString('pt-BR') : 
                    'Permanente';
                const isExpired = ban.banType === 'suspension' && ban.expiresAt && new Date(ban.expiresAt) < new Date();
                
                html += `
                    <div class="ban-card" data-ban-id="${ban.id}">
                        <div class="ban-info">
                            <h3>${ban.nickname} (${maskEmail(ban.email)})</h3>
                            <div class="ban-details">
                                <strong>Tipo:</strong> ${ban.banType === 'suspension' ? 'Suspens�o Tempor�ria' : 'Ban Permanente'} ${isExpired ? '(Expirado)' : ''}
                            </div>
                            <div class="ban-details">
                                <strong>Motivo:</strong> ${ban.reason || 'Nenhum motivo fornecido'}
                            </div>
                            <div class="ban-details">
                                <strong>Data do Ban:</strong> ${banDate}
                            </div>
                            ${ban.banType === 'suspension' && ban.expiresAt ? `<div class="ban-details"><strong>Expira em:</strong> ${expiryDate}</div>` : ''}
                        </div>
                        <div class="ban-actions">
                            <button class="unban" onclick="unbanUser(${ban.id})">Desbanir</button>
                        </div>
                    </div>
                `;
            });
            container.innerHTML = html;
        } else {
            container.innerHTML = '<p style="text-align: center; color: #999;">Nenhum usu�rio banido</p>';
        }
    } catch (error) {
        container.innerHTML = '<p style="color: red;">Erro ao carregar banimentos</p>';
        console.error('Erro ao carregar bans:', error);
    }
}

async function unbanUser(banId) {
    const confirmed = await confirmCriticalAction({
        title: 'Desbanir usu�rio',
        message: 'Tem certeza que deseja remover este banimento?',
        confirmText: 'Desbanir',
        keyword: 'DESBANIR'
    });
    if (!confirmed) {
        return;
    }
    
    try {
        const result = await AuthAPI.unbanUser(banId);
        if (result.success) {
            showMessage('Usu�rio desbanido com sucesso!', 'success');
            loadBans();
        } else {
            showMessage('Erro: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage('Erro ao desbanir: ' + error.message, 'error');
    }
}
// ===================== GERENCIAR PERMISSOES DE POSTAGEM =====================

async function loadPostPermissions() {
    const container = document.getElementById('postPermissionsContainer');
    const table = document.getElementById('postPermissionsTable');
    const tbody = document.getElementById('postPermissionsTableBody');
    
    try {
        const result = await AuthAPI.getUsersWithPostPermission();
        
        const users = (result.users || []).filter((user) => !isExampleEmail(user.email));

        if (result.success && users.length > 0) {
            tbody.innerHTML = users.map(user => `
                <tr>
                    <td><strong>${user.nickname}</strong></td>
                    <td>${maskEmail(user.email)}</td>
                    <td><span style="background: rgba(236, 72, 153, 0.3); padding: 4px 8px; border-radius: 3px;">${user.downloadCount}</span></td>
                    <td>
                        <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                            ${user.canPostDownloads ? '<span style="padding: 3px 8px; border-radius: 999px; background: rgba(244,114,182,0.2); border: 1px solid rgba(244,114,182,0.45); color: #F9A8D4; font-size: 11px;">Postar</span>' : ''}
                            ${user.canManageDownloads ? '<span style="padding: 3px 8px; border-radius: 999px; background: rgba(236,72,153,0.2); border: 1px solid rgba(236,72,153,0.45); color: #F472B6; font-size: 11px;">Gerenciar Downloads</span>' : ''}
                            ${user.canOrderFixedRanks ? '<span style="padding: 3px 8px; border-radius: 999px; background: rgba(245,158,11,0.2); border: 1px solid rgba(245,158,11,0.45); color: #FBBF24; font-size: 11px;">Ordenar Fixos</span>' : ''}
                            ${user.canAccessAdminPanel ? '<span style="padding: 3px 8px; border-radius: 999px; background: rgba(16,185,129,0.2); border: 1px solid rgba(16,185,129,0.45); color: #34D399; font-size: 11px;">Painel Admin</span>' : ''}
                            ${user.canUseAnimatedProfile ? '<span style="padding: 3px 8px; border-radius: 999px; background: rgba(56,189,248,0.2); border: 1px solid rgba(56,189,248,0.45); color: #38BDF8; font-size: 11px;">Card Animado</span>' : ''}
                        </div>
                    </td>
                    <td>
                        <div style="display:flex; gap:8px; flex-wrap: wrap;">
                            <button onclick="prefillPermissionsForm('${user.nickname}', ${Number(user.canPostDownloads) === 1}, ${Number(user.canManageDownloads) === 1}, ${Number(user.canOrderFixedRanks) === 1}, ${Number(user.canAccessAdminPanel) === 1}, ${Number(user.canUseAnimatedProfile) === 1})" style="padding: 6px 12px; background: #6B46C1; border: none; border-radius: 3px; color: white; cursor: pointer; font-weight: 600;">Editar</button>
                            <button onclick="clearIndividualPermissions('${user.nickname}')" style="padding: 6px 12px; background: #FF6B6B; border: none; border-radius: 3px; color: white; cursor: pointer; font-weight: 600;">Revogar tudo</button>
                        </div>
                    </td>
                </tr>
            `).join('');
            
            table.style.display = 'table';
            container.style.display = 'none';
        } else {
            container.innerHTML = '<p style="text-align: center; color: #999;">Nenhum usu�rio com permiss�es individuais</p>';
            container.style.display = 'block';
            table.style.display = 'none';
        }
    } catch (error) {
        container.innerHTML = '<p style="color: red;">Erro ao carregar permiss�es</p>';
        console.error('Erro ao carregar permiss�es:', error);
    }
}

async function loadPostageRanks() {
    const container = document.getElementById('postageRanksContainer');
    
    try {
        const result = await AuthAPI.getPostageRanks();
        
        if (result.success && result.ranks && result.ranks.length > 0) {
            container.innerHTML = result.ranks.map(rank => `
                <div class="rank-card" style="flex-direction: column; align-items: flex-start; background: linear-gradient(135deg, ${rank.color}22, ${rank.color}11);">
                    <div style="display: flex; align-items: center; gap: 10px; width: 100%; margin-bottom: 10px;">
                        <div style="font-size: 32px;">${rank.icon}</div>
                        <div>
                            <h3 style="margin: 0; color: ${rank.color};">${rank.name}</h3>
                            <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.6);">N�vel ${rank.rankLevel}/10</p>
                        </div>
                    </div>
                    <p style="margin: 0; font-size: 12px; color: rgba(255, 255, 255, 0.7); width: 100%;">
                        <strong>${rank.minPostages} postagens</strong> necess�rias
                    </p>
                    <small style="color: rgba(255, 255, 255, 0.6); margin-top: 8px;">${rank.description}</small>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p style="text-align: center; color: #999;">Erro ao carregar conquistas</p>';
        }
    } catch (error) {
        container.innerHTML = '<p style="color: red;">Erro ao carregar conquistas de postagem</p>';
        console.error('Erro:', error);
    }
}

function getPermissionsFromForm() {
    return {
        canPostDownloads: Boolean(document.getElementById('permCanPostDownloads')?.checked),
        canManageDownloads: Boolean(document.getElementById('permCanManageDownloads')?.checked),
        canOrderFixedRanks: Boolean(document.getElementById('permCanOrderFixedRanks')?.checked),
        canAccessAdminPanel: Boolean(document.getElementById('permCanAccessAdminPanel')?.checked),
        canUseAnimatedProfile: Boolean(document.getElementById('permCanUseAnimatedProfile')?.checked)
    };
}

function applyPermissionsToForm(permissions = {}) {
    if (document.getElementById('permCanPostDownloads')) {
        document.getElementById('permCanPostDownloads').checked = Boolean(permissions.canPostDownloads);
    }
    if (document.getElementById('permCanManageDownloads')) {
        document.getElementById('permCanManageDownloads').checked = Boolean(permissions.canManageDownloads);
    }
    if (document.getElementById('permCanOrderFixedRanks')) {
        document.getElementById('permCanOrderFixedRanks').checked = Boolean(permissions.canOrderFixedRanks);
    }
    if (document.getElementById('permCanAccessAdminPanel')) {
        document.getElementById('permCanAccessAdminPanel').checked = Boolean(permissions.canAccessAdminPanel);
    }
    if (document.getElementById('permCanUseAnimatedProfile')) {
        document.getElementById('permCanUseAnimatedProfile').checked = Boolean(permissions.canUseAnimatedProfile);
    }
}

function prefillPermissionsForm(username, canPostDownloads, canManageDownloads, canOrderFixedRanks, canAccessAdminPanel, canUseAnimatedProfile) {
    const userInput = document.getElementById('userForPermission');
    if (userInput) userInput.value = username;
    applyPermissionsToForm({
        canPostDownloads,
        canManageDownloads,
        canOrderFixedRanks,
        canAccessAdminPanel,
        canUseAnimatedProfile
    });
}

async function saveIndividualPermissions(username) {
    const permissions = getPermissionsFromForm();
    try {
        const result = await AuthAPI.setUserPermissions(username, permissions);
        if (result.success) {
            showMessage(`Permiss�es salvas para ${username}!`, 'success');
            document.getElementById('userForPermission').value = '';
            applyPermissionsToForm({
                canPostDownloads: false,
                canManageDownloads: false,
                canOrderFixedRanks: false,
                canAccessAdminPanel: false,
                canUseAnimatedProfile: false
            });
            loadPostPermissions();
        } else {
            showMessage('Erro: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage('Erro ao salvar permiss�es: ' + error.message, 'error');
    }
}

async function clearIndividualPermissions(username) {
    if (!confirm(`Tem certeza que deseja revogar todas as permiss�es de ${username}?`)) {
        return;
    }
    
    try {
        const result = await AuthAPI.setUserPermissions(username, {
            canPostDownloads: false,
            canManageDownloads: false,
            canOrderFixedRanks: false,
            canAccessAdminPanel: false,
            canUseAnimatedProfile: false
        });
        if (result.success) {
            showMessage(`Permiss�es removidas de ${username}!`, 'success');
            loadPostPermissions();
        } else {
            showMessage('Erro: ' + result.message, 'error');
        }
    } catch (error) {
        showMessage('Erro ao remover permiss�es: ' + error.message, 'error');
    }
}


