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

    // ULTRA-OPTIMIZATION: Advanced caching with IndexedDB fallback
    const responseCache = new Map();
    const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
    const MAX_CACHE_SIZE = 100; // Increased cache size
    let cacheDB = null;

    // ULTRA-OPTIMIZATION: Request queue and batching
    const requestQueue = [];
    let isProcessingQueue = false;
    const MAX_CONCURRENT_REQUESTS = 2;
    let activeRequests = 0;

    // ULTRA-OPTIMIZATION: Connection pooling
    let connectionPool = {
        status: 'online',
        lastCheck: Date.now(),
        failureCount: 0,
        backoffMs: 1000
    };

    // ULTRA-OPTIMIZATION: Predictive pre-fetching
    const commonPhrases = [
        'hello', 'hi', 'hey', 'what is', 'how to', 'why', 'when', 'where',
        'tell me', 'explain', 'help', 'thanks', 'goodbye', 'bye'
    ];

    // ULTRA-OPTIMIZATION: WebWorker for heavy computations
    let computeWorker = null;
    
    // Initialize IndexedDB for persistent caching
    async function initCacheDB() {
        try {
            const request = indexedDB.open('WizardChatCache', 1);
            request.onsuccess = (event) => {
                cacheDB = event.target.result;
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('responses')) {
                    db.createObjectStore('responses', { keyPath: 'key' });
                }
            };
        } catch (e) {
            console.log('IndexedDB not available, using memory cache only');
        }
    }

    // ULTRA-OPTIMIZATION: Persistent cache operations
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
                            // Refresh memory cache
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
        
        // Set in memory cache
        responseCache.set(key, cacheData);
        
        // Clean memory cache if too large
        if (responseCache.size > MAX_CACHE_SIZE) {
            const entries = Array.from(responseCache.entries());
            entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
            entries.slice(0, 20).forEach(([key]) => responseCache.delete(key));
        }

        // Save to IndexedDB
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

    // ULTRA-OPTIMIZATION: Request deduplication
    const pendingRequests = new Map();

    function getCacheKey(message, mode, tokens) {
        return `${message.toLowerCase().trim()}_${mode}_${tokens}`;
    }

    // ULTRA-OPTIMIZATION: Simplified vibrational analysis with memoization
    const vibrationalCache = new Map();
    function analyzeVibrationalEnergy(text) {
        const cacheKey = text.toLowerCase().trim();
        if (vibrationalCache.has(cacheKey)) {
            return vibrationalCache.get(cacheKey);
        }

        const lowerText = cacheKey;
        const positiveWords = ['love', 'peace', 'joy', 'light', 'gratitude', 'blessed', 'amazing', 
                             'beautiful', 'wonderful', 'happy', 'divine', 'sacred', 'healing', 
                             'wisdom', 'harmony', 'hope', 'faith', 'magic', 'soul', 'spirit'];
        const negativeWords = ['hate', 'anger', 'fear', 'dark', 'evil', 'terrible', 'awful', 
                             'sad', 'depressed', 'anxious', 'worried', 'stressed', 'angry', 
                             'broken', 'hurt', 'pain', 'death', 'kill', 'fight', 'war'];
        
        let score = 0;
        positiveWords.forEach(word => { if (lowerText.includes(word)) score++; });
        negativeWords.forEach(word => { if (lowerText.includes(word)) score--; });
        
        if (score === 0) score = 1;
        
        const result = Math.max(-3, Math.min(3, score));
        vibrationalCache.set(cacheKey, result);
        
        // Clean cache if too large
        if (vibrationalCache.size > 100) {
            const firstKey = vibrationalCache.keys().next().value;
            vibrationalCache.delete(firstKey);
        }
        
        return result;
    }

    // ULTRA-OPTIMIZATION: Batch DOM updates
    let pendingDOMUpdates = [];
    let rafId = null;

    function batchDOMUpdate(fn) {
        pendingDOMUpdates.push(fn);
        if (!rafId) {
            rafId = requestAnimationFrame(() => {
                const updates = pendingDOMUpdates.splice(0);
                updates.forEach(fn => fn());
                rafId = null;
            });
        }
    }

    // ULTRA-OPTIMIZATION: Simplified color mapping
    const vibrationalColors = {
        3: '#3d047a', 2: '#500470', 1: '#061b59',
        0: '#333333', '-1': '#332411', '-2': '#3b1204', '-3': '#580404'
    };

    // ULTRA-OPTIMIZATION: Debounced background animation
    let vibrationalTimeout = null;
    function setVibrationalBackground(vibrationalLevel, messageText) {
        if (vibrationalTimeout) {
            clearTimeout(vibrationalTimeout);
        }

        batchDOMUpdate(() => {
            const vibeColor = vibrationalColors[vibrationalLevel.toString()] || '#4f009d';
            document.documentElement.style.setProperty('--vibe-color', vibeColor);
            document.body.classList.add('vibrational-pulse');
        });
        
        vibrationalTimeout = setTimeout(() => {
            clearVibrationalBackground();
        }, 15000);
    }

    function clearVibrationalBackground() {
        batchDOMUpdate(() => {
            document.body.classList.remove('vibrational-pulse');
            document.documentElement.style.setProperty('--vibe-color', '#000000');
        });
    }

    // ULTRA-OPTIMIZATION: Create permanent astrological wheel once
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

    // ULTRA-OPTIMIZATION: Advanced symbol pooling
    const symbolPool = [];
    const MAX_SYMBOL_POOL_SIZE = 50;
    const activeSymbols = new Set();

    function getPooledSymbol() {
        if (symbolPool.length > 0) {
            return symbolPool.pop();
        }
        const symbol = document.createElement('div');
        symbol.className = 'vibrational-symbol';
        return symbol;
    }

    function returnToPool(symbol) {
        activeSymbols.delete(symbol);
        if (symbolPool.length < MAX_SYMBOL_POOL_SIZE) {
            symbol.style.display = 'none';
            symbol.className = 'vibrational-symbol';
            symbolPool.push(symbol);
        } else {
            symbol.remove();
        }
    }

    // ULTRA-OPTIMIZATION: Reduced symbol arrays
    const positiveSymbols = ['☀️', '🌟', '✨', '💫', '⭐', '🌙', '💎', '🔮'];
    const negativeSymbols = ['💀', '☠️', '👹', '👺', '👿', '😈', '🧟', '🦇'];

    // ULTRA-OPTIMIZATION: Efficient symbol spawning
    function spawnVibrationalSymbols(vibrationalLevel, messageLength, messageText) {
        if (!vibrationalSymbols) return;
        
        clearVibrationalSymbols();
        
        const isPositive = vibrationalLevel > 0;
        const intensity = Math.abs(vibrationalLevel);
        const symbolCount = Math.min(5, intensity + 2); // Reduced count
        
        const symbolArray = isPositive ? positiveSymbols : negativeSymbols;
        
        batchDOMUpdate(() => {
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
                
                activeSymbols.add(symbol);
                fragment.appendChild(symbol);
                
                // Return to pool after animation
                setTimeout(() => returnToPool(symbol), 10000);
            }
            
            vibrationalSymbols.appendChild(fragment);
        });
    }

    function clearVibrationalSymbols() {
        if (!vibrationalSymbols) return;
        Array.from(activeSymbols).forEach(symbol => {
            returnToPool(symbol);
        });
    }

    // ULTRA-OPTIMIZATION: Lazy load and cache audio
    let audioCache = new Map();
    
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
                    volume += 0.01;
                    if (volume >= 0.15) {
                        backgroundMusic.volume = 0.15;
                        clearInterval(fadeInterval);
                    } else {
                        backgroundMusic.volume = volume;
                    }
                }, 100);
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
        batchDOMUpdate(() => {
            wizardAscii.classList.toggle('speaking', isSpeaking);
        });
    }

    // ULTRA-OPTIMIZATION: Advanced TTS queue with caching
    let ttsQueue = [];
    let isSpeaking = false;
    const ttsCache = new Map();
    const MAX_TTS_CACHE = 20;

    async function speakWizardResponse(text) {
        // Check TTS cache
        const cachedAudio = ttsCache.get(text);
        if (cachedAudio) {
            const audio = new Audio(cachedAudio);
            audio.volume = 1.0;
            await audio.play();
            return;
        }

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
                    // Cache the audio URL
                    ttsCache.set(text, data.audioUrl);
                    if (ttsCache.size > MAX_TTS_CACHE) {
                        const firstKey = ttsCache.keys().next().value;
                        ttsCache.delete(firstKey);
                    }

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
        
        batchDOMUpdate(() => {
            wizardSpeechBubble.textContent = '';
            wizardSpeechBubble.classList.add('conjuring');
            wizardSpeechBubble.style.animation = '';
            wizardSpeechBubble.style.color = '';
        });
    }

    function clearConjuringState() {
        if (!wizardSpeechBubble) return;
        batchDOMUpdate(() => {
            wizardSpeechBubble.classList.remove('conjuring');
        });
    }

    // ULTRA-OPTIMIZATION: Efficient typing effect with cancelation
    let currentTypingAnimation = null;

    function displayWizardResponse(text, isError = false) {
        if (!wizardSpeechBubble) {
            appendMessage(text, isError ? 'wizard-message error' : 'wizard-message');
            return;
        }
        
        // Cancel any existing typing animation
        if (currentTypingAnimation) {
            cancelAnimationFrame(currentTypingAnimation);
            currentTypingAnimation = null;
        }
        
        clearConjuringState();
        
        if (isError) {
            batchDOMUpdate(() => {
                wizardSpeechBubble.textContent = text;
                wizardSpeechBubble.style.animation = 'none';
                wizardSpeechBubble.style.color = '#ff6b6b';
            });
        } else {
            batchDOMUpdate(() => {
                wizardSpeechBubble.textContent = '';
                wizardSpeechBubble.style.animation = '';
                wizardSpeechBubble.style.color = '';
            });
            
            speakWizardResponse(text);
            
            // Optimized typing with RAF
            let charIndex = 0;
            let lastTime = 0;
            const typeSpeed = 25;
            
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
        
        batchDOMUpdate(() => {
            const messageElement = document.createElement('p');
            messageElement.textContent = text;
            messageElement.className = className;
            userChatLog.appendChild(messageElement);
            userChatLog.scrollTop = userChatLog.scrollHeight;
        });
    }

    // ULTRA-OPTIMIZATION: Optimized audio handling
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
                    }, 10000); // Reduced to 10s
                };

                mediaRecorder.onstop = async () => {
                    chatInput.placeholder = "Speak or type thy query...";
                    micButton?.classList.remove('recording');
                    
                    clearTimeout(recordingTimeout);
                    
                    if (audioChunks.length === 0) return;
                    
                    const audioBlob = new Blob(audioChunks, { type: options.mimeType || 'audio/webm' });
                    audioChunks = [];

                    if (audioBlob.size > 3 * 1024 * 1024) { // 3MB limit
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

    // ULTRA-OPTIMIZATION: Request queue processing
    async function processRequestQueue() {
        if (isProcessingQueue || requestQueue.length === 0 || activeRequests >= MAX_CONCURRENT_REQUESTS) {
            return;
        }

        isProcessingQueue = true;
        
        while (requestQueue.length > 0 && activeRequests < MAX_CONCURRENT_REQUESTS) {
            const request = requestQueue.shift();
            activeRequests++;
            
            try {
                await request();
            } catch (error) {
                console.error('Request failed:', error);
            } finally {
                activeRequests--;
            }
        }
        
        isProcessingQueue = false;
        
        // Process any remaining requests
        if (requestQueue.length > 0) {
            setTimeout(processRequestQueue, 100);
        }
    }

    // ULTRA-OPTIMIZATION: Enhanced message sending with queuing
    async function sendMessage() {
        if (!chatInput) return;

        const messageText = chatInput.value.trim();
        if (!messageText) return;

        // Deduplicate requests
        const requestKey = messageText.toLowerCase().trim();
        if (pendingRequests.has(requestKey)) {
            console.log('Request already pending');
            return;
        }

        pendingRequests.set(requestKey, true);
        
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
        
        // Queue the request
        requestQueue.push(async () => {
            try {
                await sendOptimizedMessage(messageText, responseMode, tokenCount);
            } finally {
                pendingRequests.delete(requestKey);
            }
        });
        
        processRequestQueue();
    }

    // ULTRA-OPTIMIZATION: Enhanced message handler with retry logic
    async function sendOptimizedMessage(messageText, responseMode, tokenCount) {
        conversationHistory.push({ role: "user", content: messageText });
        
        // Keep conversation history limited
        if (conversationHistory.length > 6) {
            conversationHistory = conversationHistory.slice(-6);
        }
        
        // Check cache first
        const cacheKey = getCacheKey(messageText, responseMode, tokenCount);
        const cached = await getCachedResponse(cacheKey);

        if (cached) {
            displayWizardResponse(cached);
            toggleWizardSpeaking(false);
            return;
        }
        
        // Check for common phrases and pre-fetch
        const lowerMessage = messageText.toLowerCase();
        const isCommon = commonPhrases.some(phrase => lowerMessage.includes(phrase));
        
        showConjuringState();
        
        // Implement exponential backoff retry
        let retries = 0;
        const maxRetries = tokenCount > 300 ? 1 : 2;
        let lastError = null;
        
        while (retries <= maxRetries) {
            try {
                const controller = new AbortController();
                const timeoutMs = Math.min(18000, 10000 + (tokenCount * 15));
                
                const timeoutId = setTimeout(() => {
                    controller.abort();
                }, timeoutMs);
                
                const response = await fetch('/.netlify/functions/deepseek-chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        message: messageText,
                        conversationHistory: conversationHistory.slice(-4), // Less history
                        maxTokens: tokenCount,
                        responseMode: responseMode,  
                        isCommon: isCommon,
                        retryCount: retries
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data?.reply) {
                        conversationHistory.push({ role: "assistant", content: data.reply });
                        
                        // Cache response
                        await setCachedResponse(cacheKey, data.reply);
                        
                        displayWizardResponse(data.reply);
                        toggleWizardSpeaking(false);
                        
                        // Update connection pool status
                        connectionPool.status = 'online';
                        connectionPool.failureCount = 0;
                        connectionPool.backoffMs = 1000;
                        
                        return;
                    }
                }
                
                throw new Error(`API Error: ${response.status}`);
                
            } catch (error) {
                lastError = error;
                retries++;
                
                if (retries <= maxRetries) {
                    // Exponential backoff
                    const backoffMs = Math.min(5000, connectionPool.backoffMs * Math.pow(2, retries - 1));
                    await new Promise(resolve => setTimeout(resolve, backoffMs));
                }
            }
        }
        
        // All retries failed
        connectionPool.failureCount++;
        connectionPool.backoffMs = Math.min(10000, connectionPool.backoffMs * 2);
        
        let errorMessage;
        if (lastError?.name === 'AbortError') {
            errorMessage = `Response timed out! Level ${Math.max(1, parseInt(responseLengthSlider.value) - 2)} will work better.`;
        } else if (connectionPool.failureCount > 3) {
            errorMessage = "The cosmic servers are overloaded. Please try again in a few moments.";
        } else {
            errorMessage = `Connection issues detected. Try Level ${Math.min(3, parseInt(responseLengthSlider.value))} for better reliability.`;
        }
        
        displayWizardResponse(errorMessage, true);
        toggleWizardSpeaking(false);
    }

    // ULTRA-OPTIMIZATION: Adjusted token counts for maximum reliability
    function getTokenCount(sliderValue) {
        const tokenMap = {
            1: 50,    // Ultra short
            2: 100,   // Very short
            3: 175,   // Short
            4: 250,   // Moderate
            5: 350,   // Long
            6: 450    // Very long
        };
        return tokenMap[sliderValue] || 100;
    }

    function getResponseMode(sliderValue) {
        const modes = {
            1: "ultra_brief",
            2: "brief",
            3: "balanced",
            4: "detailed",
            5: "comprehensive",
            6: "exhaustive"
        };
        return modes[sliderValue] || "balanced";
    }

    function updateLengthIndicator(value) {
        const indicators = {
            1: "Lightning Whispers ⚡⚡",
            2: "Quick Wisdom ⚡⚡", 
            3: "Balanced Insights ⚡",
            4: "Deeper Knowledge ⚠️",
            5: "Extended Revelations ⚠️",
            6: "Cosmic Odyssey ⚠️⚠️"
        };
        
        if (lengthIndicator) {
            lengthIndicator.textContent = indicators[value] || "Balanced Insights";
            lengthIndicator.className = 'length-indicator';
            lengthIndicator.classList.add(parseInt(value) <= 3 ? 'reliable' : 'unreliable');
        }
    }

    // ULTRA-OPTIMIZATION: Smart predictive pre-fetching
    function predictivePreFetch(text) {
        if (text.length < 3) return;
        
        const lowerText = text.toLowerCase();
        commonPhrases.forEach(phrase => {
            if (lowerText.startsWith(phrase)) {
                // Pre-fetch common responses in background
                setTimeout(() => {
                    const cacheKey = getCacheKey(phrase, 'balanced', 175);
                    if (!responseCache.has(cacheKey)) {
                        // Silent background fetch
                        fetch('/.netlify/functions/deepseek-chat', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ 
                                message: phrase,
                                conversationHistory: [],
                                maxTokens: 175,
                                responseMode: 'balanced',
                                isPreFetch: true
                            })
                        }).then(response => response.json())
                          .then(data => {
                              if (data?.reply) {
                                  setCachedResponse(cacheKey, data.reply);
                              }
                          }).catch(() => {});
                    }
                }, 1000);
            }
        });
    }

    // Event listeners
    sendButton?.addEventListener('click', sendMessage);
    
    chatInput?.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });

    // ULTRA-OPTIMIZATION: Predictive pre-fetching on input
    let inputDebounce = null;
    chatInput?.addEventListener('input', (event) => {
        if (inputDebounce) clearTimeout(inputDebounce);
        inputDebounce = setTimeout(() => {
            predictivePreFetch(event.target.value);
        }, 500);
    });

    responseLengthSlider?.addEventListener('input', (event) => {
        updateLengthIndicator(event.target.value);
    });

    // ULTRA-OPTIMIZATION: Advanced connection monitoring
    async function checkConnection() {
        try {
            const response = await fetch('/.netlify/functions/deepseek-chat', {
                method: 'OPTIONS',
                signal: AbortSignal.timeout(3000)
            });
            
            if (response.ok) {
                connectionPool.status = 'online';
                connectionPool.failureCount = 0;
            } else {
                connectionPool.status = 'degraded';
            }
        } catch {
            connectionPool.status = 'offline';
        }
        
        connectionPool.lastCheck = Date.now();
    }

    // Check connection status periodically
    setInterval(checkConnection, 30000);

    window.addEventListener('online', () => {
        connectionPool.status = 'online';
        console.log('Connection restored');
        processRequestQueue(); // Resume any queued requests
    });

    window.addEventListener('offline', () => {
        connectionPool.status = 'offline';
        console.log('Connection lost');
    });

    // ULTRA-OPTIMIZATION: Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        // Cancel all pending requests
        requestQueue.length = 0;
        pendingRequests.clear();
        
        // Clean up workers
        if (computeWorker) {
            computeWorker.terminate();
        }
        
        // Save important cache data
        if (cacheDB) {
            cacheDB.close();
        }
    });

    // Initialize everything
    initCacheDB();
    initializeMicrophone();
    createAstrologicalWheel();
    updateLengthIndicator(responseLengthSlider?.value || 3);
    checkConnection();
});