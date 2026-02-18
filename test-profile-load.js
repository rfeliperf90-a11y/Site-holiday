// Simular exatamente o que o profile.js faz

async function testProfileLoad() {
    const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNzcwNTE2MTY3LCJleHAiOjE3NzMxMDgxNjd9._xEaDkEmDa8qZgSZUNSyKavBvIe3A3UqQSdQgx09X5k";
    
    const API_URL = 'http://localhost:5000/api';
    
    try {
        console.log('\n=== TESTE 1: GET PROFILE ===');
        const profileRes = await fetch(`${API_URL}/auth/profile`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const profileData = await profileRes.json();
        console.log('Status:', profileRes.status);
        console.log('Data:', JSON.stringify(profileData, null, 2));
        
        if (!profileData.success) {
            console.log('❌ ERRO: Profile retornou success=false');
            return;
        }
        
        const userId = profileData.user.id;
        
        console.log('\n=== TESTE 2: GET CUSTOM RANKS ===');
        const ranksRes = await fetch(`${API_URL}/ranks/user/${userId}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const ranksData = await ranksRes.json();
        console.log('Status:', ranksRes.status);
        console.log('Data:', JSON.stringify(ranksData, null, 2));
        
        console.log('\n=== TESTE 3: GET RANK HISTORY ===');
        const historyRes = await fetch(`${API_URL}/ranks/history/${userId}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const historyData = await historyRes.json();
        console.log('Status:', historyRes.status);
        console.log('Data:', JSON.stringify(historyData, null, 2));
        
        console.log('\n✅ TODOS OS TESTES COMPLETADOS');
        
    } catch (err) {
        console.error('❌ ERRO:', err);
    }
}

testProfileLoad();
