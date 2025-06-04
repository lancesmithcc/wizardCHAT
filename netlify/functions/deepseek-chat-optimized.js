exports.handler = async (event, context) => {
    // OPTIMIZATION: Don't wait for empty event loop
    context.callbackWaitsForEmptyEventLoop = false;
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
    
    // Handle OPTIONS quickly
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }
    
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            headers,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const startTime = Date.now();
        
        // Parse request with optimized defaults
        const { 
            message, 
            conversationHistory = [], 
            maxTokens = 200, 
            responseMode = 'moderate' 
        } = JSON.parse(event.body || '{}');

        console.log(`Request: ${maxTokens} tokens, mode: ${responseMode}`);

        if (!message?.trim()) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Message is required' })
            };
        }

        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        if (!DEEPSEEK_API_KEY) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        // OPTIMIZATION: Shorter, more focused prompts
        function getSystemPrompt(mode) {
            const base = "You are a wise wizard. Be cryptic, use Gen Alpha slang. No emojis/asterisks. End with a deep question.";
            
            switch(mode) {
                case 'cryptic':
                    return base + " ONLY ask mysterious questions, no advice.";
                case 'deep':
                    return base + " Give detailed insights with examples.";
                case 'profound':
                    return base + " Deliver profound wisdom with cosmic connections.";
                default:
                    return base + " Keep responses balanced.";
            }
        }

        // OPTIMIZATION: Limit conversation history more aggressively
        const historyLimit = maxTokens > 300 ? 2 : 1;
        const messages = [
            { role: "system", content: getSystemPrompt(responseMode) },
            ...conversationHistory.slice(-historyLimit),
            { role: "user", content: message }
        ];

        // OPTIMIZATION: Strict token limits
        const actualTokens = Math.min(maxTokens, 600);
        
        // OPTIMIZATION: Aggressive timeout based on Netlify limits
        const baseTimeout = 12000; // 12 seconds base
        const timeoutMs = Math.min(18000, baseTimeout + (actualTokens * 10));
        
        console.log(`Request config: ${actualTokens} tokens, ${timeoutMs}ms timeout`);

        // OPTIMIZATION: Single retry with quick timeout
        for (let attempt = 0; attempt < 2; attempt++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => {
                    console.log(`Attempt ${attempt + 1} timing out...`);
                    controller.abort();
                }, timeoutMs);

                const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model: 'deepseek-chat',
                        messages: messages,
                        temperature: 0.7,
                        max_tokens: actualTokens,
                        top_p: 0.9,
                        presence_penalty: 0.1,
                        frequency_penalty: 0.1,
                        // OPTIMIZATION: Add streaming hint for faster first token
                        stream: false
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                
                if (response.ok) {
                    const data = await response.json();
                    const reply = data.choices?.[0]?.message?.content?.trim();
                    
                    if (reply) {
                        const responseTime = Date.now() - startTime;
                        console.log(`Success in ${responseTime}ms`);
                        
                        return {
                            statusCode: 200,
                            headers,
                            body: JSON.stringify({ 
                                reply,
                                tokenUsage: data.usage || null,
                                responseTime,
                                actualTokens
                            })
                        };
                    }
                }
                
                // If not successful and it's the first attempt, retry
                if (attempt === 0) {
                    console.log(`Attempt ${attempt + 1} failed, retrying...`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    continue;
                }
                
                throw new Error(`API error: ${response.status}`);
                
            } catch (error) {
                if (error.name === 'AbortError' && attempt === 0) {
                    console.log('First attempt timed out, trying once more...');
                    continue;
                }
                throw error;
            }
        }
        
    } catch (error) {
        console.error('Function error:', error);
        
        // OPTIMIZATION: Quick error responses
        let errorMessage = 'The cosmic energies faltered! Try a shorter response level.';
        let statusCode = 500;
        
        if (error.name === 'AbortError') {
            errorMessage = 'Request timed out! Use Level 1-3 for reliable responses.';
            statusCode = 504;
        } else if (error.message?.includes('fetch')) {
            errorMessage = 'Connection failed! Try again with a shorter response.';
            statusCode = 502;
        }
        
        return {
            statusCode,
            headers,
            body: JSON.stringify({ 
                error: errorMessage,
                suggest_shorter: true
            })
        };
    }
};