'use client';

import logger from '@/lib/logger';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Switch } from '../ui/Switch';
import { Save, Plus, Key, Cpu, Zap, Gauge, Brain } from 'lucide-react';
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

type AiMode = 'standard' | 'go' | 'god' | 'enterprise';

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

const AI_MODE_OPTIONS: Array<{ value: AiMode; label: string; description: string }> = [
  { value: 'standard', label: 'Standard', description: 'Balanced output with reliable SEO structure.' },
  { value: 'go', label: 'Go Mode', description: 'Faster experimentation with deeper structure and tactics.' },
  { value: 'god', label: 'God Mode', description: 'Maximum depth, multi-angle coverage, and premium detail.' },
  { value: 'enterprise', label: 'Enterprise', description: 'Compliance-forward, brand-consistent, high-precision output.' },
];

const parseAiMode = (value: unknown): AiMode => {
  if (value === 'go' || value === 'god' || value === 'enterprise' || value === 'standard') {
    return value;
  }
  return 'standard';
};

const parseLearningLevel = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value < 1) return 1;
    if (value > 7) return 7;
    return Math.round(value);
  }
  return 3;
};

const parseBoolean = (value: unknown, fallback = false): boolean => (
  typeof value === 'boolean' ? value : fallback
);

const extractAiConfig = (value: unknown): AIProviderConfig[] => {
  if (!value || typeof value !== 'object') return [];
  const obj = value as Record<string, unknown>;
  const raw = Array.isArray(obj.aiConfig) ? obj.aiConfig : [];
  return raw
    .map((item) => toProviderConfig(item))
    .filter((item): item is AIProviderConfig => item !== null);
};

const toProviderConfig = (value: unknown): AIProviderConfig | null => {
  if (!value || typeof value !== 'object') return null;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== 'string' || typeof obj.name !== 'string') return null;
  return {
    id: obj.id,
    name: obj.name,
    enabled: typeof obj.enabled === 'boolean' ? obj.enabled : false,
    apiKey: typeof obj.apiKey === 'string' ? obj.apiKey : '',
    defaultModel: typeof obj.defaultModel === 'string' ? obj.defaultModel : '',
    availableModels: Array.isArray(obj.availableModels) ? obj.availableModels.filter((m) => typeof m === 'string') as string[] : [],
  };
};

export default function AISettings() {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<AIProviderConfig[]>(DEFAULT_PROVIDERS);
  const [customModelInputs, setCustomModelInputs] = useState<{[key: string]: string}>({});
  const [aiMode, setAiMode] = useState<AiMode>('standard');
  const [aiLearningLevel, setAiLearningLevel] = useState(3);
  const [aiSelfLearningEnabled, setAiSelfLearningEnabled] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchAPI('/settings');
      const aiConfig = extractAiConfig(data);
      const dataRecord = data && typeof data === 'object' ? (data as Record<string, unknown>) : {};
      if (aiConfig.length > 0) {
        // Merge saved config with defaults to ensure all providers exist
        const merged = DEFAULT_PROVIDERS.map(def => {
          const saved = aiConfig.find((p) => p.id === def.id);
          return saved ? { ...def, ...saved } : def;
        });
        setProviders(merged);
      }
      setAiMode(parseAiMode(dataRecord.aiMode));
      setAiLearningLevel(parseLearningLevel(dataRecord.aiLearningLevel));
      setAiSelfLearningEnabled(parseBoolean(dataRecord.aiSelfLearningEnabled));
    } catch (e: unknown) {
      logger.error('Failed to load AI settings', e, { component: 'AISettings' });
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
        body: JSON.stringify({
          aiConfig: providers,
          aiMode,
          aiLearningLevel,
          aiSelfLearningEnabled,
        }),
      });
      success('AI configurations saved successfully');
    } catch (e: unknown) {
      logger.error('Failed to save AI settings', e, { component: 'AISettings' });
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge size={18} /> AI Mode and Learning Controls
          </CardTitle>
          <CardDescription>
            Tune the AI output depth, governance, and adaptive learning profile.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">AI Mode</label>
              <select
                value={aiMode}
                onChange={(e) => setAiMode(e.target.value as AiMode)}
                className="w-full px-3 py-2 border rounded-md bg-input border-border text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {AI_MODE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                {AI_MODE_OPTIONS.find((option) => option.value === aiMode)?.description}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Learning Level (1-7)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={7}
                  value={aiLearningLevel}
                  onChange={(e) => setAiLearningLevel(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-semibold w-8 text-center">{aiLearningLevel}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Higher levels deliver deeper structure, richer examples, and more advanced synthesis.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/40">
            <div className="flex items-start gap-3">
              <Brain className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <div className="font-medium">Self-learning patterns</div>
                <div className="text-xs text-muted-foreground">
                  Enable adaptive prompts that reinforce best-performing structure and tone.
                </div>
              </div>
            </div>
            <ToggleSwitch
              checked={aiSelfLearningEnabled}
              onCheckedChange={(checked) => setAiSelfLearningEnabled(checked)}
            />
          </div>
        </CardContent>
      </Card>

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
                    <Key className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
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
                      className="w-full px-3 py-2 border rounded-md bg-input border-border text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
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

