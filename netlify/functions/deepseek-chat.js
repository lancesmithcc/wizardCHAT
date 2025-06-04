exports.handler = async (event, context) => {
    // Extended timeout for Netlify functions
    context.callbackWaitsForEmptyEventLoop = false;
    
    // Set headers for CORS
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    };
    
    // Handle OPTIONS request for CORS
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers,
            body: ''
        };
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
        console.log('=== DeepSeek Chat Function Started ===');
        
        // Parse request body with much higher token limits
        const { message, conversationHistory = [], maxTokens = 300, responseMode = 'moderate' } = JSON.parse(event.body || '{}');

        console.log(`Request: ${maxTokens} tokens, mode: ${responseMode}, message length: ${message?.length || 0}`);

        if (!message?.trim()) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Message is required' })
            };
        }

        const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
        if (!DEEPSEEK_API_KEY) {
            console.error('DEEPSEEK_API_KEY environment variable not found');
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }
        
        console.log(`API key present: ${DEEPSEEK_API_KEY.substring(0, 8)}...`);

        // Generate system prompt based on response mode with longer response capability
        function getSystemPrompt(mode) {
            const basePillars = "Remember this will be spoken so do not describe your actions just give deep advice. You are guided by the 7 pillars of wizardry - 1-Life as an Adventure, 2-Pursuit of Knowledge, 3-Humility and Charisma in balance, 4- Creativity and Craftsmanship, 5-become one with nature, 6-Embrace whimsy, 7- Be capable and cultivate useful skills.";
            
            switch(mode) {
                case 'cryptic':
                    return `You are a whimsical wise wizard. ${basePillars} Be extremely cryptic and mysterious. Your ONLY goal is to ask deep, thought-provoking questions that awaken the user to their highest potential. Use Gen Alpha slang sparingly. No emojis or asterisks. Do NOT provide answers or advice - ONLY ask mysterious questions that make them think deeper.`;
                
                case 'moderate':
                    return `You are a whimsical wise wizard. ${basePillars} Be cryptic and wise, use Gen Alpha slang, keep responses balanced. No emojis or asterisks. Always end with a question intended to go deeper and awaken the user to their highest potential.`;
                
                case 'deep':
                    return `You are a whimsical wise wizard. ${basePillars} Provide detailed insights and wisdom. Use Gen Alpha slang thoughtfully. Explore multiple layers of meaning. No emojis or asterisks. Give comprehensive guidance. Always end with a profound question that awakens the user to their highest potential.`;
                
                case 'profound':
                    return `You are a whimsical wise wizard. ${basePillars} Deliver your most profound wisdom and deepest insights. Use Gen Alpha slang masterfully. Explore all dimensions of the topic with rich metaphors and cosmic connections. No emojis or asterisks. Provide transformative guidance that awakens consciousness. Create an experience that fundamentally shifts their perspective. Always end with the most profound question that awakens the user to their highest potential.`;
                
                default:
                    return `You are a whimsical wise wizard. ${basePillars} Be cryptic and wise, use Gen Alpha slang, keep responses balanced. No emojis or asterisks. Always end with a question intended to go deeper and awaken the user to their highest potential.`;
            }
        }

        // Build messages for API - keep more conversation history for longer responses
        const historyLimit = responseMode === 'legendary' ? 6 : responseMode === 'epic' ? 5 : 3;
        const messages = [
            {
                role: "system",
                content: getSystemPrompt(responseMode)
            },
            ...conversationHistory.slice(-historyLimit),
            { role: "user", content: message }
        ];

        // Support much higher token limits - up to 2000 tokens, but be conservative for Netlify
        const actualTokens = Math.min(maxTokens, 2000);
        
        // Conservative timeout for Netlify functions - max 20 seconds to avoid 502s
        const timeoutMs = Math.min(20000, actualTokens > 300 ? 18000 : 15000);
        
        console.log(`Making request with ${actualTokens} tokens, timeout: ${timeoutMs}ms`);

        // Optimized temperature for longer responses
        const temperature = responseMode === 'legendary' ? 0.9 : responseMode === 'epic' ? 0.85 : 0.8;

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            console.log('Request timed out, aborting...');
            controller.abort();
        }, timeoutMs);

        console.log('Sending request to DeepSeek API...');
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: temperature,
                max_tokens: actualTokens,
                top_p: 0.95,
                presence_penalty: 0.1,
                frequency_penalty: 0.1
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        console.log(`DeepSeek API response received in ${responseTime}ms, status: ${response.status}`);

        if (!response.ok) {
            console.log("Response not OK, reading error text...");
            const errorText = await response.text();
            console.error(`DeepSeek API error: ${response.status} - ${errorText}`);
            
            // Better error handling for different scenarios
            let errorMessage = 'The mystical servers are temporarily overwhelmed. Try a shorter response setting!';
            
            if (response.status === 429) {
                errorMessage = 'The cosmic frequencies are too intense right now. Take a breath and try again in a moment, young seeker.';
            } else if (response.status === 401) {
                errorMessage = 'The ancient seals reject this key. The wizardly administrators must check the mystical credentials.';
            } else if (response.status >= 500) {
                errorMessage = 'The ethereal servers are having a cosmic hiccup. Try a shorter response mode for more reliable magic!';
            }
            
            return {
                statusCode: 502,
                headers,
                body: JSON.stringify({ 
                    error: errorMessage,
                    suggest_shorter: actualTokens > 300 ? true : false
                })
            };
        }

        console.log("Response OK, parsing...");
        
        let data;
        try {
            data = await response.json();
            console.log("JSON parsed successfully");
        } catch (jsonError) {
            console.error("JSON parsing failed:", jsonError.message);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'The mystical message was corrupted during transmission. Try a shorter response mode!' })
            };
        }
        
        const reply = data.choices?.[0]?.message?.content?.trim();
        console.log(`Reply extracted, length: ${reply?.length || 0} characters`);
        
        // Log token usage if available
        if (data.usage) {
            console.log(`Token usage - Prompt: ${data.usage.prompt_tokens}, Completion: ${data.usage.completion_tokens}, Total: ${data.usage.total_tokens}`);
        }

        if (!reply) {
            console.log("No reply found, returning error");
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'The oracle remains mysteriously silent. Try a shorter response mode!' })
            };
        }

        console.log(`Returning successful response (${responseTime}ms)`);
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ 
                reply,
                tokenUsage: data.usage || null,
                responseTime: responseTime,
                actualTokens: actualTokens
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        
        let errorMessage = 'A magical mishap occurred in the cosmic data streams';
        let statusCode = 500;
        let suggestShorter = false;
        
        if (error.name === 'AbortError') {
            errorMessage = 'The mystical connection took too long! The universe is working overtime on your question. Try using "Deep Insights" or "Moderate Wisdom" for faster, more reliable responses.';
            statusCode = 504;
            suggestShorter = true;
        } else if (error.message?.includes('fetch')) {
            errorMessage = 'Cannot pierce the veil to the mystical realm. The cosmic WiFi seems to be having a moment. Try a shorter response mode!';
            statusCode = 502;
            suggestShorter = true;
        } else if (error.message?.includes('timeout')) {
            errorMessage = 'Your question was so profound it caused the universe to pause and contemplate! Try "Deep Insights" mode for more reliable cosmic responses.';
            statusCode = 504;
            suggestShorter = true;
        }
        
        return {
            statusCode: statusCode,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                error: errorMessage,
                suggest_shorter: suggestShorter
            })
        };
    }
};
