exports.handler = async (event, context) => {
    // Handle preflight requests
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            },
            body: ''
        };
    }

    if (event.httpMethod !== 'GET') {
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
        // Imgur API Client ID - you'll need to set this as an environment variable
        const clientId = process.env.IMGUR_CLIENT_ID;
        if (!clientId) {
            console.error('IMGUR_CLIENT_ID not set');
            return {
                statusCode: 500,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Imgur API not configured' })
            };
        }

        // Search for wizard memes on Imgur
        const searchQuery = 'wizard meme';
        const response = await fetch(`https://api.imgur.com/3/gallery/search?q=${encodeURIComponent(searchQuery)}&sort=viral&window=all&page=0`, {
            headers: {
                'Authorization': `Client-ID ${clientId}`
            }
        });

        if (!response.ok) {
            console.error(`Imgur API error: ${response.status}`);
            return {
                statusCode: 502,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ error: 'Failed to fetch memes from the mystical archives' })
            };
        }

        const data = await response.json();
        
        // Filter for images only and get valid URLs
        const validMemes = data.data
            .filter(item => 
                item.images && 
                item.images.length > 0 && 
                item.images[0].type && 
                item.images[0].type.startsWith('image/') &&
                !item.nsfw
            )
            .map(item => ({
                id: item.id,
                title: item.title || 'Mystical Wizard Wisdom',
                url: item.images[0].link,
                thumbnail: item.images[0].link.replace(/\.(jpg|jpeg|png|gif)$/i, 'm.$1'), // Medium size thumbnail
                views: item.views || 0
            }))
            .slice(0, 20); // Limit to 20 memes for variety

        if (validMemes.length === 0) {
            // Fallback memes if search fails
            const fallbackMemes = [
                {
                    id: 'fallback1',
                    title: 'Ancient Wizard Wisdom',
                    url: 'https://i.imgur.com/placeholder1.jpg',
                    thumbnail: 'https://i.imgur.com/placeholder1m.jpg',
                    views: 1000
                },
                {
                    id: 'fallback2', 
                    title: 'Mystical Knowledge',
                    url: 'https://i.imgur.com/placeholder2.jpg',
                    thumbnail: 'https://i.imgur.com/placeholder2m.jpg',
                    views: 1500
                }
            ];
            
            return {
                statusCode: 200,
                headers: { 
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                body: JSON.stringify({ memes: fallbackMemes })
            };
        }

        return {
            statusCode: 200,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ memes: validMemes })
        };

    } catch (error) {
        console.error('Imgur meme fetch error:', error);
        return {
            statusCode: 500,
            headers: { 
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({ error: 'The mystical meme portal is temporarily closed' })
        };
    }
}; 