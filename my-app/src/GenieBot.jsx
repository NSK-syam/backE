import React, { useState } from 'react';
import './premiumStyles.css';

const GenieBot = ({ weather, closet, currentLocation, onFetchWeather, tempUnit = 'F', themeId = 'dark' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { text: "Hi! I'm your StyleGenie. 🧞‍♀️ How can I help you sparkle today?", sender: 'bot' }
    ]);
    const [inputValue, setInputValue] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);

    const getWeatherAdvice = (temp) => {
        if (!temp || temp === '--') return "I'm not sure about the temperature right now, but always dress for confidence!";
        const t = parseInt(temp);
        const isCelsius = tempUnit === 'C';

        // Thresholds
        const hot = isCelsius ? 27 : 80;
        const warm = isCelsius ? 18 : 65;
        const brisk = isCelsius ? 7 : 45;

        if (t > hot) return `It's quite hot at ${t}°${tempUnit}! I recommend light, breathable fabrics like linen or thin cotton.`;
        if (t > warm) return `The weather is lovely and warm. A light shirt or a stylish tee would be perfect.`;
        if (t > brisk) return `It's a bit brisk out there. Consider layering with a light jacket or a cozy sweater.`;
        return "Brrr! It's cold! You definitely need your warmest coat and perhaps some thermal layers.";
    };

    const getOutfitSuggestion = (temp, items) => {
        if (!items || items.length === 0) return "Your closet is empty! Add some pieces so I can style them for you.";

        const t = parseInt(temp) || (tempUnit === 'F' ? 70 : 21);
        const isCelsius = tempUnit === 'C';

        // Map temperature to "warmth" scale 1-5
        let targetWarmth = 3;
        if (isCelsius) {
            if (t < 4) targetWarmth = 5;
            else if (t < 13) targetWarmth = 4;
            else if (t < 21) targetWarmth = 3;
            else if (t < 29) targetWarmth = 2;
            else targetWarmth = 1;
        } else {
            if (t < 40) targetWarmth = 5;
            else if (t < 55) targetWarmth = 4;
            else if (t < 70) targetWarmth = 3;
            else if (t < 85) targetWarmth = 2;
            else targetWarmth = 1;
        }

        const suitableItems = items.filter(item => Math.abs(item.warmth - targetWarmth) <= 1);
        const piece = suitableItems.length > 0
            ? suitableItems[Math.floor(Math.random() * suitableItems.length)]
            : items[Math.floor(Math.random() * items.length)];

        return `Based on the ${t}°${tempUnit} weather, I suggest wearing your **${piece.name}**. It has a warmth level of ${piece.warmth}/5!`;
    };

    const handleSend = async (e, forcedText = null) => {
        if (e) e.preventDefault();
        const text = forcedText || inputValue;
        if (!text.trim()) return;

        setMessages(prev => [...prev, { text, sender: 'user' }]);
        setInputValue("");
        setIsProcessing(true);

        // AI Logic
        setTimeout(async () => {
            let response = "I'm still learning my magic spells! ✨ Try asking about the weather or an outfit.";
            const lowerText = text.toLowerCase();

            if (lowerText.includes('weather')) {
                const condition = weather?.condition || "unknown";
                const temp = weather?.temp || "--";
                const loc = weather?.location || currentLocation;
                response = `It's currently **${condition}** and **${temp}°${tempUnit}** in **${loc}**. ${getWeatherAdvice(temp)}`;
            }
            else if (lowerText.includes('outfit') || lowerText.includes('wear') || lowerText.includes('suggest')) {
                response = getOutfitSuggestion(weather?.temp, closet);
            }
            else if (lowerText.includes('hello') || lowerText.includes('hi')) {
                response = "Hello there! I'm ready to help you find the perfect look for any weather. 🌤️";
            }
            // Travel Mode: "trip to London", "weather in Tokyo"
            else if (lowerText.includes('in ') || lowerText.includes('to ')) {
                const parts = text.split(/in |to /i);
                if (parts.length > 1) {
                    const destination = parts[1].trim();
                    response = `Fetching the magical winds for **${destination}**... 🌬️ Please check the dashboard in a second!`;
                    if (onFetchWeather) onFetchWeather(destination);
                }
            }

            setMessages(prev => [...prev, { text: response, sender: 'bot' }]);
            setIsProcessing(false);
        }, 800);
    };

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 2000 }}>
            {/* Chat Window */}
            {isOpen && (
                <div className="fade-in-up premium-card" style={{
                    width: '320px',
                    height: '450px',
                    marginBottom: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    background: 'rgba(30, 41, 59, 0.95)', // Matches Dark Theme
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
                }}>
                    {/* Header */}
                    <div style={{
                        padding: '15px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '1.5rem' }}>🧞‍♀️</span>
                            <span style={{ fontWeight: '700' }}>StyleGenie Assistant</span>
                        </div>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
                    </div>

                    {/* Messages Area */}
                    <div style={{ flex: 1, padding: '15px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{
                                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.sender === 'user' ? '#667eea' : 'rgba(255,255,255,0.1)',
                                color: 'white',
                                padding: '10px 15px',
                                borderRadius: '12px',
                                borderBottomRightRadius: msg.sender === 'user' ? '2px' : '12px',
                                borderBottomLeftRadius: msg.sender === 'bot' ? '2px' : '12px',
                                maxWidth: '80%',
                                fontSize: '0.9rem',
                                lineHeight: '1.4'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                    </div>

                    {/* Quick Actions */}
                    <div style={{ padding: '10px', display: 'flex', gap: '5px', overflowX: 'auto' }}>
                        {['Suggest Outfit', 'Check Weather', 'My Closet'].map(action => (
                            <button key={action}
                                onClick={() => handleSend(null, action)}
                                disabled={isProcessing}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#a5b4fc',
                                    padding: '5px 10px',
                                    borderRadius: '15px',
                                    fontSize: '0.75rem',
                                    whiteSpace: 'nowrap',
                                    cursor: 'pointer',
                                    opacity: isProcessing ? 0.5 : 1
                                }}>
                                {action}
                            </button>
                        ))}
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSend} style={{ padding: '15px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: '10px' }}>
                        <input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask me anything..."
                            style={{
                                flex: 1,
                                background: 'rgba(255,255,255,0.05)',
                                border: 'none',
                                borderRadius: '20px',
                                padding: '10px 15px',
                                color: 'white',
                                outline: 'none'
                            }}
                        />
                        <button type="submit" style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✨</button>
                    </form>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="glow-effect"
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                    color: 'white',
                    fontSize: '2rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
            >
                {isOpen ? '×' : '🧞‍♀️'}
            </button>
        </div>
    );
};

export default GenieBot;
