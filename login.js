// ========== LOGIN SCRIPT v2 - SUPER SIMPLES ==========

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== DOM CARREGADO ===');

    // Se veio mensagem de redirecionamento (ex.: sessão inválida/bloqueada), exibir no formulário.
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
            toggleBtn.textContent = isVisible ? '⊗' : '⊙';
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
        console.log('✓ Toggle de senha configurado');
    } else {
        console.error('✗ Elementos não encontrados:', { toggleBtn, passwordInput });
    }
    
    // ===== LOGIN =====
    const loginForm = document.getElementById('loginForm');
    const nicknameInput = document.getElementById('nickname');
    const rememberCheckbox = document.getElementById('rememberAccount');
    const formError = document.getElementById('formError');
    
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
        console.log('✓ Formulário preenchido com params da URL');
    }
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('=== SUBMIT DO FORMULÁRIO ===');
            
            const nickname = nicknameInput.value.trim();
            const password = passwordInput.value;
            
            console.log('Dados:', { nickname, password: '***' });
            
            if (!nickname || !password) {
                formError.textContent = 'Preencha todos os campos';
                console.error('Campos vazios');
                return;
            }
            
            // Desabilitar botão
            const btn = loginForm.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.textContent = 'Entrando...';
            formError.textContent = '';
            
            try {
                // Impede reutilização de sessão anterior (ex.: outro usuário logado no mesmo navegador).
                AuthAPI.removeToken();

                console.log('Enviando login para API...');
                const result = await AuthAPI.login(nickname, password);
                console.log('Resposta da API:', result);
                
                if (result.success) {
                    console.log('✓ Login bem-sucedido!');
                    
                    // Salvar dados
                    if (rememberCheckbox.checked) {
                        localStorage.setItem('rememberMe', JSON.stringify({ nickname, password }));
                    } else {
                        localStorage.removeItem('rememberMe');
                    }
                    
                    // Salvar token
                    AuthAPI.setToken(result.token);
                    console.log('✓ Token armazenado');
                    
                    // Redirecionar
                    console.log('Redirecionando para profile.html...');
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 100);
                } else {
                    // Em falha de login (incluindo banimento), garantir que não exista token residual.
                    AuthAPI.removeToken();
                    formError.textContent = result.message || 'Erro ao fazer login';
                    console.error('Erro:', result.message);
                    btn.disabled = false;
                    btn.textContent = 'Entrar';
                }
            } catch (error) {
                console.error('Erro na requisição:', error);
                formError.textContent = 'Erro ao conectar ao servidor';
                btn.disabled = false;
                btn.textContent = 'Entrar';
            }
        });
    }
    
    console.log('=== SCRIPT PRONTO ===');
});
