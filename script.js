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

    // Vibrational symbol arrays
    const positiveSymbols = [
        '☀️', '🌟', '✨', '💎', '🔮', '🕉️', '☯️', '🙏', 
        '♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓',
        '🌙', '⭐', '💫', '🌈', '🦋', '🕊️', '🌸', '🌺', '🌻', 
        '❤️', '💚', '💜', '💙', '🤍', '✅', '➕', '👍', '🙌', 
        '✝️', '☪️', '🔯', '☮️', '🕎', '🛡️', '👑', '💰', '🎭', '🎨'
    ];

    const negativeSymbols = [
        '💀', '☠️', '👎', '❌', '➖', '🚫', '⛔', '🔴', '💔', 
        '🤮', '😵', '😰', '😱', '💣', '⚡', '🌪️', '☁️', '🌧️',
        '🔥', '💥', '⚠️', '🆘', '📉', '💸', '🗡️', '⚔️', '🔪',
        '🕷️', '🐍', '🦂', '👹', '👺', '🤡', '💩', '🧟', '🦇'
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

    // Spawn magical symbols
    function spawnVibrationalSymbols(vibrationalLevel, messageLength) {
        if (!vibrationalSymbols) return;
        
        const isPositive = vibrationalLevel > 0;
        const intensity = Math.abs(vibrationalLevel);
        const symbolCount = Math.min(8, Math.max(1, intensity + Math.floor(messageLength / 20)));
        
        for (let i = 0; i < symbolCount; i++) {
            setTimeout(() => {
                const symbol = document.createElement('div');
                symbol.className = `vibrational-symbol ${isPositive ? 'positive' : 'negative'}`;
                
                // Choose random symbol from appropriate array
                const symbolArray = isPositive ? positiveSymbols : negativeSymbols;
                symbol.textContent = symbolArray[Math.floor(Math.random() * symbolArray.length)];
                
                // Random position
                symbol.style.left = Math.random() * (window.innerWidth - 50) + 'px';
                symbol.style.top = Math.random() * (window.innerHeight - 50) + 'px';
                
                // Vary size based on intensity
                const size = 20 + (intensity * 8) + Math.random() * 16;
                symbol.style.fontSize = size + 'px';
                
                vibrationalSymbols.appendChild(symbol);
                
                // Remove symbol after animation
                setTimeout(() => {
                    if (symbol.parentNode) {
                        symbol.parentNode.removeChild(symbol);
                    }
                }, 4000);
            }, i * 200); // Stagger symbol appearance
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