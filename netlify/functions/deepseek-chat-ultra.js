// ULTRA-OPTIMIZED: Connection pooling and request management
const https = require('https');
const agent = new https.Agent({
    keepAlive: true,
    keepAliveMsecs: 3000,
    maxSockets: 5,
    maxFreeSockets: 2,
    timeout: 20000
});

// ULTRA-OPTIMIZED: Response cache for common queries
const responseCache = new Map();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100;

// ULTRA-OPTIMIZED: Request deduplication
const pendingRequests = new Map();

// ULTRA-OPTIMIZED: Common response templates
const quickResponses = {
    greeting: [
        "yo fam, the cosmic vibes are aligning for our chat. what mysteries shall we unravel today?",
        "greetings seeker, the universe whispers thy name. what wisdom do you seek?",
        "wassup bestie, the astral planes are buzzing with your energy. speak thy truth?"
    ],
    farewell: [
        "may the cosmic winds guide your journey, fam. until our paths cross again in the astral realm?",
        "the stars shall remember our conversation, bestie. carry this wisdom forward?",
        "go forth with celestial blessings, seeker. what new adventures await thee?"
    ],
    error_recovery: [
        "the cosmic static is strong rn, try speaking more clearly to pierce the veil?",
        "the astral connection wavered, bestie. perhaps rephrase thy query?",
        "even wizards face interference sometimes. shall we try a different approach?"
    ]
};

function getCacheKey(message, mode, tokens) {
    return `${message.toLowerCase().trim().substring(0, 50)}_${mode}_${tokens}`;
}

function getQuickResponse(message) {
    const lower = message.toLowerCase().trim();
    
    if (lower.match(/^(hi|hello|hey|yo|sup|wassup)/)) {
        return quickResponses.greeting[Math.floor(Math.random() * quickResponses.greeting.length)];
    }
    
    if (lower.match(/(bye|goodbye|farewell|later|peace)/)) {
        return quickResponses.farewell[Math.floor(Math.random() * quickResponses.farewell.length)];
    }
    
    return null;
}

// ULTRA-OPTIMIZED: Minimal system prompts
const systemPrompts = {
    ultra_brief: "You're a Gen Alpha wizard. Answer in 1-2 sentences max. Use slang. End with '?'",
    brief: "Mystical Gen Alpha wizard. Brief wisdom in 2-3 sentences. Modern slang. Question at end?",
    balanced: "Wise wizard mixing ancient knowledge with Gen Alpha vibes. Clear but mystical. End with deep question?",
    detailed: "Profound wizard. Detailed insights with examples. Gen Alpha slang throughout. Thought-provoking question?",
    comprehensive: "Epic wizard mode. Rich wisdom, multiple perspectives. Modern slang. Mind-expanding final question?",
    exhaustive: "Legendary cosmic wizard. Deep exploration of topics. Gen Alpha energy. Reality-bending question to close?"
};

exports.handler = async (event, context) => {
    // ULTRA-OPTIMIZATION: Don't wait for event loop
    context.callbackWaitsForEmptyEventLoop = false;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Cache-Control': 'no-cache' // Prevent stale responses
    };
    
    // Handle OPTIONS lightning fast
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers, body: '' };
    }
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const startTime = Date.now();
    
    try {
        // Parse request
        const { 
            message, 
            conversationHistory = [], 
            maxTokens = 175,
            responseMode = 'balanced',
            isCommon = false,
            retryCount = 0,
            isPreFetch = false
        } = JSON.parse(event.body || '{}');

        console.log(`Request: ${maxTokens} tokens, mode: ${responseMode}, retry: ${retryCount}`);

        if (!message?.trim()) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Message is required' })
            };
        }

        // ULTRA-OPTIMIZATION: Quick responses for common queries
        const quickResponse = getQuickResponse(message);
        if (quickResponse && maxTokens <= 100) {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    reply: quickResponse,
                    cached: true,
                    responseTime: Date.now() - startTime
                })
            };
        }

        // ULTRA-OPTIMIZATION: Check cache
        const cacheKey = getCacheKey(message, responseMode, maxTokens);
        const cached = responseCache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log('Cache hit!');
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ 
                    reply: cached.reply,
                    cached: true,
                    responseTime: Date.now() - startTime
                })
            };
        }

        // ULTRA-OPTIMIZATION: Request deduplication
        if (pendingRequests.has(cacheKey)) {
            console.log('Waiting for pending request...');
            try {
                const result = await pendingRequests.get(cacheKey);
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(result)
                };
            } catch (error) {
                // Pending request failed, continue with new request
            }
        }

        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        if (!DEEPSEEK_API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        // ULTRA-OPTIMIZATION: Dynamic token adjustment based on retry
        const adjustedTokens = Math.max(50, maxTokens - (retryCount * 50));
        
        // ULTRA-OPTIMIZATION: More aggressive history limiting
        const historyLimit = adjustedTokens > 200 ? 1 : 0;
        const messages = [
            { 
                role: "system", 
                content: systemPrompts[responseMode] || systemPrompts.balanced
            }
        ];
        
        if (historyLimit > 0 && conversationHistory.length > 0) {
            messages.push(...conversationHistory.slice(-historyLimit));
        }
        
        messages.push({ role: "user", content: message });

        // ULTRA-OPTIMIZATION: Timeout based on tokens and retry count
        const baseTimeout = isPreFetch ? 5000 : 8000;
        const timeoutMs = Math.max(5000, Math.min(15000, baseTimeout + (adjustedTokens * 8) - (retryCount * 2000)));
        
        console.log(`Adjusted: ${adjustedTokens} tokens, ${timeoutMs}ms timeout`);

        // Create promise for this request
        const requestPromise = (async () => {
            const controller = new AbortController();
            
            // Use native fetch with custom agent
            const fetchOptions = {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'deepseek-chat',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: adjustedTokens,
                    top_p: 0.9,
                    presence_penalty: 0.1,
                    frequency_penalty: 0.1,
                    stream: false
                }),
                signal: controller.signal,
                agent: agent // Use connection pooling
            };
            
            const timeoutId = setTimeout(() => {
                controller.abort();
            }, timeoutMs);

            try {
                const response = await fetch('https://api.deepseek.com/v1/chat/completions', fetchOptions);
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`API error: ${response.status}`);
                }
                
                const data = await response.json();
                const reply = data.choices?.[0]?.message?.content?.trim();
                
                if (!reply) {
                    throw new Error('No reply in response');
                }
                
                const result = {
                    reply,
                    tokenUsage: data.usage || null,
                    responseTime: Date.now() - startTime,
                    actualTokens: adjustedTokens
                };
                
                // Cache successful response
                responseCache.set(cacheKey, {
                    reply,
                    timestamp: Date.now()
                });
                
                // Clean cache if needed
                if (responseCache.size > MAX_CACHE_SIZE) {
                    const oldestKey = responseCache.keys().next().value;
                    responseCache.delete(oldestKey);
                }
                
                return result;
                
            } catch (error) {
                clearTimeout(timeoutId);
                throw error;
            }
        })();

        // Store pending request
        pendingRequests.set(cacheKey, requestPromise);
        
        try {
            const result = await requestPromise;
            pendingRequests.delete(cacheKey);
            
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(result)
            };
            
        } catch (error) {
            pendingRequests.delete(cacheKey);
            throw error;
        }
        
    } catch (error) {
        console.error('Function error:', error);
        
        const responseTime = Date.now() - startTime;
        
        // ULTRA-OPTIMIZATION: Smart error responses
        let errorMessage = quickResponses.error_recovery[Math.floor(Math.random() * quickResponses.error_recovery.length)];
        let statusCode = 500;
        
        if (error.name === 'AbortError' || responseTime > 15000) {
            statusCode = 504;
            if (maxTokens > 200) {
                errorMessage = "the cosmic energies are taking too long to align. try level 1-3 for instant wisdom?";
            }
        } else if (error.message?.includes('fetch')) {
            statusCode = 502;
            errorMessage = "the astral connection faltered. let's try again with a shorter response?";
        }
        
        return {
            statusCode,
            headers,
            body: JSON.stringify({ 
                error: errorMessage,
                suggest_shorter: maxTokens > 200,
                responseTime
            })
        };
    }
};