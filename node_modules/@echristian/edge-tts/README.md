# Edge TTS

> A TypeScript library for generating speech using Microsoft Edge's text-to-speech API

Generate speech from text using Microsoft Edge's text-to-speech service. This library provides access to Edge's TTS capabilities with subtitle generation support and voice customization options.

## Installation

```bash
npm install @echristian/edge-tts
```

## Usage

```typescript
import { synthesize, synthesizeStream } from "@echristian/edge-tts";

// Basic usage with synthesize()
const { audio, subtitle } = await synthesize({
  text: "Hello, world!",
});

// Stream processing usage
const generator = synthesizeStream({ text: "Hello world" });
for await (const chunk of generator) {
  // chunk is a Uint8Array of raw audio data
  // Process or save each chunk as needed
}

// Collecting all streamed chunks
const chunks: Uint8Array[] = [];
for await (const chunk of synthesizeStream({ text: "Hello world" })) {
  chunks.push(chunk);
}
```

## API

### synthesize(options): Promise<GenerateResult>

Main function to generate speech from text.

### synthesizeStream(options): AsyncGenerator<Uint8Array>

Creates an async generator that yields chunks of processed audio data. Each chunk has metadata headers automatically removed.

Uses the same options as `synthesize()`, but without subtitle support:

| Option       | Type   | Default                           | Description               |
| ------------ | ------ | --------------------------------- | ------------------------- |
| text         | string | (required)                        | Text to convert to speech |
| voice        | string | "en-US-AvaNeural"                 | Voice ID to use           |
| language     | string | "en-US"                           | Language code             |
| outputFormat | string | "audio-24khz-96kbitrate-mono-mp3" | Audio format              |
| rate         | string | "default"                         | Speaking rate             |
| pitch        | string | "default"                         | Voice pitch               |
| volume       | string | "default"                         | Audio volume              |

For detailed configuration options, refer to Microsoft's documentation:

- [Available voices and language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts)
- [Audio output formats](https://learn.microsoft.com/en-us/dotnet/api/microsoft.cognitiveservices.speech.speechsynthesisoutputformat?view=azure-dotnet)
- [Pitch, rate, and volumes](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/speech-synthesis-markup-voice)

Note: Some options may be limited by Microsoft Edge's service capabilities.

#### GenerateOptions

| Option       | Type            | Default                              | Description               |
| ------------ | --------------- | ------------------------------------ | ------------------------- |
| text         | string          | (required)                           | Text to convert to speech |
| voice        | string          | "en-US-AvaNeural"                    | Voice ID to use           |
| language     | string          | "en-US"                              | Language code             |
| outputFormat | string          | "audio-24khz-96kbitrate-mono-mp3"    | Audio format              |
| rate         | string          | "default"                            | Speaking rate             |
| pitch        | string          | "default"                            | Voice pitch               |
| volume       | string          | "default"                            | Audio volume              |
| subtitle     | SubtitleOptions | { splitBy: "word", wordsPerCue: 10 } | Subtitle options          |

#### SubtitleOptions

| Option         | Type                 | Default | Description                          |
| -------------- | -------------------- | ------- | ------------------------------------ |
| splitBy        | "word" \| "duration" | "word"  | How to split subtitles               |
| wordsPerCue    | number               | 10      | Words per subtitle when using 'word' |
| durationPerCue | number               | 5000    | Duration (ms) when using 'duration'  |

#### GenerateResult

| Property | Type                  | Description          |
| -------- | --------------------- | -------------------- |
| audio    | Blob                  | Generated audio data |
| subtitle | Array<SubtitleResult> | Generated subtitles  |

#### SubtitleResult

| Property | Type   | Description     |
| -------- | ------ | --------------- |
| text     | string | Subtitle text   |
| start    | number | Start time (ms) |
| end      | number | End time (ms)   |
| duration | number | Duration (ms)   |
