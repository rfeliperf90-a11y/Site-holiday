// Simular dados do backend
const profile = {
    selectedRanks: [
        { id: 21, name: 'Moderador', color: '#000000', icon: 'MOD' },
        { id: 19, name: 'Fundador', color: '#FFD700', icon: '�~.' },
        { id: 20, name: 'Initiate', color: '#FF6B9D', icon: '�o�' }
    ],
    autoRank: { name: 'Fundador', icon: 'FOUNDER', color: '#FFD700', level: 'founder' }
};

// Renderizar HTML como no downloads.js
const eloscustomHTML = profile.selectedRanks && profile.selectedRanks.length > 0 
    ? profile.selectedRanks.map(rank => `
        <p style="margin: 5px 0; font-size: 12px; background: ${rank.color}20; color: ${rank.color}; padding: 4px 10px; border-radius: 4px; display: inline-block; border: 1px solid ${rank.color}40; font-weight: 600;">
            ${rank.name}
        </p>
    `).join('')
    : '';

console.log('=== CONQUISTAS CUSTOMIZADOS HTML ===');
console.log(eloscustomHTML);

console.log('\n=== RENDERIZA�?�fO NA MODAL ===');
console.log(`
<div style="margin: 20px 0; padding: 15px; background: rgba(0,0,0,0.3); border-radius: 8px;">
    <p style="color: #999; font-size: 12px; margin-bottom: 10px;">CONQUISTAS CUSTOMIZADOS:</p>
    <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
        ${eloscustomHTML || '<p style="color: #999; font-size: 12px;">Nenhum conquista customizado</p>'}
    </div>
</div>
`);


