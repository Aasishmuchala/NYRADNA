export interface SoundtrackOption {
  id: string;
  name: string;
  description: string;
  mood: string;
  previewUrl: string | null;
  durationSeconds: number;
}

export const SOUNDTRACKS: SoundtrackOption[] = [
  {
    id: 'none',
    name: 'No Music',
    description: 'Video audio only',
    mood: '',
    previewUrl: null,
    durationSeconds: 0,
  },
  {
    id: 'energetic',
    name: 'High Energy',
    description: 'Upbeat electronic, driving rhythm',
    mood: 'energetic',
    // Royalty-free placeholder — replace with your own hosted audio
    previewUrl: '/audio/energetic.mp3',
    durationSeconds: 120,
  },
  {
    id: 'cinematic',
    name: 'Cinematic Orchestra',
    description: 'Epic orchestral swells, film score feel',
    mood: 'cinematic',
    previewUrl: '/audio/cinematic.mp3',
    durationSeconds: 180,
  },
  {
    id: 'lofi',
    name: 'Lo-Fi Chill',
    description: 'Relaxed lo-fi hip hop, mellow vibes',
    mood: 'chill',
    previewUrl: '/audio/lofi.mp3',
    durationSeconds: 150,
  },
  {
    id: 'dramatic',
    name: 'Dramatic Tension',
    description: 'Dark, suspenseful underscore',
    mood: 'tense',
    previewUrl: '/audio/dramatic.mp3',
    durationSeconds: 120,
  },
  {
    id: 'ambient',
    name: 'Ambient Minimal',
    description: 'Ethereal pads, atmospheric textures',
    mood: 'ambient',
    previewUrl: '/audio/ambient.mp3',
    durationSeconds: 180,
  },
];

/**
 * Returns the soundtrack option matching the given id, or the 'none' option.
 */
export function getSoundtrack(id: string): SoundtrackOption {
  return SOUNDTRACKS.find((s) => s.id === id) ?? SOUNDTRACKS[0];
}
