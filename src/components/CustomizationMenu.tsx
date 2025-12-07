import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Slider } from './ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Palette, Fish, Settings, Sparkles, Crown, X } from 'lucide-react';
import { useCustomization } from '../hooks/useCustomization';
// Types are used in component props/state, keeping import for future use

interface CustomizationMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CustomizationMenu({ isOpen, onClose }: CustomizationMenuProps) {
  const {
    customization,
    updateOctopusCustomization,
    updateEnvironmentCustomization,
    updateUICustomization,
    applyPreset,
    resetToDefault,
    getAvailablePresets,
    isSaving,
  } = useCustomization();

  const [activeTab, setActiveTab] = useState('octopus');
  const availablePresets = getAvailablePresets();

  if (!isOpen) return null;

  const colorOptions = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffd93d',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
    '#a55eea', '#26de81', '#fd79a8', '#fdcb6e', '#6c5ce7'
  ];

  const ColorPicker = ({ 
    value, 
    onChange, 
    label 
  }: { 
    value: string; 
    onChange: (color: string) => void; 
    label: string; 
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex flex-wrap gap-2">
        {colorOptions.map((color) => (
          <button
            key={color}
            className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${
              value === color ? 'border-white scale-110' : 'border-gray-300'
            }`}
            style={{ backgroundColor: color }}
            onClick={() => onChange(color)}
          />
        ))}
      </div>
      <div className="flex items-center space-x-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded border cursor-pointer"
        />
        <span className="text-xs text-gray-600 font-mono">{value}</span>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center space-x-2">
            <Palette className="h-6 w-6 text-blue-500" />
            <div className="flex flex-col">
              <CardTitle>Customization</CardTitle>
              {customization.selectedPresetId && (
                <span className="text-xs text-muted-foreground">
                  Based on: {availablePresets.find(p => p.id === customization.selectedPresetId)?.name || 'Custom'}
                </span>
              )}
            </div>
            {isSaving && <Badge variant="outline">Saving...</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="overflow-y-auto max-h-[calc(90vh-8rem)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="presets" className="flex items-center space-x-1">
                <Sparkles className="h-4 w-4" />
                <span>Presets</span>
              </TabsTrigger>
              <TabsTrigger value="octopus" className="flex items-center space-x-1">
                <Fish className="h-4 w-4" />
                <span>Octopus</span>
              </TabsTrigger>
              <TabsTrigger value="environment" className="flex items-center space-x-1">
                <Palette className="h-4 w-4" />
                <span>Environment</span>
              </TabsTrigger>
              <TabsTrigger value="ui" className="flex items-center space-x-1">
                <Settings className="h-4 w-4" />
                <span>Interface</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="presets" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availablePresets.map((preset) => (
                  <Card 
                    key={preset.id} 
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      customization.selectedPresetId === preset.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => applyPreset(preset)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{preset.name}</h3>
                        {preset.isPremium && <Crown className="h-4 w-4 text-yellow-500" />}
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: preset.octopus.bodyColor }}
                        />
                        <div 
                          className="w-4 h-4 rounded-full border border-gray-300"
                          style={{ backgroundColor: preset.environment.backgroundColor }}
                        />
                        <Badge variant="secondary" className="text-xs">
                          {preset.octopus.pattern}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <Separator />
              <div className="flex justify-center">
                <Button variant="outline" onClick={resetToDefault}>
                  Reset to Default
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="octopus" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <ColorPicker
                    label="Body Color"
                    value={customization.octopus.bodyColor}
                    onChange={(color) => updateOctopusCustomization({ bodyColor: color })}
                  />
                  
                  <ColorPicker
                    label="Tentacle Color"
                    value={customization.octopus.tentacleColor}
                    onChange={(color) => updateOctopusCustomization({ tentacleColor: color })}
                  />
                  
                  <ColorPicker
                    label="Eye Color"
                    value={customization.octopus.eyeColor}
                    onChange={(color) => updateOctopusCustomization({ eyeColor: color })}
                  />
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Pattern</Label>
                    <Select
                      value={customization.octopus.pattern}
                      onValueChange={(value: any) => updateOctopusCustomization({ pattern: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="solid">Solid</SelectItem>
                        <SelectItem value="stripes">Stripes</SelectItem>
                        <SelectItem value="spots">Spots</SelectItem>
                        <SelectItem value="gradient">Gradient</SelectItem>
                        <SelectItem value="galaxy">Galaxy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {customization.octopus.pattern !== 'solid' && (
                    <ColorPicker
                      label="Pattern Color"
                      value={customization.octopus.patternColor || '#ffffff'}
                      onChange={(color) => updateOctopusCustomization({ patternColor: color })}
                    />
                  )}

                  <div className="space-y-2">
                    <Label>Size</Label>
                    <Select
                      value={customization.octopus.size}
                      onValueChange={(value: any) => updateOctopusCustomization({ size: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="small">Small</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="large">Large</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Accessory</Label>
                    <Select
                      value={customization.octopus.accessory}
                      onValueChange={(value: any) => updateOctopusCustomization({ accessory: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="hat">Hat</SelectItem>
                        <SelectItem value="crown">Crown</SelectItem>
                        <SelectItem value="sunglasses">Sunglasses</SelectItem>
                        <SelectItem value="bowtie">Bow Tie</SelectItem>
                        <SelectItem value="cape">Cape</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Glow Effect</Label>
                    <Switch
                      checked={customization.octopus.glowEffect}
                      onCheckedChange={(checked) => updateOctopusCustomization({ glowEffect: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Trail Effect</Label>
                    <Select
                      value={customization.octopus.trailEffect}
                      onValueChange={(value: any) => updateOctopusCustomization({ trailEffect: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="bubbles">Bubbles</SelectItem>
                        <SelectItem value="sparkles">Sparkles</SelectItem>
                        <SelectItem value="rainbow">Rainbow</SelectItem>
                        <SelectItem value="ink">Ink</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="environment" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select
                      value={customization.environment.theme}
                      onValueChange={(value: any) => updateEnvironmentCustomization({ theme: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ocean">Ocean</SelectItem>
                        <SelectItem value="deep_sea">Deep Sea</SelectItem>
                        <SelectItem value="coral_reef">Coral Reef</SelectItem>
                        <SelectItem value="arctic">Arctic</SelectItem>
                        <SelectItem value="tropical">Tropical</SelectItem>
                        <SelectItem value="void">Void</SelectItem>
                        <SelectItem value="neon">Neon</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <ColorPicker
                    label="Background Color"
                    value={customization.environment.backgroundColor}
                    onChange={(color) => updateEnvironmentCustomization({ backgroundColor: color })}
                  />

                  <div className="space-y-2">
                    <Label>Lighting</Label>
                    <Select
                      value={customization.environment.lighting}
                      onValueChange={(value: any) => updateEnvironmentCustomization({ lighting: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bright">Bright</SelectItem>
                        <SelectItem value="dim">Dim</SelectItem>
                        <SelectItem value="dramatic">Dramatic</SelectItem>
                        <SelectItem value="colorful">Colorful</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Background Elements</Label>
                    <Select
                      value={customization.environment.backgroundElements}
                      onValueChange={(value: any) => updateEnvironmentCustomization({ backgroundElements: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="minimal">Minimal</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="rich">Rich</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Particle Effects</Label>
                    <Switch
                      checked={customization.environment.particleEffects}
                      onCheckedChange={(checked) => updateEnvironmentCustomization({ particleEffects: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Weather Effects</Label>
                    <Switch
                      checked={customization.environment.weatherEffects}
                      onCheckedChange={(checked) => updateEnvironmentCustomization({ weatherEffects: checked })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ui" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <ColorPicker
                    label="HUD Color"
                    value={customization.ui.hudColor}
                    onChange={(color) => updateUICustomization({ hudColor: color })}
                  />

                  <div className="space-y-2">
                    <Label>HUD Opacity</Label>
                    <Slider
                      value={[customization.ui.hudOpacity * 100]}
                      onValueChange={([value]) => updateUICustomization({ hudOpacity: value / 100 })}
                      min={10}
                      max={100}
                      step={10}
                      className="w-full"
                    />
                    <div className="text-xs text-gray-500">{Math.round(customization.ui.hudOpacity * 100)}%</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Score Style</Label>
                    <Select
                      value={customization.ui.scoreStyle}
                      onValueChange={(value: any) => updateUICustomization({ scoreStyle: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="classic">Classic</SelectItem>
                        <SelectItem value="modern">Modern</SelectItem>
                        <SelectItem value="neon">Neon</SelectItem>
                        <SelectItem value="minimal">Minimal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Button Style</Label>
                    <Select
                      value={customization.ui.buttonStyle}
                      onValueChange={(value: any) => updateUICustomization({ buttonStyle: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="rounded">Rounded</SelectItem>
                        <SelectItem value="square">Square</SelectItem>
                        <SelectItem value="glass">Glass</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <Label>Animations</Label>
                    <Switch
                      checked={customization.ui.animations}
                      onCheckedChange={(checked) => updateUICustomization({ animations: checked })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}