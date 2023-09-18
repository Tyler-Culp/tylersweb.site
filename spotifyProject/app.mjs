import express from 'express';
import querystring from 'querystring';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from './config.mjs';

const app = express();
app.use(cookieParser());

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
  let cookieToken = req.cookies.token;
  let accessToken = ""
  if (cookieToken && (new Date(cookieToken.expires)) > new Date()) {
    console.log("cookie set")
    accessToken = cookieToken
  }
  else {
    res.clearCookie('token');
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
  
      let expirationDate = new Date();
      expirationDate.setTime(expirationDate.getTime() + (60 * 60 * 1000));
      res.cookie('token', accessToken, {
        expires: expirationDate
      });
    } catch (error) {
      console.error('Error:', error.message);
      return es.status(500).send('Error obtaining access token');
    }
  }

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
    res.send(`<!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta http-equiv="X-UA-Compatible" content="IE=edge">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Top Songs</title>
                  <link rel="stylesheet" href="../app.css">
                </head>
                <body>
                  <nav>
                    <button id="short_term" onclick="shortTerm()">Last Month</button>
                    <button id="medium_term" onclick="mediumTerm()">Last 6 Month</button>
                    <button id="long_term" onclick="longTerm()">All Time</button>
                  <h1>Your Top Songs on Spotify</h1><pre>${list}</pre><br><br>
                  <button onclick="logout()">Log Out Here</button>
                  <script>
                    function shortTerm() {

                    }
                    
                    function mediumTerm() {

                    }

                    function longTerm() {

                    }
                    
                    async function logout() {
                      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                      let tempWindow = ""
                      await setTimeout(() => {
                        tempWindow = window.open("https://www.spotify.com/logout/");
                        tempWindow.blur();
                        window.focus();
                      }, 0);
                      setTimeout(() => {
                        window.location.href = "https://tylersweb.site/spotifyStuff.html";
                      }, 0);
                    }
                  </script>
                </body>
              </html>`);
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).send('Error fetching top songs');
  }

});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
