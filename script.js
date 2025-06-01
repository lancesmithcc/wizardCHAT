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

    // Massively expanded vibrational symbol arrays with HTML entities and mystical symbols
    const positiveSymbols = [
        // Celestial & Light
        '☀️', '🌟', '✨', '💫', '⭐', '🌙', '🌞', '🌛', '🌜', '🌝', '🌚', '🌠', '☄️', '💥',
        // Mystical & Spiritual Religious
        '💎', '🔮', '🕉️', '☯️', '🙏', '✝️', '☪️', '🔯', '☮️', '🕎', '⚛️', '🧿', '📿', '⛩️',
        '🕯️', '🔥', '👼', '😇', '🧘', '🤲', '🛐', '☦️', '✞', '✟', '✠', '✡', '☬', '☸', '🔱',
        // Astrology (zodiac signs now in permanent wheel)
        '⛎', // Ophiuchus (13th sign)
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
        
        // Enhanced positive keywords including greetings and common positive expressions
        const positiveWords = [
            'love', 'peace', 'joy', 'light', 'gratitude', 'blessed', 'amazing', 'beautiful', 
            'wonderful', 'fantastic', 'awesome', 'grateful', 'happy', 'enlightened', 
            'spiritual', 'divine', 'sacred', 'healing', 'wisdom', 'transcend', 'manifest',
            'abundance', 'prosperity', 'harmony', 'unity', 'compassion', 'kindness',
            'hope', 'faith', 'trust', 'believe', 'inspire', 'magic', 'miracle',
            'soul', 'spirit', 'energy', 'vibration', 'frequency', 'consciousness',
            'meditation', 'zen', 'namaste', 'blessed', 'thank', 'appreciate',
            // Common positive/neutral expressions
            'hello', 'hi', 'hey', 'good', 'great', 'nice', 'cool', 'yes', 'please',
            'help', 'welcome', 'greetings', 'thanks', 'okay', 'sure', 'absolutely',
            'perfect', 'excellent', 'brilliant', 'smart', 'wise', 'interesting',
            'curious', 'excited', 'fun', 'enjoy', 'like', 'love', 'want', 'need',
            'learn', 'grow', 'improve', 'better', 'best', 'special', 'unique'
        ];
        
        // Negative keywords  
        const negativeWords = [
            'hate', 'anger', 'fear', 'dark', 'evil', 'terrible', 'awful', 'horrible',
            'sad', 'depressed', 'anxious', 'worried', 'stressed', 'frustrated',
            'angry', 'mad', 'furious', 'disgusted', 'sick', 'tired', 'exhausted',
            'broken', 'hurt', 'pain', 'suffering', 'misery', 'despair', 'hopeless',
            'worthless', 'useless', 'failure', 'disaster', 'nightmare', 'curse',
            'damn', 'hell', 'devil', 'toxic', 'poison', 'disease', 'death',
            'destroy', 'kill', 'murder', 'violence', 'war', 'fight', 'attack',
            'no', 'never', 'stop', 'quit', 'give up', 'impossible', 'can\'t', 'won\'t'
        ];
        
        let positiveScore = 0;
        let negativeScore = 0;
        const detectedPositive = [];
        const detectedNegative = [];
        
        positiveWords.forEach(word => {
            if (lowerText.includes(word)) {
                positiveScore++;
                detectedPositive.push(word);
            }
        });
        
        negativeWords.forEach(word => {
            if (lowerText.includes(word)) {
                negativeScore++;
                detectedNegative.push(word);
            }
        });
        
        console.log('Vibrational analysis for:', text);
        console.log('Detected positive words:', detectedPositive);
        console.log('Detected negative words:', detectedNegative);
        console.log('Positive score:', positiveScore, 'Negative score:', negativeScore);
        
        let vibrationalLevel = positiveScore - negativeScore;
        
        // Give neutral messages a slight positive bias (minimum level of 1 if no negative words)
        if (vibrationalLevel === 0 && negativeScore === 0) {
            vibrationalLevel = 1;
            console.log('Applied positive bias to neutral message');
        }
        
        // Return vibrational level (-3 to +3)
        const finalLevel = Math.max(-3, Math.min(3, vibrationalLevel));
        console.log('Final vibrational level:', finalLevel);
        return finalLevel;
    }

    // Vibrational color mapping - extremely intense and visible
    const vibrationalColors = {
        // Highly positive (love, spiritual, transcendent) - extremely visible
        3: '#3d047a',  // Very bright purple for highest vibration
        2: '#500470',  // Bright blue-purple  
        1: '#061b59',  // Bright blue tint
        0: '#333333',  // Black for neutral
        '-1': '#332411', // Bright orange tint
        '-2': '#3b1204', // Bright red tint
        '-3': '#580404'  // Very bright red tint
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
        
        // Check for specific high-vibe themes - extremely visible colors
        if (lowerText.includes('love') || lowerText.includes('divine') || lowerText.includes('blessed')) {
            return '#cc44aa'; // Very bright pink tint
        }
        if (lowerText.includes('spiritual') || lowerText.includes('sacred') || lowerText.includes('enlighten')) {
            return '#8844cc'; // Very bright purple tint
        }
        if (lowerText.includes('peace') || lowerText.includes('harmony') || lowerText.includes('zen')) {
            return '#44aacc'; // Very bright cyan tint
        }
        if (lowerText.includes('joy') || lowerText.includes('happy') || lowerText.includes('celebrate')) {
            return '#ccaa44'; // Very bright yellow tint
        }
        if (lowerText.includes('gratitude') || lowerText.includes('thank') || lowerText.includes('appreciate')) {
            return '#44cc44'; // Very bright green tint
        }
        
        // Check for specific low-vibe themes - extremely visible colors
        if (lowerText.includes('hate') || lowerText.includes('evil') || lowerText.includes('curse')) {
            return '#cc2222'; // Very bright dark red
        }
        if (lowerText.includes('fear') || lowerText.includes('terror') || lowerText.includes('nightmare')) {
            return '#666666'; // Brighter dark gray
        }
        if (lowerText.includes('anger') || lowerText.includes('rage') || lowerText.includes('furious')) {
            return '#cc4444'; // Very bright red tint
        }
        
        // Default to vibrational level color
        return vibrationalColors[vibrationalLevel.toString()] || '#4f009d';
    }

    // Set background vibe color and start pulsing
    function setVibrationalBackground(vibrationalLevel, messageText) {
        const vibeColor = getVibrationalColor(vibrationalLevel, messageText);
        
        console.log('Setting vibrational background:', vibrationalLevel, vibeColor);
        console.log('Current body classes before:', document.body.classList.toString());
        
        // Clear any existing pulsing first
        document.body.classList.remove('vibrational-pulse');
        
        // Set CSS custom property for the vibe color
        document.documentElement.style.setProperty('--vibe-color', vibeColor);
        console.log('CSS variable --vibe-color set to:', vibeColor);
        
        // Force a reflow to ensure the CSS variable is set
        document.body.offsetHeight;
        
        // Add pulsing class to body immediately for testing
        document.body.classList.add('vibrational-pulse');
        console.log('Vibrational pulse class added immediately, color:', vibeColor);
        console.log('Current body classes after:', document.body.classList.toString());
        
        // Log the computed style to verify
        const computedStyle = window.getComputedStyle(document.body);
        console.log('Computed background-color:', computedStyle.backgroundColor);
        console.log('Computed animation:', computedStyle.animation);
        
        // Remove any existing timeout
        if (window.vibrationalTimeout) {
            clearTimeout(window.vibrationalTimeout);
        }
        
        // Keep the vibrational background for 15 seconds
        window.vibrationalTimeout = setTimeout(() => {
            console.log('Clearing vibrational background after 15 seconds');
            clearVibrationalBackground();
        }, 15000);
    }

    // Clear vibrational background
    function clearVibrationalBackground() {
        document.body.classList.remove('vibrational-pulse');
        document.documentElement.style.setProperty('--vibe-color', '#000000');
    }

    // Create permanent astrological wheel
    function createAstrologicalWheel() {
        if (!astrologicalWheel) return;
        
        // Simple planetary astrology symbols
        const astroSigns = ['☿', '♀', '♁', '♂', '♃', '♄', '♅', '♆', '♇'];
        
        astroSigns.forEach((sign, index) => {
            const symbol = document.createElement('div');
            symbol.className = 'zodiac-symbol';
            symbol.textContent = sign; // Use textContent for simple characters
            
            const angle = index * 40; // 40 degrees apart (9 symbols = 360/9 = 40°)
            const radius = 45; // 45% of container
            const angleRad = (angle * Math.PI) / 180;
            
            const x = 50 + radius * Math.cos(angleRad);
            const y = 50 + radius * Math.sin(angleRad);
            
            symbol.style.left = x + '%';
            symbol.style.top = y + '%';
            
            astrologicalWheel.appendChild(symbol);
        });
    }

    // Get deeply thematic symbols with animals and clever associations
    function getThematicSymbols(messageText, isPositive) {
        const lowerText = messageText.toLowerCase();
        
        if (isPositive) {
            // Love & relationships - animals of romance and bonding
            if (lowerText.includes('love') || lowerText.includes('heart') || lowerText.includes('romance') || lowerText.includes('relationship')) {
                return ['🦢', '🕊️', '🦋', '🐝', '🦆', '❤️', '💕', '💖', '💗', '💘', '🌹', '🌺', '♥', '♡', '💞'];
            }
            // Spiritual & divine - sacred animals and mystical symbols
            if (lowerText.includes('spiritual') || lowerText.includes('divine') || lowerText.includes('sacred') || lowerText.includes('enlighten') || lowerText.includes('meditation')) {
                return ['🦅', '🕊️', '🦄', '🐉', '🙏', '🕉️', '☯️', '✝️', '☪️', '🔯', '👼', '😇', '🧿', '📿', '⛩️'];
            }
            // Wisdom & knowledge - wise animals
            if (lowerText.includes('wise') || lowerText.includes('wisdom') || lowerText.includes('learn') || lowerText.includes('knowledge') || lowerText.includes('understand')) {
                return ['🦉', '🐘', '🦋', '🐢', '📚', '🔮', '✨', '💡', '🧠', '👁️', '🗝️', '💎', '⭐', '🌟', '☆'];
            }
            // Strength & courage - powerful animals
            if (lowerText.includes('strong') || lowerText.includes('courage') || lowerText.includes('brave') || lowerText.includes('power') || lowerText.includes('confident')) {
                return ['🦁', '🐅', '🦅', '🐺', '🐻', '🦬', '🦏', '💪', '👑', '🛡️', '⚡', '🔥', '🌟', '✨', '💎'];
            }
            // Freedom & adventure - free spirits
            if (lowerText.includes('free') || lowerText.includes('freedom') || lowerText.includes('adventure') || lowerText.includes('explore') || lowerText.includes('journey')) {
                return ['🦅', '🐎', '🦋', '🐋', '🐬', '🦆', '🌊', '🌬️', '🌈', '🗺️', '⛵', '🎈', '✈️', '🚀', '⭐'];
            }
            // Joy & playfulness - happy animals
            if (lowerText.includes('joy') || lowerText.includes('happy') || lowerText.includes('fun') || lowerText.includes('play') || lowerText.includes('laugh')) {
                return ['🐒', '🐧', '🦭', '🐬', '🐕', '🐱', '🦆', '🐥', '🎉', '🎊', '🎈', '✨', '🌟', '💫', '😊'];
            }
            // Peace & calm - peaceful animals
            if (lowerText.includes('peace') || lowerText.includes('calm') || lowerText.includes('tranquil') || lowerText.includes('serene') || lowerText.includes('zen')) {
                return ['🕊️', '🦢', '🐢', '🦌', '🐰', '🐑', '🌸', '🪷', '☯️', '💙', '🌊', '🌙', '☮️', '🧘', '✨'];
            }
            // Growth & renewal - life-giving animals and symbols
            if (lowerText.includes('grow') || lowerText.includes('new') || lowerText.includes('begin') || lowerText.includes('start') || lowerText.includes('birth')) {
                return ['🦋', '🐛', '🐝', '🐢', '🌱', '🌿', '🌸', '🌺', '🥚', '🐣', '🐤', '☀️', '🌅', '✨', '⭐'];
            }
            // Success & achievement - victorious animals
            if (lowerText.includes('success') || lowerText.includes('win') || lowerText.includes('achieve') || lowerText.includes('victory') || lowerText.includes('accomplish')) {
                return ['🦅', '🦁', '🐅', '🐎', '🏆', '🥇', '👑', '💰', '💎', '🎯', '🌟', '⭐', '✨', '🎉', '🙌'];
            }
        } else {
            // Fear & anxiety - fearsome/anxious animals
            if (lowerText.includes('fear') || lowerText.includes('scared') || lowerText.includes('anxiety') || lowerText.includes('worry') || lowerText.includes('nervous')) {
                return ['🦇', '🕷️', '🐍', '🦂', '🐀', '🕊️', '😰', '😱', '🌚', '🌑', '☁️', '⛈️', '🌪️', '💀', '👻'];
            }
            // Anger & aggression - aggressive animals
            if (lowerText.includes('anger') || lowerText.includes('mad') || lowerText.includes('rage') || lowerText.includes('furious') || lowerText.includes('hate')) {
                return ['🐅', '🦏', '🐗', '🦈', '🐊', '🐍', '🦂', '🔥', '⚡', '💥', '😡', '🤬', '💢', '⚔️', '🗡️'];
            }
            // Betrayal & deception - sneaky animals
            if (lowerText.includes('betray') || lowerText.includes('lie') || lowerText.includes('deceive') || lowerText.includes('fake') || lowerText.includes('cheat')) {
                return ['🐍', '🦊', '🐺', '🕷️', '🦂', '🐀', '👺', '😈', '🎭', '🖤', '⚫', '🌑', '🌚', '💀', '☠️'];
            }
            // Isolation & loneliness - solitary animals
            if (lowerText.includes('alone') || lowerText.includes('lonely') || lowerText.includes('isolat') || lowerText.includes('abandon') || lowerText.includes('empty')) {
                return ['🐺', '🦇', '🐢', '🦉', '🐧', '☁️', '🌑', '🌚', '💔', '😞', '😔', '🖤', '◼️', '▪️', '⚫'];
            }
            // Destruction & chaos - destructive forces
            if (lowerText.includes('destroy') || lowerText.includes('break') || lowerText.includes('chaos') || lowerText.includes('ruin') || lowerText.includes('devastat')) {
                return ['🦈', '🐊', '🐍', '🕷️', '🦂', '💥', '🔥', '⚡', '🌪️', '🌋', '💣', '⚔️', '💀', '☠️', '⚠️'];
            }
            // Sadness & depression - melancholy animals and symbols
            if (lowerText.includes('sad') || lowerText.includes('depress') || lowerText.includes('cry') || lowerText.includes('hurt') || lowerText.includes('pain')) {
                return ['🐧', '🦭', '🐢', '🦉', '💧', '☔', '🌧️', '☁️', '💔', '😢', '😭', '🥀', '🖤', '🌑', '◼️'];
            }
            // Toxic & poisonous - venomous animals
            if (lowerText.includes('toxic') || lowerText.includes('poison') || lowerText.includes('venom') || lowerText.includes('corrupt') || lowerText.includes('contamina')) {
                return ['🐍', '🕷️', '🦂', '🐀', '🦠', '☠️', '💀', '☢️', '☣️', '⚠️', '🖤', '💚', '🤢', '🤮', '😵'];
            }
        }
        
        // Return general positive or negative symbols if no specific theme matches
        return isPositive ? positiveSymbols : negativeSymbols;
    }

    // Clear existing symbols
    function clearVibrationalSymbols() {
        if (!vibrationalSymbols) return;
        vibrationalSymbols.innerHTML = '';
    }

    // Spawn magical symbols (now persist until next query)
    function spawnVibrationalSymbols(vibrationalLevel, messageLength, messageText) {
        if (!vibrationalSymbols) return;
        
        // Clear previous symbols first
        clearVibrationalSymbols();
        
        const isPositive = vibrationalLevel > 0;
        const intensity = Math.abs(vibrationalLevel);
        // Ensure at least 10 symbols, up to 25 for strong vibrations
        const symbolCount = Math.min(25, Math.max(10, (intensity * 6) + Math.floor(messageLength / 10)));
        
        // Get thematically appropriate symbols for this message
        const thematicSymbols = getThematicSymbols(messageText, isPositive);
        
        for (let i = 0; i < symbolCount; i++) {
            setTimeout(() => {
                const symbol = document.createElement('div');
                symbol.className = `vibrational-symbol ${isPositive ? 'positive' : 'negative'}`;
                
                // Choose from thematic symbols (70% chance) or general symbols (30% chance)
                const useThematic = Math.random() < 0.7;
                const symbolArray = useThematic ? thematicSymbols : (isPositive ? positiveSymbols : negativeSymbols);
                const chosenSymbol = symbolArray[Math.floor(Math.random() * symbolArray.length)];
                symbol.textContent = chosenSymbol;
                
                // Random position (zodiac symbols are now permanent in the wheel)
                symbol.style.left = Math.random() * (window.innerWidth - 100) + 50 + 'px';
                symbol.style.top = Math.random() * (window.innerHeight - 100) + 50 + 'px';
                
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

    // Initialize Web Audio Context and Effects
    function initializeAudioEffects() {
        try {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            wizardAudioEffects = {
                // Create oscillator for ring modulation
                ringModOsc: audioContext.createOscillator(),
                ringModGain: audioContext.createGain(),
                
                // Create filters
                lowpassFilter: audioContext.createBiquadFilter(),
                highpassFilter: audioContext.createBiquadFilter(),
                
                // Create distortion using WaveShaper
                distortion: audioContext.createWaveShaper(),
                
                // Create gain nodes for mixing
                inputGain: audioContext.createGain(),
                outputGain: audioContext.createGain(),
                
                // Pitch shift simulation (basic)
                delayNode: audioContext.createDelay(),
                feedbackGain: audioContext.createGain(),
                
                // Bitcrusher simulation
                bitcrushGain: audioContext.createGain(),
                
                // Main source and destination
                source: null,
                destination: audioContext.destination
            };
            
            // Setup ring modulation
            wizardAudioEffects.ringModOsc.frequency.setValueAtTime(30, audioContext.currentTime); // Low frequency for robotic buzz
            wizardAudioEffects.ringModOsc.start();
            wizardAudioEffects.ringModGain.gain.setValueAtTime(0.2, audioContext.currentTime); // Subtle ring mod
            
            // Setup filters
            wizardAudioEffects.lowpassFilter.type = 'lowpass';
            wizardAudioEffects.lowpassFilter.frequency.setValueAtTime(3000, audioContext.currentTime); // Cut high frequencies
            wizardAudioEffects.lowpassFilter.Q.setValueAtTime(1, audioContext.currentTime);
            
            wizardAudioEffects.highpassFilter.type = 'highpass';
            wizardAudioEffects.highpassFilter.frequency.setValueAtTime(200, audioContext.currentTime); // Cut very low frequencies
            wizardAudioEffects.highpassFilter.Q.setValueAtTime(0.5, audioContext.currentTime);
            
            // Setup subtle distortion
            const makeDistortionCurve = (amount) => {
                const samples = 44100;
                const curve = new Float32Array(samples);
                const deg = Math.PI / 180;
                for (let i = 0; i < samples; i++) {
                    const x = (i * 2) / samples - 1;
                    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
                }
                return curve;
            };
            wizardAudioEffects.distortion.curve = makeDistortionCurve(2); // Subtle distortion
            wizardAudioEffects.distortion.oversample = '4x';
            
            // Setup delay for pitch simulation
            wizardAudioEffects.delayNode.delayTime.setValueAtTime(0.02, audioContext.currentTime); // 20ms delay
            wizardAudioEffects.feedbackGain.gain.setValueAtTime(0.1, audioContext.currentTime);
            
            // Setup gains
            wizardAudioEffects.inputGain.gain.setValueAtTime(0.8, audioContext.currentTime);
            wizardAudioEffects.outputGain.gain.setValueAtTime(0.9, audioContext.currentTime);
            wizardAudioEffects.bitcrushGain.gain.setValueAtTime(0.7, audioContext.currentTime);
            
            console.log("Audio effects initialized");
        } catch (error) {
            console.error("Error initializing audio effects:", error);
        }
    }

    // Apply effects to audio element (disabled due to CORS restrictions)
    function applyWizardEffects(audioElement) {
        // Web Audio API effects are disabled because external TTS audio files
        // from fal.media don't support CORS for Web Audio processing
        // This would require proxy/server-side audio processing to work properly
        console.log("Web Audio effects disabled due to CORS restrictions on external audio files");
        return audioElement;
    }

    // Initialize background music
    function initializeBackgroundMusic() {
        backgroundMusic = new Audio('./wizardry.mp3');
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0; // Start at 0 volume for fade in
        
        // Handle loading events
        backgroundMusic.onloadstart = () => console.log('Background music loading started');
        backgroundMusic.oncanplay = () => console.log('Background music ready to play');
        backgroundMusic.onerror = (e) => console.error('Background music error:', e);
        
        console.log("Background music initialized");
    }

    // Start background music with fade in (called after first query)
    function startBackgroundMusic() {
        if (!musicStarted && backgroundMusic) {
            backgroundMusic.play().then(() => {
                console.log("Background music started, fading in...");
                musicStarted = true;
                
                // Fade in over 3 seconds
                const fadeInDuration = 3000; // 3 seconds
                const targetVolume = 0.15; // 15% final volume
                const fadeSteps = 60; // 60 steps for smooth fade
                const stepDuration = fadeInDuration / fadeSteps;
                const volumeIncrement = targetVolume / fadeSteps;
                
                let currentStep = 0;
                const fadeInterval = setInterval(() => {
                    currentStep++;
                    backgroundMusic.volume = Math.min(volumeIncrement * currentStep, targetVolume);
                    
                    if (currentStep >= fadeSteps) {
                        clearInterval(fadeInterval);
                        backgroundMusic.volume = targetVolume;
                        console.log("Background music fade in complete");
                    }
                }, stepDuration);
                
            }).catch(err => {
                console.error("Error starting background music:", err);
            });
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

    // Preprocess text for better TTS pronunciation
    function preprocessTextForTTS(text) {
        let processedText = text;
        
        // Gen Alpha slang pronunciation fixes
        processedText = processedText.replace(/\bgyatt\b/gi, 'Ghee-yat');
        processedText = processedText.replace(/\bgyat\b/gi, 'Ghee-yat');
        processedText = processedText.replace(/\brizz\b/gi, 'rizz');
        processedText = processedText.replace(/\bskibidi\b/gi, 'skib-uh-dee');
        processedText = processedText.replace(/\bsigma\b/gi, 'sig-mah');
        processedText = processedText.replace(/\bbeta\b/gi, 'bay-tah');
        processedText = processedText.replace(/\balpha\b/gi, 'al-fah');
        processedText = processedText.replace(/\bfr\b/gi, 'for real');
        processedText = processedText.replace(/\bngl\b/gi, 'not gonna lie');
        processedText = processedText.replace(/\bfam\b/gi, 'fam');
        processedText = processedText.replace(/\bno cap\b/gi, 'no cap');
        processedText = processedText.replace(/\bfacts\b/gi, 'facts'); 
        
        console.log('Original text:', text);
        console.log('Processed text for TTS:', processedText);
        
        return processedText;
    }

    async function speakWizardResponse(text) {
        try {
            const processedText = preprocessTextForTTS(text);
            console.log('Requesting TTS for text:', processedText);
            const response = await fetch('/.netlify/functions/fal-kokoro-tts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text: processedText }),
            });

            console.log('TTS response status:', response.status);
            
            if (response.ok) {
                const data = await response.json();
                console.log('TTS response data:', data);
                
                if (data.audioUrl) {
                    console.log('Playing audio from URL:', data.audioUrl);
                    const audio = new Audio(data.audioUrl);
                    audio.volume = 1.0; // 100% volume for Kokoro voice
                    
                    audio.onloadstart = () => console.log('Audio loading started');
                    audio.oncanplay = () => {
                        console.log('Audio can start playing');
                        // Skip Web Audio effects due to CORS restrictions with external audio files
                        // The external TTS audio files don't allow cross-origin Web Audio processing
                        console.log('Skipping Web Audio effects due to CORS restrictions on external audio');
                    };
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

    function showConjuringState() {
        if (!wizardSpeechBubble) {
            console.error("Wizard speech bubble element not found!");
            return;
        }
        
        // Clear any existing content and add conjuring class
        wizardSpeechBubble.textContent = ''; // Empty since CSS pseudo-element shows "Conjuring..."
        wizardSpeechBubble.classList.add('conjuring');
        wizardSpeechBubble.style.animation = '';
        wizardSpeechBubble.style.color = '';
    }

    function clearConjuringState() {
        if (!wizardSpeechBubble) return;
        
        wizardSpeechBubble.classList.remove('conjuring');
    }

    function displayWizardResponseWithRetry(text, originalMessage) {
        if (!wizardSpeechBubble) {
            console.error("Wizard speech bubble element not found!");
            return;
        }
        
        // Clear conjuring state first
        clearConjuringState();
        
        // Create container for error message and retry button
        wizardSpeechBubble.innerHTML = '';
        wizardSpeechBubble.style.animation = 'none';
        wizardSpeechBubble.style.color = '#ff6b6b';
        
        const errorText = document.createElement('div');
        errorText.textContent = text;
        errorText.style.marginBottom = '10px';
        
        const retryButton = document.createElement('button');
        retryButton.textContent = 'Try Again';
        retryButton.style.cssText = `
            background: linear-gradient(45deg, #8b5cf6, #a855f7);
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
        `;
        
        retryButton.onmouseover = () => {
            retryButton.style.transform = 'scale(1.05)';
            retryButton.style.background = 'linear-gradient(45deg, #7c3aed, #9333ea)';
        };
        retryButton.onmouseout = () => {
            retryButton.style.transform = 'scale(1)';
            retryButton.style.background = 'linear-gradient(45deg, #8b5cf6, #a855f7)';
        };
        
        retryButton.onclick = () => {
            // Clear the error and retry the message
            wizardSpeechBubble.innerHTML = '';
            chatInput.value = originalMessage;
            sendMessage();
        };
        
        wizardSpeechBubble.appendChild(errorText);
        wizardSpeechBubble.appendChild(retryButton);
    }

    function appendToWizardResponse(additionalText) {
        if (!wizardSpeechBubble) {
            console.error("Wizard speech bubble element not found!");
            return;
        }
        
        // Get current text and append
        const currentText = wizardSpeechBubble.textContent || '';
        const fullText = currentText + additionalText;
        
        // Clear and restart typing effect with full text
        wizardSpeechBubble.textContent = '';
        wizardSpeechBubble.style.color = '';
        
        // Continue TTS with additional text
        speakWizardResponse(additionalText);
        
        // Typing effect for the additional text only
        let charIndex = currentText.length;
        function typeChar() {
            if (charIndex < fullText.length) {
                wizardSpeechBubble.textContent = fullText.substring(0, charIndex + 1);
                charIndex++;
                setTimeout(typeChar, 30);
            }
        }
        
        // Set the current text immediately, then type the new part
        wizardSpeechBubble.textContent = currentText;
        typeChar();
    }

    function displayWizardResponse(text, isError = false) {
        if (!wizardSpeechBubble) {
            console.error("Wizard speech bubble element not found!");
            appendMessage(text, isError ? 'wizard-message error' : 'wizard-message');
            return;
        }
        
        // Clear conjuring state first
        clearConjuringState();
        
        if (isError) {
            wizardSpeechBubble.textContent = text;
            wizardSpeechBubble.style.animation = 'none';
            wizardSpeechBubble.style.color = '#ff6b6b';
        } else {
            // Clear bubble and start typing effect
            wizardSpeechBubble.textContent = '';
            wizardSpeechBubble.style.animation = '';
            wizardSpeechBubble.style.color = '';
            
            // Start TTS immediately when typing begins
            speakWizardResponse(text);
            
            // Typing effect
            let charIndex = 0;
            const typingSpeed = 30; // milliseconds between characters
            
            const typeInterval = setInterval(() => {
                if (charIndex < text.length) {
                    wizardSpeechBubble.textContent += text.charAt(charIndex);
                    charIndex++;
                } else {
                    clearInterval(typeInterval);
                    // TTS already started above
                }
            }, typingSpeed);
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

            // Show conjuring loading state
            showConjuringState();

            try {
                // Add current message to conversation history
                conversationHistory.push({ role: "user", content: messageText });
                
                // Keep only last 10 messages (5 exchanges) to manage memory
                if (conversationHistory.length > 10) {
                    conversationHistory = conversationHistory.slice(-10);
                }
                
                const response = await fetch('/.netlify/functions/deepseek-chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        message: messageText,
                        conversationHistory: conversationHistory,
                        maxTokens: getTokenCount(responseLengthSlider.value),
                        responseMode: getResponseMode(responseLengthSlider.value)
                    }),
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
                    // Handle chunked responses
                    if (data.shouldContinue && (data.chunkNumber || 1) < 3) { // Limit to 3 chunks max
                        console.log(`Response truncated, requesting continuation (chunk ${(data.chunkNumber || 1) + 1})`);
                        
                        // Add the partial response to conversation history
                        conversationHistory.push({ role: "assistant", content: data.reply });
                        
                        // Display the partial response immediately
                        displayWizardResponse(data.reply);
                        
                        // Request continuation after a short delay
                        setTimeout(async () => {
                            try {
                                const continuationPrompt = "Please continue your previous response from where you left off.";
                                const continuationResponse = await fetch('/.netlify/functions/deepseek-chat', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({ 
                                        message: continuationPrompt,
                                        conversationHistory: conversationHistory,
                                        maxTokens: Math.min(getTokenCount(responseLengthSlider.value) - data.tokensUsed, 800),
                                        responseMode: getResponseMode(responseLengthSlider.value),
                                        isChunk: true,
                                        chunkNumber: (data.chunkNumber || 1) + 1
                                    }),
                                });
                                
                                if (continuationResponse.ok) {
                                    const contData = await continuationResponse.json();
                                    if (contData && contData.reply) {
                                        // Update the conversation history with the full response
                                        conversationHistory[conversationHistory.length - 1].content += ' ' + contData.reply;
                                        
                                        // Append to the existing response
                                        appendToWizardResponse(' ' + contData.reply);
                                        
                                        // Check if we need another continuation
                                        if (contData.shouldContinue && contData.chunkNumber < 3) {
                                            // Recursive continuation logic could go here
                                        }
                                    }
                                }
                            } catch (contError) {
                                console.error('Continuation failed:', contError);
                                appendToWizardResponse(' [... the mystical connection wavered ...]');
                            }
                        }, 1000);
                        
                    } else {
                        // Complete response or no continuation needed
                        conversationHistory.push({ role: "assistant", content: data.reply });
                        displayWizardResponse(data.reply);
                    }
                } else {
                    console.error("Invalid data structure from backend:", data);
                    displayWizardResponse("The wizard's words are jumbled (invalid response format)... perhaps a cosmic hiccup?", true);
                }
                
            } catch (error) {
                console.error('Failed to send message or get response:', error);
                
                // Check if it's a 502 error (server error)
                const is502Error = error.message && error.message.includes('502');
                
                if (is502Error) {
                    // Show error message with try again button for 502 errors
                    displayWizardResponseWithRetry("The mystical servers are overwhelmed by your profound energy. The cosmic forces need a moment to process your request.", messageText);
                } else {
                    // Fallback wizardly responses for other errors
                    const fallbackResponses = [
                        "The cosmic WiFi is acting sus right now, young seeker. Try again when Mercury exits retrograde, no cap!",
                        "Bruh, the mystical servers are literally touching grass rn. Your question slaps though - hit me up again in a hot minute!",
                        "The divine algorithms are lowkey glitching fr fr. Your query is valid though, bestie. Circle back soon!",
                        "Not gonna lie, the astral internet is mid right now. Your vibe is immaculate though - retry when the stars align better!",
                        "The magical bandwidth is straight up bussin elsewhere. Your energy is chef's kiss though - come back when the cosmos chill out!",
                        "Yo, the ethereal servers said 'nah fam' today. Your question hits different though - slide through again when the digital spirits cooperate!"
                    ];
                    
                    const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
                    displayWizardResponse(randomResponse, true);
                }
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

    // Response Length Control
    function getTokenCount(sliderValue) {
        const tokenMap = {
            1: 100,   // Cryptic - mysterious questions
            2: 400,   // Moderate Wisdom - balanced responses
            3: 800,   // Deep Insights - detailed responses
            4: 1500   // Profound - maximum depth (increased to 1500 tokens)
        };
        return tokenMap[sliderValue] || 400; // Default to moderate (400)
    }

    function getResponseMode(sliderValue) {
        const modes = {
            1: "cryptic",      // Just ask mysterious questions
            2: "moderate",     // Balanced wisdom
            3: "deep",         // Detailed insights
            4: "profound"      // Maximum depth and analysis
        };
        return modes[sliderValue] || "moderate";
    }

    function updateLengthIndicator(value) {
        const indicators = {
            1: "Cryptic Questions",
            2: "Moderate Wisdom", 
            3: "Deep Insights",
            4: "Profound Mysteries"
        };
        if (lengthIndicator) {
            lengthIndicator.textContent = indicators[value] || "Moderate Wisdom";
        }
    }

    if (responseLengthSlider) {
        responseLengthSlider.addEventListener('input', (event) => {
            updateLengthIndicator(event.target.value);
        });
        
        // Initialize indicator
        updateLengthIndicator(responseLengthSlider.value);
    } else {
        console.error("Response length slider not found.");
    }

    initializeMicrophone();
    createAstrologicalWheel();
    initializeBackgroundMusic();
    initializeAudioEffects();
});