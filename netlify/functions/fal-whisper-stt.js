const { fal } = require('@fal-ai/client');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    const { audioData } = JSON.parse(event.body);
    
    if (!audioData) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Audio data is required for STT' })
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
        console.log('=== Starting STT Request ===');
        console.log('Received audio data length:', audioData.length);
        console.log('Audio data prefix:', audioData.substring(0, 100));
        
        let audioBuffer;
        if (audioData.startsWith('data:')) {
            console.log('Converting data URL to buffer...');
            const base64Data = audioData.split(',')[1];
            audioBuffer = Buffer.from(base64Data, 'base64');
            console.log('Converted to buffer, size:', audioBuffer.length, 'bytes');
        } else {
            console.error('Invalid audio data format - not a data URL');
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid audio data format' })
            };
        }

        console.log('Uploading audio buffer to FAL storage...');
        let uploadedFile;
        try {
            uploadedFile = await fal.storage.upload(audioBuffer, 'audio.webm');
            console.log('Successfully uploaded to FAL storage:', uploadedFile);
        } catch (uploadError) {
            console.error('Failed to upload to FAL storage:', uploadError);
            return {
                statusCode: 500,
                body: JSON.stringify({ error: `File upload failed: ${uploadError.message}` })
            };
        }

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
            return {
                statusCode: 500,
                body: JSON.stringify({ error: `Transcription failed: ${transcriptionError.message}` })
            };
        }

        console.log('FAL STT Response:', JSON.stringify(result, null, 2));
        
        if (result && result.text) {
            console.log('Found transcript in result.text');
            return {
                statusCode: 200,
                body: JSON.stringify({ transcript: result.text })
            };
        } else if (result && result.data && result.data.text) {
            console.log('Found transcript in result.data.text');
            return {
                statusCode: 200,
                body: JSON.stringify({ transcript: result.data.text })
            };
        } else if (result && result.transcript) {
            console.log('Found transcript in result.transcript');
            return {
                statusCode: 200,
                body: JSON.stringify({ transcript: result.transcript })
            };
        } else if (result && result.data && result.data.transcript) {
            console.log('Found transcript in result.data.transcript');
            return {
                statusCode: 200,
                body: JSON.stringify({ transcript: result.data.transcript })
            };
        } else {
            console.error('=== NO TRANSCRIPT FOUND ===');
            console.error('Full result structure:', JSON.stringify(result, null, 2));
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'Invalid STT response structure' })
            };
        }
    } catch (error) {
        console.error('=== GENERAL ERROR ===');
        console.error('Error type:', error.constructor.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        if (error.response) {
            console.error('FAL Error Response:', error.response.data);
            return {
                statusCode: error.response.status,
                body: JSON.stringify({ 
                    error: `STT failed: ${error.response.data.detail || error.response.data.error || error.message}` 
                })
            };
        }
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `STT request failed: ${error.message}` })
        };
    }
};