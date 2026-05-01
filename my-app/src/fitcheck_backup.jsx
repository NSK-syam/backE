/**
 * FitCheck - AI-Powered Outfit Recommendation App
 * Frontend with AWS Cognito Auth & Stripe Payments
 * 
 * SETUP INSTRUCTIONS:
 * 1. Replace CONFIG values with your actual AWS/Stripe values
 * 2. Install dependencies: npm install @aws-amplify/auth aws-amplify @stripe/stripe-js
 */

import React, { useState, useEffect, createContext, useContext } from 'react';

// ============================================
// CONFIGURATION - Replace with your values
// ============================================
const CONFIG = {
  // AWS Cognito
  COGNITO_REGION: 'us-east-1',                    // Your AWS region
  COGNITO_USER_POOL_ID: 'us-east-1_XXXXXXXXX',   // From CloudFormation output
  COGNITO_CLIENT_ID: 'xxxxxxxxxxxxxxxxxxxxxxxxxx', // From CloudFormation output
  
  // API Gateway
  API_ENDPOINT: 'https://xxxxxxxxxx.execute-api.us-east-1.amazonaws.com/dev',
  
  // Stripe
  STRIPE_PUBLISHABLE_KEY: 'pk_test_xxxxxxxxxxxxxxxx',
  STRIPE_PREMIUM_MONTHLY_PRICE_ID: 'price_xxxxxxxx',
  STRIPE_PREMIUM_YEARLY_PRICE_ID: 'price_xxxxxxxx',
  
  // Plans
  PLANS: {
    free: { closetLimit: 20, name: 'Free' },
    premium: { closetLimit: 500, name: 'Premium' },
  },
};

// ============================================
// AUTH CONTEXT
// ============================================
const AuthContext = createContext(null);

function useAuth() {
  return useContext(AuthContext);
}

// Simple auth state management (replace with Amplify in production)
function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('fitcheck_user');
    const storedToken = localStorage.getItem('fitcheck_token');
    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const signIn = async (email, password) => {
    // In production, use AWS Amplify Auth.signIn()
    // This is a placeholder for the demo
    const mockUser = {
      userId: 'demo-user-123',
      email,
      name: email.split('@')[0],
    };
    const mockToken = 'demo-token-' + Date.now();
    
    setUser(mockUser);
    setToken(mockToken);
    localStorage.setItem('fitcheck_user', JSON.stringify(mockUser));
    localStorage.setItem('fitcheck_token', mockToken);
    
    return mockUser;
  };

  const signUp = async (email, password, name) => {
    // In production, use AWS Amplify Auth.signUp()
    return { user: { username: email } };
  };

  const signOut = async () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('fitcheck_user');
    localStorage.removeItem('fitcheck_token');
  };

  const value = {
    user,
    token,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ============================================
// API CLIENT
// ============================================
class ApiClient {
  constructor(baseUrl, getToken) {
    this.baseUrl = baseUrl;
    this.getToken = getToken;
  }

  async request(path, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || `Request failed: ${response.status}`);
    }

    return response.json();
  }

  // Closet endpoints
  getCloset() {
    return this.request('/closet/items');
  }

  addClosetItem(item) {
    return this.request('/closet/items', {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  updateClosetItem(itemId, updates) {
    return this.request(`/closet/items/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  deleteClosetItem(itemId) {
    return this.request(`/closet/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  // Upload
  getUploadUrl(fileName, fileType, fileSize) {
    return this.request('/upload-url', {
      method: 'POST',
      body: JSON.stringify({ fileName, fileType, fileSize }),
    });
  }

  // Profile
  getProfile() {
    return this.request('/profile');
  }

  // Payments
  createCheckout(priceId) {
    return this.request('/checkout', {
      method: 'POST',
      body: JSON.stringify({
        priceId,
        successUrl: window.location.origin + '?payment=success',
        cancelUrl: window.location.origin + '?payment=canceled',
      }),
    });
  }

  createPortalSession() {
    return this.request('/portal', {
      method: 'POST',
      body: JSON.stringify({
        returnUrl: window.location.origin,
      }),
    });
  }
}

// ============================================
// CATEGORIES & CONSTANTS
// ============================================
const CATEGORIES = [
  { id: 'tops', name: 'Tops', icon: '👕' },
  { id: 'bottoms', name: 'Bottoms', icon: '👖' },
  { id: 'dresses', name: 'Dresses', icon: '👗' },
  { id: 'outerwear', name: 'Outerwear', icon: '🧥' },
  { id: 'shoes', name: 'Shoes', icon: '👟' },
  { id: 'accessories', name: 'Accessories', icon: '👜' },
];

const OCCASIONS = [
  { id: 'casual', name: 'Casual', icon: '😊' },
  { id: 'work', name: 'Work', icon: '💼' },
  { id: 'date', name: 'Date Night', icon: '💕' },
  { id: 'gym', name: 'Gym', icon: '💪' },
  { id: 'formal', name: 'Formal', icon: '🎩' },
  { id: 'outdoor', name: 'Outdoor', icon: '🏕️' },
  { id: 'party', name: 'Party', icon: '🎉' },
  { id: 'beach', name: 'Beach', icon: '🏖️' },
];

const COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#e94560', '#533483',
  '#f8b500', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#ffeaa7', '#dfe6e9', '#2d3436', '#636e72', '#b2bec3',
  '#fd79a8', '#a29bfe', '#74b9ff', '#55efc4', '#f8f9fa',
];

const MATERIALS = ['Cotton', 'Polyester', 'Wool', 'Denim', 'Silk', 'Linen', 'Leather', 'Synthetic'];

// ============================================
// MAIN APP COMPONENT
// ============================================
function FitCheckApp() {
  const auth = useAuth();
  const [api] = useState(() => new ApiClient(CONFIG.API_ENDPOINT, () => auth?.token));
  
  const [activeTab, setActiveTab] = useState('home');
  const [closet, setCloset] = useState([]);
  const [profile, setProfile] = useState(null);
  const [weather, setWeather] = useState(null);
  const [location, setLocation] = useState('New York, NY');
  const [selectedOccasion, setSelectedOccasion] = useState('casual');
  const [generatedOutfit, setGeneratedOutfit] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outfitHistory, setOutfitHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [stylePreference, setStylePreference] = useState('balanced');

  const [newItem, setNewItem] = useState({
    name: '',
    category: 'tops',
    color: '#1a1a2e',
    material: 'Cotton',
    warmth: 2,
    formality: 2,
    image: null,
    imageUrl: null,
  });

  // Load data on auth change
  useEffect(() => {
    if (auth?.isAuthenticated) {
      loadUserData();
    } else if (!auth?.loading) {
      setLoading(false);
    }
  }, [auth?.isAuthenticated, auth?.loading]);

  const loadUserData = async () => {
    setLoading(true);
    try {
      // In production, these would call the real API
      // For demo, we'll use local storage
      const storedCloset = localStorage.getItem('fitcheck_closet');
      const storedHistory = localStorage.getItem('fitcheck_history');
      const storedFavorites = localStorage.getItem('fitcheck_favorites');
      
      setCloset(storedCloset ? JSON.parse(storedCloset) : []);
      setOutfitHistory(storedHistory ? JSON.parse(storedHistory) : []);
      setFavorites(storedFavorites ? JSON.parse(storedFavorites) : []);
      
      setProfile({
        plan: 'free',
        closetLimit: 20,
        closetCount: storedCloset ? JSON.parse(storedCloset).length : 0,
      });
      
      fetchWeather();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Save closet to storage
  useEffect(() => {
    if (auth?.isAuthenticated && closet.length >= 0) {
      localStorage.setItem('fitcheck_closet', JSON.stringify(closet));
    }
  }, [closet, auth?.isAuthenticated]);

  useEffect(() => {
    if (auth?.isAuthenticated) {
      localStorage.setItem('fitcheck_history', JSON.stringify(outfitHistory));
    }
  }, [outfitHistory, auth?.isAuthenticated]);

  useEffect(() => {
    if (auth?.isAuthenticated) {
      localStorage.setItem('fitcheck_favorites', JSON.stringify(favorites));
    }
  }, [favorites, auth?.isAuthenticated]);

  const fetchWeather = async () => {
    setWeatherLoading(true);
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          tools: [{ type: 'web_search_20250305', name: 'web_search' }],
          messages: [{
            role: 'user',
            content: `What is the current weather in ${location}? Respond ONLY with JSON: {"condition": "Sunny", "temp": 72, "humidity": 45, "wind": 10}`
          }],
        }),
      });

      const data = await response.json();
      const textContent = data.content?.filter(c => c.type === 'text').map(c => c.text).join('') || '';
      const jsonMatch = textContent.match(/\{[^{}]*"condition"[^{}]*\}/);
      
      if (jsonMatch) {
        const weatherData = JSON.parse(jsonMatch[0]);
        const conditionLower = weatherData.condition.toLowerCase();
        let icon = '🌤️';
        if (conditionLower.includes('sun') || conditionLower.includes('clear')) icon = '☀️';
        else if (conditionLower.includes('cloud')) icon = '☁️';
        else if (conditionLower.includes('rain')) icon = '🌧️';
        else if (conditionLower.includes('snow')) icon = '❄️';
        else if (weatherData.temp > 90) icon = '🔥';
        else if (weatherData.temp < 40) icon = '🥶';
        
        setWeather({ ...weatherData, icon, location });
      }
    } catch (err) {
      console.error('Weather fetch error:', err);
      setWeather({ condition: 'Unable to fetch', temp: '--', humidity: '--', wind: '--', icon: '🌡️', location });
    }
    setWeatherLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // For demo, just convert to base64
    // In production, upload to S3 using presigned URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewItem({ ...newItem, image: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const addToCloset = async () => {
    if (!newItem.name.trim()) return;

    // Check limit
    const limit = profile?.closetLimit || 20;
    if (closet.length >= limit) {
      setShowUpgrade(true);
      return;
    }

    const item = {
      ...newItem,
      itemId: `item_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };

    setCloset([...closet, item]);
    setNewItem({
      name: '',
      category: 'tops',
      color: '#1a1a2e',
      material: 'Cotton',
      warmth: 2,
      formality: 2,
      image: null,
      imageUrl: null,
    });
    setShowAddItem(false);
  };

  const removeFromCloset = (itemId) => {
    setCloset(closet.filter(item => item.itemId !== itemId));
  };

  const generateOutfitWithAI = async () => {
    setIsGenerating(true);
    
    const closetSummary = closet.map(item => 
      `${item.name} (${item.category}, ${item.material}, warmth: ${item.warmth}/5, formality: ${item.formality}/5)`
    ).join(', ');

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: `You are a fashion stylist. Based on:
WEATHER: ${weather?.condition}, ${weather?.temp}°F
OCCASION: ${selectedOccasion}
STYLE: ${stylePreference}

CLOSET: ${closetSummary}

Suggest an outfit. Respond ONLY with JSON:
{"selectedItems": ["item name 1", "item name 2"], "stylingTips": "tips here", "confidenceRating": 8, "outfitName": "Look Name"}`
          }],
        }),
      });

      const data = await response.json();
      const textContent = data.content?.find(c => c.type === 'text')?.text || '';
      const jsonMatch = textContent.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const outfitData = JSON.parse(jsonMatch[0]);
        const selectedItems = closet.filter(item => 
          outfitData.selectedItems.some(name => 
            item.name.toLowerCase().includes(name.toLowerCase()) ||
            name.toLowerCase().includes(item.name.toLowerCase())
          )
        );
        
        const outfit = {
          id: Date.now(),
          items: selectedItems,
          tips: outfitData.stylingTips,
          rating: outfitData.confidenceRating,
          name: outfitData.outfitName,
          weather: weather?.condition,
          occasion: selectedOccasion,
          date: new Date().toLocaleDateString(),
        };
        
        setGeneratedOutfit(outfit);
        setOutfitHistory([outfit, ...outfitHistory.slice(0, 19)]);
      }
    } catch (err) {
      console.error('AI generation error:', err);
    }
    
    setIsGenerating(false);
  };

  const toggleFavorite = (outfit) => {
    const isFav = favorites.some(f => f.id === outfit.id);
    if (isFav) {
      setFavorites(favorites.filter(f => f.id !== outfit.id));
    } else {
      setFavorites([...favorites, outfit]);
    }
  };

  const handleUpgrade = async (priceId) => {
    try {
      // In production, this would call the API to create a Stripe checkout session
      // const { url } = await api.createCheckout(priceId);
      // window.location.href = url;
      
      // For demo, just upgrade locally
      setProfile({ ...profile, plan: 'premium', closetLimit: 500 });
      setShowUpgrade(false);
      alert('🎉 Upgraded to Premium! (Demo mode - no actual charge)');
    } catch (err) {
      setError('Failed to start checkout');
    }
  };

  const getItemsByCategory = (categoryId) => closet.filter(item => item.category === categoryId);

  // Styles
  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
      fontFamily: "'Playfair Display', Georgia, serif",
      color: '#f8f9fa',
    },
    header: {
      padding: '24px 32px',
      borderBottom: '1px solid rgba(255,255,255,0.1)',
      backdropFilter: 'blur(10px)',
      background: 'rgba(26, 26, 46, 0.8)',
    },
    logo: {
      fontSize: '2.5rem',
      fontWeight: '700',
      margin: 0,
      background: 'linear-gradient(135deg, #e94560, #ff6b6b, #4ecdc4)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    button: {
      padding: '12px 24px',
      borderRadius: '30px',
      border: 'none',
      cursor: 'pointer',
      fontFamily: "'Inter', sans-serif",
      fontSize: '0.9rem',
      fontWeight: '500',
      transition: 'all 0.3s ease',
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #e94560, #ff6b6b)',
      color: '#fff',
    },
    card: {
      background: 'rgba(255,255,255,0.03)',
      borderRadius: '20px',
      padding: '24px',
      border: '1px solid rgba(255,255,255,0.08)',
    },
    input: {
      width: '100%',
      padding: '14px 18px',
      borderRadius: '12px',
      border: '1px solid rgba(255,255,255,0.1)',
      background: 'rgba(0,0,0,0.3)',
      color: '#fff',
      fontSize: '1rem',
      fontFamily: 'Inter, sans-serif',
      boxSizing: 'border-box',
    },
  };

  // Auth Modal
  const AuthModal = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000,
    }}>
      <div style={{ ...styles.card, maxWidth: '400px', width: '90%' }}>
        <h2 style={{ marginTop: 0 }}>{authMode === 'signin' ? 'Welcome Back' : 'Create Account'}</h2>
        <form onSubmit={async (e) => {
          e.preventDefault();
          const form = e.target;
          const email = form.email.value;
          const password = form.password.value;
          try {
            if (authMode === 'signin') {
              await auth.signIn(email, password);
            } else {
              await auth.signUp(email, password, form.name?.value);
              setAuthMode('signin');
              return;
            }
            setShowAuth(false);
          } catch (err) {
            setError(err.message);
          }
        }}>
          {authMode === 'signup' && (
            <input name="name" placeholder="Name" style={{ ...styles.input, marginBottom: '12px' }} />
          )}
          <input name="email" type="email" placeholder="Email" required style={{ ...styles.input, marginBottom: '12px' }} />
          <input name="password" type="password" placeholder="Password" required style={{ ...styles.input, marginBottom: '20px' }} />
          <button type="submit" style={{ ...styles.button, ...styles.primaryButton, width: '100%' }}>
            {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '16px', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
          {authMode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <button onClick={() => setAuthMode(authMode === 'signin' ? 'signup' : 'signin')}
            style={{ background: 'none', border: 'none', color: '#4ecdc4', cursor: 'pointer' }}>
            {authMode === 'signin' ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
        <button onClick={() => setShowAuth(false)} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer'
        }}>×</button>
      </div>
    </div>
  );

  // Upgrade Modal
  const UpgradeModal = () => (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', display: 'flex',
      alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
    }}>
      <div style={{ ...styles.card, maxWidth: '600px', width: '100%', position: 'relative' }}>
        <button onClick={() => setShowUpgrade(false)} style={{
          position: 'absolute', top: '16px', right: '16px',
          background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer'
        }}>×</button>
        
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>✨ Upgrade to Premium</h2>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}>
          Unlock your full fashion potential!
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '24px' }}>
          {/* Monthly */}
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <h3 style={{ margin: '0 0 8px' }}>Monthly</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>$9.99<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>/mo</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
              <li style={{ marginBottom: '8px' }}>✓ 500 closet items</li>
              <li style={{ marginBottom: '8px' }}>✓ Unlimited outfits</li>
              <li style={{ marginBottom: '8px' }}>✓ Priority AI</li>
              <li style={{ marginBottom: '8px' }}>✓ Style analytics</li>
            </ul>
            <button onClick={() => handleUpgrade('monthly')} style={{
              ...styles.button, width: '100%',
              background: 'rgba(255,255,255,0.1)', color: '#fff',
            }}>Select</button>
          </div>

          {/* Yearly */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.2), rgba(78, 205, 196, 0.2))',
            borderRadius: '16px',
            padding: '24px',
            border: '2px solid #e94560',
            position: 'relative',
          }}>
            <span style={{
              position: 'absolute', top: '-12px', right: '16px',
              background: '#e94560', padding: '4px 12px', borderRadius: '20px',
              fontSize: '0.75rem', fontWeight: '600', fontFamily: 'Inter, sans-serif',
            }}>SAVE 17%</span>
            <h3 style={{ margin: '0 0 8px' }}>Yearly</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: '700' }}>$99.99<span style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>/yr</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '20px 0', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>
              <li style={{ marginBottom: '8px' }}>✓ Everything in Monthly</li>
              <li style={{ marginBottom: '8px' }}>✓ 2 months FREE</li>
              <li style={{ marginBottom: '8px' }}>✓ Early access</li>
              <li style={{ marginBottom: '8px' }}>✓ Priority support</li>
            </ul>
            <button onClick={() => handleUpgrade('yearly')} style={{
              ...styles.button, ...styles.primaryButton, width: '100%',
            }}>Select</button>
          </div>
        </div>
      </div>
    </div>
  );

  // Not authenticated view
  if (!auth?.isAuthenticated && !auth?.loading) {
    return (
      <div style={styles.container}>
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
        }}>
          <h1 style={{ ...styles.logo, fontSize: '4rem', marginBottom: '16px' }}>FitCheck</h1>
          <p style={{ fontSize: '1.3rem', color: 'rgba(255,255,255,0.7)', maxWidth: '500px', marginBottom: '40px', fontFamily: 'Inter, sans-serif' }}>
            AI-powered outfit recommendations based on weather, occasion, and your personal style.
          </p>
          
          <div style={{ display: 'flex', gap: '60px', marginBottom: '60px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { icon: '🌤️', title: 'Weather Smart', desc: 'Real-time weather integration' },
              { icon: '👗', title: 'Your Closet', desc: 'Upload & organize your wardrobe' },
              { icon: '🤖', title: 'AI Stylist', desc: 'Perfect outfit recommendations' },
            ].map((f, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '3rem' }}>{f.icon}</span>
                <h3 style={{ margin: '12px 0 4px' }}>{f.title}</h3>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>

          <button onClick={() => { setAuthMode('signup'); setShowAuth(true); }}
            style={{ ...styles.button, ...styles.primaryButton, fontSize: '1.1rem', padding: '16px 40px' }}>
            Get Started Free
          </button>
          <button onClick={() => { setAuthMode('signin'); setShowAuth(true); }}
            style={{ ...styles.button, background: 'transparent', color: '#fff', marginTop: '12px' }}>
            Already have an account? Sign In
          </button>
        </div>
        {showAuth && <AuthModal />}
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');`}</style>
      </div>
    );
  }

  // Loading
  if (loading || auth?.loading) {
    return (
      <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '4rem', animation: 'spin 1s linear infinite' }}>👗</div>
          <p style={{ fontFamily: 'Inter, sans-serif' }}>Loading your closet...</p>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Main App (abbreviated for length - same UI as before with auth integration)
  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '1200px', margin: '0 auto' }}>
          <div>
            <h1 style={styles.logo}>FitCheck</h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>
              {profile?.plan === 'premium' ? '⭐ Premium' : 'Free Plan'} • {closet.length}/{profile?.closetLimit || 20} items
            </p>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Weather Badge */}
            {weather && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                background: 'rgba(255,255,255,0.05)', padding: '12px 20px',
                borderRadius: '50px', border: '1px solid rgba(255,255,255,0.1)',
              }}>
                <span style={{ fontSize: '2rem' }}>{weatherLoading ? '🔄' : weather.icon}</span>
                <div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{weather.temp}°F</div>
                  <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>
                    {weather.condition}
                  </div>
                </div>
              </div>
            )}
            
            {profile?.plan !== 'premium' && (
              <button onClick={() => setShowUpgrade(true)}
                style={{ ...styles.button, background: 'linear-gradient(135deg, #f8b500, #ff6b6b)', color: '#fff' }}>
                ⭐ Upgrade
              </button>
            )}
            
            <button onClick={auth.signOut}
              style={{ ...styles.button, background: 'rgba(255,255,255,0.1)', color: '#fff' }}>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{ padding: '16px 32px', background: 'rgba(0,0,0,0.2)' }}>
        <div style={{ display: 'flex', gap: '8px', maxWidth: '1200px', margin: '0 auto', justifyContent: 'center' }}>
          {[
            { id: 'home', label: 'Get Outfit', icon: '✨' },
            { id: 'closet', label: 'My Closet', icon: '👗' },
            { id: 'history', label: 'History', icon: '📅' },
            { id: 'favorites', label: 'Favorites', icon: '❤️' },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                ...styles.button,
                background: activeTab === tab.id ? 'linear-gradient(135deg, #e94560, #ff6b6b)' : 'rgba(255,255,255,0.05)',
                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.7)',
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px' }}>
        {/* Home Tab */}
        {activeTab === 'home' && (
          <div>
            <div style={{ ...styles.card, marginBottom: '24px' }}>
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>📍 Location</label>
                  <input value={location} onChange={(e) => setLocation(e.target.value)} style={styles.input} placeholder="Enter city..." />
                </div>
                <button onClick={fetchWeather} disabled={weatherLoading}
                  style={{ ...styles.button, background: 'linear-gradient(135deg, #4ecdc4, #45b7d1)', color: '#fff' }}>
                  {weatherLoading ? '...' : 'Update Weather'}
                </button>
              </div>
            </div>

            <div style={{ ...styles.card, marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>🎯 Occasion</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {OCCASIONS.map(occ => (
                  <button key={occ.id} onClick={() => setSelectedOccasion(occ.id)}
                    style={{
                      ...styles.button, padding: '10px 20px',
                      background: selectedOccasion === occ.id ? 'rgba(233, 69, 96, 0.2)' : 'rgba(0,0,0,0.2)',
                      border: selectedOccasion === occ.id ? '2px solid #e94560' : '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                    }}>
                    {occ.icon} {occ.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <button onClick={generateOutfitWithAI} disabled={isGenerating || closet.length === 0}
                style={{
                  ...styles.button, ...styles.primaryButton,
                  padding: '20px 60px', fontSize: '1.2rem',
                  boxShadow: '0 10px 40px rgba(233, 69, 96, 0.3)',
                  opacity: (isGenerating || closet.length === 0) ? 0.5 : 1,
                }}>
                {isGenerating ? '⚡ Creating...' : '✨ Generate My Outfit'}
              </button>
              {closet.length === 0 && (
                <p style={{ marginTop: '12px', color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif' }}>
                  Add items to your closet first!
                </p>
              )}
            </div>

            {generatedOutfit && (
              <div style={{ ...styles.card, background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.1), rgba(78, 205, 196, 0.1))' }}>
                <h2 style={{ margin: '0 0 16px' }}>{generatedOutfit.name}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
                  {generatedOutfit.items.map((item, i) => (
                    <div key={i} style={{
                      background: 'rgba(0,0,0,0.3)', padding: '16px', borderRadius: '12px', textAlign: 'center',
                    }}>
                      <div style={{ width: '60px', height: '60px', background: item.color, borderRadius: '8px', margin: '0 auto 8px' }} />
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>{item.name}</span>
                    </div>
                  ))}
                </div>
                {generatedOutfit.tips && (
                  <div style={{ background: 'rgba(78, 205, 196, 0.1)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #4ecdc4' }}>
                    <p style={{ margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>💡 {generatedOutfit.tips}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Closet Tab */}
        {activeTab === 'closet' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>My Closet ({closet.length}/{profile?.closetLimit || 20})</h2>
              <button onClick={() => {
                if (closet.length >= (profile?.closetLimit || 20)) {
                  setShowUpgrade(true);
                } else {
                  setShowAddItem(true);
                }
              }} style={{ ...styles.button, ...styles.primaryButton }}>+ Add Item</button>
            </div>

            {closet.length >= (profile?.closetLimit || 20) && profile?.plan !== 'premium' && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(248, 181, 0, 0.2), rgba(233, 69, 96, 0.2))',
                padding: '20px', borderRadius: '12px', marginBottom: '24px',
                border: '1px solid rgba(248, 181, 0, 0.3)', display: 'flex',
                justifyContent: 'space-between', alignItems: 'center',
              }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontFamily: 'Inter, sans-serif' }}>🔒 Closet Full!</h4>
                  <p style={{ margin: 0, fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', fontFamily: 'Inter, sans-serif' }}>
                    Upgrade to Premium for 500 items
                  </p>
                </div>
                <button onClick={() => setShowUpgrade(true)} style={{ ...styles.button, ...styles.primaryButton }}>Upgrade Now</button>
              </div>
            )}

            {CATEGORIES.map(cat => {
              const items = getItemsByCategory(cat.id);
              if (items.length === 0) return null;
              return (
                <div key={cat.id} style={{ marginBottom: '32px' }}>
                  <h3 style={{ fontFamily: 'Inter, sans-serif', fontWeight: '500' }}>{cat.icon} {cat.name} ({items.length})</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '16px' }}>
                    {items.map(item => (
                      <div key={item.itemId} style={{ ...styles.card, position: 'relative', padding: '16px' }}>
                        <button onClick={() => removeFromCloset(item.itemId)} style={{
                          position: 'absolute', top: '8px', right: '8px', background: 'rgba(233, 69, 96, 0.8)',
                          border: 'none', color: '#fff', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer',
                        }}>×</button>
                        {item.image ? (
                          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                        ) : (
                          <div style={{ width: '100%', height: '100px', background: item.color, borderRadius: '8px' }} />
                        )}
                        <p style={{ margin: '12px 0 0', fontFamily: 'Inter, sans-serif', fontSize: '0.9rem' }}>{item.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {closet.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontSize: '4rem' }}>👗</span>
                <p style={{ fontFamily: 'Inter, sans-serif' }}>Your closet is empty! Add some items.</p>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <h2>Outfit History</h2>
            {outfitHistory.length > 0 ? (
              outfitHistory.map((outfit, i) => (
                <div key={i} style={{ ...styles.card, marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <h3 style={{ margin: '0 0 4px' }}>{outfit.name}</h3>
                      <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontFamily: 'Inter, sans-serif', fontSize: '0.85rem' }}>
                        {outfit.date} • {outfit.weather} • {outfit.occasion}
                      </p>
                    </div>
                    <button onClick={() => toggleFavorite(outfit)} style={{
                      background: favorites.some(f => f.id === outfit.id) ? '#e94560' : 'rgba(255,255,255,0.1)',
                      border: 'none', padding: '8px 12px', borderRadius: '20px', color: '#fff', cursor: 'pointer',
                    }}>❤️</button>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontSize: '4rem' }}>📅</span>
                <p style={{ fontFamily: 'Inter, sans-serif' }}>No outfit history yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div>
            <h2>Favorites ({favorites.length})</h2>
            {favorites.length > 0 ? (
              favorites.map((outfit, i) => (
                <div key={i} style={{ ...styles.card, marginBottom: '16px', background: 'linear-gradient(135deg, rgba(233, 69, 96, 0.1), rgba(78, 205, 196, 0.1))' }}>
                  <h3 style={{ margin: '0 0 8px' }}>{outfit.name}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {outfit.items?.map((item, j) => (
                      <span key={j} style={{ background: 'rgba(0,0,0,0.3)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif' }}>
                        {item.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '60px', color: 'rgba(255,255,255,0.5)' }}>
                <span style={{ fontSize: '4rem' }}>❤️</span>
                <p style={{ fontFamily: 'Inter, sans-serif' }}>No favorites yet.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Item Modal */}
      {showAddItem && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px',
        }}>
          <div style={{ ...styles.card, maxWidth: '500px', width: '100%', maxHeight: '90vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0 }}>Add New Item</h3>
              <button onClick={() => setShowAddItem(false)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>📸 Photo</label>
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '30px', borderRadius: '12px', border: '2px dashed rgba(255,255,255,0.2)', cursor: 'pointer' }}>
                {newItem.image ? (
                  <img src={newItem.image} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                  <span style={{ fontSize: '2rem' }}>📷</span>
                )}
                <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
              </label>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>Name *</label>
              <input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} style={styles.input} placeholder="e.g., Blue Denim Jacket" />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>Category</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setNewItem({ ...newItem, category: cat.id })}
                    style={{
                      ...styles.button, padding: '8px 16px', fontSize: '0.85rem',
                      background: newItem.category === cat.id ? 'rgba(233, 69, 96, 0.2)' : 'rgba(0,0,0,0.2)',
                      border: newItem.category === cat.id ? '2px solid #e94560' : '1px solid rgba(255,255,255,0.1)',
                      color: '#fff',
                    }}>
                    {cat.icon} {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontFamily: 'Inter, sans-serif' }}>Color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {COLORS.map(color => (
                  <button key={color} onClick={() => setNewItem({ ...newItem, color })} style={{
                    width: '32px', height: '32px', borderRadius: '50%', border: newItem.color === color ? '3px solid #fff' : '2px solid rgba(255,255,255,0.2)',
                    background: color, cursor: 'pointer',
                  }} />
                ))}
              </div>
            </div>

            <button onClick={addToCloset} disabled={!newItem.name.trim()}
              style={{ ...styles.button, ...styles.primaryButton, width: '100%', marginTop: '16px', opacity: newItem.name.trim() ? 1 : 0.5 }}>
              Add to Closet
            </button>
          </div>
        </div>
      )}

      {showAuth && <AuthModal />}
      {showUpgrade && <UpgradeModal />}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// Export wrapped with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <FitCheckApp />
    </AuthProvider>
  );
}
