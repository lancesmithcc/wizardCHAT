document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
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

    // State management
    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    let recordingTimeout;
    let backgroundMusic = null;
    let musicStarted = false;
    let conversationHistory = [];

    // OPTIMIZATION: Advanced caching with IndexedDB
    const responseCache = new Map();
    const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
    const MAX_CACHE_SIZE = 200;
    let cacheDB = null;

    // OPTIMIZATION: Request management
    const requestManager = {
        activeRequests: new Map(),
        queue: [],
        processing: false,
        lastRequestTime: 0,
        minInterval: 500,
        retryDelays: [1000, 2000, 4000]
    };

    // OPTIMIZATION: Fallback responses for timeouts
    const fallbackResponses = {
        timeout: [
            "the cosmic servers are overwhelmed with seekers rn. perhaps try a shorter question?",
            "the astral connection is taking longer than expected. shall we try level 1-3 for instant wisdom?",
            "even wizards must wait for the stars to align. try a quicker response level?"
        ],
        error: [
            "the mystical energies are unstable. let's try again with a simpler query?",
            "the cosmic void interfered with our connection. shall we reconnect?",
            "the ancient servers need a moment to recover. try again shortly?"
        ]
    };

    // OPTIMIZATION: Initialize IndexedDB for persistent caching
    async function initCacheDB() {
        try {
            const request = indexedDB.open('WizardChatCache', 2);
            request.onsuccess = (event) => {
                cacheDB = event.target.result;
                console.log('Cache DB initialized');
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('responses')) {
                    db.createObjectStore('responses', { keyPath: 'key' });
                }
                if (!db.objectStoreNames.contains('audio')) {
                    db.createObjectStore('audio', { keyPath: 'text' });
                }
            };
        } catch (e) {
            console.log('IndexedDB not available');
        }
    }

    // OPTIMIZATION: Symbol pooling for performance
    const symbolPool = {
        available: [],
        active: new Set(),
        maxSize: 30,
        
        get() {
            if (this.available.length > 0) {
                return this.available.pop();
            }
            const symbol = document.createElement('div');
            symbol.className = 'vibrational-symbol';
            return symbol;
        },
        
        return(symbol) {
            this.active.delete(symbol);
            symbol.style.display = 'none';
            if (this.available.length < this.maxSize) {
                this.available.push(symbol);
            } else {
                symbol.remove();
            }
        },
        
        clear() {
            this.active.forEach(symbol => this.return(symbol));
        }
    };

    // OPTIMIZATION: Efficient vibrational analysis
    const vibrationalAnalyzer = {
        cache: new Map(),
        maxCacheSize: 100,
        
        analyze(text) {
            const key = text.toLowerCase().trim();
            if (this.cache.has(key)) {
                return this.cache.get(key);
            }
            
            const positivePatterns = /\b(love|peace|joy|light|gratitude|blessed|happy|divine|healing|wisdom|harmony|hope|faith|magic|soul)\b/gi;
            const negativePatterns = /\b(hate|anger|fear|dark|evil|sad|depressed|anxious|worried|stressed|angry|broken|hurt|pain|death)\b/gi;
            
            const positiveMatches = (key.match(positivePatterns) || []).length;
            const negativeMatches = (key.match(negativePatterns) || []).length;
            
            let score = positiveMatches - negativeMatches;
            if (score === 0) score = 1; // Neutral bias
            
            const result = Math.max(-3, Math.min(3, score));
            
            this.cache.set(key, result);
            if (this.cache.size > this.maxCacheSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }
            
            return result;
        }
    };

    // OPTIMIZATION: Batch DOM operations
    const domBatcher = {
        updates: [],
        rafId: null,
        
        add(fn) {
            this.updates.push(fn);
            if (!this.rafId) {
                this.rafId = requestAnimationFrame(() => {
                    this.flush();
                });
            }
        },
        
        flush() {
            const updates = this.updates.splice(0);
            updates.forEach(fn => fn());
            this.rafId = null;
        }
    };

    // Cache management functions
    function getCacheKey(message, mode, tokens) {
        return `${message.toLowerCase().trim().substring(0, 100)}_${mode}_${tokens}`;
    }

    async function getCachedResponse(key) {
        // Check memory cache first
        const memCached = responseCache.get(key);
        if (memCached && Date.now() - memCached.timestamp < CACHE_DURATION) {
            return memCached.reply;
        }

        // Check IndexedDB
        if (cacheDB) {
            try {
                const transaction = cacheDB.transaction(['responses'], 'readonly');
                const store = transaction.objectStore('responses');
                const request = store.get(key);
                
                return new Promise((resolve) => {
                    request.onsuccess = () => {
                        const result = request.result;
                        if (result && Date.now() - result.timestamp < CACHE_DURATION) {
                            responseCache.set(key, result);
                            resolve(result.reply);
                        } else {
                            resolve(null);
                        }
                    };
                    request.onerror = () => resolve(null);
                });
            } catch (e) {
                return null;
            }
        }
        return null;
    }

    async function setCachedResponse(key, reply) {
        const cacheData = { key, reply, timestamp: Date.now() };
        
        responseCache.set(key, cacheData);
        
        if (responseCache.size > MAX_CACHE_SIZE) {
            const entries = Array.from(responseCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            entries.slice(0, 50).forEach(([key]) => responseCache.delete(key));
        }

        if (cacheDB) {
            try {
                const transaction = cacheDB.transaction(['responses'], 'readwrite');
                const store = transaction.objectStore('responses');
                store.put(cacheData);
            } catch (e) {
                console.log('Failed to save to IndexedDB');
            }
        }
    }

    // Visual effects functions
    const vibrationalColors = {
        3: '#3d047a', 2: '#500470', 1: '#061b59',
        0: '#333333', '-1': '#332411', '-2': '#3b1204', '-3': '#580404'
    };

    function setVibrationalBackground(vibrationalLevel) {
        domBatcher.add(() => {
            const vibeColor = vibrationalColors[vibrationalLevel] || '#4f009d';
            document.documentElement.style.setProperty('--vibe-color', vibeColor);
            document.body.classList.add('vibrational-pulse');
        });
        
        setTimeout(() => {
            domBatcher.add(() => {
                document.body.classList.remove('vibrational-pulse');
                document.documentElement.style.setProperty('--vibe-color', '#000000');
            });
        }, 15000);
    }

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
            
            symbol.style.left = (50 + radius * Math.cos(angleRad)) + '%';
            symbol.style.top = (50 + radius * Math.sin(angleRad)) + '%';
            
            fragment.appendChild(symbol);
        });
        
        astrologicalWheel.appendChild(fragment);
    }

    function spawnVibrationalSymbols(vibrationalLevel) {
        if (!vibrationalSymbols) return;
        
        symbolPool.clear();
        
        const isPositive = vibrationalLevel > 0;
        const intensity = Math.abs(vibrationalLevel);
        const symbolCount = Math.min(8, 3 + intensity);
        
        const symbols = isPositive ? 
            ['☀️', '🌟', '✨', '💫', '⭐', '🌙', '💎', '🔮'] :
            ['💀', '☠️', '👹', '👺', '👿', '😈', '🧟', '🦇'];
        
        domBatcher.add(() => {
            const fragment = document.createDocumentFragment();
            
            for (let i = 0; i < symbolCount; i++) {
                const symbol = symbolPool.get();
                symbol.style.display = '';
                symbol.className = `vibrational-symbol ${isPositive ? 'positive' : 'negative'}`;
                symbol.textContent = symbols[Math.floor(Math.random() * symbols.length)];
                
                symbol.style.left = Math.random() * (window.innerWidth - 100) + 50 + 'px';
                symbol.style.top = Math.random() * (window.innerHeight - 100) + 50 + 'px';
                symbol.style.fontSize = (18 + intensity * 3 + Math.random() * 10) + 'px';
                symbol.style.animationDelay = Math.random() * 2 + 's';
                
                symbolPool.active.add(symbol);
                fragment.appendChild(symbol);
                
                setTimeout(() => symbolPool.return(symbol), 10000);
            }
            
            vibrationalSymbols.appendChild(fragment);
        });
    }

    // Audio functions
    function initializeBackgroundMusic() {
        if (backgroundMusic) return;
        
        backgroundMusic = new Audio('./wizardry.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0;
        backgroundMusic.preload = 'none'; // Don't preload until needed
    }

    function startBackgroundMusic() {
        if (!musicStarted && backgroundMusic) {
            backgroundMusic.play().then(() => {
                musicStarted = true;
                
                let volume = 0;
                const fadeInterval = setInterval(() => {
                    volume += 0.01;
                    if (volume >= 0.15) {
                        backgroundMusic.volume = 0.15;
                        clearInterval(fadeInterval);
                    } else {
                        backgroundMusic.volume = volume;
                    }
                }, 100);
            }).catch(err => {
                console.error("Music error:", err);
            });
        }
    }

    // TTS Queue management
    const ttsQueue = {
        items: [],
        processing: false,
        cache: new Map(),
        maxCache: 30,
        
        async add(text) {
            // Check cache first
            if (this.cache.has(text)) {
                const audio = new Audio(this.cache.get(text));
                audio.volume = 1.0;
                try {
                    await audio.play();
                } catch (e) {
                    console.error('TTS playback error:', e);
                }
                return;
            }
            
            this.items.push(text);
            if (!this.processing) {
                this.process();
            }
        },
        
        async process() {
            if (this.items.length === 0) {
                this.processing = false;
                return;
            }
            
            this.processing = true;
            const text = this.items.shift();
            
            try {
                const response = await fetch('/.netlify/functions/fal-kokoro-tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text }),
                    signal: AbortSignal.timeout(10000) // 10 second timeout
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.audioUrl) {
                        // Cache the URL
                        this.cache.set(text, data.audioUrl);
                        if (this.cache.size > this.maxCache) {
                            const firstKey = this.cache.keys().next().value;
                            this.cache.delete(firstKey);
                        }

                        const audio = new Audio(data.audioUrl);
                        audio.volume = 1.0;
                        
                        audio.onended = () => this.process();
                        audio.onerror = () => this.process();
                        
                        await audio.play();
                        return;
                    }
                }
            } catch (error) {
                console.error("TTS error:", error);
            }
            
            this.process();
        }
    };

    // UI functions
    function showConjuringState() {
        if (!wizardSpeechBubble) return;
        
        domBatcher.add(() => {
            wizardSpeechBubble.textContent = '';
            wizardSpeechBubble.classList.add('conjuring');
            wizardSpeechBubble.style.animation = '';
            wizardSpeechBubble.style.color = '';
        });
    }

    function clearConjuringState() {
        if (!wizardSpeechBubble) return;
        domBatcher.add(() => {
            wizardSpeechBubble.classList.remove('conjuring');
        });
    }

    function toggleWizardSpeaking(isSpeaking) {
        domBatcher.add(() => {
            wizardAscii.classList.toggle('speaking', isSpeaking);
        });
    }

    let currentTypingAnimation = null;
    function displayWizardResponse(text, isError = false) {
        if (!wizardSpeechBubble) {
            appendMessage(text, isError ? 'wizard-message error' : 'wizard-message');
            return;
        }
        
        if (currentTypingAnimation) {
            cancelAnimationFrame(currentTypingAnimation);
            currentTypingAnimation = null;
        }
        
        clearConjuringState();
        
        if (isError) {
            domBatcher.add(() => {
                wizardSpeechBubble.textContent = text;
                wizardSpeechBubble.style.animation = 'none';
                wizardSpeechBubble.style.color = '#ff6b6b';
            });
        } else {
            domBatcher.add(() => {
                wizardSpeechBubble.textContent = '';
                wizardSpeechBubble.style.animation = '';
                wizardSpeechBubble.style.color = '';
            });
            
            ttsQueue.add(text);
            
            // Optimized typing animation
            let charIndex = 0;
            let lastTime = 0;
            const typeSpeed = 20;
            
            function typeChar(currentTime) {
                if (charIndex < text.length) {
                    if (currentTime - lastTime >= typeSpeed) {
                        wizardSpeechBubble.textContent += text.charAt(charIndex);
                        charIndex++;
                        lastTime = currentTime;
                    }
                    currentTypingAnimation = requestAnimationFrame(typeChar);
                } else {
                    currentTypingAnimation = null;
                }
            }
            currentTypingAnimation = requestAnimationFrame(typeChar);
        }
    }

    function appendMessage(text, className) {
        if (!userChatLog) return;
        
        domBatcher.add(() => {
            const messageElement = document.createElement('p');
            messageElement.textContent = text;
            messageElement.className = className;
            userChatLog.appendChild(messageElement);
            userChatLog.scrollTop = userChatLog.scrollHeight;
        });
    }

    // Microphone handling
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
                    if (event.data.size > 0) {
                        audioChunks.push(event.data);
                    }
                };

                mediaRecorder.onstart = () => {
                    chatInput.placeholder = "Listening... (max 10s)";
                    micButton?.classList.add('recording');
                    
                    recordingTimeout = setTimeout(() => {
                        if (mediaRecorder?.state === "recording") {
                            mediaRecorder.stop();
                        }
                    }, 10000);
                };

                mediaRecorder.onstop = async () => {
                    chatInput.placeholder = "Speak or type thy query...";
                    micButton?.classList.remove('recording');
                    
                    clearTimeout(recordingTimeout);
                    
                    if (audioChunks.length === 0) return;
                    
                    const audioBlob = new Blob(audioChunks, { type: options.mimeType || 'audio/webm' });
                    audioChunks = [];

                    if (audioBlob.size > 2 * 1024 * 1024) { // 2MB limit
                        appendMessage("Audio too large. Try a shorter recording.", "wizard-message error");
                        return;
                    }

                    appendMessage("[Processing thy whispers...]", "user-message dimmed");

                    try {
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            const response = await fetch('/.netlify/functions/fal-whisper-stt', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ audioData: reader.result }),
                                signal: AbortSignal.timeout(15000)
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
                        };
                        reader.readAsDataURL(audioBlob);
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

    // OPTIMIZATION: Enhanced message sending with smart request management
    async function sendMessage() {
        if (!chatInput) return;

        const messageText = chatInput.value.trim();
        if (!messageText) return;

        // Rate limiting
        const now = Date.now();
        if (now - requestManager.lastRequestTime < requestManager.minInterval) {
            return;
        }
        requestManager.lastRequestTime = now;

        // Check if similar request is already active
        const requestKey = messageText.toLowerCase().trim();
        if (requestManager.activeRequests.has(requestKey)) {
            console.log('Similar request already active');
            return;
        }

        const vibrationalLevel = vibrationalAnalyzer.analyze(messageText);
        spawnVibrationalSymbols(vibrationalLevel);
        setVibrationalBackground(vibrationalLevel);
        
        if (!musicStarted) {
            initializeBackgroundMusic();
            startBackgroundMusic();
        }
        
        appendMessage(messageText, 'user-message');
        chatInput.value = '';
        toggleWizardSpeaking(true);

        const tokenCount = getTokenCount(responseLengthSlider.value);
        const responseMode = getResponseMode(responseLengthSlider.value);
        
        await processMessage(messageText, responseMode, tokenCount);
    }

    async function processMessage(messageText, responseMode, tokenCount) {
        const requestKey = messageText.toLowerCase().trim();
        requestManager.activeRequests.set(requestKey, true);
        
        try {
            // Add to conversation history
            conversationHistory.push({ role: "user", content: messageText });
            if (conversationHistory.length > 4) {
                conversationHistory = conversationHistory.slice(-4);
            }
            
            // Check cache first
            const cacheKey = getCacheKey(messageText, responseMode, tokenCount);
            const cached = await getCachedResponse(cacheKey);

            if (cached) {
                displayWizardResponse(cached);
                toggleWizardSpeaking(false);
                return;
            }
            
            showConjuringState();
            
            // Implement progressive enhancement for longer responses
            if (tokenCount > 250) {
                // First, try with reduced tokens
                const quickTokens = Math.min(150, tokenCount / 2);
                const quickResponse = await makeAPIRequest(messageText, responseMode, quickTokens, 0);
                
                if (quickResponse.success) {
                    displayWizardResponse(quickResponse.reply);
                    toggleWizardSpeaking(false);
                    
                    // Cache the quick response
                    await setCachedResponse(cacheKey, quickResponse.reply);
                    
                    // Optionally, fetch full response in background
                    if (tokenCount > 400) {
                        setTimeout(() => {
                            makeAPIRequest(messageText, responseMode, tokenCount, 0)
                                .then(async (fullResponse) => {
                                    if (fullResponse.success) {
                                        await setCachedResponse(cacheKey, fullResponse.reply);
                                    }
                                });
                        }, 2000);
                    }
                    
                    return;
                }
            }
            
            // Regular request with retries
            const response = await makeAPIRequest(messageText, responseMode, tokenCount);
            
            if (response.success) {
                conversationHistory.push({ role: "assistant", content: response.reply });
                await setCachedResponse(cacheKey, response.reply);
                displayWizardResponse(response.reply);
            } else {
                const fallback = getFallbackResponse(response.error);
                displayWizardResponse(fallback, true);
            }
            
        } finally {
            requestManager.activeRequests.delete(requestKey);
            toggleWizardSpeaking(false);
        }
    }

    async function makeAPIRequest(messageText, responseMode, tokenCount, retryCount = 0) {
        try {
            const controller = new AbortController();
            const timeoutMs = getTimeoutForTokens(tokenCount);
            
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, timeoutMs);
            
            const response = await fetch('/.netlify/functions/deepseek-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    message: messageText,
                    conversationHistory: conversationHistory.slice(-2),
                    maxTokens: tokenCount,
                    responseMode: responseMode,
                    retryCount: retryCount
                }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                const data = await response.json();
                if (data?.reply) {
                    return { success: true, reply: data.reply };
                }
            }
            
            throw new Error(`API Error: ${response.status}`);
            
        } catch (error) {
            if (retryCount < requestManager.retryDelays.length) {
                await new Promise(resolve => 
                    setTimeout(resolve, requestManager.retryDelays[retryCount])
                );
                return makeAPIRequest(messageText, responseMode, tokenCount, retryCount + 1);
            }
            
            return { 
                success: false, 
                error: error.name === 'AbortError' ? 'timeout' : 'error' 
            };
        }
    }

    function getTimeoutForTokens(tokens) {
        // More realistic timeouts for Netlify
        if (tokens <= 100) return 8000;
        if (tokens <= 200) return 12000;
        if (tokens <= 300) return 16000;
        return 20000; // Max 20 seconds
    }

    function getFallbackResponse(errorType) {
        const responses = errorType === 'timeout' ? 
            fallbackResponses.timeout : fallbackResponses.error;
        return responses[Math.floor(Math.random() * responses.length)];
    }

    // OPTIMIZATION: More realistic token mapping
    function getTokenCount(sliderValue) {
        const tokenMap = {
            1: 50,    // Ultra fast
            2: 100,   // Fast
            3: 150,   // Balanced
            4: 250,   // Detailed
            5: 350,   // Extended
            6: 450    // Maximum
        };
        return tokenMap[sliderValue] || 150;
    }

    function getResponseMode(sliderValue) {
        const modes = {
            1: "ultra_brief",
            2: "brief",
            3: "balanced",
            4: "detailed",
            5: "comprehensive",
            6: "legendary"
        };
        return modes[sliderValue] || "balanced";
    }

    function updateLengthIndicator(value) {
        const indicators = {
            1: "Lightning Speed ⚡⚡⚡",
            2: "Quick Wisdom ⚡⚡", 
            3: "Balanced Magic ⚡",
            4: "Deep Insights ⚠️",
            5: "Epic Wisdom ⚠️⚠️",
            6: "Legendary Knowledge ⚠️⚠️⚠️"
        };
        
        if (lengthIndicator) {
            lengthIndicator.textContent = indicators[value] || "Balanced Magic";
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

    // Initialize microphone
    if (micButton) {
        micButton.disabled = false;
        micButton.addEventListener('click', handleMicButtonClick);
    }

    // Connection monitoring
    window.addEventListener('online', () => {
        console.log('Connection restored');
    });

    window.addEventListener('offline', () => {
        console.log('Connection lost');
    });

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        requestManager.activeRequests.clear();
        if (cacheDB) {
            cacheDB.close();
        }
    });

    // Initialize
    initCacheDB();
    createAstrologicalWheel();
    updateLengthIndicator(responseLengthSlider?.value || 3);
    
    // Preload common responses
    setTimeout(() => {
        const commonQueries = ['hello', 'hi', 'help', 'what is', 'how to'];
        commonQueries.forEach(query => {
            const cacheKey = getCacheKey(query, 'balanced', 150);
            getCachedResponse(cacheKey); // Warm up cache
        });
    }, 5000);
});