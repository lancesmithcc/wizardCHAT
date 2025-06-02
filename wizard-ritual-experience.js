// Enhanced loading experience with background processing
class WizardRitualExperience {
    constructor() {
        this.ritualId = null;
        this.startTime = null;
        this.pollingInterval = null;
        this.currentPhase = 0;
        this.phases = [
            { 
                time: 0, 
                message: "Initiating mystical communion...", 
                description: "The cosmic energies begin to stir",
                symbolCount: 5
            },
            { 
                time: 30000, // 30 seconds
                message: "Gathering cosmic energies...", 
                description: "Drawing power from distant galaxies",
                symbolCount: 15
            },
            { 
                time: 60000, // 1 minute
                message: "Consulting ancient scrolls...", 
                description: "Accessing the library of infinite wisdom",
                symbolCount: 25
            },
            { 
                time: 120000, // 2 minutes
                message: "Channeling interdimensional insights...", 
                description: "Bridging realms of consciousness",
                symbolCount: 40
            },
            { 
                time: 300000, // 5 minutes
                message: "Weaving legendary cosmic wisdom...", 
                description: "Crafting your personalized mystical guidance",
                symbolCount: 60
            }
        ];
    }

    async startRitual(message, responseMode, maxTokens) {
        this.startTime = Date.now();
        this.ritualId = `ritual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Show initial ritual state
        this.showRitualPhase(0);
        
        // Start background processing
        const backgroundResponse = await fetch('/.netlify/functions/background-deepseek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                ritualId: this.ritualId,
                message,
                responseMode,
                maxTokens
            })
        });
        
        if (backgroundResponse.ok) {
            // Start polling for results
            this.startPolling();
        } else {
            this.handleRitualFailure();
        }
    }

    startPolling() {
        this.pollingInterval = setInterval(async () => {
            await this.checkRitualProgress();
            this.updateRitualPhase();
        }, 5000); // Check every 5 seconds
    }

    async checkRitualProgress() {
        try {
            const response = await fetch(`/.netlify/functions/check-ritual?id=${this.ritualId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.complete) {
                    this.completeRitual(data.result);
                } else if (data.error) {
                    this.handleRitualFailure(data.error);
                }
            }
        } catch (error) {
            console.error('Polling error:', error);
        }
    }

    updateRitualPhase() {
        const elapsed = Date.now() - this.startTime;
        const newPhase = this.phases.findIndex(phase => elapsed < phase.time && phase.time > 0) - 1;
        const phaseIndex = Math.max(0, newPhase === -2 ? this.phases.length - 1 : newPhase);
        
        if (phaseIndex !== this.currentPhase) {
            this.currentPhase = phaseIndex;
            this.showRitualPhase(phaseIndex);
        }
    }

    showRitualPhase(phaseIndex) {
        const phase = this.phases[phaseIndex];
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        
        // Update wizard speech bubble
        const speechBubble = document.getElementById('wizard-speech-bubble');
        speechBubble.innerHTML = `
            <div class="ritual-phase">
                <div class="ritual-message">${phase.message}</div>
                <div class="ritual-description">${phase.description}</div>
                <div class="ritual-timer">Elapsed: ${elapsed}s • Phase ${phaseIndex + 1}/${this.phases.length}</div>
                <div class="ritual-progress">
                    <div class="progress-bar" style="width: ${Math.min(100, (elapsed / 300) * 100)}%"></div>
                </div>
            </div>
        `;
        
        // Spawn additional mystical symbols
        this.spawnRitualSymbols(phase.symbolCount);
        
        // Update wizard animation intensity
        this.updateWizardIntensity(phaseIndex);
    }

    spawnRitualSymbols(count) {
        const symbolsContainer = document.querySelector('.vibrational-symbols');
        // Add more symbols based on ritual intensity
        for (let i = 0; i < count; i++) {
            // Use existing symbol spawning logic but with ritual-specific symbols
            this.createRitualSymbol(symbolsContainer);
        }
    }

    createRitualSymbol(container) {
        const ritualSymbols = ['🔮', '✨', '🌟', '⭐', '💫', '🌙', '🌞', '🔯', '☯️', '🕉️'];
        const symbol = document.createElement('div');
        symbol.className = 'ritual-symbol';
        symbol.textContent = ritualSymbols[Math.floor(Math.random() * ritualSymbols.length)];
        
        // Random position
        symbol.style.left = Math.random() * window.innerWidth + 'px';
        symbol.style.top = Math.random() * window.innerHeight + 'px';
        symbol.style.animationDelay = Math.random() * 3 + 's';
        
        container.appendChild(symbol);
        
        // Remove after animation
        setTimeout(() => symbol.remove(), 10000);
    }

    updateWizardIntensity(phase) {
        const wizard = document.getElementById('wizard-ascii');
        wizard.style.animationDuration = `${3 - (phase * 0.3)}s`; // Faster animation = more intensity
    }

    completeRitual(result) {
        clearInterval(this.pollingInterval);
        
        // Show completion celebration
        this.showRitualCompletion();
        
        setTimeout(() => {
            // Display the final result
            this.displayWizardResponse(result);
        }, 2000);
    }

    showRitualCompletion() {
        const speechBubble = document.getElementById('wizard-speech-bubble');
        speechBubble.innerHTML = `
            <div class="ritual-complete">
                <div class="completion-message">🎆 COSMIC TRANSMISSION COMPLETE! 🎆</div>
                <div class="completion-description">Your legendary wisdom has been channeled from the depths of the universe!</div>
            </div>
        `;
        
        // Celebration symbol explosion
        this.triggerCelebrationSymbols();
    }

    handleRitualFailure(error) {
        clearInterval(this.pollingInterval);
        const speechBubble = document.getElementById('wizard-speech-bubble');
        speechBubble.innerHTML = `
            <div class="ritual-failed">
                <div class="failure-message">The cosmic energies have been disrupted!</div>
                <div class="failure-description">${error || 'The ritual requires more favorable celestial conditions.'}</div>
                <button onclick="wizardRitual.retryWithShorterMode()">Try a Less Intensive Ritual</button>
            </div>
        `;
    }
}

// Global instance
const wizardRitual = new WizardRitualExperience();
