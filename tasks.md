# wizardCHAT Project Tasks

## Setup Tasks
- [x] Initialize git repository
- [x] Configure GitHub remote repository

## Development Tasks
- [ ] Review existing codebase structure
- [ ] Identify areas for improvement
- [ ] Ensure code stays modular, clean, and efficient
- [ ] Refactor any files larger than 500 lines

## Deployment Tasks
- [x] Push code to GitHub repository

## Future Enhancements
- [ ] TBD based on project requirements

## Phase 1: Initial Setup & UI

- [x] Create basic HTML structure for the chat interface.
- [x] Add ASCII wizard to the page.
- [x] Add microphone button (SVG) and text input area.
- [x] Style the page with an aurora background animation (purple, aqua, violet).
- [x] Apply Google Font "Dosis" (closest match to "doto" I could find, assuming "doto" was a typo, please correct me if I'm wrong).
- [x] Implement basic wizard animation placeholder (e.g., simple mouth movement).

## Phase 2: Core Chat Functionality

- [x] Set up environment variables for API keys (`FAL_API_KEY`, `DEEPSEEK_API_KEY`). (User confirmed .env creation)
- [x] Implement JavaScript to capture text input and send to backend.
- [x] Integrate with DeepSeek API for chat responses.
- [x] Display wizard's responses on the page.
- [x] Implement wizard's whimsical personality and encoded language style (via system prompt).

## Phase 3: Voice Input & Output (Kokoro via FAL.AI)

- [x] Integrate FAL.AI SDK (client-side basic initialization).
- [x] Implement microphone button functionality to capture audio.
- [x] Send audio to FAL.AI (Kokoro) for speech-to-text (using `fal-ai/wizper` placeholder).
- [x] Use the transcribed text as input for the DeepSeek API.
- [ ] (Optional/Stretch) Send DeepSeek's text response to FAL.AI (Kokoro) for text-to-speech.
- [ ] Animate wizard when speaking (synchronized with audio output if TTS is used).

## Phase 4: Refinements & Enhancements

- [ ] Refine wizard animations.
- [ ] Enhance the whimsical personality and encoded language.
- [ ] Ensure the wizard's goal of analyzing the conversation and helping the listener awaken to their true potential is reflected in responses.
- [ ] Error handling and user feedback.
- [ ] Code cleanup and modularization.
- [ ] Testing.

## Notes:
- The Google font "Dosis" will be used. If "doto" is the correct font and available, we can switch.
- Wizard animation will start simple and be refined later.
- The primary goal is a text-based chat first, then voice integration. 