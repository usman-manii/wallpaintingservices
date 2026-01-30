'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Switch } from '../ui/Switch';
import { Save, Plus, Trash, Key, Cpu, Zap } from 'lucide-react';
import { fetchAPI } from '@/lib/api';

// Fallback Switch if not exists
const ToggleSwitch = ({ checked, onCheckedChange }: { checked: boolean; onCheckedChange: (c: boolean) => void }) => (
  <Switch checked={checked} onCheckedChange={onCheckedChange} />
);



interface AIProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  apiKey: string;
  defaultModel: string;
  availableModels: string[];
}

const DEFAULT_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'openai',
    name: 'OpenAI (GPT)',
    enabled: true,
    apiKey: '',
    defaultModel: 'gpt-4-turbo',
    availableModels: ['gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'],
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    enabled: false,
    apiKey: '',
    defaultModel: 'claude-3-opus',
    availableModels: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
  },
  {
    id: 'google',
    name: 'Google Gemini',
    enabled: false,
    apiKey: '',
    defaultModel: 'gemini-1.5-pro',
    availableModels: ['gemini-1.5-pro', 'gemini-pro', 'gemini-ultra'],
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    enabled: false,
    apiKey: '',
    defaultModel: 'deepseek-coder',
    availableModels: ['deepseek-coder', 'deepseek-chat'],
  },
];

export default function AISettings() {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<AIProviderConfig[]>(DEFAULT_PROVIDERS);
  const [customModelInputs, setCustomModelInputs] = useState<{[key: string]: string}>({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchAPI('/settings');
      if (data && data.aiConfig && Array.isArray(data.aiConfig)) {
        // Merge saved config with defaults to ensure all providers exist
        const merged = DEFAULT_PROVIDERS.map(def => {
          const saved = data.aiConfig.find((p: any) => p.id === def.id);
          return saved ? { ...def, ...saved } : def;
        });
        setProviders(merged);
      }
    } catch (e) {
      console.error(e);
      showError('Failed to load AI settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      // Don't verify API keys here, backend should do that or just store them
      await fetchAPI('/settings', {
        method: 'PUT',
        body: JSON.stringify({ aiConfig: providers }),
      });
      success('AI configurations saved successfully');
    } catch (e) {
      console.error(e);
      showError('Failed to save settings');
    }
  };

  const updateProvider = (id: string, updates: Partial<AIProviderConfig>) => {
    setProviders(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const addCustomModel = (id: string) => {
    const input = customModelInputs[id];
    if (!input) return;
    
    setProviders(prev => prev.map(p => {
      if (p.id === id && !p.availableModels.includes(input)) {
        return { ...p, availableModels: [...p.availableModels, input] };
      }
      return p;
    }));
    setCustomModelInputs(prev => ({ ...prev, [id]: '' }));
  };

  if (loading) return <div>Loading configurations...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">AI Provider Configuration</h2>
        <Button onClick={handleSave} className="gap-2">
          <Save size={16} /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {providers.map((provider) => (
          <Card key={provider.id} className={provider.enabled ? 'border-blue-500/50' : 'opacity-80'}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                   {provider.id === 'openai' && <Zap className="text-green-500" />}
                   {provider.id === 'anthropic' && <Cpu className="text-purple-500" />}
                   {provider.name}
                </CardTitle>
                <ToggleSwitch 
                  checked={provider.enabled} 
                  onCheckedChange={(checked) => updateProvider(provider.id, { enabled: checked })} 
                />
              </div>
              <CardDescription>
                Configure API access and model preferences for {provider.name}.
              </CardDescription>
            </CardHeader>
            
            {provider.enabled && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">API Key</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input 
                      type="password"
                      placeholder={`Enter ${provider.name} API Key`}
                      className="pl-9"
                      value={provider.apiKey}
                      onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Default Model</label>
                    <select 
                      className="w-full px-3 py-2 border rounded-md dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                      value={provider.defaultModel}
                      onChange={(e) => updateProvider(provider.id, { defaultModel: e.target.value })}
                    >
                      {provider.availableModels.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                     <label className="text-sm font-medium">Add Custom Model ID</label>
                     <div className="flex gap-2">
                       <Input 
                         placeholder="e.g. gpt-4-32k"
                         value={customModelInputs[provider.id] || ''}
                         onChange={(e) => setCustomModelInputs(prev => ({ ...prev, [provider.id]: e.target.value }))}
                       />
                       <Button variant="outline" size="sm" onClick={() => addCustomModel(provider.id)}>
                         <Plus size={16} />
                       </Button>
                     </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
