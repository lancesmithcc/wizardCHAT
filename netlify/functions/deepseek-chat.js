exports.handler = async (event, context) => {
    // Simple CORS and method check
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        // Parse request body
        const { message, conversationHistory = [], maxTokens = 300, responseMode = 'moderate', isChunk = false, chunkNumber = 1 } = JSON.parse(event.body || '{}');

        if (!message?.trim()) {
            return {
                statusCode: 400,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Message is required' })
            };
        }

        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        if (!DEEPSEEK_API_KEY) {
            console.error('DEEPSEEK_API_KEY environment variable not found');
            return {
                statusCode: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }
        
        console.log(`API key present: ${DEEPSEEK_API_KEY.substring(0, 8)}...`);

        // Generate system prompt based on response mode
        function getSystemPrompt(mode) {
            const basePillars = "Remember this will be spoken so do not describe your actions just give deep advice. You are guided by the 7 pillars of wizardry - 1-Life as an Adventure, 2-Pursuit of Knowledge, 3-Humility and Charisma in balance, 4- Creativity and Craftsmanship, 5-become one with nature, 6-Embrace whimsy, 7- Be capable and cultivate useful skills.";
            
            switch(mode) {
                case 'cryptic':
                    return `You are a whimsical wise wizard. ${basePillars} Be extremely cryptic and mysterious. Your ONLY goal is to ask deep, thought-provoking questions that awaken the user to their highest potential. Use Gen Alpha slang sparingly. No emojis or asterisks. Do NOT provide answers or advice - ONLY ask mysterious questions that make them think deeper.`;
                
                case 'moderate':
                    return `You are a whimsical wise wizard. ${basePillars} Be cryptic and wise, use Gen Alpha slang, keep responses balanced. No emojis or asterisks. Always end with a question intended to go deeper and awaken the user to their highest potential.`;
                
                case 'deep':
                    return `You are a whimsical wise wizard. ${basePillars} Provide detailed insights and wisdom. Use Gen Alpha slang thoughtfully. Explore multiple layers of meaning. No emojis or asterisks. Give comprehensive guidance while maintaining mystique. Always end with a profound question that awakens the user to their highest potential.`;
                
                case 'profound':
                    return `You are a whimsical wise wizard. ${basePillars} Deliver your most profound wisdom and deepest insights. Use Gen Alpha slang masterfully. Explore all dimensions of the topic with rich metaphors and cosmic connections. No emojis or asterisks. Provide transformative guidance that awakens consciousness. Create an experience that fundamentally shifts their perspective. Always end with the most profound question that awakens the user to their highest potential.`;
                
                default:
                    return `You are a whimsical wise wizard. ${basePillars} Be cryptic and wise, use Gen Alpha slang, keep responses balanced. No emojis or asterisks. Always end with a question intended to go deeper and awaken the user to their highest potential.`;
            }
        }

        // Build messages for API
        const messages = [
            {
                role: "system",
                content: getSystemPrompt(responseMode)
            },
            ...conversationHistory.slice(-3),
            { role: "user", content: message }
        ];

        console.log(`Making request with ${maxTokens} tokens in ${responseMode} mode`);
        const startTime = Date.now();

        // Use conservative token limits for initial chunk to avoid timeouts
        let actualTokens = maxTokens;
        if (responseMode === 'profound' && !isChunk) {
            actualTokens = Math.min(maxTokens, 600); // Start with 600 tokens for profound
        } else if (responseMode === 'deep' && !isChunk) {
            actualTokens = Math.min(maxTokens, 500); // Start with 500 tokens for deep
        }
        
        // Shorter timeouts for chunked approach
        const controller = new AbortController();
        let timeoutMs;
        switch(responseMode) {
            case 'cryptic': timeoutMs = 25000; break;    // 25s for cryptic
            case 'moderate': timeoutMs = 30000; break;   // 30s for moderate  
            case 'deep': timeoutMs = 35000; break;       // 35s for deep
            case 'profound': timeoutMs = 40000; break;   // 40s for profound
            default: timeoutMs = 30000;
        }
        console.log(`Setting timeout to ${timeoutMs}ms for ${responseMode} mode, tokens: ${actualTokens}`);
        
        // Retry logic with exponential backoff
        let response;
        let lastError;
        const maxRetries = 3;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            const controller = new AbortController();
            const attemptTimeout = timeoutMs + (attempt - 1) * 15000; // Add 15s per retry
            const timeoutId = setTimeout(() => controller.abort(), attemptTimeout);
            
            try {
                console.log(`Attempt ${attempt}/${maxRetries} with ${attemptTimeout}ms timeout`);
                
                response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: messages,
                        temperature: 0.85, // Slightly lower for more consistent responses
                        max_tokens: actualTokens, // Use conservative token limit
                        stream: false, // Ensure we get complete response
                        top_p: 0.95, // Add top_p for better quality
                        frequency_penalty: 0.1, // Slight penalty to reduce repetition
                        presence_penalty: 0.1 // Encourage variety in responses
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                const responseTime = Date.now() - startTime;
                console.log(`DeepSeek API response received in ${responseTime}ms, status: ${response.status}, attempt: ${attempt}`);
                
                // If successful or non-retryable error, break out of retry loop
                if (response.ok || (response.status < 500 && response.status !== 429)) {
                    break;
                }
                
                lastError = new Error(`HTTP ${response.status}`);
                
            } catch (error) {
                clearTimeout(timeoutId);
                lastError = error;
                console.log(`Attempt ${attempt} failed:`, error.message);
                
                // If this is the last attempt, don't wait
                if (attempt < maxRetries) {
                    const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff, max 10s
                    console.log(`Waiting ${waitTime}ms before retry ${attempt + 1}`);
                    await new Promise(resolve => setTimeout(resolve, waitTime));
                }
            }
        }

        // If all retries failed and we don't have a response, throw the last error
        if (!response) {
            throw lastError || new Error('All retry attempts failed');
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`DeepSeek API error: ${response.status} - ${errorText}`);
            
            // Return different status codes based on the API error
            const statusCode = response.status >= 500 ? 502 : response.status;
            
            return {
                statusCode: statusCode,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: response.status === 429 
                        ? 'The mystical realm is busy. Please wait a moment and try again.'
                        : response.status >= 500 
                        ? 'The mystical servers are temporarily overwhelmed. Try again soon!'
                        : 'A disturbance in the mystical forces occurred. Please try again.'
                })
            };
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content?.trim();
        const finishReason = data.choices?.[0]?.finish_reason;
        const usage = data.usage;

        if (!reply) {
            return {
                statusCode: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'No response from the mystical realm' })
            };
        }

        // Check if response was truncated due to token limit
        const wasTruncated = finishReason === 'length';
        const tokensUsed = usage?.completion_tokens || 0;
        const shouldContinue = wasTruncated && tokensUsed >= (actualTokens * 0.9); // If used 90% of tokens and truncated
        
        console.log(`Response: ${tokensUsed} tokens, finish_reason: ${finishReason}, truncated: ${wasTruncated}, should_continue: ${shouldContinue}`);

        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                reply,
                wasTruncated,
                shouldContinue,
                tokensUsed,
                requestedTokens: actualTokens,
                maxTokens,
                chunkNumber
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        
        // Handle different types of errors
        let errorMessage = 'A magical mishap occurred';
        let statusCode = 500;
        
        if (error.name === 'AbortError') {
            errorMessage = 'The mystical connection timed out. Please try again.';
            statusCode = 504;
        } else if (error.message?.includes('fetch')) {
            errorMessage = 'Cannot reach the mystical realm. Please check your connection.';
            statusCode = 502;
        }
        
        return {
            statusCode: statusCode,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: errorMessage })
        };
    }
};