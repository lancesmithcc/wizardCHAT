const { fal } = require('@fal-ai/client');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const { text } = JSON.parse(event.body);
    
    if (!text) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Text is required for TTS' })
        };
    }
    
    const FAL_API_KEY = process.env.FAL_API_KEY;
    if (!FAL_API_KEY) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'FAL.AI API key not configured on server.' })
        };
    }

    // Configure FAL client
    fal.config({
        credentials: FAL_API_KEY
    });

    try {
        console.log('=== Starting TTS Request ===');
        console.log('Text to synthesize:', text);
        
        let result;
        try {
            result = await fal.subscribe('fal-ai/kokoro', {
                input: {
                    prompt: text,
                    voice: "am_santa",
                    speed: 1.0
                },
                logs: true
            });
            console.log('Kokoro TTS completed successfully');
        } catch (ttsError) {
            console.error('TTS API call failed:', ttsError);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: `TTS failed: ${ttsError.message}` })
            };
        }

        console.log('FAL TTS Response:', JSON.stringify(result, null, 2));

        if (result && result.audio && result.audio.url) {
            console.log('TTS successful, audio URL:', result.audio.url);
            return {
                statusCode: 200,
                body: JSON.stringify({ audioUrl: result.audio.url })
            };
        } else if (result && result.audio_url) {
            console.log('TTS successful, audio URL:', result.audio_url);
            return {
                statusCode: 200,
                body: JSON.stringify({ audioUrl: result.audio_url })
            };
        } else if (result && result.data && result.data.audio && result.data.audio.url) {
            console.log('TTS successful, audio URL:', result.data.audio.url);
            return {
                statusCode: 200,
                body: JSON.stringify({ audioUrl: result.data.audio.url })
            };
        } else if (result && result.data && result.data.audio_url) {
            console.log('TTS successful, audio URL:', result.data.audio_url);
            return {
                statusCode: 200,
                body: JSON.stringify({ audioUrl: result.data.audio_url })
            };
        } else {
            console.error('=== NO AUDIO URL FOUND ===');
            console.error('Full TTS result structure:', JSON.stringify(result, null, 2));
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Invalid TTS response structure' })
            };
        }
    } catch (error) {
        console.error('Error calling FAL.AI TTS:', error);
        if (error.response) {
            return {
                statusCode: error.response.status,
                body: JSON.stringify({ 
                    error: `TTS failed: ${error.response.data.error || error.message}` 
                })
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'TTS request failed' })
        };
    }
};