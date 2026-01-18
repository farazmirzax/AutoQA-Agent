// Environment configuration for API endpoints
const isDevelopment = process.env.NODE_ENV === 'development';

export const config = {
  apiUrl: isDevelopment 
    ? 'http://localhost:8000' 
    : process.env.NEXT_PUBLIC_API_URL || 'https://your-render-app.onrender.com',
};
