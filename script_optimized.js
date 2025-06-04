document.addEventListener('DOMContentLoaded', () => {
    const micButton = document.getElementById('mic-button');
    const wizardAscii = document.getElementById('wizard-ascii');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const userChatLog = document.getElementById('user-chat-log');
    const wizardSpeechBubble = document.getElementById('wizard-speech-bubble');
    const vibrationalSymbols = document.querySelector('.vibrational-symbols');
    const astrologicalWheel = document.querySelector('.astrological-wheel');
    const responseLengthSlider = document.getElementById('response-length-slider');
    const lengthIndicator = document.getElementById('length-indicator');

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    let recordingTimeout;
    let backgroundMusic = null;
    let musicStarted = false;
    let conversationHistory = [];
    let audioContext = null;
    let wizardAudioEffects = null;

    // OPTIMIZATION: Enhanced caching with larger cache and longer duration
    const responseCache = new Map();
    const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes
    const MAX_CACHE_SIZE = 50; // Increased from 20

    // OPTIMIZATION: Connection status tracking
    let connectionStatus = 'online';
    let lastRequestTime = 0;
    const MIN_REQUEST_INTERVAL = 1000; // Minimum 1 second between requests

    // OPTIMIZATION: Request queue for debouncing
    let pendingRequest = null;

    // OPTIMIZATION: Symbol pool for reuse instead of creating new ones
    const symbolPool = [];
    const MAX_SYMBOL_POOL_SIZE = 30;

    // OPTIMIZATION: Reduced symbol arrays for better memory usage
    const positiveSymbols = [
        '☀️', '🌟', '✨', '💫', '⭐', '🌙', '💎', '🔮', '🕉️', '☯️', 
        '🙏', '✝️', '☪️', '🔯', '☮️', '🕎', '⚛️', '🧿', '📿', '⛩️',
        '🕯️', '🔥', '👼', '😇', '🧘', '🌈', '🦋', '🕊️', '🌸', '🌺'
    ];

    const negativeSymbols = [
        '💀', '☠️', '👹', '👺', '👿', '😈', '🧟', '🦇', '🕷️', '🐍', 
        '🦂', '⚰️', '⚱️', '💥', '⚡', '🌪️', '☄️', '💔', '😵', '😰',
        '😱', '🤮', '😭', '😢', '😤', '😡', '🤬', '😠', '😾', '🙄'
    ];

    function getCacheKey(message, mode, tokens) {
        return `${message.toLowerCase().trim()}_${mode}_${tokens}`;
    }

    // OPTIMIZATION: Simplified vibrational analysis
    function analyzeVibrationalEnergy(text) {
        const lowerText = text.toLowerCase();
        const positiveWords = ['love', 'peace', 'joy', 'light', 'gratitude', 'blessed', 'amazing', 
                             'beautiful', 'wonderful', 'happy', 'divine', 'sacred', 'healing', 
                             'wisdom', 'harmony', 'hope', 'faith', 'magic', 'soul', 'spirit'];
        const negativeWords = ['hate', 'anger', 'fear', 'dark', 'evil', 'terrible', 'awful', 
                             'sad', 'depressed', 'anxious', 'worried', 'stressed', 'angry', 
                             'broken', 'hurt', 'pain', 'death', 'kill', 'fight', 'war'];
        
        let score = 0;
        positiveWords.forEach(word => { if (lowerText.includes(word)) score++; });
        negativeWords.forEach(word => { if (lowerText.includes(word)) score--; });
        
        // Neutral messages get slight positive bias
        if (score === 0) score = 1;
        
        return Math.max(-3, Math.min(3, score));
    }

    // OPTIMIZATION: Simplified color mapping
    const vibrationalColors = {
        3: '#3d047a', 2: '#500470', 1: '#061b59',
        0: '#333333', '-1': '#332411', '-2': '#3b1204', '-3': '#580404'
    };

    // OPTIMIZATION: Use RAF for background animation
    function setVibrationalBackground(vibrationalLevel, messageText) {
        const vibeColor = vibrationalColors[vibrationalLevel.toString()] || '#4f009d';
        
        document.documentElement.style.setProperty('--vibe-color', vibeColor);
        document.body.classList.add('vibrational-pulse');
        
        if (window.vibrationalTimeout) {
            clearTimeout(window.vibrationalTimeout);
        }
        
        window.vibrationalTimeout = setTimeout(() => {
            clearVibrationalBackground();
        }, 15000);
    }

    function clearVibrationalBackground() {
        document.body.classList.remove('vibrational-pulse');
        document.documentElement.style.setProperty('--vibe-color', '#000000');
    }

    // OPTIMIZATION: Create permanent astrological wheel once
    function createAstrologicalWheel() {
        if (!astrologicalWheel || astrologicalWheel.children.length > 0) return;
        
        const astroSigns = ['☿', '♀', '♁', '♂', '♃', '♄', '♅', '♆', '♇'];
        const fragment = document.createDocumentFragment();
        
        astroSigns.forEach((sign, index) => {
            const symbol = document.createElement('div');
            symbol.className = 'zodiac-symbol';
            symbol.textContent = sign;
            
            const angle = index * 40;
            const radius = 45;
            const angleRad = (angle * Math.PI) / 180;
            
            const x = 50 + radius * Math.cos(angleRad);
            const y = 50 + radius * Math.sin(angleRad);
            
            symbol.style.left = x + '%';
            symbol.style.top = y + '%';
            
            fragment.appendChild(symbol);
        });
        
        astrologicalWheel.appendChild(fragment);
    }

    // OPTIMIZATION: Pool-based symbol spawning
    function getPooledSymbol() {
        if (symbolPool.length > 0) {
            return symbolPool.pop();
        }
        const symbol = document.createElement('div');
        symbol.className = 'vibrational-symbol';
        return symbol;
    }

    function returnToPool(symbol) {
        if (symbolPool.length < MAX_SYMBOL_POOL_SIZE) {
            symbol.style.display = 'none';
            symbolPool.push(symbol);
        } else {
            symbol.remove();
        }
    }

    // OPTIMIZATION: Efficient symbol spawning with RAF and pooling
    function spawnVibrationalSymbols(vibrationalLevel, messageLength, messageText) {
        if (!vibrationalSymbols) return;
        
        clearVibrationalSymbols();
        
        const isPositive = vibrationalLevel > 0;
        const intensity = Math.abs(vibrationalLevel);
        const symbolCount = Math.min(10, Math.max(3, intensity * 2)); // Reduced from 15
        
        const symbolArray = isPositive ? positiveSymbols : negativeSymbols;
        const fragment = document.createDocumentFragment();
        
        for (let i = 0; i < symbolCount; i++) {
            const symbol = getPooledSymbol();
            symbol.style.display = '';
            symbol.className = `vibrational-symbol ${isPositive ? 'positive' : 'negative'}`;
            symbol.textContent = symbolArray[Math.floor(Math.random() * symbolArray.length)];
            
            symbol.style.left = Math.random() * (window.innerWidth - 100) + 50 + 'px';
            symbol.style.top = Math.random() * (window.innerHeight - 100) + 50 + 'px';
            
            const size = 18 + (intensity * 3) + Math.random() * 10;
            symbol.style.fontSize = size + 'px';
            symbol.style.animationDelay = Math.random() * 2 + 's';
            
            fragment.appendChild(symbol);
            
            // Return to pool after animation
            setTimeout(() => returnToPool(symbol), 10000);
        }
        
        vibrationalSymbols.appendChild(fragment);
    }

    function clearVibrationalSymbols() {
        if (!vibrationalSymbols) return;
        Array.from(vibrationalSymbols.children).forEach(child => {
            returnToPool(child);
        });
    }

    // OPTIMIZATION: Lazy load background music
    function initializeBackgroundMusic() {
        if (backgroundMusic) return;
        
        backgroundMusic = new Audio('./wizardry.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0;
        
        backgroundMusic.oncanplay = () => console.log('Background music ready');
        backgroundMusic.onerror = (e) => console.error('Background music error:', e);
    }

    function startBackgroundMusic() {
        if (!musicStarted && backgroundMusic) {
            backgroundMusic.play().then(() => {
                musicStarted = true;
                
                // Simplified fade in
                let volume = 0;
                const fadeInterval = setInterval(() => {
                    volume += 0.005;
                    if (volume >= 0.15) {
                        backgroundMusic.volume = 0.15;
                        clearInterval(fadeInterval);
                    } else {
                        backgroundMusic.volume = volume;
                    }
                }, 50);
            }).catch(err => {
                console.error("Error starting background music:", err);
            });
        }
    }

    function initializeMicrophone() {
        if (micButton) {
            micButton.disabled = false;
            micButton.addEventListener('click', handleMicButtonClick);
        }
    }

    function toggleWizardSpeaking(isSpeaking) {
        wizardAscii.classList.toggle('speaking', isSpeaking);
    }

    // OPTIMIZATION: Debounced TTS
    let ttsQueue = [];
    let isSpeaking = false;

    async function speakWizardResponse(text) {
        ttsQueue.push(text);
        if (!isSpeaking) {
            processTTSQueue();
        }
    }

    async function processTTSQueue() {
        if (ttsQueue.length === 0) {
            isSpeaking = false;
            return;
        }
        
        isSpeaking = true;
        const text = ttsQueue.shift();
        
        try {
            const response = await fetch('/.netlify/functions/fal-kokoro-tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.audioUrl) {
                    const audio = new Audio(data.audioUrl);
                    audio.volume = 1.0;
                    
                    audio.onended = () => processTTSQueue();
                    audio.onerror = () => processTTSQueue();
                    
                    await audio.play();
                } else {
                    processTTSQueue();
                }
            } else {
                processTTSQueue();
            }
        } catch (error) {
            console.error("TTS error:", error);
            processTTSQueue();
        }
    }

    function showConjuringState() {
        if (!wizardSpeechBubble) return;
        
        wizardSpeechBubble.textContent = '';
        wizardSpeechBubble.classList.add('conjuring');
        wizardSpeechBubble.style.animation = '';
        wizardSpeechBubble.style.color = '';
    }

    function clearConjuringState() {
        if (!wizardSpeechBubble) return;
        wizardSpeechBubble.classList.remove('conjuring');
    }

    // OPTIMIZATION: Efficient typing effect
    function displayWizardResponse(text, isError = false) {
        if (!wizardSpeechBubble) {
            appendMessage(text, isError ? 'wizard-message error' : 'wizard-message');
            return;
        }
        
        clearConjuringState();
        
        if (isError) {
            wizardSpeechBubble.textContent = text;
            wizardSpeechBubble.style.animation = 'none';
            wizardSpeechBubble.style.color = '#ff6b6b';
        } else {
            wizardSpeechBubble.textContent = '';
            wizardSpeechBubble.style.animation = '';
            wizardSpeechBubble.style.color = '';
            
            speakWizardResponse(text);
            
            // Optimized typing with RAF
            let charIndex = 0;
            function typeChar() {
                if (charIndex < text.length) {
                    wizardSpeechBubble.textContent += text.charAt(charIndex);
                    charIndex++;
                    requestAnimationFrame(() => setTimeout(typeChar, 25));
                }
            }
            typeChar();
        }
    }

    function appendMessage(text, className) {
        if (!userChatLog) return;
        
        const messageElement = document.createElement('p');
        messageElement.textContent = text;
        messageElement.className = className;
        userChatLog.appendChild(messageElement);
        userChatLog.scrollTop = userChatLog.scrollHeight;
    }

    // OPTIMIZATION: Smaller audio handling
    async function handleMicButtonClick() {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000,
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true
                    }
                });
                
                const options = { 
                    mimeType: 'audio/webm;codecs=opus',
                    audioBitsPerSecond: 16000
                };
                
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = 'audio/webm';
                }
                
                mediaRecorder = new MediaRecorder(stream, options);
                
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstart = () => {
                    chatInput.placeholder = "Listening... (max 15s)";
                    micButton?.classList.add('recording');
                    
                    recordingTimeout = setTimeout(() => {
                        if (mediaRecorder?.state === "recording") {
                            mediaRecorder.stop();
                        }
                    }, 15000); // Reduced from 20s
                };

                mediaRecorder.onstop = async () => {
                    chatInput.placeholder = "Speak or type thy query...";
                    micButton?.classList.remove('recording');
                    
                    clearTimeout(recordingTimeout);
                    
                    if (audioChunks.length === 0) return;
                    
                    const audioBlob = new Blob(audioChunks, { type: options.mimeType || 'audio/webm' });
                    audioChunks = [];

                    if (audioBlob.size > 5 * 1024 * 1024) { // 5MB limit
                        appendMessage("Audio too large. Try a shorter recording.", "wizard-message error");
                        return;
                    }

                    appendMessage("[Processing thy whispers...]", "user-message dimmed");

                    try {
                        const audioDataUrl = await blobToDataUrl(audioBlob);
                        
                        const response = await fetch('/.netlify/functions/fal-whisper-stt', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ audioData: audioDataUrl }),
                        });

                        if (response.ok) {
                            const data = await response.json();
                            if (data.transcript) {
                                chatInput.value = data.transcript;
                                const processingMessage = Array.from(userChatLog.children)
                                    .find(el => el.textContent === "[Processing thy whispers...]");
                                processingMessage?.remove();
                                sendMessage();
                            }
                        }
                    } catch (err) {
                        console.error("STT error:", err);
                        appendMessage("Voice processing failed.", "wizard-message error");
                    }
                };

                mediaRecorder.start();
                isRecording = true;
                
            } catch (err) {
                console.error("Microphone error:", err);
                appendMessage("Cannot access microphone.", "wizard-message error");
            }
        } else {
            mediaRecorder?.stop();
            clearTimeout(recordingTimeout);
            isRecording = false;
        }
    }

    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    // OPTIMIZATION: Debounced message sending
    async function sendMessage() {
        const currentTime = Date.now();
        if (currentTime - lastRequestTime < MIN_REQUEST_INTERVAL) {
            setTimeout(sendMessage, MIN_REQUEST_INTERVAL - (currentTime - lastRequestTime));
            return;
        }
        
        lastRequestTime = currentTime;
        
        if (!chatInput) return;

        const messageText = chatInput.value.trim();
        if (messageText) {
            // Cancel any pending request
            if (pendingRequest) {
                pendingRequest.abort();
                pendingRequest = null;
            }
            
            const vibrationalLevel = analyzeVibrationalEnergy(messageText);
            spawnVibrationalSymbols(vibrationalLevel, messageText.length, messageText);
            setVibrationalBackground(vibrationalLevel, messageText);
            
            if (!musicStarted) {
                initializeBackgroundMusic();
                startBackgroundMusic();
            }
            
            appendMessage(messageText, 'user-message');
            chatInput.value = '';
            toggleWizardSpeaking(true);

            const tokenCount = getTokenCount(responseLengthSlider.value);
            const responseMode = getResponseMode(responseLengthSlider.value);
            
            await sendOptimizedMessage(messageText, responseMode, tokenCount);
        }
    }

    // OPTIMIZATION: Unified message handler with better error recovery
    async function sendOptimizedMessage(messageText, responseMode, tokenCount) {
        conversationHistory.push({ role: "user", content: messageText });
        
        // Keep conversation history limited
        if (conversationHistory.length > 8) {
            conversationHistory = conversationHistory.slice(-8);
        }
        
        // Check cache first
        const cacheKey = getCacheKey(messageText, responseMode, tokenCount);
        const cached = responseCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            displayWizardResponse(cached.reply);
            toggleWizardSpeaking(false);
            return;
        }
        
        showConjuringState();
        
        // Create abort controller for this request
        const controller = new AbortController();
        pendingRequest = controller;
        
        try {
            const timeoutMs = tokenCount > 300 ? 20000 : 15000;
            
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, timeoutMs);
            
            const response = await fetch('/.netlify/functions/deepseek-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: messageText,
                    conversationHistory: conversationHistory,
                    maxTokens: tokenCount,
                    responseMode: responseMode
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            pendingRequest = null;
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            if (data?.reply) {
                conversationHistory.push({ role: "assistant", content: data.reply });
                
                // Cache response
                responseCache.set(cacheKey, {
                    reply: data.reply,
                    timestamp: Date.now()
                });
                
                // Clean cache if too large
                if (responseCache.size > MAX_CACHE_SIZE) {
                    const oldestKey = responseCache.keys().next().value;
                    responseCache.delete(oldestKey);
                }
                
                displayWizardResponse(data.reply);
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            console.error('Message failed:', error);
            
            let errorMessage;
            if (error.name === 'AbortError') {
                errorMessage = `Response timed out! Try Level ${Math.max(1, parseInt(responseLengthSlider.value) - 1)} for faster results.`;
            } else if (connectionStatus === 'offline') {
                errorMessage = "You appear to be offline. Check your connection and try again.";
            } else {
                errorMessage = "The cosmic servers are busy. Try a shorter response level.";
            }
            
            displayWizardResponse(errorMessage, true);
        } finally {
            toggleWizardSpeaking(false);
            pendingRequest = null;
        }
    }

    // OPTIMIZATION: Adjusted token counts for better reliability
    function getTokenCount(sliderValue) {
        const tokenMap = {
            1: 60,    // Very short
            2: 120,   // Short
            3: 200,   // Moderate  
            4: 300,   // Long
            5: 400,   // Very long
            6: 500    // Maximum
        };
        return tokenMap[sliderValue] || 120;
    }

    function getResponseMode(sliderValue) {
        const modes = {
            1: "cryptic",
            2: "moderate",
            3: "deep",
            4: "profound",
            5: "epic",
            6: "legendary"
        };
        return modes[sliderValue] || "moderate";
    }

    function updateLengthIndicator(value) {
        const indicators = {
            1: "Brief Whispers ⚡",
            2: "Quick Wisdom ⚡", 
            3: "Balanced Insights ⚡",
            4: "Deep Knowledge ⚠️",
            5: "Epic Revelations ⚠️",
            6: "Cosmic Odyssey ⚠️"
        };
        
        if (lengthIndicator) {
            lengthIndicator.textContent = indicators[value] || "Balanced Insights";
            lengthIndicator.className = 'length-indicator';
            lengthIndicator.classList.add(parseInt(value) <= 3 ? 'reliable' : 'unreliable');
        }
    }

    // Event listeners
    sendButton?.addEventListener('click', sendMessage);
    
    chatInput?.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    responseLengthSlider?.addEventListener('input', (event) => {
        updateLengthIndicator(event.target.value);
    });

    // OPTIMIZATION: Connection monitoring
    window.addEventListener('online', () => {
        connectionStatus = 'online';
        console.log('Connection restored');
    });

    window.addEventListener('offline', () => {
        connectionStatus = 'offline';
        console.log('Connection lost');
    });

    // Initialize
    initializeMicrophone();
    createAstrologicalWheel();
    updateLengthIndicator(responseLengthSlider?.value || 3);
});