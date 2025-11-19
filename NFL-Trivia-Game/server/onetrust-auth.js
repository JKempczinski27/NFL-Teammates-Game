const axios = require('axios');
const apiClient = require('./apiClient');

// Replace with your actual credentials from the OneTrust Admin Portal
const clientId = 'YOUR_CLIENT_ID';
const clientSecret = 'YOUR_CLIENT_SECRET';
const tokenUrl = 'https://app.onetrust.com/api/access/v1/oauth/token';

class OAuthClient {
    constructor(clientId, clientSecret, tokenUrl) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.tokenUrl = tokenUrl;
        this.accessToken = null;
        this.tokenExpiry = null;
    }

    async getAccessToken() {
        if (!this.accessToken || this.isTokenExpired()) {
            await this.requestNewToken();
        }
        return this.accessToken;
    }

    isTokenExpired() {
        return !this.tokenExpiry || new Date() >= this.tokenExpiry;
    }

    async requestNewToken() {
        try {
            const response = await axios.post(this.tokenUrl, new URLSearchParams({
                grant_type: 'client_credentials',
                client_id: this.clientId,
                client_secret: this.clientSecret
            }), {
                headers: {
                    'Accept': 'application/json'
                }
            });

            const data = response.data;
            this.accessToken = data.access_token;
            const expiresIn = data.expires_in || 3600;
            this.tokenExpiry = new Date(new Date().getTime() + expiresIn * 1000);
        } catch (error) {
            throw new Error(`❌ Failed to obtain access token: ${error.message}`);
        }
    }
}

// Run manually from the terminal: node onetrust-auth.js
(async () => {
    const oauthClient = new OAuthClient(clientId, clientSecret, tokenUrl);
    const accessToken = await oauthClient.getAccessToken();
    console.log('✅ Access Token:', accessToken);

    // Example usage of apiClient
    // const response = await apiClient.get('/some-endpoint');
})();