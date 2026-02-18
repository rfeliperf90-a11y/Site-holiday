// Teste mais detalhado simulando o que profile.js faz

async function testFullProfileFlow() {
    console.log('\n=== INICIANDO TESTE COMPLETO ===\n');
    
    const API_URL = 'http://localhost:5000/api';
    
    // Gerar um token vÃ¡lido
    const loginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({nickname: 'fael', password: 'test123'})
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    
    console.log('âœ“ Token obtido:', token.substring(0, 20) + '...');
    
    try {
        // ETAPA 1: Buscar perfil
        console.log('\n--- ETAPA 1: Buscando perfil ---');
        const profileRes = await fetch(`${API_URL}/auth/profile`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const profileData = await profileRes.json();
        
        if (!profileData.success) {
            throw new Error('Profile API falhou: ' + profileData.message);
        }
        console.log('âœ“ Perfil carregado');
        console.log('  - UsuÃ¡rio:', profileData.user.firstName, profileData.user.lastName);
        console.log('  - Email:', profileData.user.email);
        console.log('  - conquista:', profileData.rank?.name || 'nenhum');
        console.log('  - HistÃ³rico de conquistas:', profileData.rankHistory?.length || 0);
        
        // Simular atribuiÃ§Ã£o de variÃ¡veis como profile.js faz
        const currentUser = profileData.user;
        const userId = currentUser.id;
        
        // ETAPA 2: Renderizar perfil no DOM (simulado)
        console.log('\n--- ETAPA 2: Atualizando UI ---');
        console.log('âœ“ Nome completo:', currentUser.firstName + ' ' + currentUser.lastName);
        console.log('âœ“ Bio:', currentUser.bio || '(vazia)');
        
        // ETAPA 3: Carregar histÃ³rico
        console.log('\n--- ETAPA 3: HistÃ³rico de conquistas ---');
        if (profileData.rankHistory && profileData.rankHistory.length > 0) {
            console.log('âœ“ HistÃ³rico encontrado:', profileData.rankHistory.length, 'conquistas');
            profileData.rankHistory.forEach((item, idx) => {
                console.log(`  ${idx + 1}. ${item.rankName} em ${item.achievedAt}`);
            });
        } else {
            console.log('âœ“ Nenhum histÃ³rico ainda (normal para novo usuÃ¡rio)');
        }
        
        // ETAPA 4: Carregar conquistas customizados do usuÃ¡rio
        console.log('\n--- ETAPA 4: conquistas customizados ---');
        const elosRes = await fetch(`${API_URL}/ranks/user/${userId}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const elosData = await elosRes.json();
        
        if (elosData.success && elosData.ranks && elosData.ranks.length > 0) {
            console.log('âœ“ conquistas customizados encontrados:', elosData.ranks.length);
            elosData.ranks.forEach(rank => {
                console.log(`  - ${rank.name} (${rank.color})`);
            });
        } else {
            console.log('âœ“ Nenhum conquista customizado atribuÃ­do');
        }
        
        console.log('\nâœ… TESTE COMPLETO - Tudo funcionando normalmente!');
        
    } catch (err) {
        console.error('\nâŒ ERRO:', err.message);
        console.error('Stack:', err.stack);
    }
}

testFullProfileFlow();


