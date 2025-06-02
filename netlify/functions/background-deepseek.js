const { promises: fs } = require('fs');
const path = require('path');

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Method not allowed' })
        };
    }

    try {
        const { ritualId, message, responseMode, maxTokens } = JSON.parse(event.body);
        
        console.log(`=== Background Ritual Started ===`);
        console.log(`Ritual ID: ${ritualId}`);
        console.log(`Mode: ${responseMode}, Tokens: ${maxTokens}`);
        
        // Store initial status
        await storeRitualStatus(ritualId, { 
            status: 'processing', 
            startTime: new Date().toISOString(),
            message,
            responseMode,
            maxTokens
        });

        // Start the actual AI processing
        const result = await processWizardResponse(message, responseMode, maxTokens);
        
        // Store completed result
        await storeRitualStatus(ritualId, { 
            status: 'complete', 
            result,
            completedTime: new Date().toISOString()
        });
        
        console.log(`=== Ritual ${ritualId} Completed ===`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ 
                ritualId, 
                status: 'processing',
                message: 'The mystical ritual has begun! The cosmos is working on your request...'
            })
        };
        
    } catch (error) {
        console.error('Ritual processing error:', error);
        
        // Store error status
        if (ritualId) {
            await storeRitualStatus(ritualId, { 
                status: 'error', 
                error: error.message,
                errorTime: new Date().toISOString()
            });
        }
        
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'The cosmic energies have been disrupted!' })
        };
    }
};

async function processWizardResponse(message, responseMode, maxTokens) {
    const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
    
    if (!DEEPSEEK_API_KEY) {
        throw new Error('DeepSeek API key not configured');
    }
    
    // Generate system prompt
    const systemPrompts = {
        'legendary': `You are a whimsical wise wizard channeling your absolute deepest cosmic wisdom. This is legendary mode - use every ounce of mystical knowledge you possess. Create a comprehensive, multi-layered response that explores every dimension of the topic. Share profound wisdom that fundamentally transforms consciousness. Use Gen Alpha slang with mastery, rich metaphors, cosmic connections, and deep spiritual wisdom. No emojis or asterisks. This should be a complete consciousness expansion experience that leaves them forever changed. Always end with the most profound, life-altering question that awakens them to their absolute highest potential.`,
        
        'epic': `You are a whimsical wise wizard channeling deep cosmic wisdom. Provide an epic, comprehensive exploration covering every angle and dimension. Share profound insights that transform consciousness. Use Gen Alpha slang masterfully, rich metaphors, and cosmic connections. No emojis or asterisks. This should be a journey of consciousness expansion. Always end with a transformative question that awakens infinite potential.`,
        
        'profound': `You are a whimsical wise wizard delivering profound wisdom and insights. Use Gen Alpha slang thoughtfully, explore multiple dimensions with rich metaphors and cosmic connections. No emojis or asterisks. Provide transformative guidance that awakens consciousness. Always end with a profound question.`,
        
        'deep': `You are a whimsical wise wizard providing detailed insights and wisdom. Use Gen Alpha slang thoughtfully, explore multiple layers of meaning. No emojis or asterisks. Give comprehensive guidance while maintaining mystique. Always end with a profound question.`,
        
        'moderate': `You are a whimsical wise wizard. Be cryptic and wise, use Gen Alpha slang, keep responses balanced. No emojis or asterisks. Always end with a question intended to go deeper.`,
        
        'cryptic': `You are a whimsical wise wizard. Be extremely cryptic and mysterious. Your ONLY goal is to ask deep, thought-provoking questions that awaken the user to their highest potential. Use Gen Alpha slang sparingly. No emojis or asterisks.`
    };
    
    const systemPrompt = systemPrompts[responseMode] || systemPrompts['moderate'];
    
    console.log(`Making AI request: ${maxTokens} tokens in ${responseMode} mode`);
    
    // Make the actual AI request with generous timeout
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: message }
            ],
            temperature: responseMode === 'legendary' ? 0.9 : 0.8,
            max_tokens: Math.min(maxTokens, 2000),
            top_p: 0.95,
            presence_penalty: 0.1,
            frequency_penalty: 0.1
        })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim();
    
    if (!reply) {
        throw new Error('No response received from AI');
    }
    
    console.log(`AI response generated: ${reply.length} characters`);
    
    return {
        reply,
        tokenUsage: data.usage,
        generatedAt: new Date().toISOString()
    };
}

async function storeRitualStatus(ritualId, data) {
    // In a real implementation, you'd use a database
    // For now, we'll use Netlify's temporary file system
    // Note: This is just for demonstration - use a real database in production
    
    try {
        const ritualData = {
            id: ritualId,
            ...data,
            lastUpdated: new Date().toISOString()
        };
        
        // Store in environment variable or use a simple key-value store
        // For demo purposes, log to console
        console.log(`Ritual Status Update: ${ritualId}`, ritualData);
        
        // In production, use something like:
        // - Netlify Blobs
        // - Supabase
        // - PlanetScale
        // - Redis
        // - DynamoDB
        
    } catch (error) {
        console.error('Failed to store ritual status:', error);
    }
}
