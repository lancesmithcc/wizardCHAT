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

        // Make API request with timeout - longer for profound mode
        const controller = new AbortController();
        const timeoutMs = responseMode === 'profound' ? 45000 : 30000; // 45s for profound, 30s for others
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages: messages,
                temperature: 0.9,
                max_tokens: Math.min(maxTokens, 1000) // Allow up to 1000 tokens for profound mode
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;
        console.log(`DeepSeek API response received in ${responseTime}ms, status: ${response.status}`);

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