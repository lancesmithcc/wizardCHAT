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
        const { message, conversationHistory = [], maxTokens = 300, responseMode = 'moderate' } = JSON.parse(event.body || '{}');

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

        // Use very conservative token limits to avoid timeouts
        const actualTokens = Math.min(maxTokens, 400); // Max 400 tokens to avoid any issues
        
        // Simple timeout - 25 seconds
        const controller = new AbortController();
        const timeoutMs = 25000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        console.log(`Making simple request with ${actualTokens} tokens, timeout: ${timeoutMs}ms`);

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.8,
                max_tokens: actualTokens
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
            
            return {
                statusCode: 502,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: 'The mystical servers are temporarily overwhelmed. Try again soon!'
                })
            };
        }

        console.log("Response OK, checking response size...");
        
        // Check response size first
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 50000) { // 50KB limit
            console.error(`Response too large: ${contentLength} bytes`);
            return {
                statusCode: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Response too large' })
            };
        }
        
        console.log("Reading response as text first...");
        let responseText;
        try {
            const textPromise = response.text();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Text reading timeout')), 3000)
            );
            
            responseText = await Promise.race([textPromise, timeoutPromise]);
            console.log(`Response text length: ${responseText.length}`);
            console.log(`Response text preview: ${responseText.substring(0, 200)}...`);
        } catch (textError) {
            console.error("Text reading failed:", textError);
            return {
                statusCode: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Failed to read API response' })
            };
        }
        
        console.log("Parsing text as JSON...");
        let data;
        try {
            data = JSON.parse(responseText);
            console.log("JSON parsed successfully");
        } catch (jsonError) {
            console.error("JSON parsing failed:", jsonError.message);
            console.log("Raw response that failed to parse:", responseText.substring(0, 500));
            return {
                statusCode: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Failed to parse API response as JSON' })
            };
        }
        
        console.log("Extracting reply...");
        const reply = data.choices?.[0]?.message?.content?.trim();
        console.log(`Reply extracted, length: ${reply?.length || 0}`);

        if (!reply) {
            console.log("No reply found, returning error");
            return {
                statusCode: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'No response from the mystical realm' })
            };
        }

        console.log("Returning successful response...");
        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ reply })
        };

    } catch (error) {
        console.error('Function error:', error);
        
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