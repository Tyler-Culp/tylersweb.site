const express = require('express');
const http = require('http');
const querystring = require('querystring');
const app = express();
const PORT = process.env.PORT || 3000;

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'https://tylersweb.site/spotifyProject/callback'; // Update with your actual redirect URI
const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

let accessToken = '';

app.get('/login', (req, res) => {
    const scope = 'user-top-read'; // Specify required scope for top songs
  
    // Generate a random state value (can be more secure in production)
    const state = Math.random().toString(36).substring(7);
  
    // Redirect the user to the Spotify Accounts service for authorization
    res.redirect(`https://accounts.spotify.com/authorize?${querystring.stringify({
      response_type: 'code',
      client_id: CLIENT_ID,
      scope,
      redirect_uri: REDIRECT_URI,
      state,
    })}`);
  });
  
  app.get('/callback', async (req, res) => {
    const { code, state } = req.query;
  
    // Verify the state parameter to prevent CSRF attacks
    if (state !== 'your-random-state') {
      return res.status(400).send('Invalid state parameter');
    }
  
    try {
      // Exchange the authorization code for an access token
      const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
        },
        body: querystring.stringify({
          grant_type: 'authorization_code',
          code,
          redirect_uri: REDIRECT_URI,
        }),
      });
  
      if (!tokenResponse.ok) {
        throw new Error('Token request failed');
      }
  
      const tokenData = await tokenResponse.json();
      accessToken = tokenData.access_token;
  
      // Redirect to a new URL where the user's top songs are displayed
      res.redirect('/top-songs');
    } catch (error) {
      console.error('Error:', error.message);
      res.status(500).send('Error obtaining access token');
    }
  });
  
  app.get('/top-songs', async (req, res) => {
    try {
      // Fetch the user's top songs using the access token
      const response = await fetch(`${SPOTIFY_API_BASE}/me/top/tracks`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });
  
      if (!response.ok) {
        throw new Error('Top songs request failed');
      }
  
      const topSongs = await response.json();
  
      // Display the user's top songs
      res.send(`<h1>Your Top Songs on Spotify</h1><pre>${JSON.stringify(topSongs, null, 2)}</pre>`);
    } catch (error) {
      console.error('Error:', error.message);
      res.status(500).send('Error fetching top songs');
    }
  });
  
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });