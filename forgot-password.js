let resetEmail = '';
let codeVerified = false;
let verificationTimer = null;
let cooldownInterval = null;
let lastResendTime = 0;
const RESEND_COOLDOWN = 30000;

const requestResetForm = document.getElementById('requestResetForm');
const resetPasswordForm = document.getElementById('resetPasswordForm');
const codeSection = document.getElementById('codeSection');
const passwordSection = document.getElementById('passwordSection');
const requestError = document.getElementById('requestError');
const resetError = document.getElementById('resetError');
const resetCodeInput = document.getElementById('resetCode');
const emailInput = document.getElementById('email');
const resendBtn = document.getElementById('resendResetBtn');
const resendCooldownTimer = document.getElementById('resendCooldownTimer');

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function setResendState(disabled, message = '') {
    resendBtn.disabled = disabled;
    resendCooldownTimer.style.display = message ? 'block' : 'none';
    resendCooldownTimer.textContent = message;
}

function startCooldown(totalSeconds) {
    if (cooldownInterval) clearInterval(cooldownInterval);

    let seconds = totalSeconds;
    setResendState(true, `Aguarde ${seconds}s para reenviar.`);

    cooldownInterval = setInterval(() => {
        seconds -= 1;
        if (seconds <= 0) {
            clearInterval(cooldownInterval);
            cooldownInterval = null;
            setResendState(false, '');
            return;
        }
        setResendState(true, `Aguarde ${seconds}s para reenviar.`);
    }, 1000);
}

requestResetForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    requestError.textContent = '';
    resetEmail = normalizeEmail(emailInput.value);
    emailInput.value = resetEmail;

    if (!resetEmail) {
        requestError.textContent = 'Email e obrigatorio.';
        return;
    }

    if (!isValidEmail(resetEmail)) {
        requestError.textContent = 'Esse e-mail nao e um e-mail valido.';
        return;
    }

    const result = await AuthAPI.forgotPassword(resetEmail);

    if (!result.success) {
        requestError.textContent = result.message || 'Nao foi possivel enviar o codigo.';
        return;
    }

    codeVerified = false;
    requestResetForm.style.display = 'none';
    resetPasswordForm.style.display = 'block';
    codeSection.style.display = 'block';
    passwordSection.style.display = 'none';
    resetError.textContent = '';
    resetCodeInput.value = '';

    startResetTimer();
    lastResendTime = Date.now();
    startCooldown(Math.floor(RESEND_COOLDOWN / 1000));
});

resetCodeInput.addEventListener('input', async (e) => {
    const code = String(e.target.value || '').trim();
    if (code.length === 6 && !codeVerified) {
        await verifyResetCode(code);
    }
});

async function verifyResetCode(code) {
    const result = await AuthAPI.verifyResetCode(resetEmail, code);

    if (!result.success) {
        codeVerified = false;
        resetError.textContent = result.message || 'Codigo invalido.';
        resetCodeInput.value = '';
        return;
    }

    codeVerified = true;
    resetError.textContent = '';

    setTimeout(() => {
        codeSection.style.display = 'none';
        passwordSection.style.display = 'block';
        document.getElementById('newPassword').focus();
        clearResetTimer();
    }, 250);
}

function backToCodeVerification() {
    codeVerified = false;
    passwordSection.style.display = 'none';
    codeSection.style.display = 'block';
    resetCodeInput.focus();
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmNewPassword').value = '';

    clearResetTimer();
    startResetTimer();
}

resetPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!codeVerified) {
        resetError.textContent = 'Verifique o codigo primeiro.';
        return;
    }

    clearErrors();

    const code = String(document.getElementById('resetCode').value || '').trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmNewPassword').value;

    if (!code || !newPassword || !confirmPassword) {
        resetError.textContent = 'Preencha todos os campos.';
        return;
    }

    if (newPassword.length < 6) {
        resetError.textContent = 'Senha deve ter no minimo 6 caracteres.';
        return;
    }

    if (newPassword !== confirmPassword) {
        resetError.textContent = 'As senhas nao conferem.';
        return;
    }

    const result = await AuthAPI.resetPassword(resetEmail, code, newPassword, confirmPassword);

    if (result.success) {
        alert('Senha alterada com sucesso!');
        window.location.href = 'login.html';
    } else {
        resetError.textContent = result.message || 'Nao foi possivel alterar a senha.';
    }
});

function startResetTimer() {
    let timeLeft = 900;
    const timerElement = document.getElementById('resetTimer');
    if (!timerElement) return;

    updateTimerDisplay(timeLeft, timerElement);

    verificationTimer = setInterval(() => {
        timeLeft -= 1;
        updateTimerDisplay(timeLeft, timerElement);

        if (timeLeft <= 0) {
            clearResetTimer();
            timerElement.textContent = 'Codigo expirou. Clique em Reenviar Codigo.';
            timerElement.style.color = '#FF0000';
            codeSection.style.pointerEvents = 'none';
            codeSection.style.opacity = '0.5';
            setResendState(false, '');
        }
    }, 1000);
}

function updateTimerDisplay(seconds, element) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    element.textContent = `Valido por ${minutes}:${secs.toString().padStart(2, '0')}`;
}

function clearResetTimer() {
    if (verificationTimer) {
        clearInterval(verificationTimer);
        verificationTimer = null;
    }
}

async function resendResetCode() {
    const now = Date.now();

    if (now - lastResendTime < RESEND_COOLDOWN) {
        const waitTime = Math.ceil((RESEND_COOLDOWN - (now - lastResendTime)) / 1000);
        startCooldown(waitTime);
        return;
    }

    resendBtn.disabled = true;
    resendBtn.textContent = 'Reenviando...';
    setResendState(true, 'Enviando novo codigo...');

    const result = await AuthAPI.resendReset(resetEmail);

    resendBtn.textContent = 'Reenviar Codigo';

    if (!result.success) {
        setResendState(false, '');
        resetError.textContent = result.message || 'Erro ao reenviar codigo.';
        return;
    }

    lastResendTime = Date.now();
    codeVerified = false;
    resetError.textContent = 'Novo codigo enviado para seu e-mail.';
    resetError.style.color = '#10B981';
    resetCodeInput.value = '';

    clearResetTimer();
    startResetTimer();
    startCooldown(Math.floor(RESEND_COOLDOWN / 1000));
}

function clearErrors() {
    requestError.textContent = '';
    resetError.textContent = '';
    resetError.style.color = '';
}
