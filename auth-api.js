// API Configuration
function normalizeApiBase(rawUrl) {
    const sanitized = String(rawUrl || '').trim().replace(/\/+$/, '');
    if (!sanitized) return '';
    return /\/api$/i.test(sanitized) ? sanitized : `${sanitized}/api`;
}

function resolveApiUrl() {
    const runtimeOverride = typeof window !== 'undefined' ? window.HOLIDAY_API_URL : '';
    const fromRuntime = normalizeApiBase(runtimeOverride);
    if (fromRuntime) return fromRuntime;

    const hasWindow = typeof window !== 'undefined' && window.location;
    if (!hasWindow) return 'http://localhost:8080/api';

    const hostname = String(window.location.hostname || '').toLowerCase();
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
    if (isLocalhost) {
        return 'http://localhost:8080/api';
    }

    // Produção: fallback fixo para evitar erro quando não existir rewrite /api no host estático.
    return 'https://guildholiday.discloud.app/api';
}

const API_URL = resolveApiUrl();

class AuthAPI {
    static getToken() {
        // Usar AuthManager se disponível, senão fallback para localStorage
        return typeof AuthManager !== 'undefined' ? AuthManager.getToken() : localStorage.getItem('token');
    }

    static setToken(token) {
        // Usar AuthManager se disponível para notificar mudanças
        if (typeof AuthManager !== 'undefined') {
            AuthManager.setToken(token);
        } else {
            localStorage.setItem('token', token);
        }
    }

    static removeToken() {
        // Usar AuthManager se disponível para notificar mudanças
        if (typeof AuthManager !== 'undefined') {
            AuthManager.removeToken();
        } else {
            localStorage.removeItem('token');
        }
    }

    static getHeaders(withAuth = false) {
        const headers = {
            'Content-Type': 'application/json'
        };

        if (withAuth) {
            const token = this.getToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    // Links da comunidade (Discord/WhatsApp)
    static async getSocialLinks() {
        try {
            const response = await fetch(`${API_URL}/admin/social-links`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar links da comunidade:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async updateSocialLinks(whatsappUrl, discordUrl) {
        try {
            const response = await fetch(`${API_URL}/admin/social-links`, {
                method: 'PUT',
                headers: this.getHeaders(true),
                body: JSON.stringify({ whatsappUrl, discordUrl })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar links da comunidade:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Autenticação
    static async register(firstName, lastName, nickname, email, birthDate, password, confirmPassword) {
        try {
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ firstName, lastName, nickname, email, birthDate, password, confirmPassword })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro na requisição de registro:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async login(nickname, password, trustedDeviceToken = '') {
        try {
            const payload = { nickname, password };
            if (trustedDeviceToken) {
                payload.trustedDeviceToken = trustedDeviceToken;
            }
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro na requisição de login:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async verifyTwoFactorLogin(loginTicket, code, method = 'authenticator') {
        try {
            const response = await fetch(`${API_URL}/auth/2fa/verify-login`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ loginTicket, code, method })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro na verificação 2FA do login:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async sendTwoFactorEmailCode(loginTicket) {
        try {
            const response = await fetch(`${API_URL}/auth/2fa/send-email-code`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ loginTicket })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao enviar código 2FA por email:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async verifyEmail(email, code) {
        try {
            const response = await fetch(`${API_URL}/auth/verify-email`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email, code })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro na verificação de email:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async resendVerification(email) {
        try {
            const response = await fetch(`${API_URL}/auth/resend-verification`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao reenviar verificação:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async forgotPassword(email) {
        try {
            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro na recuperação de senha:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async resetPassword(email, code, newPassword, confirmPassword) {
        try {
            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email, code, newPassword, confirmPassword })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao resetar senha:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async verifyResetCode(email, code) {
        try {
            const response = await fetch(`${API_URL}/auth/verify-reset-code`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email, code })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao verificar código de reset:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async resendReset(email) {
        try {
            const response = await fetch(`${API_URL}/auth/resend-reset`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({ email })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao reenviar código de reset:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Perfil do usuário
    static async getProfile() {
        try {
            const response = await fetch(`${API_URL}/auth/profile`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar perfil:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async updateProfile(formData) {
        try {
            // Para FormData, não enviar Content-Type (navegador faz isso automaticamente)
            const headers = {
                'Authorization': `Bearer ${this.getToken()}`
            };

            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: headers,
                body: formData
            });
            const contentType = (response.headers.get('content-type') || '').toLowerCase();
            const isJson = contentType.includes('application/json');
            const payload = isJson
                ? await response.json()
                : { success: false, message: `Erro ${response.status}` };

            if (!response.ok && (!payload || payload.success !== false)) {
                return {
                    success: false,
                    message: payload?.message || `Erro ${response.status}`
                };
            }

            return payload;
        } catch (error) {
            console.error('Erro ao atualizar perfil:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async updateBio(bio) {
        try {
            const response = await fetch(`${API_URL}/users/profile`, {
                method: 'PUT',
                headers: this.getHeaders(true),
                body: JSON.stringify({ bio })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar bio:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async getUserByNickname(nickname) {
        try {
            const response = await fetch(`${API_URL}/users/${nickname}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar usuário:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async changePassword(currentPassword, newPassword, confirmPassword) {
        try {
            const response = await fetch(`${API_URL}/users/change-password`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao mudar senha:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async getTwoFactorStatus() {
        try {
            const response = await fetch(`${API_URL}/auth/2fa/status`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter status do 2FA:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async setupTwoFactor() {
        try {
            const response = await fetch(`${API_URL}/auth/2fa/setup`, {
                method: 'POST',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao iniciar setup do 2FA:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async enableTwoFactor(code) {
        try {
            const response = await fetch(`${API_URL}/auth/2fa/enable`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ code })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao ativar 2FA:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async disableTwoFactor(code) {
        try {
            const response = await fetch(`${API_URL}/auth/2fa/disable`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ code })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao desativar 2FA:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async updateTwoFactorSettings(rememberDays) {
        try {
            const response = await fetch(`${API_URL}/auth/2fa/settings`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ rememberDays })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar configurações do 2FA:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async sendEmailChangeCode(email) {
        try {
            const response = await fetch(`${API_URL}/users/send-email-code`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ email })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao enviar código de email:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async changeEmail(newEmail, code) {
        try {
            const response = await fetch(`${API_URL}/users/change-email`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ newEmail, code })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao alterar email:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Funções de Admin
    static async getAdminUsers() {
        try {
            const response = await fetch(`${API_URL}/admin/users`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar usuários:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async setUserRank(userId, rankName) {
        try {
            const response = await fetch(`${API_URL}/admin/set-rank`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ userId, rankName })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao atribuir conquista:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async removeUserRank(userId) {
        try {
            const response = await fetch(`${API_URL}/admin/remove-rank`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ userId })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao remover conquista:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async renameAccount(firstName, lastName) {
        try {
            const response = await fetch(`${API_URL}/admin/rename-account`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ firstName, lastName })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao renomear conta:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async deleteUserAccount(userId) {
        try {
            const response = await fetch(`${API_URL}/admin/users/${userId}`, {
                method: 'DELETE',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao excluir conta:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Gerenciamento de conquistas Customizáveis
    static async getCustomRanks() {
        try {
            const response = await fetch(`${API_URL}/ranks/custom`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar conquistas:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async getDefaultRanks() {
        try {
            const response = await fetch(`${API_URL}/ranks/default`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar conquistas padrão:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async createCustomRank(
        name,
        color,
        description = '',
        customText = '',
        backgroundImageUrl = '',
        backgroundImageFile = null,
        enableAdminPanel = false,
        isVisible = true,
        canManageDownloads = false,
        canOrderAllRanks = false,
        canUseAnimatedProfile = false
    ) {
        try {
            const body = JSON.stringify({ 
                name, 
                color, 
                description, 
                customText, 
                backgroundImageUrl,
                enableAdminPanel,
                isVisible,
                canManageDownloads,
                canOrderAllRanks,
                canUseAnimatedProfile
            });

            const response = await fetch(`${API_URL}/ranks/custom`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: body
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao criar conquista:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async updateCustomRank(
        rankId,
        name,
        color,
        description = '',
        customText = '',
        backgroundImageUrl = '',
        enableAdminPanel = false,
        isVisible = true,
        canManageDownloads = false,
        canOrderAllRanks = false,
        canUseAnimatedProfile = false
    ) {
        try {
            const response = await fetch(`${API_URL}/ranks/custom/${rankId}`, {
                method: 'PUT',
                headers: this.getHeaders(true),
                body: JSON.stringify({
                    name,
                    color,
                    description,
                    customText,
                    backgroundImageUrl,
                    enableAdminPanel,
                    isVisible,
                    canManageDownloads,
                    canOrderAllRanks,
                    canUseAnimatedProfile
                })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar conquista:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async getCustomRanks() {
        try {
            const response = await fetch(`${API_URL}/ranks/custom`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar conquistas customizáveis:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async getAllCustomRanks() {
        try {
            const response = await fetch(`${API_URL}/ranks/custom/all`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            const data = await response.json();
            console.log('getAllCustomRanks response:', data);
            return data;
        } catch (error) {
            console.error('Erro ao buscar todos os conquistas:', error);
            return { success: false, message: 'Erro de conexão: ' + error.message };
        }
    }

    static async deleteCustomRank(rankId) {
        try {
            const response = await fetch(`${API_URL}/ranks/custom/${rankId}`, {
                method: 'DELETE',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao deletar conquista:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async addUserCustomRank(userId, customRankId) {
        try {
            const response = await fetch(`${API_URL}/ranks/user/${userId}/add`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ customRankId })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao atribuir conquista:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async removeUserCustomRank(userId, customRankId) {
        try {
            const response = await fetch(`${API_URL}/ranks/user/${userId}/remove/${customRankId}`, {
                method: 'DELETE',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao remover conquista:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async getUserCustomRanks(userId) {
        try {
            const response = await fetch(`${API_URL}/ranks/user/${userId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar conquistas do usuário:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Downloads
    static async getDownloads() {
        try {
            const response = await fetch(`${API_URL}/downloads`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar downloads:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async canPostDownload() {
        try {
            const response = await fetch(`${API_URL}/downloads/can-post`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao verificar permissão:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async getMyDownloadReaction(downloadId) {
        try {
            const response = await fetch(`${API_URL}/downloads/${downloadId}/my-reaction`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter reação:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async deleteDownload(downloadId) {
        try {
            const response = await fetch(`${API_URL}/downloads/${downloadId}`, {
                method: 'DELETE',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao deletar download:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async updateDownload(downloadId, data) {
        try {
            const response = await fetch(`${API_URL}/downloads/${downloadId}`, {
                method: 'PUT',
                headers: this.getHeaders(true),
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar download:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async getUserMiniProfile(userId) {
        try {
            const response = await fetch(`${API_URL}/downloads/user-profile/${userId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar perfil do usuário:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Selecionar conquistas customizáveis para exibir no perfil (máximo 4)
    static async selectProfileRanks(rankIds) {
        try {
            // rankIds deve ser um array com até 4 IDs de custom ranks
            const response = await fetch(`${API_URL}/users/selected-ranks`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ rankIds: rankIds || [] })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao selecionar conquistas:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Recuperar conquistas selecionados do perfil do usuário
    static async getSelectedProfileRanks() {
        try {
            const response = await fetch(`${API_URL}/users/selected-ranks`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar conquistas selecionados:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Banir ou suspender usuário
    static async banUser(userIdentifier, banType, banDays, reason) {
        try {
            const response = await fetch(`${API_URL}/admin/ban-user`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ userIdentifier, banType, banDays, reason })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao banir usuário:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Obter lista de banimentos
    static async getBans() {
        try {
            const response = await fetch(`${API_URL}/admin/bans`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar banimentos:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Desbanir usuário
    static async unbanUser(banId) {
        try {
            const response = await fetch(`${API_URL}/admin/unban/${banId}`, {
                method: 'DELETE',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao desbanir usuário:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Conceder permissão de postagem
    static async grantPostPermission(userIdentifier) {
        try {
            const response = await fetch(`${API_URL}/admin/grant-post-permission`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ userIdentifier })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao conceder permissão:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Remover permissão de postagem
    static async revokePostPermission(userIdentifier) {
        try {
            const response = await fetch(`${API_URL}/admin/revoke-post-permission`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ userIdentifier })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao remover permissão:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async grantFixedRankOrderPermission(userIdentifier) {
        try {
            const response = await fetch(`${API_URL}/admin/grant-fixed-rank-order`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ userIdentifier })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao conceder permissão de ordenação fixa:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async revokeFixedRankOrderPermission(userIdentifier) {
        try {
            const response = await fetch(`${API_URL}/admin/revoke-fixed-rank-order`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ userIdentifier })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao remover permissão de ordenação fixa:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Listar usuários com permissão de postagem
    static async getUsersWithPostPermission() {
        try {
            const response = await fetch(`${API_URL}/admin/users-with-post-permission`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao listar usuários:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async setUserPermissions(userIdentifier, permissions = {}) {
        try {
            const response = await fetch(`${API_URL}/admin/set-user-permissions`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ userIdentifier, permissions })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao salvar permissões do usuário:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async getAnimatedProfileSettings() {
        try {
            const response = await fetch(`${API_URL}/users/animated-profile-settings`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar configuração de card animado:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async updateAnimatedProfileSettings(settingsOrEnabled, animatedProfileTheme = 'auto') {
        const payload = (settingsOrEnabled && typeof settingsOrEnabled === 'object')
            ? settingsOrEnabled
            : {
                animatedProfileEnabled: Boolean(settingsOrEnabled),
                animatedMiniProfileEnabled: Boolean(settingsOrEnabled),
                animatedDownloadCardEnabled: Boolean(settingsOrEnabled),
                animatedProfileTheme
            };
        try {
            const response = await fetch(`${API_URL}/users/animated-profile-settings`, {
                method: 'PUT',
                headers: this.getHeaders(true),
                body: JSON.stringify(payload)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao salvar configuração de card animado:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async searchAnimatedGifs(query, limit = 18, pos = '') {
        try {
            const q = String(query || '').trim();
            if (!q) return { success: false, message: 'Digite algo para buscar GIF.' };
            const params = new URLSearchParams({
                q,
                limit: String(limit || 18)
            });
            if (pos) params.set('pos', String(pos));

            const response = await fetch(`${API_URL}/gifs/search?${params.toString()}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao buscar GIFs:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async getTrendingAnimatedGifs(limit = 18, pos = '') {
        try {
            const params = new URLSearchParams({
                limit: String(limit || 18)
            });
            if (pos) params.set('pos', String(pos));

            const response = await fetch(`${API_URL}/gifs/trending?${params.toString()}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao carregar GIFs em alta:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async uploadAnimatedProfileGif(file) {
        try {
            const formData = new FormData();
            formData.append('gif', file);

            const token = this.getToken();
            const response = await fetch(`${API_URL}/users/animated-profile/upload-gif`, {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
                body: formData
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao enviar GIF personalizado:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Obter conquistas de postagem
    static async getPostageRanks() {
        try {
            const response = await fetch(`${API_URL}/downloads/ranks/all`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter conquistas de postagem:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Sincronizar conquistas de conquista por quantidade de postagens
    static async syncPostAchievementRanks() {
        try {
            const response = await fetch(`${API_URL}/downloads/post-conquistas/sync`, {
                method: 'POST',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao sincronizar conquistas de postagens:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async syncLikeAchievementRanks() {
        try {
            const response = await fetch(`${API_URL}/downloads/like-conquistas/sync`, {
                method: 'POST',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao sincronizar conquistas de likes:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // ========== DOWNLOADS E POSTAGENS ==========

    // Criar postagem
    static async createDownload(name, description, link) {
        try {
            // Suportar tanto formato antigo (link único) quanto novo (array)
            let body;
            if (typeof link === 'object' && link.links) {
                body = { name, description, ...link, links: link.links };
            } else if (Array.isArray(link)) {
                body = { name, description, links: link };
            } else if (typeof link === 'object') {
                body = { name, description, ...link };
            } else {
                body = { name, description, links: [link] };
            }

            const response = await fetch(`${API_URL}/downloads`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify(body)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao criar download:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Verificar permissão de postagem
    static async checkCanPostDownloads() {
        try {
            const response = await fetch(`${API_URL}/downloads/can-post`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao verificar permissão:', error);
            return { success: false, canPost: false };
        }
    }

    // Verificar permissão de gerenciar downloads (editar/excluir)
    static async checkCanManageDownloads() {
        try {
            const response = await fetch(`${API_URL}/downloads/can-manage`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao verificar permissão:', error);
            return { success: false, canManage: false };
        }
    }

    // Obter perfil do usuário com conquistas de postagem
    static async getUserPostageProfile(userId) {
        try {
            const response = await fetch(`${API_URL}/downloads/user-profile/${userId}`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter perfil:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Obter todos os downloads
    static async getAllDownloads() {
        try {
            const response = await fetch(`${API_URL}/downloads`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter downloads:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Obter downloads com conquistas
    static async getDownloadsWithRanks() {
        try {
            const response = await fetch(`${API_URL}/downloads/list/with-ranks`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter downloads:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Dar reação/like em um download
    static async addDownloadReaction(downloadId, reactionType) {
        try {
            const response = await fetch(`${API_URL}/downloads/${downloadId}/reaction`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ reactionType })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao adicionar reação:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Adicionar/remover favorito
    static async toggleDownloadFavorite(downloadId) {
        try {
            const response = await fetch(`${API_URL}/downloads/${downloadId}/favorite`, {
                method: 'POST',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao adicionar favorito:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Verificar se é favorito
    static async checkIsFavorite(downloadId) {
        try {
            const response = await fetch(`${API_URL}/downloads/${downloadId}/is-favorite`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao verificar favorito:', error);
            return { success: false, isFavorite: false };
        }
    }

    // Obter favoritos do usuário
    static async getFavoriteDownloads() {
        try {
            const response = await fetch(`${API_URL}/downloads/favorites/list`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter favoritos:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Obter downloads de um usuário específico
    static async getUserDownloads(userId) {
        try {
            const response = await fetch(`${API_URL}/downloads/user/${userId}/downloads`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter downloads do usuário:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Obter estatísticas do usuário (postagens, likes, etc)
    static async getUserDownloadStats(userId) {
        try {
            const response = await fetch(`${API_URL}/downloads/user/${userId}/stats`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async checkAdminPermission() {
        try {
            const response = await fetch(`${API_URL}/admin/check-permission`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao verificar permissão de admin:', error);
            return { success: false, hasAccess: false };
        }
    }

    // ===================== COMENTÁRIOS =====================

    // Adicionar comentário
    static async addDownloadComment(downloadId, content) {
        try {
            const response = await fetch(`${API_URL}/downloads/${downloadId}/comments`, {
                method: 'POST',
                headers: this.getHeaders(true),
                body: JSON.stringify({ content })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Obter comentários de um download
    static async getDownloadComments(downloadId) {
        try {
            const response = await fetch(`${API_URL}/downloads/${downloadId}/comments`, {
                method: 'GET',
                headers: this.getHeaders()
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter comentários:', error);
            return { success: false, comments: [] };
        }
    }

    // Deletar comentário
    static async deleteDownloadComment(commentId) {
        try {
            const response = await fetch(`${API_URL}/downloads/comments/${commentId}`, {
                method: 'DELETE',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao deletar comentário:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // ===================== NOTIFICAÇÕES =====================

    // Obter notificações não lidas
    static async getUnreadNotifications() {
        try {
            const response = await fetch(`${API_URL}/downloads/notifications/unread`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter notificações:', error);
            return { success: false, notifications: [], unreadCount: 0 };
        }
    }

    // Obter todas as notificações
    static async getAllNotifications(limit = 50, offset = 0) {
        try {
            const response = await fetch(`${API_URL}/downloads/notifications/all?limit=${limit}&offset=${offset}`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter notificações:', error);
            return { success: false, notifications: [] };
        }
    }

    // Contar notificações não lidas
    static async getNotificationCount() {
        try {
            const response = await fetch(`${API_URL}/downloads/notifications/count`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao contar notificações:', error);
            return { success: false, unreadCount: 0 };
        }
    }

    // Marcar notificação como lida
    static async markNotificationAsRead(notificationId) {
        try {
            const response = await fetch(`${API_URL}/downloads/notifications/${notificationId}/read`, {
                method: 'POST',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao marcar como lida:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Marcar todas as notificações como lidas
    static async markAllNotificationsAsRead() {
        try {
            const response = await fetch(`${API_URL}/downloads/notifications/mark-all-read`, {
                method: 'POST',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao marcar todas como lidas:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    // Configurações de notificações do usuário
    static async getNotificationSettings() {
        try {
            const response = await fetch(`${API_URL}/users/notification-settings`, {
                method: 'GET',
                headers: this.getHeaders(true)
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao obter configurações de notificações:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    static async updateNotificationSettings(settings) {
        try {
            const response = await fetch(`${API_URL}/users/notification-settings`, {
                method: 'PUT',
                headers: this.getHeaders(true),
                body: JSON.stringify(settings || {})
            });
            return await response.json();
        } catch (error) {
            console.error('Erro ao atualizar configurações de notificações:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }
}


