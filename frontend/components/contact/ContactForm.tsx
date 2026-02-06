'use client';

import logger from '@/lib/logger';

import { useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { Captcha } from '@/components/auth/Captcha';
import { getErrorMessage } from '@/lib/error-utils';

export function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    captchaToken: '',
    captchaId: '',
    captchaType: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCaptchaVerify = (token: string, id?: string, type?: string) => {
    setFormData((prev) => ({
      ...prev,
      captchaToken: token,
      captchaId: id || '',
      captchaType: type || '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.captchaToken) {
      setErrorMessage('Please complete the security check.');
      setStatus('error');
      return;
    }

    setStatus('sending');
    setErrorMessage('');

    try {
      await fetchAPI('/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
        captchaToken: '',
        captchaId: '',
        captchaType: '',
      });
    } catch (error: unknown) {
      logger.error('Failed to send contact message', error, { component: 'ContactForm' });
      setStatus('error');
      setErrorMessage(getErrorMessage(error, 'Failed to send message. Please try again.'));
    }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 text-foreground">Contact Us</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          We're here to help. Send us a message and we'll respond as soon as possible.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Send us a Message</CardTitle>
            <CardDescription>We typically respond within 24 hours.</CardDescription>
          </CardHeader>
          <CardContent>
            {status === 'success' ? (
              <div className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 p-6 rounded-lg text-center flex flex-col items-center">
                <CheckCircle size={48} className="mb-4" />
                <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
                <p className="mb-6">Thank you for contacting us. We will get back to you shortly.</p>
                <Button onClick={() => setStatus('idle')} variant="outline">
                  Send Another
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium">
                      Your Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-sm font-medium">
                    Subject
                  </label>
                  <Input
                    id="subject"
                    name="subject"
                    placeholder="Project Inquiry"
                    value={formData.subject}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-sm font-medium">
                    Message
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    rows={6}
                    className="flex w-full rounded-md border border-input bg-input px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="How can we help you?"
                    value={formData.message}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="py-2">
                  <Captcha onVerify={handleCaptchaVerify} />
                </div>

                <Button type="submit" className="w-full md:w-auto" disabled={status === 'sending'}>
                  <Send size={18} className="mr-2" />
                  {status === 'sending' ? 'Sending...' : 'Send Message'}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


