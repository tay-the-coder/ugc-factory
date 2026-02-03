/**
 * ElevenLabs API Client
 * Text-to-speech for UGC voiceovers
 */

const API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE_URL = 'https://api.elevenlabs.io/v1';

/**
 * Get available voices
 */
export async function getVoices() {
  const response = await fetch(`${BASE_URL}/voices`, {
    headers: { 'xi-api-key': API_KEY }
  });

  if (!response.ok) {
    throw new Error(`ElevenLabs API error: ${response.status}`);
  }

  const data = await response.json();
  return data.voices.map(v => ({
    id: v.voice_id,
    name: v.name,
    category: v.category,
    labels: v.labels,
    previewUrl: v.preview_url
  }));
}

/**
 * Generate speech from text
 */
export async function textToSpeech(text, options = {}) {
  const {
    voiceId = '21m00Tcm4TlvDq8ikWAM', // Rachel - default natural voice
    modelId = 'eleven_multilingual_v2',
    stability = 0.5,
    similarityBoost = 0.75,
    style = 0.0,
    speakerBoost = true
  } = options;

  const response = await fetch(`${BASE_URL}/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: modelId,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
        style,
        use_speaker_boost: speakerBoost
      }
    })
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail?.message || `ElevenLabs API error: ${response.status}`);
  }

  // Return audio as buffer
  const audioBuffer = await response.arrayBuffer();
  return {
    success: true,
    audio: Buffer.from(audioBuffer),
    contentType: 'audio/mpeg'
  };
}

/**
 * Generate speech and return as base64
 */
export async function textToSpeechBase64(text, options = {}) {
  const result = await textToSpeech(text, options);
  if (result.success) {
    return {
      success: true,
      audioBase64: result.audio.toString('base64'),
      contentType: result.contentType
    };
  }
  return result;
}

/**
 * Estimate speech duration (rough calculation)
 * Average speaking rate: ~150 words per minute
 */
export function estimateDuration(text) {
  const wordCount = text.split(/\s+/).length;
  const minutes = wordCount / 150;
  return Math.ceil(minutes * 60); // seconds
}

/**
 * Check if text fits within duration
 */
export function fitsInDuration(text, maxSeconds) {
  return estimateDuration(text) <= maxSeconds;
}

export default { 
  getVoices, 
  textToSpeech, 
  textToSpeechBase64, 
  estimateDuration,
  fitsInDuration
};
