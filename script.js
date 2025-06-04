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

    // Response caching for performance
    const responseCache = new Map();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    function getCacheKey(message, mode, tokens) {
        return `${message.toLowerCase().trim()}_${mode}_${tokens}`;
    }

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

    // Spawn magical symbols (now persist until next query) - OPTIMIZED
    function spawnVibrationalSymbols(vibrationalLevel, messageLength, messageText) {
        if (!vibrationalSymbols) return;
        
        // Clear previous symbols first
        clearVibrationalSymbols();
        
        const isPositive = vibrationalLevel > 0;
        const intensity = Math.abs(vibrationalLevel);
        // Reduced max symbols from 25 to 15 for better performance
        const symbolCount = Math.min(15, Math.max(5, (intensity * 3) + Math.floor(messageLength / 20)));
        
        // Get thematically appropriate symbols for this message
        const thematicSymbols = getThematicSymbols(messageText, isPositive);
        
        // Use requestAnimationFrame for smoother animations
        let symbolIndex = 0;
        function addSymbol() {
            if (symbolIndex >= symbolCount) return;
            
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
            const size = 18 + (intensity * 4) + Math.random() * 15;
            symbol.style.fontSize = size + 'px';
            
            // Add random delay to pulsing animation
            symbol.style.animationDelay = Math.random() * 2 + 's';
            
            vibrationalSymbols.appendChild(symbol);
            symbolIndex++;
            
            // Use RAF instead of setTimeout for smoother performance
            requestAnimationFrame(addSymbol);
        }
        
        requestAnimationFrame(addSymbol);
    }

    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
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
        
        // Clear any existing timeouts
        if (window.conjuringTimeout1) clearTimeout(window.conjuringTimeout1);
        if (window.conjuringTimeout2) clearTimeout(window.conjuringTimeout2);
        
        // Clear any existing content and add conjuring class
        wizardSpeechBubble.textContent = ''; // Empty since CSS pseudo-element shows "Conjuring..."
        wizardSpeechBubble.classList.add('conjuring');
        wizardSpeechBubble.style.animation = '';
        wizardSpeechBubble.style.color = '';
        
        // Show additional info for longer responses
        const tokenCount = getTokenCount(responseLengthSlider.value);
        const responseMode = getResponseMode(responseLengthSlider.value);
        
        if (tokenCount > 1000) {
            // Add extra text for epic/legendary responses
            window.conjuringTimeout1 = setTimeout(() => {
                if (wizardSpeechBubble.classList.contains('conjuring')) {
                    const modeText = responseMode === 'legendary' ? 'legendary cosmic wisdom' : responseMode === 'epic' ? 'epic mystical knowledge' : 'profound insights';
                    wizardSpeechBubble.innerHTML = `<div class="conjuring-text">Channeling ${modeText}...</div><div class="conjuring-subtext">The universe is working hard on your profound question</div>`;
                }
            }, 3000); // Show after 3 seconds
            
            window.conjuringTimeout2 = setTimeout(() => {
                if (wizardSpeechBubble.classList.contains('conjuring')) {
                    wizardSpeechBubble.innerHTML = `<div class="conjuring-text">Almost there...</div><div class="conjuring-subtext">Your cosmic response is manifesting</div>`;
                }
            }, 15000); // Show after 15 seconds
        }
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
            background: none;;
            color: white;
            border: solid 1px #555;
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

            const tokenCount = getTokenCount(responseLengthSlider.value);
            const responseMode = getResponseMode(responseLengthSlider.value);
            
            // For longer responses, show enhanced ritual experience
            if (tokenCount > 350) {
                await sendMessageWithRitualExperience(messageText, responseMode, tokenCount);
            } else {
                await sendImmediateMessage(messageText, responseMode, tokenCount);
            }
        }
    }

    // Enhanced ritual experience using timed phases with regular API
    async function sendMessageWithRitualExperience(messageText, responseMode, tokenCount) {
        console.log(`Starting ritual experience: ${tokenCount} tokens in ${responseMode} mode`);
        
        // Add to conversation history
        conversationHistory.push({ role: "user", content: messageText });
        
        let ritualStartTime = Date.now();
        let ritualPhase = 1;
        
        // Show initial ritual phase
        showSimpleRitualPhase({
            message: "Initiating mystical ritual...",
            description: "The cosmic energies begin to gather",
            phase: 1,
            startTime: ritualStartTime
        });
        
        // Phase updates with timing
        const phase2Timer = setTimeout(() => {
            ritualPhase = 2;
            showSimpleRitualPhase({
                message: "Gathering cosmic energies...",
                description: "Drawing power from distant galaxies", 
                phase: 2,
                startTime: ritualStartTime
            });
        }, 8000); // 8 seconds
        
        const phase3Timer = setTimeout(() => {
            ritualPhase = 3;
            showSimpleRitualPhase({
                message: "Channeling interdimensional insights...",
                description: "Bridging realms of consciousness",
                phase: 3, 
                startTime: ritualStartTime
            });
        }, 16000); // 16 seconds
        
        const phase4Timer = setTimeout(() => {
            ritualPhase = 4;
            showSimpleRitualPhase({
                message: "Weaving legendary cosmic wisdom...",
                description: "Crafting your personalized mystical guidance",
                phase: 4,
                startTime: ritualStartTime
            });
        }, 25000); // 25 seconds
        
        try {
            // Keep only last 10 messages
            if (conversationHistory.length > 10) {
                conversationHistory = conversationHistory.slice(-10);
            }
            
            // Extended timeout for longer responses
            const timeoutMs = 40000; // 40 seconds
            
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
            clearTimeout(phase2Timer);
            clearTimeout(phase3Timer);
            clearTimeout(phase4Timer);
            
            if (!response.ok) {
                throw new Error(`API Error: ${response.status}`);
            }
            
            const data = await response.json();
            if (data && data.reply) {
                // Show completion celebration
                showSimpleRitualCompletion();
                
                setTimeout(() => {
                    conversationHistory.push({ role: "assistant", content: data.reply });
                    displayWizardResponse(data.reply);
                    
                    if (data.tokenUsage) {
                        console.log(`Token usage:`, data.tokenUsage);
                    }
                    
                    toggleWizardSpeaking(false);
                }, 2000);
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            console.error('Ritual failed:', error);
            clearTimeout(phase2Timer);
            clearTimeout(phase3Timer);
            clearTimeout(phase4Timer);
            
            const isAbortError = error.name === 'AbortError';
            const is502Error = error.message && error.message.includes('502');
            const isTimeoutError = error.message && (error.message.includes('timeout') || error.message.includes('time'));
            
            let errorMessage;
            if (isAbortError || isTimeoutError) {
                errorMessage = `The ${responseMode} ritual required more cosmic energy than available! The mystical servers timed out. Try "Deep Insights" (Level 3) or lower for more reliable wizardly wisdom.`;
            } else if (is502Error) {
                errorMessage = "The mystical servers are overwhelmed by your profound energy. Try using Level 1-3 for more reliable responses!";
            } else {
                errorMessage = error.message || "The cosmic energies have been disrupted!";
            }
            
            handleSimpleRitualFailure(errorMessage, messageText);
        }
    }
    
    function showSimpleRitualPhase(phaseData) {
        if (!wizardSpeechBubble) return;
        
        const elapsed = Math.floor((Date.now() - phaseData.startTime) / 1000);
        
        wizardSpeechBubble.innerHTML = `
            <div class="ritual-phase">
                <div class="ritual-message">${phaseData.message}</div>
                <div class="ritual-description">${phaseData.description}</div>
                <div class="ritual-timer">Elapsed: ${elapsed}s • Phase ${phaseData.phase}</div>
                <div class="ritual-progress">
                    <div class="progress-bar" style="width: ${Math.min(100, (elapsed / 45) * 100)}%"></div>
                </div>
                <button class="ritual-cancel" onclick="cancelCurrentRitual()">Cancel & Try Shorter Response</button>
            </div>
        `;
        
        // Spawn ritual symbols
        spawnSimpleRitualSymbols(phaseData.phase);
    }
    
    function spawnSimpleRitualSymbols(phase) {
        const ritualSymbols = ['🔮', '✨', '🌟', '⭐', '💫', '🌙', '🌞', '🔯', '☯️', '🕉️'];
        const symbolCount = Math.min(8, phase * 2);
        
        for (let i = 0; i < symbolCount; i++) {
            setTimeout(() => {
                const symbol = document.createElement('div');
                symbol.className = 'ritual-symbol';
                symbol.textContent = ritualSymbols[Math.floor(Math.random() * ritualSymbols.length)];
                
                symbol.style.left = Math.random() * window.innerWidth + 'px';
                symbol.style.top = Math.random() * window.innerHeight + 'px';
                symbol.style.animationDelay = Math.random() * 3 + 's';
                
                vibrationalSymbols.appendChild(symbol);
                
                setTimeout(() => symbol.remove(), 6000);
            }, i * 150);
        }
    }
    
    function showSimpleRitualCompletion() {
        wizardSpeechBubble.innerHTML = `
            <div class="ritual-complete">
                <div class="completion-message">🎆 COSMIC TRANSMISSION COMPLETE! 🎆</div>
                <div class="completion-description">Your mystical wisdom has manifested!</div>
            </div>
        `;
        
        // Celebration symbol explosion
        const celebrationSymbols = ['✨', '🎆', '🌟', '💫', '🎊', '🎉'];
        for (let i = 0; i < 15; i++) {
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
    
    function handleSimpleRitualFailure(error, originalMessage) {
        wizardSpeechBubble.innerHTML = `
            <div class="ritual-failed">
                <div class="failure-message">The cosmic energies have been disrupted!</div>
                <div class="failure-description">${error}</div>
                <button onclick="retryWithShorterMode('${originalMessage}')">Try Shorter Response Mode</button>
            </div>
        `;
        toggleWizardSpeaking(false);
    }
    
    window.cancelCurrentRitual = function() {
        const currentLevel = parseInt(responseLengthSlider.value);
        const newLevel = Math.max(1, currentLevel - 1);
        responseLengthSlider.value = newLevel;
        updateLengthIndicator(newLevel);
        
        handleSimpleRitualFailure('Ritual cancelled. Using shorter response mode for faster results!', '');
    };
    
    window.retryWithShorterMode = function(originalMessage) {
        const currentLevel = parseInt(responseLengthSlider.value);
        const newLevel = Math.max(1, currentLevel - 1);
        responseLengthSlider.value = newLevel;
        updateLengthIndicator(newLevel);
        
        // Clear the speech bubble
        wizardSpeechBubble.innerHTML = '';
        
        // Set the original message if provided
        if (originalMessage) {
            chatInput.value = originalMessage;
        }
        
        // Trigger new message
        setTimeout(() => {
            sendMessage();
        }, 500);
    };
    
    // Immediate response for shorter messages (≤350 tokens)
    async function sendImmediateMessage(messageText, responseMode, tokenCount) {
        console.log(`Sending immediate message: ${tokenCount} tokens in ${responseMode} mode`);
        
        // Check cache first
        const cacheKey = getCacheKey(messageText, responseMode, tokenCount);
        const cached = responseCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('Using cached response');
            displayWizardResponse(cached.reply);
            setTimeout(() => toggleWizardSpeaking(false), 1000);
            return;
        }
        
        // Show conjuring loading state
        showConjuringState();
        
        try {
            // Add current message to conversation history
            conversationHistory.push({ role: "user", content: messageText });
            
            // Keep only last 10 messages (5 exchanges) to manage memory
            if (conversationHistory.length > 10) {
                conversationHistory = conversationHistory.slice(-10);
            }
            
            console.log(`Requesting ${tokenCount} tokens in ${responseMode} mode`);
            
            // Shorter timeout for immediate responses
            const timeoutMs = 25000; // 25 seconds max
            
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
                // Add wizard's response to conversation history
                conversationHistory.push({ role: "assistant", content: data.reply });
                
                // Cache the response
                responseCache.set(cacheKey, {
                    reply: data.reply,
                    timestamp: Date.now()
                });
                
                // Clean old cache entries if too many
                if (responseCache.size > 20) {
                    const oldestKey = responseCache.keys().next().value;
                    responseCache.delete(oldestKey);
                }
                
                // Log token usage if available
                if (data.tokenUsage) {
                    console.log(`Token usage - Prompt: ${data.tokenUsage.prompt_tokens}, Completion: ${data.tokenUsage.completion_tokens}, Total: ${data.tokenUsage.total_tokens}`);
                }
                if (data.responseTime) {
                    console.log(`Response time: ${data.responseTime}ms`);
                }
                
                displayWizardResponse(data.reply);
            } else if (data && data.error && data.suggest_shorter) {
                // Backend suggests using a shorter response mode
                const currentLevel = parseInt(responseLengthSlider.value);
                const suggestedLevel = Math.max(1, currentLevel - 1);
                const errorWithSuggestion = data.error + ` Consider sliding down to Level ${suggestedLevel} for more reliable cosmic transmissions.`;
                displayWizardResponseWithRetry(errorWithSuggestion, messageText);
            } else {
                console.error("Invalid data structure from backend:", data);
                displayWizardResponse("The wizard's words are jumbled (invalid response format)... perhaps a cosmic hiccup?", true);
            }
            
        } catch (error) {
            console.error('Failed to send immediate message:', error);
            
            // Check for specific error types
            const isAbortError = error.name === 'AbortError';
            const is502Error = error.message && error.message.includes('502');
            const isTimeoutError = error.message && (error.message.includes('timeout') || error.message.includes('time'));
            
            if (isAbortError || isTimeoutError) {
                displayWizardResponseWithRetry(`Even the shorter response timed out! The cosmic servers are extra busy. Try "Cryptic Questions" or "Moderate Wisdom" for the most reliable results.`, messageText);
            } else if (is502Error) {
                displayWizardResponseWithRetry("The mystical servers are overwhelmed. Try using Level 1 or 2 for more reliable responses!", messageText);
            } else {
                // Fallback wizardly responses for other errors
                const fallbackResponses = [
                    "The cosmic WiFi is acting sus right now, young seeker. Try Level 1 or 2 for more reliable vibes!",
                    "Bruh, the mystical servers are literally touching grass rn. Slide down to a lower level for better luck!",
                    "The divine algorithms are lowkey glitching fr fr. Try a more basic response mode, bestie!"
                ];
                
                const randomResponse = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
                displayWizardResponse(randomResponse, true);
            }
        } finally {
            const speakDuration = wizardSpeechBubble && wizardSpeechBubble.textContent ? wizardSpeechBubble.textContent.length * 50 : 2000;
            setTimeout(() => toggleWizardSpeaking(false), Math.max(1000, speakDuration));
        }
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

    // Response Length Control - Optimized for Netlify free tier reliability
    function getTokenCount(sliderValue) {
        const tokenMap = {
            1: 80,    // Cryptic - mysterious questions (reduced from 100)
            2: 150,   // Moderate Wisdom - balanced responses (reduced from 200)
            3: 250,   // Deep Insights - detailed responses (reduced from 350)
            4: 350,   // Profound - comprehensive wisdom (reduced from 500)
            5: 450,   // Epic - extensive mystical knowledge (reduced from 700)
            6: 550    // Legendary - maximum cosmic wisdom (reduced from 900)
        };
        return tokenMap[sliderValue] || 150; // Default to moderate
    }

    function getResponseMode(sliderValue) {
        const modes = {
            1: "cryptic",      // Just ask mysterious questions
            2: "moderate",     // Balanced wisdom
            3: "deep",         // Detailed insights
            4: "profound",     // Maximum depth and analysis
            5: "epic",         // Extensive mystical exploration
            6: "legendary"     // Ultimate cosmic wisdom
        };
        return modes[sliderValue] || "moderate";
    }

    function updateLengthIndicator(value) {
        const indicators = {
            1: "Cryptic Questions ⚡",
            2: "Moderate Wisdom ⚡", 
            3: "Deep Insights ⚡",
            4: "Profound Mysteries ⚠️",
            5: "Epic Wisdom ⚠️",
            6: "Legendary Knowledge ⚠️"
        };
        
        const warnings = {
            4: " (May timeout on busy servers)",
            5: " (Longer wait, possible timeout)",
            6: " (Maximum wait, timeout likely)"
        };
        
        if (lengthIndicator) {
            const baseText = indicators[value] || "Moderate Wisdom";
            const warning = warnings[value] || "";
            lengthIndicator.textContent = baseText + warning;
            
            // Add visual styling based on reliability
            lengthIndicator.className = 'length-indicator';
            lengthIndicator.classList.add(parseInt(value) <= 3 ? 'reliable' : 'unreliable');
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
    // initializeAudioEffects();
});