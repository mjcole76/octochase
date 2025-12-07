import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { 
  UserCustomization, 
  UserCustomizationUpdate,
  OctopusCustomization, 
  EnvironmentCustomization, 
  UICustomization,
  CustomizationPreset
} from '../types/customization';

import {
  DEFAULT_OCTOPUS_CUSTOMIZATION,
  DEFAULT_ENVIRONMENT_CUSTOMIZATION,
  DEFAULT_UI_CUSTOMIZATION,
  CUSTOMIZATION_PRESETS
} from '../types/customization';

const STORAGE_KEY = 'octosprint_customization';

export function useCustomization() {
  const { user } = useAuth();
  const [customization, setCustomization] = useState<UserCustomization>({
    octopus: DEFAULT_OCTOPUS_CUSTOMIZATION,
    environment: DEFAULT_ENVIRONMENT_CUSTOMIZATION,
    ui: DEFAULT_UI_CUSTOMIZATION,
    lastModified: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load customization from local storage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setCustomization(prev => ({
          ...prev,
          ...parsed,
          lastModified: parsed.lastModified || new Date().toISOString(),
        }));
      } catch (error) {
        console.error('Failed to parse stored customization:', error);
      }
    }
  }, []);

  // Load user customization from Supabase when user logs in
  useEffect(() => {
    if (user) {
      loadUserCustomization();
    }
  }, [user]);

  const loadUserCustomization = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_customizations')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const userCustomization: UserCustomization = {
          userId: user.id,
          octopus: data.octopus_customization,
          environment: data.environment_customization,
          ui: data.ui_customization,
          selectedPresetId: data.selected_preset_id,
          lastModified: data.last_modified,
        };
        setCustomization(userCustomization);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userCustomization));
      }
    } catch (error) {
      console.error('Failed to load user customization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomization = useCallback(async (newCustomization: UserCustomizationUpdate) => {
    const updatedCustomization: UserCustomization = {
      userId: user?.id,
      octopus: newCustomization.octopus ? { ...customization.octopus, ...newCustomization.octopus } : customization.octopus,
      environment: newCustomization.environment ? { ...customization.environment, ...newCustomization.environment } : customization.environment,
      ui: newCustomization.ui ? { ...customization.ui, ...newCustomization.ui } : customization.ui,
      selectedPresetId: newCustomization.selectedPresetId !== undefined ? newCustomization.selectedPresetId : customization.selectedPresetId,
      lastModified: new Date().toISOString(),
    };
    
    // Update state immediately
    setCustomization(updatedCustomization);
    
    // Save to localStorage immediately
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCustomization));
    
    console.log('🎨 Customization updated:', updatedCustomization);

    if (user) {
      setIsSaving(true);
      try {
        // Use the updated customization from the closure
        setTimeout(async () => {
          try {
            const { error } = await supabase
              .from('user_customizations')
              .upsert({
                user_id: user.id,
                octopus_customization: updatedCustomization.octopus,
                environment_customization: updatedCustomization.environment,
                ui_customization: updatedCustomization.ui,
                selected_preset_id: updatedCustomization.selectedPresetId,
                last_modified: updatedCustomization.lastModified,
              });

            if (error) throw error;
          } catch (error) {
            console.error('Failed to save customization:', error);
          } finally {
            setIsSaving(false);
          }
        }, 0);
      } catch (error) {
        console.error('Failed to save customization:', error);
        setIsSaving(false);
      }
    }
  }, [user, customization]);

  const updateOctopusCustomization = useCallback((octopus: Partial<OctopusCustomization>) => {
    saveCustomization({
      octopus,
      // Keep the preset ID - allow customization on top of presets
    });
  }, [saveCustomization]);

  const updateEnvironmentCustomization = useCallback((environment: Partial<EnvironmentCustomization>) => {
    saveCustomization({
      environment,
      // Keep the preset ID - allow customization on top of presets
    });
  }, [saveCustomization]);

  const updateUICustomization = useCallback((ui: Partial<UICustomization>) => {
    saveCustomization({
      ui,
      // Keep the preset ID - allow customization on top of presets
    });
  }, [saveCustomization]);

  const applyPreset = useCallback((preset: CustomizationPreset) => {
    saveCustomization({
      octopus: preset.octopus,
      environment: preset.environment,
      ui: preset.ui,
      selectedPresetId: preset.id,
    });
  }, [saveCustomization]);

  const resetToDefault = useCallback(() => {
    saveCustomization({
      octopus: DEFAULT_OCTOPUS_CUSTOMIZATION,
      environment: DEFAULT_ENVIRONMENT_CUSTOMIZATION,
      ui: DEFAULT_UI_CUSTOMIZATION,
      selectedPresetId: 'classic',
    });
  }, [saveCustomization]);

  const getAvailablePresets = useCallback(() => {
    return CUSTOMIZATION_PRESETS.filter(preset => 
      !preset.isPremium || (user && user.user_metadata?.premium)
    );
  }, [user]);

  return {
    customization,
    isLoading,
    isSaving,
    updateOctopusCustomization,
    updateEnvironmentCustomization,
    updateUICustomization,
    applyPreset,
    resetToDefault,
    getAvailablePresets,
    saveCustomization,
  };
}