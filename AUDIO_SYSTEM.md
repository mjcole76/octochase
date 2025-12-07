# 🎵 Music Playlist & Sound Effects System

## New Features Added

**Music Playlist:** 5 different background music tracks to choose from  
**Sound Effect Styles:** 4 different sound effect styles  
**Audio Settings Menu:** Complete control over all audio settings  
**Auto-Save:** All preferences saved to localStorage

---

## 🎵 Music Tracks

### **1. 🌊 Ambient Ocean (Default)**
- **Vibe:** Calm underwater atmosphere
- **Tempo:** Slow, relaxing
- **Best For:** Casual gameplay, learning the game
- **Characteristics:** Deep bass, gentle waves, peaceful

### **2. ⚡ Energetic Waves**
- **Vibe:** Upbeat and fast-paced
- **Tempo:** Fast, exciting
- **Best For:** Intense gameplay, high scores
- **Characteristics:** Higher frequencies, faster modulation, energizing

### **3. 🧘 Peaceful Depths**
- **Vibe:** Very relaxing and slow
- **Tempo:** Very slow, meditative
- **Best For:** Zen mode, relaxation
- **Characteristics:** Ultra-low frequencies, minimal movement, tranquil

### **4. 🔥 Deep Pressure**
- **Vibe:** Dramatic and tense
- **Tempo:** Medium, intense
- **Best For:** Survival mode, challenging gameplay
- **Characteristics:** Low rumbling, dramatic tones, suspenseful

### **5. 🌌 Mysterious Abyss**
- **Vibe:** Eerie and otherworldly
- **Tempo:** Slow-medium, mysterious
- **Best For:** Exploration, mysterious atmosphere
- **Characteristics:** Unusual frequencies, ethereal sounds, enigmatic

---

## 🔊 Sound Effect Styles

### **1. Classic (Default)**
- **Description:** Standard game sounds
- **Characteristics:** Balanced, clear, familiar
- **Best For:** Traditional gaming experience

### **2. Retro**
- **Description:** 8-bit style sounds
- **Characteristics:** Nostalgic, arcade-like, pixelated
- **Best For:** Retro gaming fans

### **3. Modern**
- **Description:** Crisp digital sounds
- **Characteristics:** Sharp, clean, contemporary
- **Best For:** Modern gaming aesthetic

### **4. Minimal**
- **Description:** Subtle, quiet sounds
- **Characteristics:** Soft, unobtrusive, gentle
- **Best For:** Focus on music, less distraction

---

## 🎛️ Audio Settings Menu

### **How to Access:**
1. From main menu, click **"Audio"** button (green, with 🎵 icon)
2. Settings menu opens with all audio controls

### **Available Controls:**

#### **Master Volume**
- **Range:** 0% - 100%
- **Step:** 5%
- **Function:** Controls overall volume
- **Includes:** Mute/Unmute button

#### **Music Volume**
- **Range:** 0% - 100%
- **Step:** 5%
- **Function:** Controls background music only
- **Independent:** Can adjust separately from SFX

#### **SFX Volume**
- **Range:** 0% - 100%
- **Step:** 5%
- **Function:** Controls sound effects only
- **Independent:** Can adjust separately from music

#### **Music Track Selection**
- **Options:** 5 tracks (see above)
- **Preview:** Changes apply immediately
- **Visual:** Shows emoji, name, and description

#### **Sound Effect Style**
- **Options:** 4 styles (see above)
- **Dropdown:** Easy selection
- **Instant:** Changes apply to next sound

---

## 🎮 How to Use

### **Change Music Track:**
```
1. Click "Audio" button on main menu
2. Scroll to "Background Music" section
3. Click on any music track card
4. Music changes immediately
5. Close menu - settings saved!
```

### **Adjust Volumes:**
```
1. Open Audio Settings
2. Drag sliders for:
   - Master Volume (overall)
   - Music Volume (background music)
   - SFX Volume (sound effects)
3. Changes apply in real-time
4. Close menu - settings saved!
```

### **Change Sound Effects:**
```
1. Open Audio Settings
2. Go to "Sound Effects" section
3. Click dropdown menu
4. Select style (Classic/Retro/Modern/Minimal)
5. Next sound will use new style
```

### **Mute/Unmute:**
```
Option 1: In-game mute button (🔊/🔇)
Option 2: Audio Settings "Mute" button
Option 3: Set Master Volume to 0%
```

---

## 💾 Auto-Save Feature

**All settings are automatically saved to localStorage:**
- ✅ Music track selection
- ✅ Sound effect style
- ✅ Master volume
- ✅ Music volume
- ✅ SFX volume
- ✅ Mute state

**Your preferences persist:**
- Across browser sessions
- After page refresh
- Until you change them

---

## 🎯 Use Cases

### **Relaxing Session:**
```
Music: 🧘 Peaceful Depths
SFX: Minimal
Music Volume: 60%
SFX Volume: 30%
```

### **Intense Gameplay:**
```
Music: ⚡ Energetic Waves
SFX: Modern
Music Volume: 50%
SFX Volume: 80%
```

### **Focus Mode:**
```
Music: 🌊 Ambient Ocean
SFX: Minimal
Music Volume: 40%
SFX Volume: 20%
```

### **Retro Experience:**
```
Music: 🌌 Mysterious Abyss
SFX: Retro
Music Volume: 60%
SFX Volume: 70%
```

### **Silent Mode:**
```
Mute: ON
(or all volumes to 0%)
```

---

## 🔧 Technical Details

### **Music Implementation:**
- **Technology:** Web Audio API
- **Method:** Procedural generation with oscillators
- **Layers:** 3 ambient layers per track
- **Modulation:** LFO (Low Frequency Oscillator) for movement
- **Performance:** Lightweight, no audio files needed

### **Sound Effects:**
- **Technology:** Web Audio API oscillators
- **Types:** Sine, sawtooth, square, triangle waves
- **Customization:** Frequency, gain, duration
- **Styles:** Different parameters per style

### **Storage:**
- **Method:** localStorage
- **Key:** `octosprint_audio_settings`
- **Format:** JSON
- **Size:** ~200 bytes

---

## 🎨 UI Design

### **Audio Button (Main Menu):**
- **Color:** Green border/text
- **Icon:** 🎵 Music note
- **Position:** Between "Customize" and "Progress"
- **Hover:** Green background

### **Settings Dialog:**
- **Header:** Headphones icon + title
- **Sections:** Master, Music, Sound Effects
- **Style:** Card-based, clean layout
- **Responsive:** Works on all screen sizes

### **Music Track Cards:**
- **Layout:** Full-width buttons
- **Content:** Emoji + Name + Description
- **Active State:** Blue border + background
- **Indicator:** ⚡ icon when selected

---

## 📊 Sound Effects List

**Sounds in the game:**
- **Collect:** Food collection (rising tone)
- **Dash:** Jet dash activation (swoosh)
- **Hit:** Taking damage (impact)
- **Powerup:** Collecting power-up (ascending notes)
- **Bubble:** Ink cloud activation (bubble pop)
- **Combo:** Combo multiplier increase (chime)

**Each sound has 4 style variations!**

---

## 💡 Tips & Tricks

### **Finding Your Perfect Mix:**
1. Start with default settings
2. Try each music track
3. Adjust music volume to preference
4. Test sound effects in-game
5. Fine-tune SFX volume
6. Save and enjoy!

### **Performance Optimization:**
- Lower volumes = less CPU usage
- Mute when not needed
- Minimal SFX = quieter gameplay

### **Mood Matching:**
- **Morning:** Peaceful Depths
- **Afternoon:** Ambient Ocean
- **Evening:** Mysterious Abyss
- **Night:** Deep Pressure
- **Party:** Energetic Waves

---

## 🎵 Music Track Comparison

| Track | Tempo | Intensity | Mood | Best Mode |
|-------|-------|-----------|------|-----------|
| Ambient Ocean | Slow | Low | Calm | Classic, Zen |
| Energetic Waves | Fast | High | Exciting | Time Attack, Speed Run |
| Peaceful Depths | Very Slow | Very Low | Tranquil | Zen |
| Deep Pressure | Medium | High | Tense | Survival, Endless |
| Mysterious Abyss | Slow-Med | Medium | Eerie | Challenge, Puzzle |

---

## 🔊 Volume Recommendations

### **Balanced (Default):**
- Master: 70%
- Music: 40%
- SFX: 60%

### **Music Focus:**
- Master: 80%
- Music: 70%
- SFX: 30%

### **Gameplay Focus:**
- Master: 70%
- Music: 30%
- SFX: 80%

### **Quiet:**
- Master: 40%
- Music: 30%
- SFX: 40%

---

## ✅ Summary

**What You Get:**
- 🎵 **5 unique music tracks** with different vibes
- 🔊 **4 sound effect styles** for customization
- 🎛️ **Complete volume control** (master, music, SFX)
- 💾 **Auto-save** preferences
- 🎨 **Beautiful UI** for easy control
- ⚡ **Instant changes** - no restart needed

**How to Access:**
1. Click **"Audio"** button on main menu (green)
2. Choose your music track
3. Select sound effect style
4. Adjust volumes
5. Close and play!

**Your settings are saved automatically!**

---

**Refresh your browser and click the "Audio" button to customize your experience!** 🎵🎮✨
