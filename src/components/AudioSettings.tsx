import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { Music, Volume2, VolumeX, Headphones, Zap, X } from 'lucide-react';
import type { MusicTrack, SoundEffectStyle } from '../hooks/use-audio';

interface AudioSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    masterVolume: number;
    musicVolume: number;
    sfxVolume: number;
    muted: boolean;
    selectedTrack: MusicTrack;
    soundEffectStyle: SoundEffectStyle;
  };
  onUpdateSettings: (settings: any) => void;
  onChangeMusicTrack: (track: MusicTrack) => void;
  onChangeSoundEffectStyle: (style: SoundEffectStyle) => void;
  onToggleMute: () => void;
}

const MUSIC_TRACKS: { id: MusicTrack; name: string; description: string; emoji: string; category: string }[] = [
  // Ambient Tracks
  { id: 'ambient', name: 'Ambient Ocean', description: 'Calm underwater atmosphere', emoji: '🌊', category: 'Ambient' },
  { id: 'calm', name: 'Peaceful Depths', description: 'Very relaxing and slow', emoji: '🧘', category: 'Ambient' },
  { id: 'mysterious', name: 'Mysterious Abyss', description: 'Eerie and otherworldly', emoji: '🌌', category: 'Ambient' },
  
  // Action Tracks
  { id: 'energetic', name: 'Energetic Waves', description: 'Upbeat and fast-paced', emoji: '⚡', category: 'Action' },
  { id: 'intense', name: 'Deep Pressure', description: 'Dramatic and tense', emoji: '🔥', category: 'Action' },
  
  // Battle Tracks
  { id: 'battle', name: 'Battle Surge', description: 'Aggressive combat music', emoji: '⚔️', category: 'Battle' },
  { id: 'epic', name: 'Epic Quest', description: 'Grand heroic theme', emoji: '🛡️', category: 'Battle' },
  { id: 'mission', name: 'Mission Critical', description: 'Tactical and focused', emoji: '🎯', category: 'Battle' },
  { id: 'boss_fight', name: 'Boss Battle', description: 'Intense boss encounter', emoji: '👹', category: 'Battle' },
  { id: 'victory', name: 'Victory March', description: 'Triumphant celebration', emoji: '🏆', category: 'Battle' },
];

const SOUND_EFFECT_STYLES: { id: SoundEffectStyle; name: string; description: string }[] = [
  { id: 'classic', name: 'Classic', description: 'Standard game sounds' },
  { id: 'retro', name: 'Retro', description: '8-bit style sounds' },
  { id: 'modern', name: 'Modern', description: 'Crisp digital sounds' },
  { id: 'minimal', name: 'Minimal', description: 'Subtle, quiet sounds' },
];

export function AudioSettings({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onChangeMusicTrack,
  onChangeSoundEffectStyle,
  onToggleMute,
}: AudioSettingsProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center space-x-2">
            <Headphones className="h-6 w-6 text-blue-500" />
            <div>
              <CardTitle>Audio Settings</CardTitle>
              <CardDescription>Customize your music and sound effects</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Master Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-lg font-semibold flex items-center gap-2">
                {settings.muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                Master Volume
              </Label>
              <Button
                variant={settings.muted ? 'destructive' : 'outline'}
                size="sm"
                onClick={onToggleMute}
              >
                {settings.muted ? 'Unmute' : 'Mute'}
              </Button>
            </div>
            <Slider
              value={[settings.masterVolume * 100]}
              onValueChange={([value]) => onUpdateSettings({ masterVolume: value / 100 })}
              min={0}
              max={100}
              step={5}
              disabled={settings.muted}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-right">
              {Math.round(settings.masterVolume * 100)}%
            </div>
          </div>

          {/* Music Settings */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-lg font-semibold flex items-center gap-2">
              <Music className="h-5 w-5" />
              Background Music
            </Label>

            <div className="space-y-4">
              <Label className="text-sm">Music Track</Label>
              
              {/* Ambient Tracks */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">🌊 AMBIENT</div>
                <div className="grid grid-cols-1 gap-2">
                  {MUSIC_TRACKS.filter(t => t.category === 'Ambient').map((track) => (
                    <button
                      key={track.id}
                      onClick={() => onChangeMusicTrack(track.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        settings.selectedTrack === track.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{track.emoji}</span>
                        <div className="flex-1">
                          <div className="font-semibold">{track.name}</div>
                          <div className="text-xs text-muted-foreground">{track.description}</div>
                        </div>
                        {settings.selectedTrack === track.id && (
                          <Zap className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Tracks */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">⚡ ACTION</div>
                <div className="grid grid-cols-1 gap-2">
                  {MUSIC_TRACKS.filter(t => t.category === 'Action').map((track) => (
                    <button
                      key={track.id}
                      onClick={() => onChangeMusicTrack(track.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        settings.selectedTrack === track.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{track.emoji}</span>
                        <div className="flex-1">
                          <div className="font-semibold">{track.name}</div>
                          <div className="text-xs text-muted-foreground">{track.description}</div>
                        </div>
                        {settings.selectedTrack === track.id && (
                          <Zap className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Battle Tracks */}
              <div>
                <div className="text-xs font-semibold text-muted-foreground mb-2">⚔️ BATTLE</div>
                <div className="grid grid-cols-1 gap-2">
                  {MUSIC_TRACKS.filter(t => t.category === 'Battle').map((track) => (
                    <button
                      key={track.id}
                      onClick={() => onChangeMusicTrack(track.id)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        settings.selectedTrack === track.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{track.emoji}</span>
                        <div className="flex-1">
                          <div className="font-semibold">{track.name}</div>
                          <div className="text-xs text-muted-foreground">{track.description}</div>
                        </div>
                        {settings.selectedTrack === track.id && (
                          <Zap className="h-4 w-4 text-blue-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Music Volume</Label>
              <Slider
                value={[settings.musicVolume * 100]}
                onValueChange={([value]) => onUpdateSettings({ musicVolume: value / 100 })}
                min={0}
                max={100}
                step={5}
                disabled={settings.muted}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-right">
                {Math.round(settings.musicVolume * 100)}%
              </div>
            </div>
          </div>

          {/* Sound Effects Settings */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Sound Effects
            </Label>

            <div className="space-y-2">
              <Label className="text-sm">Sound Style</Label>
              <Select
                value={settings.soundEffectStyle}
                onValueChange={(value: SoundEffectStyle) => onChangeSoundEffectStyle(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOUND_EFFECT_STYLES.map((style) => (
                    <SelectItem key={style.id} value={style.id}>
                      <div>
                        <div className="font-semibold">{style.name}</div>
                        <div className="text-xs text-muted-foreground">{style.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">SFX Volume</Label>
              <Slider
                value={[settings.sfxVolume * 100]}
                onValueChange={([value]) => onUpdateSettings({ sfxVolume: value / 100 })}
                min={0}
                max={100}
                step={5}
                disabled={settings.muted}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-right">
                {Math.round(settings.sfxVolume * 100)}%
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg text-sm">
            <p className="font-semibold mb-2">💡 Tips:</p>
            <ul className="space-y-1 text-muted-foreground">
              <li>• Music changes take effect immediately</li>
              <li>• Try different tracks for different moods</li>
              <li>• Sound effects enhance gameplay feedback</li>
              <li>• All settings are saved automatically</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
