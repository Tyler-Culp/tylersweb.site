import express from 'express';
import querystring from 'querystring';
import fetch from 'node-fetch';
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from './config.mjs';

const app = express();

const PORT = 3000;

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

app.get('/login', (req, res) => {

  console.log("login page reached");
  const scope = 'user-top-read'; // Specify required scope for top songs

  res.redirect(`https://accounts.spotify.com/authorize?${querystring.stringify({
    response_type: 'code',
    client_id: CLIENT_ID,
    scope,
    redirect_uri: REDIRECT_URI,
  })}`)
});
  
app.get('/callback', async (req, res) => {
  console.log("callback page reached");
  const { code } = req.query;
  console.log(`code = ${code}`);
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
    let accessToken = tokenData.access_token;

    console.log("Top songs reached");
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
  
      let topSongs = await response.json();
      let list = "<ul>";
      // topSongs = topSongs.items[0].name; // This is the way to get the name of each song from the items list
      // topSongs = topSongs.items[0].artists[0].name; // This is the way to get the name of each artist from the list of 'items' in the JSON
      topSongs = topSongs.items;
      for (let i = 0 ; i < topSongs.length ; i++) {
        let song = topSongs[i].name;
        let artist = topSongs[i].artists[0].name;
        list += `<li> ${i + 1} : ${artist} - ${song}</li>`;
      }
      list += `</ul>`
      console.log(`top songs json = ${list}`);


  
      // Display the user's top songs
      res.send(`<h1>Your Top Songs on Spotify</h1><pre>${list}</pre><br><br>
                <button onclick="logout()">Log Out Here</button>
                <script>
                  async function logout() {
                    let tempWindow = ""
                    await setTimeout(() => {
                      tempWindow = window.open("https://www.spotify.com/logout/","_blank");
                    }, 0);
                    setTimeout(() => {
                      window.location.href = "https://tylersweb.site/spotifyStuff.html";
                    }, 0);
                  }
                </script>`);
    } catch (error) {
      console.error('Error:', error.message);
      res.status(500).send('Error fetching top songs');
    }

  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Error obtaining access token');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
