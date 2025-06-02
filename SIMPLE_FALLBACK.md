# 🔧 Simple Fallback Implementation (No Background Functions)

If the background functions continue to cause build issues, here's a simpler implementation that provides a great ritual experience without complex background processing:

## Replace the sendMessage function in script.js with this:

```javascript
async function sendMessage() {
    if (!chatInput) {
        console.error("Chat input not found in sendMessage");
        return;
    }

    const messageText = chatInput.value.trim();
    if (messageText) {
        // Analyze vibrational energy and spawn symbols
        const vibrationalLevel = analyzeVibrationalEnergy(messageText);
        spawnVibrationalSymbols(vibrationalLevel, messageText.length, messageText);
        
        // Set background color based on vibrational energy
        setVibrationalBackground(vibrationalLevel, messageText);
        
        // Start background music after first query
        if (!musicStarted) {
            startBackgroundMusic();
        }
        
        appendMessage(messageText, 'user-message');
        chatInput.value = '';
        toggleWizardSpeaking(true);

        const tokenCount = getTokenCount(responseLengthSlider.value);
        const responseMode = getResponseMode(responseLengthSlider.value);
        
        // For longer responses, show extended ritual experience
        if (tokenCount > 350) {
            await sendMessageWithRitualExperience(messageText, responseMode, tokenCount);
        } else {
            await sendImmediateMessage(messageText, responseMode, tokenCount);
        }
    }
}

// Enhanced ritual experience using just the regular API with extended loading
async function sendMessageWithRitualExperience(messageText, responseMode, tokenCount) {
    console.log(`Starting ritual experience: ${tokenCount} tokens in ${responseMode} mode`);
    
    // Add to conversation history
    conversationHistory.push({ role: "user", content: messageText });
    
    // Show ritual phases with timed updates
    showRitualPhase({
        message: "Initiating mystical ritual...",
        description: "The cosmic energies begin to gather",
        phase: 1,
        startTime: Date.now()
    });
    
    // Phase 2 after 10 seconds
    setTimeout(() => {
        showRitualPhase({
            message: "Gathering cosmic energies...",
            description: "Drawing power from distant galaxies", 
            phase: 2,
            startTime: Date.now() - 10000
        });
    }, 10000);
    
    // Phase 3 after 20 seconds
    setTimeout(() => {
        showRitualPhase({
            message: "Channeling interdimensional insights...",
            description: "Bridging realms of consciousness",
            phase: 3, 
            startTime: Date.now() - 20000
        });
    }, 20000);
    
    try {
        // Extended timeout for longer responses
        const timeoutMs = 45000; // 45 seconds
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
        }, timeoutMs);
        
        const response = await fetch('/.netlify/functions/deepseek-chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                message: messageText,
                conversationHistory: conversationHistory,
                maxTokens: tokenCount,
                responseMode: responseMode
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        if (data && data.reply) {
            // Show completion celebration
            showRitualCompletion();
            
            setTimeout(() => {
                conversationHistory.push({ role: "assistant", content: data.reply });
                displayWizardResponse(data.reply);
                toggleWizardSpeaking(false);
            }, 2000);
        } else {
            throw new Error('Invalid response format');
        }
        
    } catch (error) {
        console.error('Ritual failed:', error);
        handleRitualFailure(error.message);
    }
}

function showRitualPhase(phaseData) {
    if (!wizardSpeechBubble) return;
    
    const elapsed = Math.floor((Date.now() - phaseData.startTime) / 1000);
    
    wizardSpeechBubble.innerHTML = `
        <div class="ritual-phase">
            <div class="ritual-message">${phaseData.message}</div>
            <div class="ritual-description">${phaseData.description}</div>
            <div class="ritual-timer">Elapsed: ${elapsed}s • Phase ${phaseData.phase}</div>
            <div class="ritual-progress">
                <div class="progress-bar" style="width: ${Math.min(100, (elapsed / 60) * 100)}%"></div>
            </div>
            <button class="ritual-cancel" onclick="cancelCurrentRitual()">Cancel & Try Shorter Response</button>
        </div>
    `;
    
    // Spawn ritual symbols
    spawnRitualSymbols(phaseData.phase);
}

function showRitualCompletion() {
    wizardSpeechBubble.innerHTML = `
        <div class="ritual-complete">
            <div class="completion-message">🎆 COSMIC TRANSMISSION COMPLETE! 🎆</div>
            <div class="completion-description">Your mystical wisdom has manifested!</div>
        </div>
    `;
    
    // Celebration symbol explosion
    const celebrationSymbols = ['✨', '🎆', '🌟', '💫', '🎊', '🎉'];
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            const symbol = document.createElement('div');
            symbol.className = 'celebration-symbol';
            symbol.textContent = celebrationSymbols[Math.floor(Math.random() * celebrationSymbols.length)];
            symbol.style.left = Math.random() * window.innerWidth + 'px';
            symbol.style.top = Math.random() * window.innerHeight + 'px';
            vibrationalSymbols.appendChild(symbol);
            setTimeout(() => symbol.remove(), 3000);
        }, i * 100);
    }
}

function handleRitualFailure(error) {
    wizardSpeechBubble.innerHTML = `
        <div class="ritual-failed">
            <div class="failure-message">The cosmic energies have been disrupted!</div>
            <div class="failure-description">${error}</div>
            <button onclick="retryWithShorterMode()">Try Shorter Response Mode</button>
        </div>
    `;
    toggleWizardSpeaking(false);
}

window.cancelCurrentRitual = function() {
    const currentLevel = parseInt(responseLengthSlider.value);
    const newLevel = Math.max(1, currentLevel - 1);
    responseLengthSlider.value = newLevel;
    updateLengthIndicator(newLevel);
    
    handleRitualFailure('Ritual cancelled. Using shorter response mode for faster results!');
};

window.retryWithShorterMode = function() {
    const currentLevel = parseInt(responseLengthSlider.value);
    const newLevel = Math.max(1, currentLevel - 1);
    responseLengthSlider.value = newLevel;
    updateLengthIndicator(newLevel);
    
    // Clear the speech bubble
    wizardSpeechBubble.innerHTML = '';
    
    // Trigger new message
    setTimeout(() => {
        sendMessage();
    }, 500);
};
```

## Benefits of This Approach:

1. **No background functions needed** - works with just the regular deepseek-chat function
2. **Still provides ritual experience** - timed phases, progress bars, celebrations
3. **Much simpler deployment** - fewer moving parts to break
4. **Better reliability** - uses proven Netlify function patterns
5. **Same user experience** - users still get the mystical ritual feeling

This gives you 90% of the ritual experience without the complexity of background processing!
