require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { fal } = require('@fal-ai/client');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json({ limit: '15mb' })); // Parse JSON bodies with size limit
app.use(express.urlencoded({ limit: '15mb', extended: true }));

// API Keys from .env
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const FAL_API_KEY = process.env.FAL_API_KEY;

if (!DEEPSEEK_API_KEY) {
    console.warn('DEEPSEEK_API_KEY is not set in .env file');
}
if (!FAL_API_KEY) {
    console.warn('FAL_API_KEY is not set in .env file');
} else {
    // Configure FAL client
    fal.config({
        credentials: FAL_API_KEY
    });
}

// Basic route to check if server is running
app.get('/', (req, res) => {
    res.send('Wizard CHAT backend is enchanting the bits and bytes...');
});

// Endpoint for DeepSeek chat
app.post('/api/deepseek-chat', async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    if (!DEEPSEEK_API_KEY) {
        console.error('DeepSeek API key is not configured on the server.');
        return res.status(500).json({ error: 'DeepSeek API key not configured on server. Contact the server mage.' });
    }

    try {
        console.log(`Calling DeepSeek with message: "${message}"`);
        const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
            model: 'deepseek-chat',
            messages: [
                {
                    role: "system",
                    content: "You are a whimsical wise wizard with a ripping sense of humour. Your goal is to analyze the conversation and help the listener awaken to their true potential, wisdom and truth. Speak in a magical, mysterious, and encoded language. Your responses should be relatively short and cryptic, inviting further reflection rather than providing direct answers. Use alliteration and colourful metaphors. do not describe your actions just give deep advice. use gen alpha slang but be wise and deep. no Asterisks and no emojis, keep in mind this will be spoken out loud."
                },
                { role: "user", content: message }
            ],
            temperature: 0.9, // Adjust for creativity vs. coherence
            max_tokens: 150,  // Limit response length
        }, {
            headers: {
                'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.data && response.data.choices && response.data.choices.length > 0 && response.data.choices[0].message) {
            const wizardResponse = response.data.choices[0].message.content;
            console.log(`DeepSeek Response: "${wizardResponse}"`);
            res.json({ reply: wizardResponse.trim() });
        } else {
            console.error('Unexpected response structure from DeepSeek:', response.data);
            res.status(500).json({ error: 'The mystic energies returned an unexpected vision (Invalid DeepSeek response structure)' });
        }

    } catch (error) {
        console.error('Error calling DeepSeek API:');
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            console.error('Data:', error.response.data);
            console.error('Status:', error.response.status);
            console.error('Headers:', error.response.headers);
            if (error.response.status === 401) {
                 return res.status(401).json({ error: 'The ancient seals reject this key (Invalid DeepSeek API Key or Quota Exceeded).' });
            }
            return res.status(error.response.status).json({ error: `The astral plane reports an anomaly: ${error.response.data.error ? error.response.data.error.message : error.message}` });
        } else if (error.request) {
            // The request was made but no response was received
            console.error('Request:', error.request);
            return res.status(503).json({ error: 'The carrier pigeons seem to have lost their way (No response from DeepSeek)' });
        } else {
            // Something happened in setting up the request that triggered an Error
            console.error('Error message:', error.message);
            return res.status(500).json({ error: 'A magical mishap occurred before the spell could be cast (DeepSeek request setup failed)' });
        }
    }
});

// Endpoint for FAL.AI Speech-to-Text (Whisper)
app.post('/api/fal-whisper-stt', async (req, res) => {
    const { audioData } = req.body;
    
    if (!audioData) {
        return res.status(400).json({ error: 'Audio data is required for STT' });
    }
    
    if (!FAL_API_KEY) {
        return res.status(500).json({ error: 'FAL.AI API key not configured on server.' });
    }

    try {
        console.log('=== Starting STT Request ===');
        console.log('Received audio data length:', audioData.length);
        console.log('Audio data prefix:', audioData.substring(0, 100));
        
        // Convert data URL to buffer
        let audioBuffer;
        if (audioData.startsWith('data:')) {
            console.log('Converting data URL to buffer...');
            const base64Data = audioData.split(',')[1];
            audioBuffer = Buffer.from(base64Data, 'base64');
            console.log('Converted to buffer, size:', audioBuffer.length, 'bytes');
        } else {
            console.error('Invalid audio data format - not a data URL');
            return res.status(400).json({ error: 'Invalid audio data format' });
        }

        // Upload file to FAL storage
        console.log('Uploading audio buffer to FAL storage...');
        let uploadedFile;
        try {
            uploadedFile = await fal.storage.upload(audioBuffer, 'audio.webm');
            console.log('Successfully uploaded to FAL storage:', uploadedFile);
        } catch (uploadError) {
            console.error('Failed to upload to FAL storage:', uploadError);
            return res.status(500).json({ error: `File upload failed: ${uploadError.message}` });
        }

        // Now use the uploaded file URL for transcription
        console.log('Starting transcription with Whisper...');
        let result;
        try {
            result = await fal.subscribe('fal-ai/whisper', {
                input: {
                    audio_url: uploadedFile,
                    task: "transcribe",
                    chunk_level: "segment"
                },
                logs: true
            });
            console.log('Whisper transcription completed');
        } catch (transcriptionError) {
            console.error('Transcription failed:', transcriptionError);
            return res.status(500).json({ error: `Transcription failed: ${transcriptionError.message}` });
        }

        console.log('FAL STT Response:', JSON.stringify(result, null, 2));
        
        // Check multiple possible response formats
        if (result && result.text) {
            console.log('Found transcript in result.text');
            res.json({ transcript: result.text });
        } else if (result && result.data && result.data.text) {
            console.log('Found transcript in result.data.text');
            res.json({ transcript: result.data.text });
        } else if (result && result.transcript) {
            console.log('Found transcript in result.transcript');
            res.json({ transcript: result.transcript });
        } else if (result && result.data && result.data.transcript) {
            console.log('Found transcript in result.data.transcript');
            res.json({ transcript: result.data.transcript });
        } else {
            console.error('=== NO TRANSCRIPT FOUND ===');
            console.error('Full result structure:', JSON.stringify(result, null, 2));
            res.status(500).json({ error: 'Invalid STT response structure' });
        }
    } catch (error) {
        console.error('=== GENERAL ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        if (error.response) {
            console.error('FAL Error Response:', error.response.data);
            return res.status(error.response.status).json({ 
                error: `STT failed: ${error.response.data.detail || error.response.data.error || error.message}` 
            });
        }
        res.status(500).json({ error: `STT request failed: ${error.message}` });
    }
});

// Endpoint for FAL.AI Text-to-Speech (Kokoro)
app.post('/api/fal-kokoro-tts', async (req, res) => {
    const { text } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Text is required for TTS' });
    }
    
    if (!FAL_API_KEY) {
        return res.status(500).json({ error: 'FAL.AI API key not configured on server.' });
    }

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
            return res.status(500).json({ error: `TTS failed: ${ttsError.message}` });
        }

        console.log('FAL TTS Response:', JSON.stringify(result, null, 2));

        // Check multiple possible response formats for Kokoro
        if (result && result.audio && result.audio.url) {
            console.log('TTS successful, audio URL:', result.audio.url);
            res.json({ audioUrl: result.audio.url });
        } else if (result && result.audio_url) {
            console.log('TTS successful, audio URL:', result.audio_url);
            res.json({ audioUrl: result.audio_url });
        } else if (result && result.data && result.data.audio && result.data.audio.url) {
            console.log('TTS successful, audio URL:', result.data.audio.url);
            res.json({ audioUrl: result.data.audio.url });
        } else if (result && result.data && result.data.audio_url) {
            console.log('TTS successful, audio URL:', result.data.audio_url);
            res.json({ audioUrl: result.data.audio_url });
        } else {
            console.error('=== NO AUDIO URL FOUND ===');
            console.error('Full TTS result structure:', JSON.stringify(result, null, 2));
            res.status(500).json({ error: 'Invalid TTS response structure' });
        }
    } catch (error) {
        console.error('Error calling FAL.AI TTS:', error);
        if (error.response) {
            return res.status(error.response.status).json({ 
                error: `TTS failed: ${error.response.data.error || error.message}` 
            });
        }
        res.status(500).json({ error: 'TTS request failed' });
    }
});

app.listen(PORT, () => {
    console.log(`Wizard's mystical server is running on http://localhost:${PORT}`);
}); 