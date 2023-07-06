# PrivateYouTubeSync

PrivateYouTubeSync is a tool designed to bypass the YouTube API restrictions on private and unlisted videos. It fetches data from your organization's own YouTube channel to display the contents in an app, even when the videos are private/unlisted.

## Features
- Fetches data from your organization's YouTube channel, including private and unlisted videos.
- Organizes and saves playlist data (including titles and video information) in a local JSON file.
- Converts the saved data to a CSV file for easy parsing and usage.
- Downloads thumbnail images from each video in the playlists and saves them in a local directory.

## Installation

Before you begin, make sure you have Node.js installed on your machine.

1. Clone this repository to your local machine:
    ```bash
    git clone https://github.com/zac-bostick/PrivateYouTubeSync.git
    ```
2. Navigate to the project directory and install the dependencies:
    ```bash
    cd PrivateYouTubeSync
    npm install
    ```
3. Rename the `mycredentials.json` to `credentials.json` and replace the contents with your own OAuth2 client credentials from your Google Cloud Console.
4. Start the application by running: 
    ```bash
    npm start
    ```
    The server will start and listen on port 3000.

### OAuth2 Flow
- Navigate to http://localhost:3000/ in your web browser.
- You will be redirected to the Google OAuth2 authorization page.
- Sign in with the Google account associated with the YouTube channel you want to fetch data from.
- After successful authentication, the application will fetch all playlists from your YouTube channel, including private and unlisted videos.
- The fetched data is then saved in playlists_with_titles_and_videos.json, converted to CSV in playlists_with_videos.csv, and all video thumbnails are downloaded to the thumbnails directory.

### Important Notes

- The server runs on port 3000.
- OAuth2 is used for YouTube API authentication. Make sure you have a valid `credentials.json` file in your project root directory. This file should contain your OAuth2 client credentials, including `client_id`, `client_secret`, and `redirect_uris`. You can get these credentials from your Google Cloud Console.
- The application starts by taking you to the authentication page where you authenticate your Google account and grant access to the YouTube Data API.
- On successful authorization, the application receives an OAuth2 code which it exchanges for access and refresh tokens.
- The application then fetches all your playlists and their respective videos using the YouTube Data API.
- The data fetched includes video titles, descriptions, IDs, and high resolution thumbnails, which are saved in a JSON file and also converted to a CSV file.
- Thumbnails are downloaded and saved in a separate folder.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

This project is licensed under the terms of the [MIT license](LICENSE.txt).

