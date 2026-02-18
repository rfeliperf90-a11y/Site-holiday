import fetch from 'node-fetch';

const token = 'seu_token_aqui'; // Vamos testar sem token primeiro

// Testar usuário 1 (Fael)
const userId = 1;

fetch(`http://localhost:5000/api/downloads/user-profile/${userId}`, {
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
})
.then(res => res.json())
.then(data => {
    console.log('=== RESPOSTA DO BACKEND ===\n');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.profile) {
        console.log('\n=== ANÁLISE ===');
        console.log('selectedRanks:', data.profile.selectedRanks);
        console.log('selectedRanks é array?', Array.isArray(data.profile.selectedRanks));
        console.log('selectedRanks.length:', data.profile.selectedRanks?.length);
        console.log('\nautoRank:', data.profile.autoRank);
    }
})
.catch(err => console.error('Erro:', err));
