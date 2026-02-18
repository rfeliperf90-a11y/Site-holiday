import http from 'http';

const userId = 1; // Fael

const options = {
    hostname: 'localhost',
    port: 5000,
    path: `/api/downloads/user-profile/${userId}`,
    method: 'GET',
    headers: {
        'Content-Type': 'application/json'
    }
};

const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const response = JSON.parse(data);
            console.log('=== RESPOSTA DO BACKEND ===\n');
            console.log(JSON.stringify(response, null, 2));
            
            if (response.profile) {
                console.log('\n=== ANÁLISE ===');
                console.log('selectedRanks:', response.profile.selectedRanks);
                console.log('selectedRanks é array?', Array.isArray(response.profile.selectedRanks));
                console.log('selectedRanks.length:', response.profile.selectedRanks?.length);
                console.log('\nautoRank:', response.profile.autoRank);
            }
            process.exit(0);
        } catch (e) {
            console.error('Erro ao fazer parse:', e);
            process.exit(1);
        }
    });
});

req.on('error', (e) => {
    console.error('Erro:', e);
    process.exit(1);
});

req.end();
