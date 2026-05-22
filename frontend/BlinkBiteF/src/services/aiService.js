import api from './api';

export const aiService = {
    sendMessage: async (prompt) => {
        try {
            const response = await api.post('/ai/chat', { prompt });
            return response.data.reply;
        } catch (error) {
            console.error("Error sending message to AI:", error);
            
            if (error.response) {
                if (error.response.status === 401) {
                    return "Please log in to use the AI assistant.";
                }
                if (error.response.status === 500) {
                    return "Sorry, the AI service is temporarily unavailable. Please try again later. ";
                }
                return `Sorry, I encountered an error: ${error.response.data?.message || error.response.statusText}`;
            } else if (error.request) {
                return "Unable to connect to the server. Please check your internet connection. ";
            } else {
                return "Sorry, I couldn't process your request right now. Please try again.";
            }
        }
    }
};