const express = require('express');
const fs = require('fs');
const https = require('https');
const path = require('path');
const { google } = require('googleapis');
const { Parser } = require('json2csv');
const credentials = require('./credentials.json');

const app = express();
const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const { client_id, client_secret, redirect_uris } = credentials.installed;
const oauth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
const scopes = ['https://www.googleapis.com/auth/youtube.readonly'];
const authUrl = oauth2Client.generateAuthUrl({ access_type: 'offline', scope: scopes });

async function convertJsonToCsv() {
  const playlists = require('./playlists_with_titles_and_videos.json');

  const flattenedData = playlists.reduce((arr, playlist) => {
    playlist.videos.forEach(video => {
      const thumbnailUrl = video.snippet.thumbnails?.maxres?.url || video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url;

      arr.push({
        playlistId: playlist.id,
        playlistTitle: playlist.title,
        videoId: video.contentDetails.videoId,
        videoTitle: video.snippet.title,
        videoDescription: video.snippet.description,
        videoThumbnailUrl: thumbnailUrl,
        videoPublishedAt: video.snippet.publishedAt
      });
    });
    return arr;
  }, []);

  const parser = new Parser();
  const csv = parser.parse(flattenedData);

  fs.writeFileSync('playlists_with_videos.csv', csv);
  console.log('CSV conversion complete');
}

function downloadImage(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  https.get(url, (response) => {
    response.pipe(file);
    file.on('finish', () => {
      file.close(cb);
    });
  });
}

app.get('/', (req, res) => {
  res.redirect(authUrl);
});

app.get('/oauth2callback', (req, res) => {
  const code = req.query.code;
  oauth2Client.getToken(code, async (err, tokens) => {
    if (err) {
      console.error('Error retrieving access token:', err);
      return;
    }

    oauth2Client.setCredentials(tokens);
    console.log('Successfully retrieved tokens');

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    async function fetchAllPlaylists(pageToken) {
      const response = await youtube.playlists.list({
        part: 'snippet,contentDetails',
        mine: true,
        maxResults: 50,
        pageToken: pageToken  
      });

      let playlists = response.data.items;

      if (response.data.nextPageToken) {
        const nextPagePlaylists = await fetchAllPlaylists(response.data.nextPageToken);
        playlists = playlists.concat(nextPagePlaylists);
      }
      if (playlists.length > 1) {
        playlists.pop();
      }
      return playlists;
    }

    const playlists = await fetchAllPlaylists();
    console.log('Successfully retrieved playlists');
      
    for (let playlist of playlists) {
      const playlistItemsResponse = await youtube.playlistItems.list({
        playlistId: playlist.id,
        part: 'snippet,contentDetails',
        maxResults: 200  
      });
      playlist.videos = playlistItemsResponse.data.items;
    }

    const dataToSave = playlists.map(playlist => {
      return {
        id: playlist.id,
        title: playlist.snippet.title,
        videos: playlist.videos
      };
    });

    fs.writeFileSync('playlists_with_titles_and_videos.json', JSON.stringify(dataToSave, null, 2));
    console.log('Playlists, their titles and videos saved to playlists_with_titles_and_videos.json');

    await convertJsonToCsv();

    fs.mkdir(path.join(__dirname, 'thumbnails'), { recursive: true }, (err) => {
      if (err) throw err;
    });

    dataToSave.forEach((playlist) => {
      playlist.videos.forEach((video) => {
        if (video.snippet.thumbnails && video.snippet.thumbnails.maxres) {
          const imageUrl = video.snippet.thumbnails.maxres.url;
          const videoId = video.snippet.resourceId.videoId;
          const imagePath = path.join(__dirname, 'thumbnails', `${videoId}.jpg`);

          downloadImage(imageUrl, imagePath, (err) => {
            if (err) throw err;
            console.log(`Downloaded image for video ${videoId}`);
          });
        } else {
          console.log(`No high resolution thumbnail available for video ${video.snippet.resourceId.videoId}`);
        }
      });
    });

    res.send('Playlists, their titles and videos saved. Images are downloading.'); 
  });
});
