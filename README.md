# WizardCHAT

A magical AI chat interface featuring speech-to-text, text-to-speech, and whimsical wizard interactions.

## Features

- 🧙‍♂️ **Whimsical Wizard AI** - Powered by DeepSeek with mystical personality
- 🎤 **Speech-to-Text** - Record your voice with Whisper via fal.ai
- 🔊 **Text-to-Speech** - Hear the wizard's responses with Kokoro TTS (Santa voice)
- ✨ **Magical UI** - Aurora colors, floating stars, and heartbeat animations
- ⌨️ **Typing Effect** - Wizard responses appear with typewriter animation
- 📱 **Responsive Design** - Works on desktop and mobile

## Live Demo

Visit the live application at: [https://www.wizardchat.lancesmith.cc](https://www.wizardchat.lancesmith.cc)

## Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express.js
- **AI Services**: 
  - DeepSeek API for chat responses
  - fal.ai Whisper for speech-to-text
  - fal.ai Kokoro for text-to-speech
- **Styling**: Custom CSS with aurora animations and floating stars

## Environment Variables

Create a `.env` file with:

```
DEEPSEEK_API_KEY=your_deepseek_api_key
FAL_API_KEY=your_fal_api_key
PORT=3001
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/lancesmithcc/wizardCHAT.git
cd wizardCHAT
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see above)

4. Start the server:
```bash
npm start
```

## Development

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon

## API Endpoints

- `GET /` - Serve the main application
- `POST /api/deepseek-chat` - Send message to wizard
- `POST /api/fal-whisper-stt` - Speech-to-text conversion
- `POST /api/fal-kokoro-tts` - Text-to-speech generation

## Features in Detail

### Voice Interaction
- Click the microphone button to start recording
- Speak your message (up to 30 seconds)
- Audio is automatically transcribed and sent to the wizard
- Wizard responds with both text and voice

### Visual Effects
- Aurora color animations throughout the interface
- Floating stars background with gentle movement
- Heartbeat animations when wizard is speaking
- Typewriter effect for wizard responses
- Responsive design with subtle rotations and effects

### AI Personality
The wizard is configured to be:
- Whimsical and wise
- Mysterious and encoded in language
- Uses alliteration and colorful metaphors
- Provides cryptic responses that invite reflection

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - see LICENSE file for details