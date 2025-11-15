import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const Callback = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Starting callback handling...');
        
        // Get the authorization code from URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const state = params.get('state');
        
        if (!code) {
          console.error('No authorization code received');
          navigate('/', { replace: true });
          return;
        }
        console.log('Authorization code received, exchanging for token...');
        const tokenResponse = await axios.post(`https://dev-4vgfwjaogpv4yvzc.us.auth0.com/oauth/token`, {
            grant_type: 'authorization_code',
            client_id: 'UWS1hOdN37vALBqb9ssB49lWXqFOXCjj',
            client_secret: 'vRCmDPtp9uW34LZfh-_zeaG2k2jGVzwwP_LrVhvDTWb_eiQCvuSlpDGCdUsMFcAc',
            code,
            redirect_uri: `${window.location.origin}/callback`
          });
        // Exchange the code for a token using the backend
        // const response = await axios.post(`${API_URL}/auth/callback`, {
        //   code,
        //   state,
        //   redirect_uri: `${window.location.origin}/callback`
        // });
        
        console.log('Token received from backend '+JSON.stringify(tokenResponse.data));
        
        // Store the token and user info
        const { access_token, user } = tokenResponse.data;
        console.log("uuuuuuuu "+user);
        localStorage.setItem('auth_token', access_token);
        localStorage.setItem('current_user', JSON.stringify(user));
        
        // Redirect to dashboard
        console.log('Redirecting to dashboard...');
        navigate('/admin/dashboard', { replace: true });
      } catch (error) {
        console.error('Error in callback handling:', error);
        if (axios.isAxiosError(error)) {
          console.error('Backend error details:', error.response?.data);
        }
        navigate('/', { replace: true });
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Processing login...</h1>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  );
};

export default Callback; 