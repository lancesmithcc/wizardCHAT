const axios = require('axios');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const { message } = JSON.parse(event.body);

    if (!message) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Message is required' })
        };
    }

    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    if (!DEEPSEEK_API_KEY) {
        console.error('DeepSeek API key is not configured on the server.');
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'DeepSeek API key not configured on server. Contact the server mage.' })
        };
    }

    try {
        console.log(`Calling DeepSeek with message: "${message}"`);
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: "system",
                    content: "You are a whimsical wise wizard with a ripping sense of humour. Your goal is to analyze the conversation and help the listener awaken to their true potential, wisdom and truth. Speak in a magical, mysterious, and encoded language. Your responses should be relatively short and cryptic, inviting further reflection rather than providing direct answers. Use alliteration and colourful metaphors. do not describe your actions just give deep advice. use gen alpha slang but be wise and deep. no Asterisks and no emojis, keep in mind this will be spoken out loud. after you answer, suggest how we can go deeper, ask a question."
                },
                { role: "user", content: message }
            ],
            temperature: 0.9,
            max_tokens: 170,
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message) {
            const wizardResponse = response.data.choices[0].message.content;
            console.log(`DeepSeek Response: "${wizardResponse}"`);
            return {
                statusCode: 200,
                body: JSON.stringify({ reply: wizardResponse.trim() })
            };
        } else {
            console.error('Unexpected response structure from DeepSeek:', response.data);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'The mystic energies returned an unexpected vision (Invalid DeepSeek response structure)' })
            };
        }

    } catch (error) {
        console.error('Error calling DeepSeek API:');
        if (error.response) {
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            if (error.response.status === 401) {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ error: 'The ancient seals reject this key (Invalid DeepSeek API Key or Quota Exceeded).' })
                };
            }
            return {
                statusCode: error.response.status,
                body: JSON.stringify({ error: `The astral plane reports an anomaly: ${error.response.data.error ? error.response.data.error.message : error.message}` })
            };
        } else if (error.request) {
            console.error('Request:', error.request);
            return {
                statusCode: 503,
                body: JSON.stringify({ error: 'The carrier pigeons seem to have lost their way (No response from DeepSeek)' })
            };
        } else {
            console.error('Error message:', error.message);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'A magical mishap occurred before the spell could be cast (DeepSeek request setup failed)' })
            };
        }
    }
};