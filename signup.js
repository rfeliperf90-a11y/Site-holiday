// Script para p�gina de SIGNUP

let userEmail = '';
let verificationTimer = null;
let lastResendTime = 0;
const RESEND_COOLDOWN = 30000; // 30 segundos entre reenvios

// Esperar o DOM carregar completamente
document.addEventListener('DOMContentLoaded', function() {
    console.log(' P�gina carregada');
    
    const signupForm = document.getElementById('signupForm');
    const verifyForm = document.getElementById('verifyForm');
    const togglePassword = document.getElementById('togglePassword');
    const toggleConfirmPassword = document.getElementById('toggleConfirmPassword');
    
    if (!signupForm) {
        console.error(' Formul�rio de signup n�o encontrado!');
        return;
    }
    
    console.log(' Elementos encontrados, registrando eventos...');
    
    // Evento de submit do formul�rio
    signupForm.addEventListener('submit', async (e) => {
        console.log(' Formul�rio enviado');
        e.preventDefault();
        clearErrors();

        const firstName = document.getElementById('firstName').value.trim();
        const lastName = document.getElementById('lastName').value.trim();
        const nickname = document.getElementById('nickname').value.trim();
        const email = document.getElementById('email').value.trim();
        const birthDate = document.getElementById('birthDate').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        console.log('Dados:', {firstName, lastName, nickname, email, birthDate});

        if (!firstName || !lastName || !nickname || !email || !birthDate || !password || !confirmPassword) {
            document.getElementById('formError').textContent = 'Preencha todos os campos';
            console.warn(' Campos vazios');
            return;
        }

        if (firstName.length < 2) {
            document.getElementById('firstNameError').textContent = 'Primeiro nome deve ter pelo menos 2 caracteres';
            return;
        }

        if (lastName.length < 2) {
            document.getElementById('lastNameError').textContent = 'Sobrenome deve ter pelo menos 2 caracteres';
            return;
        }

        if (nickname.length < 1) {
            document.getElementById('nicknameError').textContent = 'Nickname � obrigat�rio';
            return;
        }

        if (password.length < 6) {
            document.getElementById('passwordError').textContent = 'Senha deve ter no m�nimo 6 caracteres';
            return;
        }

        if (password !== confirmPassword) {
            document.getElementById('confirmPasswordError').textContent = 'Senhas n�o conferem';
            return;
        }

        console.log(' Enviando para servidor...');
        const result = await AuthAPI.register(firstName, lastName, nickname, email, birthDate, password, confirmPassword);
        console.log('Resposta do servidor:', result);

        if (result.success) {
            AuthAPI.setToken(result.token);
            userEmail = email;
            lastResendTime = Date.now();
            
            console.log(' Usu�rio criado, mostrando modal');
            document.getElementById('verifyEmail').textContent = email;
            document.getElementById('signupForm').style.display = 'none';
            document.getElementById('verifyModal').style.display = 'flex';
            document.getElementById('verifyError').textContent = '';
            document.getElementById('verificationCode').value = '';
            
            // Iniciar timer de 4 minutos
            startVerificationTimer();
        } else {
            document.getElementById('formError').textContent = result.message || 'Erro ao criar conta';
            console.error(' Erro:', result.message);
        }
    });

    // Evento de verifica��o de email
    if (verifyForm) {
        verifyForm.addEventListener('submit', async (e) => {
            console.log(' Verificando email');
            e.preventDefault();
            
            const code = document.getElementById('verificationCode').value.trim();
            
            if (!code || code.length !== 6) {
                document.getElementById('verifyError').textContent = 'Insira um c�digo v�lido com 6 d�gitos';
                return;
            }
            
            console.log(' Enviando c�digo:', code);
            const result = await AuthAPI.verifyEmail(userEmail, code);
            console.log('Resposta:', result);
            
            if (result.success) {
                clearVerificationTimer();
                alert('Email verificado com sucesso! ');
                window.location.href = 'profile.html';
            } else {
                document.getElementById('verifyError').textContent = result.message || 'C�digo inv�lido ou expirado';
                console.error('Erro:', result.message);
            }
        });
    }

    // Toggle password visibility
    const setupPasswordToggle = (buttonEl, inputEl) => {
        if (!buttonEl || !inputEl) return;

        const updateVisual = () => {
            const isVisible = inputEl.type === 'text';
            buttonEl.textContent = isVisible ? '?' : '?';
            buttonEl.setAttribute('aria-label', isVisible ? 'Ocultar senha' : 'Mostrar senha');
            buttonEl.setAttribute('title', isVisible ? 'Ocultar senha' : 'Mostrar senha');
        };

        updateVisual();

        buttonEl.addEventListener('click', (e) => {
            e.preventDefault();
            inputEl.type = inputEl.type === 'password' ? 'text' : 'password';
            updateVisual();
        });
    };

    setupPasswordToggle(togglePassword, document.getElementById('password'));
    setupPasswordToggle(toggleConfirmPassword, document.getElementById('confirmPassword'));

    console.log(' Eventos registrados com sucesso');
});

// Timer de 4 minutos para verifica��o
function startVerificationTimer() {
    let timeLeft = 240; // 4 minutos em segundos
    const timerElement = document.getElementById('verificationTimer');
    const resendBtn = document.getElementById('resendBtn');
    
    if (!timerElement || !resendBtn) {
        console.warn('Elementos de timer n�o encontrados');
        return;
    }

    // Mostrar timer
    updateTimerDisplay(timeLeft, timerElement);
    
    verificationTimer = setInterval(() => {
        timeLeft--;
        updateTimerDisplay(timeLeft, timerElement);
        
        if (timeLeft <= 0) {
            clearVerificationTimer();
            timerElement.textContent = 'C�digo expirado! Reenvie um novo c�digo.';
            timerElement.style.color = '#FF0000';
            document.getElementById('verifyForm').style.pointerEvents = 'none';
            document.getElementById('verifyForm').style.opacity = '0.5';
        }
    }, 1000);
}

function updateTimerDisplay(seconds, element) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    element.textContent = `V�lido por ${minutes}:${secs.toString().padStart(2, '0')}`;
}

function clearVerificationTimer() {
    if (verificationTimer) {
        clearInterval(verificationTimer);
        verificationTimer = null;
    }
}

// Reenviar c�digo
async function resendVerificationCode() {
    const now = Date.now();
    
    if (now - lastResendTime < RESEND_COOLDOWN) {
        const waitTime = Math.ceil((RESEND_COOLDOWN - (now - lastResendTime)) / 1000);
        document.getElementById('verifyError').textContent = `Aguarde ${waitTime}s antes de reenviar`;
        return;
    }
    
    const resendBtn = document.getElementById('resendBtn');
    resendBtn.disabled = true;
    resendBtn.textContent = 'Reenviando...';
    
    const result = await AuthAPI.resendVerification(userEmail);
    
    if (result.success) {
        lastResendTime = now;
        document.getElementById('verifyError').textContent = '? Novo c�digo enviado para seu email!';
        document.getElementById('verifyError').style.color = '#00FF00';
        document.getElementById('verificationCode').value = '';
        
        // Reiniciar timer
        clearVerificationTimer();
        startVerificationTimer();
        
        // Spinner no bot�o
        setTimeout(() => {
            resendBtn.disabled = false;
            resendBtn.textContent = 'Reenviar C�digo';
        }, 2000);
    } else {
        document.getElementById('verifyError').textContent = result.message || 'Erro ao reenviar c�digo';
        resendBtn.disabled = false;
        resendBtn.textContent = 'Reenviar C�digo';
    }
}

function clearErrors() {
    const errorElements = [
        'firstNameError',
        'lastNameError',
        'nicknameError',
        'emailError',
        'birthDateError',
        'passwordError',
        'confirmPasswordError',
        'formError',
        'verifyError'
    ];
    
    errorElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) element.textContent = '';
    });
}
