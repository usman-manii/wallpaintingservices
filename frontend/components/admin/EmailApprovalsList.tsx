'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Check, X, Clock, Mail, ArrowRight, User } from 'lucide-react';
import { format } from 'date-fns';
import { API_URL } from '@/lib/api';

interface EmailRequest {
  id: string;
  newEmail: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    email: string; // Current email
    firstName: string;
    lastName: string;
  };
}

export default function EmailApprovalsList() {
  const { success, error: showError } = useToast();
  const [requests, setRequests] = useState<EmailRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/email-change/pending`, {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        console.error('Failed to fetch requests');
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/auth/email-change/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ requestId }),
      });

      if (response.ok) {
        success('Email change approved successfully');
        setRequests(requests.filter(r => r.id !== requestId));
      } else {
        const data = await response.json();
        showError(data.message || 'Failed to approve request');
      }
    } catch (error) {
      showError('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading && requests.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <div className="flex justify-center mb-4">
            <Mail className="w-12 h-12 text-muted-foreground/50" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No Pending Requests</h3>
          <p>There are no email change requests waiting for approval.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <Card key={request.id}>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending Approval
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Requested on {format(new Date(request.createdAt), 'MMM d, yyyy h:mm a')}
                  </span>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                     <span className="font-medium text-foreground">{request.user.email}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  <div className="flex items-center gap-2">
                     <span className="font-medium text-blue-600">{request.newEmail}</span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Requested by: {request.user.firstName} {request.user.lastName} ({request.user.username})
                </div>
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto">
                <Button 
                  onClick={() => handleApprove(request.id)}
                  className="flex-1 md:flex-none bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve change
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
