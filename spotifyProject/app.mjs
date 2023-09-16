import express from 'express';
import querystring from 'querystring';
import fetch from 'node-fetch';
import cors from 'cors'
import { CLIENT_ID, CLIENT_SECRET, REDIRECT_URI } from './config.mjs';

const app = express();

const corsOptions = {
  origin: 'https://spotify.com', // Allow requests from this domain
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
  credentials: true, // Allow cookies and credentials to be sent
};

app.use((req, res, next) => {
  console.log("In app.use");
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});
app.use(cors(corsOptions));

const PORT = 3000;


const SPOTIFY_API_BASE = 'https://api.spotify.com/v1';

app.get('/login', (req, res) => {

  console.log("login page reached");
  const scope = 'user-top-read'; // Specify required scope for top songs

  // Generate a random state value (can be more secure in production)
  // Redirect the user to the Spotify Accounts service for authorization
  res.setHeader('Cache-Control', 'no-store');
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
      topSongs = topSongs.items[0];
      // topSongs = topSongs.items[0].artists[0].name; // This is the way to get the name of each artist from the list of 'items' in the JSON
      console.log(`top songs json = ${topSongs}`);


  
      // Display the user's top songs
      res.send(`<h1>Your Top Songs on Spotify</h1><pre>${JSON.stringify(topSongs, null, 2)}</pre><br><br>
                <button onclick="logout()">Log Out Here</button>
                <script>
                  async function logout() {
                    // try {
                    //   let resp = await fetch("https://www.spotify.com/logout/");
                    //   if (resp.status === 200) {
                    //     window.location.href = "https://tylersweb.site/spotifyProject/login";
                    //   }
                    //   else{
                    //     console.log("Responded with " + response.status);
                    //   }
                    // }
                    // catch (err) {
                    //   console.error("Fetch request error: " + err);
                    // }
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

// app.get("/logout", async (req, res) => {
//   fetch("https://www.spotify.com/logout/")
//   .then(r => {
//     if (r.status == 200 ) {
//       res.redirect("https://tylersweb.site/spotifyStuff.html");
//     }
//     else {
//       console.log(`r = ${r}`);
//     }
//   })
//   .catch(err => {
//     console.log(`logout failed : err = ${err}`);
//   });
// });

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
