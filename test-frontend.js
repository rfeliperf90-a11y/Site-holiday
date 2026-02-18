console.log('\n=== TESTING FRONTEND REACTION HANDLER ===\n');

// Simulate having a logged-in user
window.currentUser = {
    id: 1,
    username: 'testuser',
    token: 'teste_token'
};

// Mock the AuthAPI if it doesn't exist
if (!window.AuthAPI) {
    window.AuthAPI = {};
}

// Add the reaction method if it doesn't exist
if (!window.AuthAPI.addDownloadReaction) {
    window.AuthAPI.addDownloadReaction = async function(downloadId, reactionType) {
        console.log(`[API Call] POST /api/downloads/${downloadId}/reaction`, { reactionType });
        
        const response = await fetch(`http://localhost:5000/api/downloads/${downloadId}/reaction`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${window.currentUser.token}`
            },
            body: JSON.stringify({ reactionType })
        });
        
        return await response.json();
    };
}

// Test the handleReaction function
async function testHandleReaction() {
    // Simulate click event on like button
    const mockEvent = {
        currentTarget: {
            dataset: { id: 3, type: 'like' }
        },
        stopPropagation: () => {}
    };
    
    console.log('Simulating like button click...');
    try {
        // Try to call the handleReaction if it exists
        if (typeof window.handleReaction === 'function') {
            await window.handleReaction(mockEvent);
        } else {
            console.log('handleReaction function not found in window');
        }
    } catch (error) {
        console.error('Error calling handleReaction:', error);
    }
}

// Run test after a delay
setTimeout(() => {
    testHandleReaction();
}, 2000);

console.log('Frontend test initialized. Waiting for page to load...');
