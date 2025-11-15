
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import axios from 'axios';
import { Card, CardContent } from '@/components/ui/card';

// Get API URL from environment variables with fallback
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const AuthCallback = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);
  
  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get authorization code from URL
        const searchParams = new URLSearchParams(location.search);
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        console.log('Auth callback received with code:', code ? 'Present (hidden)' : 'Not present');
        console.log('Auth callback state:', state);
        
        if (!code) {
          setError('Authorization code not found in the callback URL');
          setProcessing(false);
          return;
        }

        // Exchange code for token with the backend
        console.log('Sending code to backend for token exchange');
        const redirectUri = `${window.location.origin}/callback`;
        console.log('Using redirect URI:', redirectUri);
        
        const response = await axios.post(`${API_URL}/auth/callback`, { 
          code, 
          state,
          redirectUri
        });
        
        console.log('Auth callback response received');
        
        if (!response.data || !response.data.token) {
          setError('Failed to retrieve access token');
          setProcessing(false);
          return;
        }
        
        // Save token and user data
        localStorage.setItem('auth_token', response.data.token);
        localStorage.setItem('current_user', JSON.stringify(response.data.user));
        
        toast({
          title: 'Login Successful',
          description: `Welcome${response.data.user?.name ? ` back, ${response.data.user.name}` : ''}!`
        });
        
        // Redirect to dashboard immediately
        navigate('/admin/dashboard', { replace: true });
      } catch (error: any) {
        console.error('Auth0 callback error:', error);
        
        let errorMessage = error.response?.data?.message || error.message || 'Authentication failed';
        
        setError(errorMessage);
        setProcessing(false);
        
        toast({
          title: 'Authentication Error',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    };
    
    handleCallback();
  }, [location, navigate, toast]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          {processing ? (
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-medical-600 border-r-transparent"></div>
              <p className="mt-4 text-lg">Processing authentication...</p>
              <p className="text-gray-500 text-sm mt-2">Please wait while we complete your login</p>
            </div>
          ) : (
            <div className="text-center">
              {error ? (
                <>
                  <div className="inline-block p-2 rounded-full bg-red-100">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  </div>
                  <p className="mt-4 text-lg font-medium">Authentication Failed</p>
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                  <pre className="mt-2 text-xs text-left bg-gray-100 p-2 rounded overflow-x-auto">
                    {JSON.stringify({
                      code: new URLSearchParams(location.search).get('code') ? 'Present (hidden)' : 'Not present',
                      state: new URLSearchParams(location.search).get('state'),
                      redirectUri: window.location.origin + '/callback'
                    }, null, 2)}
                  </pre>
                  <button 
                    className="mt-4 px-4 py-2 bg-medical-600 text-white rounded-md hover:bg-medical-700"
                    onClick={() => navigate('/login')}
                  >
                    Return to Login
                  </button>
                </>
              ) : (
                <>
                  <div className="inline-block p-2 rounded-full bg-green-100">
                    <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <p className="mt-4 text-lg font-medium">Authentication Successful</p>
                  <p className="text-gray-500 text-sm mt-2">Redirecting to dashboard...</p>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthCallback;
