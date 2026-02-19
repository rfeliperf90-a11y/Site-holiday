// ========== LOGIN SCRIPT v2 - SUPER SIMPLES ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CARREGADO ===');
    const TRUSTED_DEVICE_TOKEN_KEY = 'holidayTrustedDeviceToken';

    // Se veio mensagem de redirecionamento (ex.: sess�o inv�lida/bloqueada), exibir no formul�rio.
    const urlParams = new URLSearchParams(window.location.search);
    const messageParam = urlParams.get('message');
    const formErrorEl = document.getElementById('formError');
    if (messageParam && formErrorEl) {
        formErrorEl.textContent = messageParam;
    }
    
    // ===== TOGGLE DE SENHA =====
    const toggleBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    
    if (toggleBtn && passwordInput) {
        const updateToggleVisual = () => {
            const isVisible = passwordInput.type === 'text';
            toggleBtn.textContent = isVisible ? '?' : '?';
            toggleBtn.setAttribute('aria-label', isVisible ? 'Ocultar senha' : 'Mostrar senha');
            toggleBtn.setAttribute('title', isVisible ? 'Ocultar senha' : 'Mostrar senha');
        };

        updateToggleVisual();

        toggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            console.log('Toggle clicado! Tipo atual:', passwordInput.type);
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
            } else {
                passwordInput.type = 'password';
            }

            updateToggleVisual();
        });
        console.log('? Toggle de senha configurado');
    } else {
        console.error('? Elementos n�o encontrados:', { toggleBtn, passwordInput });
    }
    
    // ===== LOGIN =====
    const loginForm = document.getElementById('loginForm');
    const nicknameInput = document.getElementById('nickname');
    const rememberCheckbox = document.getElementById('rememberAccount');
    const formError = document.getElementById('formError');
    const twoFactorGroup = document.getElementById('twoFactorGroup');
    const twoFactorMethodGroup = document.getElementById('twoFactorMethodGroup');
    const twoFactorMethodAuthenticatorBtn = document.getElementById('twoFactorMethodAuthenticator');
    const twoFactorMethodEmailBtn = document.getElementById('twoFactorMethodEmail');
    const twoFactorCodeLabel = document.getElementById('twoFactorCodeLabel');
    const twoFactorCodeInput = document.getElementById('twoFactorCode');
    const sendTwoFactorEmailBtn = document.getElementById('sendTwoFactorEmailBtn');
    const twoFactorInfo = document.getElementById('twoFactorInfo');
    const formOptions = document.querySelector('.form-options');
    const submitBtn = loginForm ? loginForm.querySelector('button[type="submit"]') : null;
    let pendingTwoFactorTicket = '';
    let pendingTwoFactorMethods = ['authenticator'];
    let currentTwoFactorMethod = 'authenticator';
    const getTrustedDeviceToken = () => String(localStorage.getItem(TRUSTED_DEVICE_TOKEN_KEY) || '').trim();
    const clearTrustedDeviceToken = () => localStorage.removeItem(TRUSTED_DEVICE_TOKEN_KEY);
    const saveTrustedDeviceToken = (value) => {
        const token = String(value || '').trim();
        if (!token) {
            clearTrustedDeviceToken();
            return;
        }
        localStorage.setItem(TRUSTED_DEVICE_TOKEN_KEY, token);
    };

    const clearTwoFactorInfo = () => {
        if (!twoFactorInfo) return;
        twoFactorInfo.style.display = 'none';
        twoFactorInfo.textContent = '';
    };

    const setTwoFactorInfo = (message) => {
        if (!twoFactorInfo) return;
        twoFactorInfo.style.display = message ? 'block' : 'none';
        twoFactorInfo.textContent = message || '';
    };

    const normalizeTwoFactorMethods = (methods) => {
        const source = Array.isArray(methods) ? methods : [];
        const normalized = source
            .map((item) => String(item || '').trim().toLowerCase())
            .filter((item) => item === 'authenticator' || item === 'email');
        return normalized.length > 0 ? Array.from(new Set(normalized)) : ['authenticator'];
    };

    const setTwoFactorMethod = (method) => {
        const normalized = String(method || '').trim().toLowerCase();
        if (!pendingTwoFactorMethods.includes(normalized)) return;
        currentTwoFactorMethod = normalized;

        if (twoFactorMethodAuthenticatorBtn) {
            twoFactorMethodAuthenticatorBtn.classList.toggle('active', normalized === 'authenticator');
        }
        if (twoFactorMethodEmailBtn) {
            twoFactorMethodEmailBtn.classList.toggle('active', normalized === 'email');
        }

        if (twoFactorCodeLabel) {
            twoFactorCodeLabel.textContent = normalized === 'email'
                ? 'C�digo enviado por e-mail'
                : 'C�digo Authenticator (2FA)';
        }
        if (twoFactorCodeInput) {
            twoFactorCodeInput.placeholder = normalized === 'email'
                ? 'Digite o c�digo recebido no e-mail'
                : 'Digite os 6 d�gitos do Authenticator';
        }
        if (sendTwoFactorEmailBtn) {
            sendTwoFactorEmailBtn.style.display = normalized === 'email' ? 'block' : 'none';
        }
    };

    const setSubmitLoading = (loading, text = 'Entrar') => {
        if (!submitBtn) return;
        submitBtn.disabled = Boolean(loading);
        submitBtn.textContent = loading ? text : (pendingTwoFactorTicket ? 'Verificar c�digo' : 'Entrar');
    };

    const setTwoFactorMode = (enabled, methods = []) => {
        const active = Boolean(enabled);
        pendingTwoFactorTicket = active ? pendingTwoFactorTicket : '';
        pendingTwoFactorMethods = active ? normalizeTwoFactorMethods(methods) : ['authenticator'];

        if (twoFactorGroup) {
            twoFactorGroup.style.display = active ? 'block' : 'none';
        }
        if (twoFactorMethodGroup) {
            twoFactorMethodGroup.style.display = active && pendingTwoFactorMethods.length > 1 ? 'flex' : 'none';
        }
        if (twoFactorCodeInput) {
            twoFactorCodeInput.value = '';
            twoFactorCodeInput.required = active;
        }
        clearTwoFactorInfo();
        if (nicknameInput) {
            nicknameInput.readOnly = active;
        }
        if (passwordInput) {
            passwordInput.readOnly = active;
        }
        if (rememberCheckbox) {
            rememberCheckbox.disabled = active;
        }
        if (formOptions) {
            formOptions.style.opacity = active ? '0.65' : '1';
            formOptions.style.pointerEvents = active ? 'none' : '';
        }
        if (submitBtn) {
            submitBtn.textContent = active ? 'Verificar c�digo' : 'Entrar';
        }

        if (active) {
            if (pendingTwoFactorMethods.includes('authenticator')) {
                setTwoFactorMethod('authenticator');
            } else {
                setTwoFactorMethod(pendingTwoFactorMethods[0]);
            }
        } else {
            currentTwoFactorMethod = 'authenticator';
            setTwoFactorMethod('authenticator');
        }
    };

    const sendTwoFactorEmailCode = async () => {
        if (!pendingTwoFactorTicket) {
            formError.textContent = 'Sess�o 2FA inv�lida. Tente fazer login novamente.';
            return;
        }

        clearTwoFactorInfo();
        if (sendTwoFactorEmailBtn) {
            sendTwoFactorEmailBtn.disabled = true;
            sendTwoFactorEmailBtn.textContent = 'Enviando...';
        }

        try {
            const result = await AuthAPI.sendTwoFactorEmailCode(pendingTwoFactorTicket);
            if (result?.success) {
                formError.textContent = '';
                setTwoFactorInfo(result.message || 'C�digo enviado para seu e-mail.');
            } else {
                formError.textContent = result?.message || 'Erro ao enviar c�digo por e-mail';
            }
        } catch (error) {
            console.error('Erro ao enviar c�digo 2FA por e-mail:', error);
            formError.textContent = 'Erro ao enviar c�digo por e-mail';
        } finally {
            if (sendTwoFactorEmailBtn) {
                sendTwoFactorEmailBtn.disabled = false;
                sendTwoFactorEmailBtn.textContent = 'Enviar c�digo por e-mail';
            }
        }
    };
    setTwoFactorMode(false);

    // Carregar dados salvos
    const saved = localStorage.getItem('rememberMe');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            nicknameInput.value = data.nickname || '';
            passwordInput.value = data.password || '';
            rememberCheckbox.checked = true;
        } catch (e) {
            console.error('Erro ao carregar dados salvos:', e);
        }
    }
    
    // Verificar URL params
    const urlNick = urlParams.get('nickname');
    const urlPass = urlParams.get('password');
    if (urlNick && urlPass) {
        nicknameInput.value = urlNick;
        passwordInput.value = urlPass;
        console.log('? Formul�rio preenchido com params da URL');
    }

    if (twoFactorMethodAuthenticatorBtn) {
        twoFactorMethodAuthenticatorBtn.addEventListener('click', () => {
            setTwoFactorMethod('authenticator');
            clearTwoFactorInfo();
            formError.textContent = '';
        });
    }

    if (twoFactorMethodEmailBtn) {
        twoFactorMethodEmailBtn.addEventListener('click', async () => {
            setTwoFactorMethod('email');
            clearTwoFactorInfo();
            formError.textContent = '';
            await sendTwoFactorEmailCode();
        });
    }

    if (sendTwoFactorEmailBtn) {
        sendTwoFactorEmailBtn.addEventListener('click', async () => {
            formError.textContent = '';
            await sendTwoFactorEmailCode();
        });
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('=== SUBMIT DO FORMUL�RIO ===');

            const nickname = nicknameInput.value.trim();
            const password = passwordInput.value;
            formError.textContent = '';

            // Etapa 2FA
            if (pendingTwoFactorTicket) {
                const code = String(twoFactorCodeInput?.value || '').replace(/\s+/g, '').trim();
                if (!/^\d{6}$/.test(code)) {
                    formError.textContent = currentTwoFactorMethod === 'email'
                        ? 'Digite o c�digo de 6 d�gitos enviado por e-mail'
                        : 'Digite o c�digo de 6 d�gitos do Authenticator';
                    return;
                }

                setSubmitLoading(true, 'Validando...');
                try {
                    const verifyResult = await AuthAPI.verifyTwoFactorLogin(
                        pendingTwoFactorTicket,
                        code,
                        currentTwoFactorMethod
                    );
                    if (verifyResult.success) {
                        if (verifyResult.trustedDeviceToken) {
                            saveTrustedDeviceToken(verifyResult.trustedDeviceToken);
                        } else {
                            clearTrustedDeviceToken();
                        }
                        if (rememberCheckbox.checked) {
                            localStorage.setItem('rememberMe', JSON.stringify({ nickname, password }));
                        } else {
                            localStorage.removeItem('rememberMe');
                        }

                        AuthAPI.setToken(verifyResult.token);
                        setTwoFactorMode(false);
                        setTimeout(() => {
                            window.location.href = 'profile.html';
                        }, 100);
                        return;
                    }

                    AuthAPI.removeToken();
                    formError.textContent = verifyResult.message || 'C�digo inv�lido';
                } catch (error) {
                    console.error('Erro na verifica��o 2FA:', error);
                    formError.textContent = 'Erro ao validar c�digo';
                } finally {
                    setSubmitLoading(false);
                }
                return;
            }

            console.log('Dados:', { nickname, password: '***' });

            if (!nickname || !password) {
                formError.textContent = 'Preencha todos os campos';
                console.error('Campos vazios');
                return;
            }

            setSubmitLoading(true, 'Entrando...');

            try {
                // Impede reutiliza��o de sess�o anterior (ex.: outro usu�rio logado no mesmo navegador).
                AuthAPI.removeToken();
                const trustedDeviceToken = getTrustedDeviceToken();

                console.log('Enviando login para API...');
                const result = await AuthAPI.login(nickname, password, trustedDeviceToken);
                console.log('Resposta da API:', result);

                if (result.success && result.requiresTwoFactor) {
                    if (result.clearTrustedDeviceToken) {
                        clearTrustedDeviceToken();
                    }
                    if (!result.loginTicket) {
                        formError.textContent = 'Falha ao iniciar valida��o 2FA';
                        setSubmitLoading(false);
                        return;
                    }
                    pendingTwoFactorTicket = result.loginTicket;
                    setTwoFactorMode(true, result.twoFactorMethods);
                    formError.textContent = result.message || 'Digite o c�digo 2FA para continuar.';
                    setSubmitLoading(false);
                    return;
                }

                if (result.success) {
                    console.log('? Login bem-sucedido!');
                    
                    // Salvar dados
                    if (rememberCheckbox.checked) {
                        localStorage.setItem('rememberMe', JSON.stringify({ nickname, password }));
                    } else {
                        localStorage.removeItem('rememberMe');
                    }
                    
                    // Salvar token
                    AuthAPI.setToken(result.token);
                    console.log('? Token armazenado');
                    
                    // Redirecionar
                    console.log('Redirecionando para profile.html...');
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 100);
                } else {
                    // Em falha de login (incluindo banimento), garantir que n�o exista token residual.
                    AuthAPI.removeToken();
                    formError.textContent = result.message || 'Erro ao fazer login';
                    console.error('Erro:', result.message);
                    setSubmitLoading(false);
                }
            } catch (error) {
                console.error('Erro na requisi��o:', error);
                formError.textContent = 'Erro ao conectar ao servidor';
                setSubmitLoading(false);
            }
        });
    }
    
    console.log('=== SCRIPT PRONTO ===');
});
