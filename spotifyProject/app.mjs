import express from 'express';
import querystring from 'querystring';
import fetch from 'node-fetch';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from './config.mjs';

const app = express();
app.use(cookieParser());

app.use(session({
  secret: "A very secretive key",
  resave: false,
  saveUninitialized: true
}));

const PORT = 3001;

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
  let accessToken = "";
  const { code } = req.query;
  console.log(`code = ${code}`);

  if (req.session.accessToken) {
    accessToken = req.session.accessToken;
  }
  else{
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
        // throw new Error(`Token request failed with status ${tokenResponse.status}`);
        alert('token Response:', tokenResponse.status);
        return res.redirect("https://tylersweb.site/spotifyProject/logout");
      }

      const tokenData = await tokenResponse.json();
      console.log(`tokenData = ${tokenData}`);
      accessToken = tokenData.access_token;
      console.log(`accessToken = ${accessToken}`);
      req.session.accessToken = accessToken;
    } catch (error) {
      console.error('Error1:', error.message);
      alert('Error1:', error.message);
      return res.redirect("https://tylersweb.site/spotifyProject/logout");
    }
  }


  console.log("Top songs reached");
  try {
    let timeRange = req.query.timeRange;
    if (!timeRange) {
      timeRange = "medium_term"
    }

    // Fetch the user's top songs using the access token
    const response = await fetch(`${SPOTIFY_API_BASE}/me/top/tracks?time_range=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      alert('Spotify API response error:', response.status);
      return res.redirect("https://tylersweb.site/spotifyProject/logout");
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
                    <button id="short_term" onclick="updateTimeRange('short_term')">Last Month</button>
                    <button id="medium_term" onclick="updateTimeRange('medium_term')">Last 6 Month</button>
                    <button id="long_term" onclick="updateTimeRange('long_term')">All Time</button>
                  <h1>Your Top Songs on Spotify</h1><pre>${list}</pre><br><br>
                  <button onclick="logout()">Log Out Here</button>
                  <script>
                    function updateTimeRange(timeRange) {
                      // Update the URL with the new query parameter without reloading the page
                      const url = new URL(window.location);
                      url.searchParams.set('timeRange', timeRange);
                      history.pushState(null, '', url.toString());
                      
                      // Reload the page
                      location.reload();
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
                        window.location.href = "https://tylersweb.site/spotifyProject/logout";
                      }, 0);
                    }
                  </script>
                </body>
              </html>`);
  } catch (error) {
    alert('Error rendering list:', error.message);
    return res.redirect("https://tylersweb.site/spotifyProject/logout");
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error clearing session:', err);
    }

    // Redirect the user to https://tylersweb.site
    res.redirect('https://tylersweb.site/spotifyStuff.html');
  });
});
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
