'use client';

import { useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function GetQuotePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    serviceType: 'Residential Painting',
    message: ''
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setErrorMessage('');

    try {
      // Reusing the contact endpoint for now, but bundling the extra info into the message
      // ideally we'd have a specific /quote endpoint, but this works for the "contact" schema
      const payload = {
          name: formData.name,
          email: formData.email,
          subject: `Quote Request: ${formData.serviceType}`,
          message: `Phone: ${formData.phone}\nService: ${formData.serviceType}\n\nDetails:\n${formData.message}`
      };

      await fetchAPI('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', serviceType: 'Residential Painting', message: '' });
    } catch (error: any) {
      console.error(error);
      setStatus('error');
      setErrorMessage(error.message || 'Failed to send request. Please try again.');
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Card className="shadow-lg border-slate-200 dark:border-slate-700">
        <CardHeader className="text-center bg-blue-600 text-white rounded-t-xl py-8">
          <CardTitle className="text-3xl font-bold text-white">Get a Free Quote</CardTitle>
          <CardDescription className="text-blue-100 text-lg">
            Tell us about your project and we'll get back to you with an estimate.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {status === 'success' ? (
            <div className="text-center py-8">
              <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Request Received!</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Thank you for your interest. One of our painting experts will contact you shortly.
              </p>
              <Button onClick={() => setStatus('idle')} className="bg-blue-600 hover:bg-blue-700">
                Submit Another Request
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {status === 'error' && (
                <div className="bg-red-50 text-red-600 p-4 rounded-md flex items-center gap-2">
                  <AlertCircle size={20} />
                  {errorMessage}
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300">Full Name</label>
                  <Input 
                    id="name" 
                    name="name" 
                    placeholder="Your Name" 
                    value={formData.name} 
                    onChange={handleChange}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-slate-700 dark:text-slate-300">Phone Number</label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    type="tel"
                    placeholder="050 123 4567" 
                    value={formData.phone} 
                    onChange={handleChange}
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Address</label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email"
                  placeholder="name@example.com" 
                  value={formData.email} 
                  onChange={handleChange}
                  required 
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="serviceType" className="text-sm font-medium text-slate-700 dark:text-slate-300">Service Needed</label>
                <select 
                  id="serviceType" 
                  name="serviceType" 
                  value={formData.serviceType}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                >
                  <option value="Residential Painting">Residential Painting (Villa/Apartment)</option>
                  <option value="Commercial Painting">Commercial Painting (Office/Shop)</option>
                  <option value="Move Out Painting">Move-Out / Move-In Painting</option>
                  <option value="Exterior Painting">Exterior Painting</option>
                  <option value="Wallpaper Installation">Wallpaper Installation</option>
                  <option value="Other">Other Query</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium text-slate-700 dark:text-slate-300">Project Details</label>
                <textarea 
                  id="message" 
                  name="message" 
                  placeholder="Please describe your project (e.g., number of rooms, current wall condition, specific colors...)" 
                  rows={5}
                  value={formData.message} 
                  onChange={handleChange}
                  className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:ring-offset-slate-950 dark:placeholder:text-slate-400 dark:focus-visible:ring-slate-300"
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700 text-white text-lg py-6" disabled={status === 'sending'}>
                {status === 'sending' ? 'Submitting...' : 'Get My Free Quote'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
