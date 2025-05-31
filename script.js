document.addEventListener('DOMContentLoaded', () => {
    const micButton = document.getElementById('mic-button');
    const wizardAscii = document.getElementById('wizard-ascii');
    const chatInput = document.getElementById('chat-input');
    const sendButton = document.getElementById('send-button');
    const userChatLog = document.getElementById('user-chat-log');
    const wizardSpeechBubble = document.getElementById('wizard-speech-bubble');
    const vibrationalSymbols = document.querySelector('.vibrational-symbols');

    let mediaRecorder;
    let audioChunks = [];
    let isRecording = false;
    let recordingTimeout;

    // Massively expanded vibrational symbol arrays with HTML entities and mystical symbols
    const positiveSymbols = [
        // Celestial & Light
        '☀️', '🌟', '✨', '💫', '⭐', '🌙', '🌞', '🌛', '🌜', '🌝', '🌚', '🌠', '☄️', '💥',
        // Mystical & Spiritual Religious
        '💎', '🔮', '🕉️', '☯️', '🙏', '✝️', '☪️', '🔯', '☮️', '🕎', '⚛️', '🧿', '📿', '⛩️',
        '🕯️', '🔥', '👼', '😇', '🧘', '🤲', '🛐', '☦️', '✞', '✟', '✠', '✡', '☬', '☸', '🔱',
        // Zodiac & Astrology
        '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓', '⛎',
        // Nature & Life Magic
        '🌈', '🦋', '🕊️', '🌸', '🌺', '🌻', '🌷', '🌹', '🍀', '🌿', '🌱', '🌵', '🌾',
        '🌳', '🌲', '🌴', '🍃', '🦢', '🐝', '🦄', '🧚', '🧜', '🦅', '🦆', '🐚', '🪷',
        '🌊', '💧', '💦', '🫧', '🌪️', '🌬️', '☁️', '⛅', '🌤️', '⛈️', '🌩️', '🌦️',
        // Sacred Geometry & Mystical Symbols
        '❤️', '💚', '💜', '💙', '🤍', '💛', '🧡', '✅', '➕', '👍', '🙌', '🤝', '👏',
        '🛡️', '👑', '💰', '🎭', '🎨', '🎪', '🎯', '🏆', '🎖️', '🥇', '🏅', '📜', '🗝️',
        // Angels & Divine Beings
        '👼', '😇', '🧚‍♀️', '🧚‍♂️', '🧞‍♀️', '🧞‍♂️', '🦄', '🐉', '🦅', '🕊️',
        // Crystals & Gems
        '💎', '💍', '💒', '🔮', '⭐', '🌟', '✨', '💫', '🌠',
        // Sacred Tools & Objects
        '🔮', '🕯️', '📿', '🧿', '🪬', '🎭', '🎪', '🎨', '🎼', '🎵', '🎶', '🎤',
        // Positive Energy Symbols
        '∞', '☆', '★', '✦', '✧', '✩', '✪', '✫', '✬', '✭', '✮', '✯', '✰', '✱', '✲', '✳',
        '✴', '✵', '✶', '✷', '✸', '✹', '✺', '✻', '✼', '✽', '✾', '✿', '❀', '❁', '❂', '❃',
        '❄', '❅', '❆', '❇', '❈', '❉', '❊', '❋', '❌', '❍', '❎', '❏', '❐', '❑', '❒',
        // Sacred Geometry
        '◊', '◈', '◉', '○', '●', '◌', '◍', '◎', '◐', '◑', '◒', '◓', '◔', '◕', '◖', '◗',
        '◘', '◙', '◚', '◛', '◜', '◝', '◞', '◟', '◠', '◡', '◢', '◣', '◤', '◥', '◦', '◧',
        // Card Suits & Mystical
        '♠', '♣', '♥', '♦', '♡', '♢', '♧', '♤', '♚', '♛', '♜', '♝', '♞', '♟',
        // Misc Magical
        '⚡', '⚜', '❅', '❆', '🔆', '🔅', '💡', '🕯️', '🪔', '🎆', '🎇', '🌀', '💫',
        // Ancient & Runic
        '᚛', '᚜', 'ᚁ', 'ᚂ', 'ᚃ', 'ᚄ', 'ᚅ', 'ᚆ', 'ᚇ', 'ᚈ', 'ᚉ', 'ᚊ', 'ᚋ', 'ᚌ', 'ᚍ', 'ᚎ',
        '⚹', '⚺', '⚻', '⚼', '⚽', '⚾', '⚿', '⛀', '⛁', '⛂', '⛃'
    ];

    const negativeSymbols = [
        // Death & Darkness
        '💀', '☠️', '👹', '👺', '👿', '😈', '🧟', '🦇', '🕷️', '🐍', '🦂', '💀', '⚰️', '⚱️',
        '🔥', '💥', '⚡', '🌪️', '☄️', '💫', '🌊', '🌋', '🗲', '⚇', '⚈', '⚉',
        // Dark Creatures & Monsters
        '👾', '👻', '😱', '🤡', '🧌', '🧛', '🧟‍♀️', '🧟‍♂️', '🦈', '🐙', '🕸️', '🦟', '🪰',
        '🐀', '🐺', '🦘', '🦗', '🪲', '🦠', '🧬', '🦹', '🦸‍♂️', '🦸‍♀️', '🤖',
        // Negative Emotions & Faces
        '💔', '😵', '😰', '😱', '🤮', '😭', '😢', '😤', '😡', '🤬', '😠', '😾', '🙄',
        '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢',
        // Destruction & Chaos
        '💣', '💥', '⚡', '🌪️', '🌊', '🔥', '⚠️', '🆘', '☢️', '☣️', '⛈️', '🌩️',
        '💀', '⚔️', '🗡️', '🔪', '🪓', '⚒️', '🔨', '💣', '🧨', '💥', '⚰️', '⚱️',
        // Dark Weather & Elements
        '☁️', '🌧️', '⛈️', '🌩️', '❄️', '🧊', '🌫️', '🌀', '💨', '⛅', '🌑', '🌒',
        '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌚', '🌝', '🌛', '🌜',
        // Rejection & Negation
        '❌', '➖', '🚫', '⛔', '🔴', '👎', '📉', '💸', '🗑️', '🚮', '🚯', '🚱',
        '🚳', '🚷', '🚸', '⚠️', '☠️', '⚰️', '⚱️', '🔇', '🔕', '📴', '💔',
        // Dark Symbols & Entities
        '✖', '✗', '✘', '⛌', '⛍', '⛎', '⛏', '⚒', '⚓', '⚰', '⚱', '⚠', '☠',
        '☢', '☣', '⚡', '⚠', '☡', '⚞', '⚟', '⚠', '⚡', '⚢', '⚣', '⚤', '⚥',
        // Dark Geometry
        '◐', '◑', '◒', '◓', '◔', '◕', '◖', '◗', '◘', '◙', '◚', '◛', '◜', '◝',
        '◞', '◟', '◠', '◡', '◢', '◣', '◤', '◥', '◦', '◧', '◨', '◩', '◪', '◫',
        '▲', '▼', '◆', '◇', '■', '□', '▪', '▫', '▬', '▭', '▮', '▯', '▰', '▱',
        '▲', '▼', '▶', '◀', '▴', '▾', '▸', '◂', '▵', '▿', '▹', '◃', '△', '▽',
        // Dark Ancient & Cursed
        '᚛', '᚜', 'ᚠ', 'ᚡ', 'ᚢ', 'ᚣ', 'ᚤ', 'ᚥ', 'ᚦ', 'ᚧ', 'ᚨ', 'ᚩ', 'ᚪ', 'ᚫ', 'ᚬ', 'ᚭ',
        '⛤', '⛥', '⛦', '⛧', '⛨', '⛩', '⛪', '⛫', '⛬', '⛭', '⛮', '⛯', '⛰', '⛱', '⛲', '⛳',
        // Misc Dark & Cursed
        '🕳️', '⚫', '⬛', '◼️', '▪️', '🔳', '◾', '◼', '▪', '▫', '⬜', '◽', '◻', '▫️',
        '💀', '☠', '⚰', '⚱', '🗿', '🪦', '⚡', '⛈', '🌪', '🌊', '🔥', '💥', '💣',
        '👁️', '🧿', '👁️‍🗨️', '🔮', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘'
    ];

    // Vibrational analysis function
    function analyzeVibrationalEnergy(text) {
        const lowerText = text.toLowerCase();
        
        // Positive keywords
        const positiveWords = [
            'love', 'peace', 'joy', 'light', 'gratitude', 'blessed', 'amazing', 'beautiful', 
            'wonderful', 'fantastic', 'awesome', 'grateful', 'happy', 'enlightened', 
            'spiritual', 'divine', 'sacred', 'healing', 'wisdom', 'transcend', 'manifest',
            'abundance', 'prosperity', 'harmony', 'unity', 'compassion', 'kindness',
            'hope', 'faith', 'trust', 'believe', 'inspire', 'magic', 'miracle',
            'soul', 'spirit', 'energy', 'vibration', 'frequency', 'consciousness',
            'meditation', 'zen', 'namaste', 'blessed', 'thank', 'appreciate'
        ];
        
        // Negative keywords  
        const negativeWords = [
            'hate', 'anger', 'fear', 'dark', 'evil', 'terrible', 'awful', 'horrible',
            'sad', 'depressed', 'anxious', 'worried', 'stressed', 'frustrated',
            'angry', 'mad', 'furious', 'disgusted', 'sick', 'tired', 'exhausted',
            'broken', 'hurt', 'pain', 'suffering', 'misery', 'despair', 'hopeless',
            'worthless', 'useless', 'failure', 'disaster', 'nightmare', 'curse',
            'damn', 'hell', 'devil', 'toxic', 'poison', 'disease', 'death',
            'destroy', 'kill', 'murder', 'violence', 'war', 'fight', 'attack'
        ];
        
        let positiveScore = 0;
        let negativeScore = 0;
        
        positiveWords.forEach(word => {
            if (lowerText.includes(word)) positiveScore++;
        });
        
        negativeWords.forEach(word => {
            if (lowerText.includes(word)) negativeScore++;
        });
        
        // Return vibrational level (-3 to +3)
        return Math.max(-3, Math.min(3, positiveScore - negativeScore));
    }

    // Vibrational color mapping - subtly perceptible
    const vibrationalColors = {
        // Highly positive (love, spiritual, transcendent) - subtle but visible
        3: '#2a1535',  // Subtle purple for highest vibration
        2: '#1f1a35',  // Subtle blue-purple  
        1: '#1a2035',  // Subtle blue tint
        0: '#000000',  // Black for neutral
        '-1': '#352015', // Subtle orange tint
        '-2': '#351515', // Subtle red tint
        '-3': '#350a0a'  // More noticeable red tint
    };

    // Astrological positions for zodiac symbols (12 positions around a circle)
    const zodiacPositions = {
        '♈': { angle: 0 },    // Aries - East
        '♉': { angle: 30 },   // Taurus
        '♊': { angle: 60 },   // Gemini
        '♋': { angle: 90 },   // Cancer - North
        '♌': { angle: 120 },  // Leo
        '♍': { angle: 150 },  // Virgo
        '♎': { angle: 180 },  // Libra - West
        '♏': { angle: 210 },  // Scorpio
        '♐': { angle: 240 },  // Sagittarius
        '♑': { angle: 270 },  // Capricorn - South
        '♒': { angle: 300 },  // Aquarius
        '♓': { angle: 330 }   // Pisces
    };

    // Advanced vibrational analysis with subtle color themes
    function getVibrationalColor(vibrationalLevel, messageText) {
        const lowerText = messageText.toLowerCase();
        
        // Check for specific high-vibe themes - subtly perceptible
        if (lowerText.includes('love') || lowerText.includes('divine') || lowerText.includes('blessed')) {
            return '#35152a'; // Subtle pink tint
        }
        if (lowerText.includes('spiritual') || lowerText.includes('sacred') || lowerText.includes('enlighten')) {
            return '#251535'; // Subtle purple tint
        }
        if (lowerText.includes('peace') || lowerText.includes('harmony') || lowerText.includes('zen')) {
            return '#152535'; // Subtle cyan tint
        }
        if (lowerText.includes('joy') || lowerText.includes('happy') || lowerText.includes('celebrate')) {
            return '#353515'; // Subtle yellow tint
        }
        if (lowerText.includes('gratitude') || lowerText.includes('thank') || lowerText.includes('appreciate')) {
            return '#153515'; // Subtle green tint
        }
        
        // Check for specific low-vibe themes - subtly perceptible
        if (lowerText.includes('hate') || lowerText.includes('evil') || lowerText.includes('curse')) {
            return '#350a0a'; // Subtle dark red
        }
        if (lowerText.includes('fear') || lowerText.includes('terror') || lowerText.includes('nightmare')) {
            return '#151515'; // Subtle dark gray
        }
        if (lowerText.includes('anger') || lowerText.includes('rage') || lowerText.includes('furious')) {
            return '#351010'; // Subtle red tint
        }
        
        // Default to vibrational level color
        return vibrationalColors[vibrationalLevel.toString()] || '#000000';
    }

    // Set background vibe color and start pulsing
    function setVibrationalBackground(vibrationalLevel, messageText) {
        const vibeColor = getVibrationalColor(vibrationalLevel, messageText);
        
        // Set CSS custom property for the vibe color
        document.documentElement.style.setProperty('--vibe-color', vibeColor);
        
        // Add pulsing class to body
        document.body.classList.add('vibrational-pulse');
        
        // Remove any existing timeout
        if (window.vibrationalTimeout) {
            clearTimeout(window.vibrationalTimeout);
        }
    }

    // Clear vibrational background
    function clearVibrationalBackground() {
        document.body.classList.remove('vibrational-pulse');
        document.documentElement.style.setProperty('--vibe-color', '#000000');
    }

    // Clear existing symbols
    function clearVibrationalSymbols() {
        if (!vibrationalSymbols) return;
        vibrationalSymbols.innerHTML = '';
    }

    // Spawn magical symbols (now persist until next query)
    function spawnVibrationalSymbols(vibrationalLevel, messageLength) {
        if (!vibrationalSymbols) return;
        
        // Clear previous symbols first
        clearVibrationalSymbols();
        
        const isPositive = vibrationalLevel > 0;
        const intensity = Math.abs(vibrationalLevel);
        // Increase symbol count significantly
        const symbolCount = Math.min(20, Math.max(3, (intensity * 4) + Math.floor(messageLength / 15)));
        
        for (let i = 0; i < symbolCount; i++) {
            setTimeout(() => {
                const symbol = document.createElement('div');
                symbol.className = `vibrational-symbol ${isPositive ? 'positive' : 'negative'}`;
                
                // Choose random symbol from appropriate array
                const symbolArray = isPositive ? positiveSymbols : negativeSymbols;
                const chosenSymbol = symbolArray[Math.floor(Math.random() * symbolArray.length)];
                symbol.textContent = chosenSymbol;
                
                // Position zodiac symbols in correct astrological positions
                if (zodiacPositions[chosenSymbol]) {
                    const position = zodiacPositions[chosenSymbol];
                    const centerX = window.innerWidth / 2;
                    const centerY = window.innerHeight / 2;
                    const radius = Math.min(window.innerWidth, window.innerHeight) * 0.35;
                    
                    const angleRad = (position.angle * Math.PI) / 180;
                    const x = centerX + radius * Math.cos(angleRad) - 25;
                    const y = centerY + radius * Math.sin(angleRad) - 25;
                    
                    symbol.style.left = x + 'px';
                    symbol.style.top = y + 'px';
                } else {
                    // Random position for non-zodiac symbols
                    symbol.style.left = Math.random() * (window.innerWidth - 100) + 50 + 'px';
                    symbol.style.top = Math.random() * (window.innerHeight - 100) + 50 + 'px';
                }
                
                // Vary size based on intensity and randomness
                const size = 18 + (intensity * 6) + Math.random() * 20;
                symbol.style.fontSize = size + 'px';
                
                // Add random delay to pulsing animation
                symbol.style.animationDelay = Math.random() * 2 + 's';
                
                vibrationalSymbols.appendChild(symbol);
                
                // Symbols now persist until next query (no automatic removal)
            }, i * 150); // Faster stagger
        }
    }

    function initializeMicrophone() {
        console.log("Initializing microphone functionality...");
        
        if (micButton) {
            micButton.disabled = false;
            micButton.addEventListener('click', handleMicButtonClick);
            console.log("Microphone button ready");
        } else {
            console.error("Microphone button not found");
        }
    }

    function toggleWizardSpeaking(isSpeaking) {
        if (isSpeaking) {
            wizardAscii.classList.add('speaking');
        } else {
            wizardAscii.classList.remove('speaking');
        }
    }

    async function speakWizardResponse(text) {
        try {
            console.log('Requesting TTS for text:', text);
            const response = await fetch('/.netlify/functions/fal-kokoro-tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: text }),
            });

            console.log('TTS response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('TTS response data:', data);
                
                if (data.audioUrl) {
                    console.log('Playing audio from URL:', data.audioUrl);
                    const audio = new Audio(data.audioUrl);
                    
                    audio.onloadstart = () => console.log('Audio loading started');
                    audio.oncanplay = () => console.log('Audio can start playing');
                    audio.onplay = () => console.log('Audio playback started');
                    audio.onended = () => console.log('Audio playback ended');
                    audio.onerror = (e) => console.error('Audio error:', e);
                    
                    audio.play().catch(err => {
                        console.error("Error playing TTS audio:", err);
                        appendMessage("The wizard's voice echoes only in silence (audio playback failed).", "wizard-message error");
                    });
                } else {
                    console.error("No audioUrl in TTS response");
                }
            } else {
                console.error("TTS request failed:", response.status);
                const errorData = await response.text();
                console.error("TTS error details:", errorData);
            }
        } catch (error) {
            console.error("Error with TTS:", error);
        }
    }

    function displayWizardResponse(text, isError = false) {
        if (!wizardSpeechBubble) {
            console.error("Wizard speech bubble element not found!");
            appendMessage(text, isError ? 'wizard-message error' : 'wizard-message');
            return;
        }
        
        wizardSpeechBubble.textContent = text;
        if (isError) {
            wizardSpeechBubble.style.animation = 'none';
            wizardSpeechBubble.style.color = '#ff6b6b';
        } else {
            wizardSpeechBubble.style.animation = '';
            wizardSpeechBubble.style.color = '';
            speakWizardResponse(text);
        }
    }

    function appendMessage(text, className) {
        if (!userChatLog) {
            console.error("Chat log element not found! Cannot append message:", text);
            return;
        }
        const messageElement = document.createElement('p');
        messageElement.textContent = text;
        messageElement.className = className;
        userChatLog.appendChild(messageElement);
        userChatLog.scrollTop = userChatLog.scrollHeight;
        if (className.includes('error')) {
            messageElement.style.color = '#ff6b6b';
        }
    }

    async function handleMicButtonClick() {
        if (!isRecording) {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ 
                    audio: {
                        channelCount: 1,
                        sampleRate: 16000,
                        echoCancellation: true,
                        noiseSuppression: true
                    }
                });
                
                // Try to use a more compressed format
                const options = { mimeType: 'audio/webm;codecs=opus' };
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options.mimeType = 'audio/webm';
                }
                
                mediaRecorder = new MediaRecorder(stream, options);
                
                mediaRecorder.ondataavailable = event => {
                    audioChunks.push(event.data);
                };

                mediaRecorder.onstart = () => {
                    console.log("Recording started");
                    chatInput.placeholder = "Listening... speak thy truth... (max 30s)";
                    if (micButton) micButton.classList.add('recording');
                    
                    // Auto-stop recording after 30 seconds
                    recordingTimeout = setTimeout(() => {
                        if (mediaRecorder && mediaRecorder.state === "recording") {
                            mediaRecorder.stop();
                        }
                    }, 30000);
                };

                mediaRecorder.onstop = async () => {
                    console.log("Recording stopped");
                    chatInput.placeholder = "Speak or type thy query...";
                    if (micButton) micButton.classList.remove('recording');
                    
                    // Clear the timeout
                    if (recordingTimeout) {
                        clearTimeout(recordingTimeout);
                        recordingTimeout = null;
                    }
                    
                    if (audioChunks.length === 0) {
                        console.log("No audio data captured.");
                        return;
                    }
                    
                    const audioBlob = new Blob(audioChunks, { type: options.mimeType || 'audio/webm' });
                    audioChunks = [];

                    // Check file size (limit to 10MB)
                    if (audioBlob.size > 10 * 1024 * 1024) {
                        appendMessage("The whispers are too voluminous for the ancient scrolls (audio too large). Try a shorter recording.", "wizard-message error");
                        return;
                    }

                    console.log(`Audio blob size: ${(audioBlob.size / 1024 / 1024).toFixed(2)} MB`);
                    appendMessage("[Processing thy whispers...]", "user-message dimmed");

                    try {
                        const audioDataUrl = await blobToDataUrl(audioBlob);
                        
                        const response = await fetch('/.netlify/functions/fal-whisper-stt', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({ audioData: audioDataUrl }),
                        });

                        if (response.ok) {
                            const data = await response.json();
                            if (data.transcript) {
                                console.log("Transcript received:", data.transcript);
                                chatInput.value = data.transcript;
                                const processingMessage = Array.from(userChatLog.children).find(el => el.textContent === "[Processing thy whispers...]");
                                if (processingMessage) processingMessage.remove();
                                sendMessage();
                            } else {
                                console.error("No transcript in response:", data);
                                appendMessage("The oracle speaks in riddles unclear (no transcript received).", "wizard-message error");
                                const processingMessage = Array.from(userChatLog.children).find(el => el.textContent === "[Processing thy whispers...]");
                                if (processingMessage) processingMessage.remove();
                            }
                        } else {
                            const errorData = await response.json();
                            console.error("STT request failed:", errorData);
                            appendMessage(`The spirits of voice whisper secrets untold: ${errorData.error || 'STT failed'}`, "wizard-message error");
                            const processingMessage = Array.from(userChatLog.children).find(el => el.textContent === "[Processing thy whispers...]");
                            if (processingMessage) processingMessage.remove();
                        }

                    } catch (err) {
                        console.error("Error during STT call:", err);
                        appendMessage(`The spirits of voice are confused: ${err.message || 'STT Failed'}`, "wizard-message error");
                        const processingMessage = Array.from(userChatLog.children).find(el => el.textContent === "[Processing thy whispers...]");
                        if (processingMessage) processingMessage.remove();
                    }
                };

                mediaRecorder.start();
                isRecording = true;
                
            } catch (err) {
                console.error("Error accessing microphone:", err);
                appendMessage("The spirits of the airwaves are shy... (Cannot access microphone)", "wizard-message error");
            }
        } else {
            if (mediaRecorder && mediaRecorder.state === "recording") {
                mediaRecorder.stop();
            }
            if (recordingTimeout) {
                clearTimeout(recordingTimeout);
                recordingTimeout = null;
            }
            isRecording = false;
        }
    }

    async function sendMessage() {
        if (!chatInput) {
            console.error("Chat input not found in sendMessage");
            return;
        }

        const messageText = chatInput.value.trim();
        if (messageText) {
            // Analyze vibrational energy and spawn symbols
            const vibrationalLevel = analyzeVibrationalEnergy(messageText);
            spawnVibrationalSymbols(vibrationalLevel, messageText.length);
            
            // Set background color based on vibrational energy
            setVibrationalBackground(vibrationalLevel, messageText);
            
            appendMessage(messageText, 'user-message');
            chatInput.value = '';
            toggleWizardSpeaking(true);

            try {
                const response = await fetch('/.netlify/functions/deepseek-chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ message: messageText }),
                });
                
                if (!response.ok) {
                    let errorData = { error: `Error from the mystic ether: ${response.status}` };
                    try {
                        const potentialErrorJson = await response.json();
                        if (potentialErrorJson && potentialErrorJson.error) {
                            errorData.error = potentialErrorJson.error;
                        }
                    } catch (e) {
                        console.warn("Could not parse error response as JSON.");
                    }
                    throw new Error(errorData.error);
                }
                
                const data = await response.json();
                if (data && data.reply) {
                    displayWizardResponse(data.reply);
                } else {
                    console.error("Invalid data structure from backend:", data);
                    displayWizardResponse("The wizard's words are jumbled (invalid response format)... perhaps a cosmic hiccup?", true);
                }
                
            } catch (error) {
                console.error('Failed to send message or get response:', error);
                displayWizardResponse(`Oh dear, a disturbance in the arcane flows! (${error.message})`, true);
            } finally {
                const speakDuration = wizardSpeechBubble && wizardSpeechBubble.textContent ? wizardSpeechBubble.textContent.length * 50 : 2000;
                setTimeout(() => toggleWizardSpeaking(false), Math.max(1000, speakDuration));
            }
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

    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    } else {
        console.error("Send button not found.");
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
            }
        });
    } else {
        console.error("Chat input not found.");
    }

    initializeMicrophone();
});