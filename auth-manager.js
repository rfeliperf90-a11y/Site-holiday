// ============================================
// SISTEMA CENTRALIZADO DE AUTENTICACAO
// ============================================
// Este arquivo gerencia todo o estado de autenticacao do site

class AuthManager {
    static TOKEN_KEY = 'token';
    static STORAGE_EVENT = 'auth-state-changed';

    static getToken() {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    static setToken(token) {
        localStorage.setItem(this.TOKEN_KEY, token);
        this.notifyStateChange();
    }

    static removeToken() {
        localStorage.removeItem(this.TOKEN_KEY);
        this.notifyStateChange();
    }

    static isLoggedIn() {
        return !!this.getToken();
    }

    static notifyStateChange() {
        window.dispatchEvent(new Event(this.STORAGE_EVENT));
    }

    static onAuthStateChange(callback) {
        window.addEventListener(this.STORAGE_EVENT, callback);
        window.addEventListener('storage', callback);
    }
}

// ============================================
// GERENCIADOR DE NAVBAR GLOBAL
// ============================================

class NavbarManager {
    static notificationUpdateInterval = null;
    static socialLinksLoaded = false;
    static defaultWhatsappUrl = 'https://chat.whatsapp.com/EDqaY8udJmFCTVCTex3b5p';
    static defaultDiscordUrl = 'https://discord.gg/KEc4ZdR3';

    static getApiBase() {
        if (typeof API_URL === 'string' && API_URL.trim()) {
            return API_URL.replace(/\/$/, '');
        }
        const configured = typeof window !== 'undefined'
            ? String(window.HOLIDAY_API_URL || '').trim().replace(/\/+$/, '')
            : '';
        if (configured) {
            return /\/api$/i.test(configured) ? configured : `${configured}/api`;
        }
        return 'https://guildholiday.discloud.app/api';
    }

    static async apiRequest(path, options = {}) {
        const token = AuthManager.getToken();
        if (!token) return null;

        const headers = {
            ...(options.headers || {}),
            Authorization: `Bearer ${token}`
        };

        const response = await fetch(`${this.getApiBase()}${path}`, {
            ...options,
            headers
        });

        if (!response.ok) return null;
        return response.json();
    }

    static async isSessionValid() {
        const token = AuthManager.getToken();
        if (!token) return false;

        try {
            const response = await fetch(`${this.getApiBase()}/auth/profile`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    static async init() {
        await this.loadCommunityLinks();

        let isLoggedIn = AuthManager.isLoggedIn();
        if (isLoggedIn) {
            const valid = await this.isSessionValid();
            if (!valid) {
                AuthManager.removeToken();
                isLoggedIn = false;
            }
        }
        this.updateNavbar(isLoggedIn);

        AuthManager.onAuthStateChange(async () => {
            let logged = AuthManager.isLoggedIn();
            if (logged) {
                const valid = await this.isSessionValid();
                if (!valid) {
                    AuthManager.removeToken();
                    return;
                }
            }
            this.updateNavbar(logged);
        });
    }

    static applyCommunityLinks(links = {}) {
        const whatsappUrl = links.whatsappUrl || this.defaultWhatsappUrl;
        const discordUrl = links.discordUrl || this.defaultDiscordUrl;

        document.querySelectorAll('.btn-whatsapp').forEach((el) => {
            if (el.tagName !== 'A') return;
            el.setAttribute('href', whatsappUrl);
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
        });

        document.querySelectorAll('.btn-discord').forEach((el) => {
            if (el.tagName !== 'A') return;
            el.setAttribute('href', discordUrl);
            el.setAttribute('target', '_blank');
            el.setAttribute('rel', 'noopener noreferrer');
        });
    }

    static async loadCommunityLinks() {
        if (this.socialLinksLoaded) return;

        try {
            const response = await fetch(`${this.getApiBase()}/admin/social-links`, {
                method: 'GET'
            });

            if (!response.ok) {
                this.applyCommunityLinks();
                this.socialLinksLoaded = true;
                return;
            }

            const data = await response.json();
            if (data?.success && data.links) {
                this.applyCommunityLinks(data.links);
            } else {
                this.applyCommunityLinks();
            }
        } catch (error) {
            this.applyCommunityLinks();
        } finally {
            this.socialLinksLoaded = true;
        }
    }

    static updateNavbar(isLoggedIn = AuthManager.isLoggedIn()) {

        const loginBtn = document.querySelector('a[href="login.html"]');
        const logoutBtn = document.getElementById('logoutBtn');
        const profileLink = document.querySelector('a[href="profile.html"]');

        const notificationBell = document.getElementById('notificationBell');
        const notificationBadge = document.getElementById('notificationBadge');

        if (isLoggedIn) {
            if (loginBtn) loginBtn.style.display = 'none';

            if (logoutBtn) {
                logoutBtn.style.display = 'inline-flex';
                logoutBtn.onclick = (e) => {
                    e.preventDefault();
                    this.logout();
                };
            }

            if (profileLink) profileLink.style.display = 'block';

            if (notificationBell) {
                notificationBell.style.display = 'inline-flex';
                notificationBell.onclick = (e) => {
                    e.preventDefault();
                    this.showNotifications();
                };
            }

            this.startNotificationUpdates();
        } else {
            if (loginBtn) loginBtn.style.display = 'inline-flex';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (profileLink) profileLink.style.display = 'none';

            if (notificationBell) notificationBell.style.display = 'none';
            if (notificationBadge) notificationBadge.style.display = 'none';

            this.stopNotificationUpdates();
        }
    }

    static logout() {
        AuthManager.removeToken();
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 100);
    }

    static startNotificationUpdates() {
        if (this.notificationUpdateInterval) return;

        this.updateNotificationBadge();
        this.notificationUpdateInterval = setInterval(() => {
            this.updateNotificationBadge();
        }, 30000);
    }

    static stopNotificationUpdates() {
        if (!this.notificationUpdateInterval) return;
        clearInterval(this.notificationUpdateInterval);
        this.notificationUpdateInterval = null;
    }

    static async updateNotificationBadge() {
        const badge = document.getElementById('notificationBadge');
        if (!badge) return;

        try {
            const data = await this.apiRequest('/downloads/notifications/count', {
                method: 'GET'
            });
            if (!data) return;

            const unreadCount = Number(data.unreadCount || 0);

            if (unreadCount > 0) {
                badge.textContent = String(unreadCount);
                badge.style.display = 'flex';
                badge.style.alignItems = 'center';
                badge.style.justifyContent = 'center';
            } else {
                badge.style.display = 'none';
            }
        } catch (error) {
            console.error('[NavbarManager] Error updating notification badge:', error);
        }
    }

    static formatNotificationText(notif) {
        const from = `@${notif.nickname || 'Usuario'}`;
        const post = notif.downloadName || 'seu post';

        if (notif.type === 'like') return `${from} curtiu \"${post}\"`;
        if (notif.type === 'heart') return `${from} enviou coracao em \"${post}\"`;
        if (notif.type === 'comment') return `${from} comentou em \"${post}\"`;
        return `${from} enviou uma notificacao em \"${post}\"`;
    }

    static async markNotificationAsRead(notificationId) {
        if (!notificationId) return;

        try {
            await this.apiRequest(`/downloads/notifications/${notificationId}/read`, {
                method: 'POST'
            });
            await this.updateNotificationBadge();
        } catch (error) {
            console.error('[NavbarManager] Error marking notification as read:', error);
        }
    }

    static async markAllNotificationsAsRead() {
        try {
            await this.apiRequest('/downloads/notifications/mark-all-read', {
                method: 'POST'
            });
            await this.updateNotificationBadge();
        } catch (error) {
            console.error('[NavbarManager] Error marking all notifications as read:', error);
        }
    }

    static async openNotificationTarget(notificationId, downloadId, openComments = false) {
        if (!downloadId) return;

        if (notificationId) {
            await this.markNotificationAsRead(notificationId);
        }

        const params = new URLSearchParams();
        params.set('downloadId', String(downloadId));
        if (openComments) {
            params.set('openComments', '1');
        }

        window.location.href = `downloads.html?${params.toString()}`;
    }

    static async showNotifications() {
        if (!AuthManager.getToken()) return;

        try {
            const data = await this.apiRequest('/downloads/notifications/unread', {
                method: 'GET'
            });
            if (!data) return;

            const notifications = data.notifications || [];

            const existingModal = document.querySelector('.notifications-modal');
            if (existingModal) existingModal.remove();

            const modal = document.createElement('div');
            modal.className = 'notifications-modal';
            modal.style.cssText = `
                position: fixed;
                top: 70px;
                right: 20px;
                background: #1a1a2e;
                border: 2px solid #EC4899;
                border-radius: 12px;
                padding: 0;
                max-width: 420px;
                width: calc(100vw - 40px);
                max-height: 520px;
                overflow-y: auto;
                z-index: 10000;
                box-shadow: 0 10px 40px rgba(236, 72, 153, 0.3);
            `;

            let html = `
                <div style="padding: 15px; border-bottom: 1px solid rgba(236, 72, 153, 0.2); display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0; color: #EC4899;">Notificacoes</h3>
                    <button type="button" class="notifications-close-btn" style="background: none; border: none; color: #EC4899; font-size: 24px; cursor: pointer;">&times;</button>
                </div>
            `;

            if (notifications.length === 0) {
                html += '<div style="padding: 30px; text-align: center; color: #999;">Nenhuma notificacao</div>';
            } else {
                html += notifications.slice(0, 20).map(notif => {
                    const notifId = Number(notif.id) || 0;
                    const downloadId = Number(notif.downloadId) || 0;
                    const isComment = notif.type === 'comment';
                    const avatar = notif.avatar || '/imagens/login.png';
                    const text = this.formatNotificationText(notif);
                    const time = new Date(notif.createdAt).toLocaleString('pt-BR');

                    return `
                        <div class="notif-item" data-notif-id="${notifId}" style="padding: 12px 15px; border-bottom: 1px solid rgba(236, 72, 153, 0.12);">
                            <div style="display: flex; gap: 10px;">
                                <img src="${avatar}" alt="Avatar" style="width: 34px; height: 34px; border-radius: 50%; object-fit: cover;">
                                <div style="flex: 1;">
                                    <p style="margin: 0; color: #F9A8D4; font-size: 13px; line-height: 1.45;">${text}</p>
                                    <p style="margin: 6px 0 0; color: #8B8B9E; font-size: 11px;">${time}</p>
                                </div>
                            </div>
                            <div style="display: flex; gap: 8px; margin-top: 10px;">
                                <button type="button" class="notif-open-post" data-notif-id="${notifId}" data-download-id="${downloadId}" style="flex: 1; padding: 8px 10px; border: 1px solid #6B46C1; border-radius: 6px; background: rgba(107, 70, 193, 0.2); color: #E9D5FF; cursor: pointer; font-size: 12px; font-weight: 600;">
                                    Ir ao post
                                </button>
                                ${isComment ? `<button type="button" class="notif-open-comments" data-notif-id="${notifId}" data-download-id="${downloadId}" style="flex: 1; padding: 8px 10px; border: 1px solid #EC4899; border-radius: 6px; background: rgba(236, 72, 153, 0.2); color: #FBCFE8; cursor: pointer; font-size: 12px; font-weight: 600;">Responder</button>` : ''}
                                <button type="button" class="notif-mark-read" data-notif-id="${notifId}" style="padding: 8px 10px; border: 1px solid #374151; border-radius: 6px; background: rgba(55, 65, 81, 0.35); color: #D1D5DB; cursor: pointer; font-size: 12px; font-weight: 600;">
                                    Lida
                                </button>
                            </div>
                        </div>
                    `;
                }).join('');
            }

            html += `
                <div style="padding: 15px; border-top: 1px solid rgba(236, 72, 153, 0.2);">
                    <button type="button" class="notif-mark-all-read" style="width: 100%; padding: 10px; background: linear-gradient(135deg, #EC4899, #6B46C1); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;">
                        Marcar tudo como lido
                    </button>
                </div>
            `;

            modal.innerHTML = html;
            document.body.appendChild(modal);
            const noNotificationsState = '<div class="notif-empty" style="padding: 30px; text-align: center; color: #999;">Nenhuma notificacao</div>';

            const syncModalAfterRead = async (row) => {
                if (row) row.remove();
                await this.updateNotificationBadge();

                const hasRows = modal.querySelector('.notif-item');
                if (!hasRows && !modal.querySelector('.notif-empty')) {
                    const footer = modal.querySelector('.notif-mark-all-read')?.closest('div');
                    if (footer) {
                        footer.insertAdjacentHTML('beforebegin', noNotificationsState);
                    }
                }
            };

            const closeBtn = modal.querySelector('.notifications-close-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => modal.remove());
            }

            modal.querySelectorAll('.notif-mark-read').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const notificationId = Number(btn.dataset.notifId);
                    await this.markNotificationAsRead(notificationId);

                    const row = btn.closest('.notif-item');
                    await syncModalAfterRead(row);
                });
            });

            modal.querySelectorAll('.notif-item').forEach(row => {
                row.addEventListener('click', async (e) => {
                    if (e.target.closest('button')) return;
                    const notificationId = Number(row.dataset.notifId);
                    await this.markNotificationAsRead(notificationId);
                    await syncModalAfterRead(row);
                });
            });

            modal.querySelectorAll('.notif-open-post').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const notificationId = Number(btn.dataset.notifId);
                    const downloadId = Number(btn.dataset.downloadId);
                    await this.openNotificationTarget(notificationId, downloadId, false);
                });
            });

            modal.querySelectorAll('.notif-open-comments').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const notificationId = Number(btn.dataset.notifId);
                    const downloadId = Number(btn.dataset.downloadId);
                    await this.openNotificationTarget(notificationId, downloadId, true);
                });
            });

            const markAllBtn = modal.querySelector('.notif-mark-all-read');
            if (markAllBtn) {
                markAllBtn.addEventListener('click', async () => {
                    await this.markAllNotificationsAsRead();
                    modal.remove();
                });
            }

            setTimeout(() => {
                document.addEventListener('click', function closeModal(e) {
                    if (!e.target.closest('.notifications-modal') && !e.target.closest('#notificationBell')) {
                        modal.remove();
                        document.removeEventListener('click', closeModal);
                    }
                });
            }, 0);
        } catch (error) {
            console.error('[NavbarManager] Error showing notifications:', error);
        }
    }
}

class RouteGuard {
    static redirectToLogin(message) {
        const loginMessage = String(message || 'Fa�a login para continuar');
        window.location.href = `login.html?message=${encodeURIComponent(loginMessage)}`;
    }

    static async requireAuth(options = {}) {
        const {
            loginMessage = 'Fa�a login para acessar esta p�gina',
            invalidSessionMessage = 'Sess�o inv�lida. Fa�a login novamente.',
            validateSession = true
        } = options;

        const token = AuthManager.getToken();
        if (!token) {
            this.redirectToLogin(loginMessage);
            return false;
        }

        if (!validateSession) {
            return true;
        }

        const isValid = await NavbarManager.isSessionValid();
        if (!isValid) {
            AuthManager.removeToken();
            this.redirectToLogin(invalidSessionMessage);
            return false;
        }

        return true;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    NavbarManager.init();
});


