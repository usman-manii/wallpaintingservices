'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { Save, Plus, Trash, Share2, Globe, Link as LinkIcon, Facebook, Linkedin, Twitter, Youtube, Instagram } from 'lucide-react';
import { fetchAPI } from '@/lib/api';

interface SocialChannel {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  isCustom?: boolean;
  // Distribution Config
  apiKey?: string;
  apiSecret?: string;
  autoPublish?: boolean;
  renewInterval?: number;
}

const DEFAULT_CHANNELS: SocialChannel[] = [
  { id: 'twitter', name: 'Twitter / X', url: 'https://twitter.com/', enabled: true },
  { id: 'facebook', name: 'Facebook', url: 'https://facebook.com/', enabled: true },
  { id: 'linkedin', name: 'LinkedIn', url: 'https://linkedin.com/company/', enabled: true },
  { id: 'instagram', name: 'Instagram', url: 'https://instagram.com/', enabled: true },
  { id: 'youtube', name: 'YouTube', url: 'https://youtube.com/c/', enabled: false },
  { id: 'pinterest', name: 'Pinterest', url: 'https://pinterest.com/', enabled: false },
  { id: 'tiktok', name: 'TikTok', url: 'https://tiktok.com/@', enabled: false },
  { id: 'medium', name: 'Medium', url: 'https://medium.com/@', enabled: false },
  { id: 'reddit', name: 'Reddit', url: 'https://reddit.com/r/', enabled: false },
];

export default function DistributionPage() {
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [channels, setChannels] = useState<SocialChannel[]>(DEFAULT_CHANNELS);
  const [newChannel, setNewChannel] = useState({ name: '', url: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchAPI('/settings');
      if (data && data.socialLinks && Array.isArray(data.socialLinks)) {
        // Merge saved config
        const mergedDefaults = DEFAULT_CHANNELS.map(def => {
          const saved = data.socialLinks.find((p: any) => p.id === def.id);
          return saved ? { ...def, ...saved } : def;
        });

        const customChannels = data.socialLinks.filter((s: any) => 
          s.isCustom || !DEFAULT_CHANNELS.find(d => d.id === s.id)
        );

        setChannels([...mergedDefaults, ...customChannels]);
      }
    } catch (e) {
      console.error(e);
      showError('Failed to load social settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await fetchAPI('/settings', {
        method: 'PUT',
        body: JSON.stringify({ socialLinks: channels }),
      });
      success('Distribution channels saved successfully');
    } catch (e) {
      console.error(e);
      showError('Failed to save settings');
    }
  };

  const updateChannel = (id: string, updates: Partial<SocialChannel>) => {
    setChannels(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const addCustomChannel = () => {
    if (!newChannel.name || !newChannel.url) return;
    
    const id = `custom_${Date.now()}`;
    const channel: SocialChannel = {
      id,
      name: newChannel.name,
      url: newChannel.url,
      enabled: true,
      isCustom: true,
    };

    setChannels(prev => [...prev, channel]);
    setNewChannel({ name: '', url: '' });
  };

  const removeChannel = (id: string) => {
    setChannels(prev => prev.filter(c => c.id !== id));
  };

  const getIcon = (id: string) => {
    switch(id) {
        case 'facebook': return <Facebook className="text-blue-600" />;
        case 'twitter': return <Twitter className="text-sky-500" />;
        case 'linkedin': return <Linkedin className="text-blue-700" />;
        case 'youtube': return <Youtube className="text-red-600" />;
        case 'instagram': return <Instagram className="text-pink-600" />;
        default: return <Globe className={id === 'tiktok' ? 'text-black dark:text-white' : 'text-slate-400'} />;
    }
  };

  if (loading) return <div>Loading channels...</div>;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Share2 className="text-blue-500" />
            Social Distribution
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Manage your social media presence and distribution channels.</p>
        </div>
        <Button onClick={handleSave} className="gap-2">
          <Save size={16} /> Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Standard Channels</CardTitle>
              <CardDescription>Configure URLs for popular platforms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {channels.filter(c => !c.isCustom).map(channel => (
                <div key={channel.id} className="flex items-center gap-4 p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <div className="min-w-[40px] flex justify-center">
                    {getIcon(channel.id)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between mb-1">
                      <span className="font-medium text-sm">{channel.name}</span>
                      <input 
                        type="checkbox" 
                        checked={channel.enabled}
                        onChange={(e) => updateChannel(channel.id, { enabled: e.target.checked })}
                        className="accent-blue-600 h-4 w-4"
                      />
                    </div>
                    <Input 
                      value={channel.url}
                      onChange={(e) => updateChannel(channel.id, { url: e.target.value })}
                      placeholder={`https://...`}
                      className="h-8 text-xs"
                      disabled={!channel.enabled}
                    />
                    
                    {/* API Configuration */}
                    {channel.enabled && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-blue-600 hover:text-blue-700 font-medium mb-2">Configure API & Auto-Publish</summary>
                          <div className="space-y-3 p-2 bg-slate-50 dark:bg-slate-900 rounded">
                            <div className="flex items-center gap-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                  <input 
                                    type="checkbox"
                                    checked={(channel as any).autoPublish || false}
                                    onChange={(e) => updateChannel(channel.id, { autoPublish: e.target.checked } as any)}
                                    className="accent-blue-600 h-3 w-3"
                                  />
                                  <span>Auto-publish new posts</span>
                                </label>
                            </div>
                            
                            <div>
                              <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">API Key / Access Token</label>
                              <Input 
                                type="password" 
                                value={(channel as any).apiKey || ''} 
                                onChange={(e) => updateChannel(channel.id, { apiKey: e.target.value } as any)}
                                className="h-7 text-xs font-mono"
                                placeholder={`Enter ${channel.name} API Key`}
                              />
                            </div>
                            
                            {(channel.id === 'twitter' || channel.id === 'linkedin') && (
                              <div>
                                <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">API Secret (Optional)</label>
                                <Input 
                                  type="password" 
                                  value={(channel as any).apiSecret || ''} 
                                  onChange={(e) => updateChannel(channel.id, { apiSecret: e.target.value } as any)}
                                  className="h-7 text-xs font-mono"
                                  placeholder="Secret / Client Secret"
                                />
                              </div>
                            )}

                            <div>
                               <label className="block text-[10px] uppercase text-slate-500 font-bold mb-1">Renew / Repost Rule</label>
                               <div className="flex items-center gap-2">
                                  <span className="text-slate-500">Repost every</span>
                                  <Input 
                                    type="number" 
                                    min="0"
                                    value={(channel as any).renewInterval || 0} 
                                    onChange={(e) => updateChannel(channel.id, { renewInterval: parseInt(e.target.value) || 0 } as any)}
                                    className="h-7 w-16 text-xs text-center"
                                  />
                                  <span className="text-slate-500">days (0 to disable)</span>
                               </div>
                            </div>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Custom Channels</CardTitle>
              <CardDescription>Add niche platforms or specific distribution webhooks.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {channels.filter(c => c.isCustom).map(channel => (
                <div key={channel.id} className="flex items-center gap-4 p-3 border border-dashed border-blue-200 bg-blue-50/20 rounded-lg">
                  <LinkIcon size={20} className="text-blue-400" />
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between items-center">
                      <Input 
                        value={channel.name}
                        onChange={(e) => updateChannel(channel.id, { name: e.target.value })}
                        className="h-8 w-1/2 font-medium"
                      />
                      <Button variant="ghost" size="sm" onClick={() => removeChannel(channel.id)} className="text-red-500 hover:text-red-700 h-8 w-8 p-0">
                         <Trash size={14} />
                      </Button>
                    </div>
                    <Input 
                      value={channel.url}
                      onChange={(e) => updateChannel(channel.id, { url: e.target.value })}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              ))}

              {channels.filter(c => c.isCustom).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">No custom channels added yet.</p>
              )}

              <div className="pt-4 border-t mt-4">
                <h4 className="text-sm font-medium mb-3">Add New Channel</h4>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <Input 
                    placeholder="Platform Name" 
                    value={newChannel.name}
                    onChange={(e) => setNewChannel(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input 
                    placeholder="Profile URL" 
                    value={newChannel.url}
                    onChange={(e) => setNewChannel(prev => ({ ...prev, url: e.target.value }))}
                  />
                </div>
                <Button onClick={addCustomChannel} disabled={!newChannel.name || !newChannel.url} className="w-full" variant="outline">
                  <Plus size={16} className="mr-2" /> Add Channel
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-100 dark:border-indigo-800">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                 <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg text-indigo-600 dark:text-indigo-400">
                   <Share2 size={24} />
                 </div>
                 <div>
                   <h3 className="font-semibold text-indigo-900 dark:text-indigo-100">Distribution Tips</h3>
                   <p className="text-sm text-indigo-700/80 dark:text-indigo-300 mt-1">
                     Connect these channels to the AI Generator to automatically draft social posts whenever you publish a blog article. 
                     Check the "Share" tab in the Post Editor.
                   </p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
