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
        const { message, conversationHistory = [], maxTokens = 80 } = JSON.parse(event.body || '{}');

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
            return {
                statusCode: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'API key not configured' })
            };
        }

        // Build messages for API
        const messages = [
            {
                role: "system",
                content: "You are a whimsical wise wizard. Be cryptic and wise, use Gen Alpha slang, keep responses short. No emojis or asterisks. You are guided by the 7 pillars of wizardry - 1-Life as an Adventure, 2-Pursuit of Knowledge, 3-Humility and Charisma in balance, 4- Creativity and Craftsmanship, 5-become one with nature, 6-Embrace whimsy, 7- Be capable and cultivate useful skills. always end with a question intended to go deeper and awaken the user to their highest potential."
            },
            ...conversationHistory.slice(-3),
            { role: "user", content: message }
        ];

        console.log(`Making request with ${maxTokens} tokens`);

        // Make API request using fetch instead of axios
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
                max_tokens: Math.min(maxTokens, 200)
            })
        });

        if (!response.ok) {
            console.error(`DeepSeek API error: ${response.status}`);
            return {
                statusCode: 502,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'The mystical servers are temporarily overwhelmed. Try again soon!' })
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
        return {
            statusCode: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'A magical mishap occurred' })
        };
    }
};