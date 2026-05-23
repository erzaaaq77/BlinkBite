import React, { useState, useRef, useEffect, useCallback } from 'react';
import { aiService } from '../services/aiService';
import {tokenService} from '../services/tokenService';
const AiChat = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState(null);
    const [userName, setUserName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);


const ACCESS_TOKEN_KEY = "access_token";

const getStoredToken = () => {
    try {
        const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
        if (sessionToken) return sessionToken;

        const legacyToken = localStorage.getItem(ACCESS_TOKEN_KEY) || "";
        if (legacyToken) {
            sessionStorage.setItem(ACCESS_TOKEN_KEY, legacyToken);
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            return legacyToken;
        }
        
        const oldToken = localStorage.getItem('token');
        if (oldToken) return oldToken;
        
    } catch (err) {
        console.error("Token storage read failed", err);
    }
    return "";
};

    const decodeToken = (token) => {
        try {
            const payload = token.split('.')[1];
            const decoded = JSON.parse(atob(payload));
            return decoded;
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    };

    const getRoleStyles = () => {
        switch (userRole) {
            case 'customer':
                return {
                    gradient: 'from-green-500 to-emerald-600',
                    buttonBg: 'bg-green-600 hover:bg-green-700',
                    icon: '🍕',
                    badge: 'Customer Support'
                };
            case 'merchant':
                return {
                    gradient: 'from-blue-500 to-indigo-600',
                    buttonBg: 'bg-blue-600 hover:bg-blue-700',
                    icon: '📊',
                    badge: 'Merchant Help'
                };
            case 'driver':
                return {
                    gradient: 'from-orange-500 to-red-600',
                    buttonBg: 'bg-orange-600 hover:bg-orange-700',
                    icon: '🚗',
                    badge: 'Driver Assistant'
                };
            case 'admin':
                return {
                    gradient: 'from-purple-500 to-pink-600',
                    buttonBg: 'bg-purple-600 hover:bg-purple-700',
                    icon: '🛠️',
                    badge: 'Admin Console'
                };
            default:
                return {
                    gradient: 'from-blue-500 to-cyan-600',
                    buttonBg: 'bg-blue-600 hover:bg-blue-700',
                    icon: '🤖',
                    badge: 'AI Assistant'
                };
        }
    };

    const roleStyles = getRoleStyles();

    const getWelcomeMessage = (role, name) => {
        const hour = new Date().getHours();
        const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
        
        switch (role) {
            case 'customer':
                return `${greeting} ${name}! 👋 I'm your BlinkBite AI assistant. I can help you with:\n\n• Finding restaurants and dishes\n• Tracking your orders 🚚\n• Answering questions about delivery\n• Managing your favorites ⭐\n\nWhat would you like to order today? 🍕`;
            
            case 'merchant':
                return `${greeting} ${name}! 📊 Welcome to your merchant dashboard. I can assist you with:\n\n• Managing your menu items 🍽️\n• Viewing order statistics 📈\n• Updating restaurant information\n• Checking pending orders\n• Sales reports and analytics\n\nHow can I help your business grow today?`;
            
            case 'driver':
                return `${greeting} ${name}! 🚗 Ready for deliveries? I can help you with:\n\n• Finding the fastest routes 🗺️\n• Checking delivery status\n• Getting customer contact info\n• Reporting delivery issues\n• Tracking your earnings 💰\n\nWhat do you need assistance with?`;
            
            case 'admin':
                return `${greeting} ${name}! 🛠️ Welcome to admin panel. I can help you manage:\n\n• User accounts and roles 👥\n• Platform analytics 📊\n• System health monitoring\n• Merchant approvals\n• Dispute resolution\n\nWhat would you like to monitor today?`;
            
            default:
                return `${greeting}! 🤖 I'm your BlinkBite AI assistant. How can I help you today?`;
        }
    };

    useEffect(() => {
        const checkLoginStatus = () => {
            const token = tokenService.getToken();
            console.log('🔍 Token from tokenService:', token ? 'YES - ' + token.substring(0, 20) + '...' : 'NO');
            
            if (!token) {
                setIsLoggedIn(false);
                setUserRole(null);
                setMessages([{
                    id: '1',
                    text: "🔐 Please log in to use the BlinkBite AI assistant. Once logged in, I can help you with orders, recommendations, and more!",
                    sender: 'ai',
                    timestamp: new Date()
                }]);
                return;
            }
            
            setIsLoggedIn(true);
            const userData = decodeToken(token);
            
            if (userData) {
                const role = userData.role || userData.Role || userData['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
                const name = userData.name || userData.Name || userData.unique_name || userData.email || 'User';
                const email = userData.email || userData.Email || '';
                
                setUserRole(role?.toLowerCase());
                setUserName(name);
                setUserEmail(email);
                
                setMessages([{
                    id: '1',
                    text: getWelcomeMessage(role?.toLowerCase(), name),
                    sender: 'ai',
                    timestamp: new Date()
                }]);
            }
        };
        
        checkLoginStatus();
        
        
        window.addEventListener('storage', checkLoginStatus);
        return () => window.removeEventListener('storage', checkLoginStatus);
    }, []);


   useEffect(() => {
        const checkTokenOnFocus = () => {
            const token = tokenService.getToken();
            
            if (token && !isLoggedIn) {
                // Sapo u logua, rifresko chat-in
                const userData = decodeToken(token);
                if (userData) {
                    const role = userData.role || userData.Role || userData['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
                    const name = userData.name || userData.Name || userData.unique_name || userData.email || 'User';
                    const email = userData.email || userData.Email || '';
                    
                    setIsLoggedIn(true);
                    setUserRole(role?.toLowerCase());
                    setUserName(name);
                    setUserEmail(email);
                    setMessages([{
                        id: Date.now().toString(),
                        text: getWelcomeMessage(role?.toLowerCase(), name),
                        sender: 'ai',
                        timestamp: new Date()
                    }]);
                }
            } else if (!token && isLoggedIn) {
                // U bë logout
                setIsLoggedIn(false);
                setUserRole(null);
                setMessages([{
                    id: Date.now().toString(),
                    text: "🔐 You have been logged out. Please log in again to continue using the AI assistant.",
                    sender: 'ai',
                    timestamp: new Date()
                }]);
            }
        };

        window.addEventListener('focus', checkTokenOnFocus);
        return () => window.removeEventListener('focus', checkTokenOnFocus);
    }, [isLoggedIn]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        if (isOpen && !isMinimized && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen, isMinimized]);

    const formatTime = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return;
        
        const token = tokenService.getToken();
        if (!token) {
            const loginMessage = {
                id: Date.now().toString(),
                text: "🔐 Please log in to continue using the AI assistant. Click the login button in the top right corner.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, loginMessage]);
            setInputValue('');
            return;
        }

        const userMessage = {
            id: Date.now().toString(),
            text: inputValue,
            sender: 'user',
            timestamp: new Date()
        };
        
        setMessages(prev => [...prev, userMessage]);
        setInputValue('');
        setIsLoading(true);

        try {
            const aiReply = await aiService.sendMessage(inputValue, userRole);
            const aiMessage = {
                id: (Date.now() + 1).toString(),
                text: aiReply,
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMessage]);
        } catch (error) {
            const errorMessage = {
                id: (Date.now() + 1).toString(),
                text: "❌ Sorry, something went wrong. Please try again in a moment.",
                sender: 'ai',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const clearChat = () => {
        setMessages([{
            id: Date.now().toString(),
            text: getWelcomeMessage(userRole, userName),
            sender: 'ai',
            timestamp: new Date()
        }]);
    };

    if (!isLoggedIn) {
        return (
            <button
                onClick={() => { window.location.hash = "/login"; }}
                className="fixed bottom-4 right-4 bg-gray-600 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-all duration-300 z-50 group flex items-center gap-2 hover:scale-105"
            >
                <span className="text-xl">🔐</span>
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">Login to Chat</span>
            </button>
        );
    }

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed bottom-4 right-4 ${roleStyles.buttonBg} text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 group flex items-center gap-2 hover:scale-105`}
            >
                <span className="text-2xl">{roleStyles.icon}</span>
                <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 whitespace-nowrap">
                    {roleStyles.badge}
                </span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 right-4 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-gray-200 animate-slideUp">
            {/* Header */}
            <div className={`bg-gradient-to-r ${roleStyles.gradient} text-white p-4`}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                            {roleStyles.icon}
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">BlinkBite AI</h3>
                            <p className="text-xs opacity-90">{roleStyles.badge} • {userName}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={clearChat}
                            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                            title="Clear chat"
                        >
                            🗑️
                        </button>
                        <button
                            onClick={() => setIsMinimized(!isMinimized)}
                            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                            {isMinimized ? '□' : '−'}
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
                {userEmail && (
                    <div className="text-xs opacity-75 mt-1 ml-12">
                        {userEmail}
                    </div>
                )}
            </div>

            {/* Messages Area */}
            {!isMinimized && (
                <>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                            >
                                <div className={`max-w-[80%] ${msg.sender === 'user' ? 'order-2' : 'order-1'}`}>
                                    <div
                                        className={`p-3 rounded-2xl ${
                                            msg.sender === 'user'
                                                ? `bg-gradient-to-r ${roleStyles.gradient} text-white rounded-br-sm`
                                                : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                                        }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                                    </div>
                                    {msg.timestamp && (
                                        <p className={`text-xs text-gray-400 mt-1 ${msg.sender === 'user' ? 'text-right' : 'text-left'}`}>
                                            {formatTime(msg.timestamp)}
                                        </p>
                                    )}
                                </div>
                                {msg.sender === 'ai' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm mr-2 order-1">
                                        {roleStyles.icon}
                                    </div>
                                )}
                            </div>
                        ))}
                        
                        {isLoading && (
                            <div className="flex justify-start animate-fadeIn">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm mr-2">
                                    {roleStyles.icon}
                                </div>
                                <div className="bg-white text-gray-800 p-3 rounded-2xl rounded-bl-sm shadow-sm">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Suggestions */}
                    <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            {userRole === 'customer' && (
                                <>
                                    <QuickSuggestion text="🍕 Find pizza near me" onClick={() => setInputValue("Find pizza restaurants near me")} />
                                    <QuickSuggestion text="🚚 Track my order" onClick={() => setInputValue("Track my order")} />
                                    <QuickSuggestion text="🎟️ Promo codes" onClick={() => setInputValue("Do you have any promo codes?")} />
                                </>
                            )}
                            {userRole === 'merchant' && (
                                <>
                                    <QuickSuggestion text="📊 Today's orders" onClick={() => setInputValue("Show me today's orders")} />
                                    <QuickSuggestion text="🍽️ Update menu" onClick={() => setInputValue("How do I update my menu?")} />
                                    <QuickSuggestion text="💰 Revenue report" onClick={() => setInputValue("Show me my revenue report")} />
                                </>
                            )}
                            {userRole === 'driver' && (
                                <>
                                    <QuickSuggestion text="🗺️ Best route" onClick={() => setInputValue("What's the best route for my next delivery?")} />
                                    <QuickSuggestion text="📦 Pending deliveries" onClick={() => setInputValue("Show me my pending deliveries")} />
                                    <QuickSuggestion text="💰 Today's earnings" onClick={() => setInputValue("How much did I earn today?")} />
                                </>
                            )}
                            {userRole === 'admin' && (
                                <>
                                    <QuickSuggestion text="👥 User stats" onClick={() => setInputValue("Show me user statistics")} />
                                    <QuickSuggestion text="📈 Platform analytics" onClick={() => setInputValue("Platform analytics for today")} />
                                    <QuickSuggestion text="🏪 New merchants" onClick={() => setInputValue("Show pending merchant approvals")} />
                                </>
                            )}
                        </div>
                    </div>

                    {/* Input Area */}
                    <div className="p-4 bg-white border-t border-gray-200">
                        <div className="flex gap-2">
                            <textarea
                                ref={inputRef}
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Type your message..."
                                rows="1"
                                className="flex-1 p-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-sm"
                                style={{ maxHeight: '100px' }}
                                disabled={isLoading}
                            />
                            <button
                                onClick={handleSendMessage}
                                disabled={isLoading || !inputValue.trim()}
                                className={`${roleStyles.buttonBg} text-white px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
                            >
                                <span>Send</span>
                                <span>➤</span>
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 mt-2 text-center">
                            AI assistant may make mistakes. Verify important information.
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

const QuickSuggestion = ({ text, onClick }) => (
    <button
        onClick={onClick}
        className="px-3 py-1 bg-white border border-gray-300 rounded-full text-sm hover:bg-gray-100 transition-colors whitespace-nowrap"
    >
        {text}
    </button>
);

export default AiChat;