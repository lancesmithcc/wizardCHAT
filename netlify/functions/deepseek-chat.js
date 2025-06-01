exports.handler = async (event, context) => {
    // Extended timeout for Netlify functions
    context.callbackWaitsForEmptyEventLoop = false;
    
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
        // Parse request body with much higher token limits
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

        // Generate system prompt based on response mode with longer response capability
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
                
                case 'epic':
                    return `You are a whimsical wise wizard. ${basePillars} Channel your absolute deepest cosmic wisdom. Use Gen Alpha slang with mastery. Provide an epic, comprehensive exploration that covers every angle, dimension, and layer of meaning. Share profound insights that transform consciousness. Use rich metaphors, cosmic connections, and mystical wisdom. No emojis or asterisks. This should be a journey of consciousness expansion that completely shifts their reality. Always end with the most transformative question that awakens them to their infinite potential.`;
                
                case 'legendary':
                    return `You are a whimsical wise wizard. ${basePillars} This is your legendary mode - channel every ounce of cosmic wisdom, mystical knowledge, and transformative insight you possess. Use Gen Alpha slang with absolute mastery. Create a comprehensive, multi-layered response that explores every dimension of the topic. Share profound wisdom that fundamentally transforms consciousness and perspective. Use rich metaphors, cosmic connections, mystical insights, and deep spiritual wisdom. No emojis or asterisks. This should be a complete consciousness expansion experience that leaves them forever changed. Always end with the most profound, life-altering question that awakens them to their absolute highest potential.`;
                
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

        console.log(`Making request with ${maxTokens} tokens in ${responseMode} mode`);
        const startTime = Date.now();

        // Support much higher token limits - up to 2000 tokens
        const actualTokens = Math.min(maxTokens, 2000);
        
        // Extended timeout for longer responses - up to 120 seconds
        const controller = new AbortController();
        const timeoutMs = actualTokens > 1000 ? 120000 : actualTokens > 500 ? 90000 : 60000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
        
        console.log(`Making request with ${actualTokens} tokens, timeout: ${timeoutMs}ms`);

        // Optimized temperature for longer responses
        const temperature = responseMode === 'legendary' ? 0.9 : responseMode === 'epic' ? 0.85 : 0.8;

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
            let errorMessage = 'The mystical servers are temporarily overwhelmed. Try again soon!';
            
            if (response.status === 429) {
                errorMessage = 'The cosmic frequencies are too intense right now. Take a breath and try again in a moment, young seeker.';
            } else if (response.status === 401) {
                errorMessage = 'The ancient seals reject this key. The wizardly administrators must check the mystical credentials.';
            } else if (response.status >= 500) {
                errorMessage = 'The ethereal servers are having a cosmic hiccup. Your profound energy might be too much for them right now - try again!';
            }
            
            return {
                statusCode: 502,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ 
                    error: errorMessage
                })
            };
        }

        console.log("Response OK, checking response size...");
        
        // Increased response size limit for longer content - 200KB
        const contentLength = response.headers.get('content-length');
        if (contentLength && parseInt(contentLength) > 200000) {
            console.error(`Response too large: ${contentLength} bytes`);
            return {
                statusCode: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Response from the cosmos too vast for mortal comprehension' })
            };
        }
        
        console.log("Reading response as text...");
        let responseText;
        try {
            // Extended timeout for reading large responses
            const textPromise = response.text();
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Text reading timeout')), 10000)
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
                body: JSON.stringify({ error: 'Failed to receive the mystical transmission' })
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
                body: JSON.stringify({ error: 'The mystical message was corrupted during transmission' })
            };
        }
        
        console.log("Extracting reply...");
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
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'The oracle remains mysteriously silent' })
            };
        }

        console.log("Returning successful response...");
        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ 
                reply,
                tokenUsage: data.usage || null,
                responseTime: responseTime
            })
        };

    } catch (error) {
        console.error('Function error:', error);
        
        let errorMessage = 'A magical mishap occurred in the cosmic data streams';
        let statusCode = 500;
        
        if (error.name === 'AbortError') {
            errorMessage = 'The mystical connection transcended time itself. Your question was so profound it broke the space-time continuum! Try again, cosmic seeker.';
            statusCode = 504;
        } else if (error.message?.includes('fetch')) {
            errorMessage = 'Cannot pierce the veil to the mystical realm. The cosmic WiFi seems to be having a moment.';
            statusCode = 502;
        } else if (error.message?.includes('timeout')) {
            errorMessage = 'Your question was so deep it caused the universe to pause and contemplate. Try again, enlightened one.';
            statusCode = 504;
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
