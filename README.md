# Youtube Subscriptions to Playlist
This Google Apps Script allows you to automatically add all new uploads from the YouTube channels you are subscribed to to a playlist of your choice.

It maintains its data of which videos were already added to the playlist in a Google Spreadsheet. This way you can easily review and maintain the video list if you need to.

The main purpose for me was to get rid of RSS subscriptions to YouTube channels which I had to open up and add all videos manually to my "Watch Later" playlist. This script adds all new videos from your subscribed channels to a playlist of your choice - e.g. your "Watch Later" playlist.

# Setup
For the moment:
- Create a Google Spreadsheet
- Select **Tools** > **Script Editor**
- Paste the code from `Code.gs` and save the script
- Refresh the Spreadsheet (<kbd>F5</kbd>)
- Accept API permissions

After accepting all API permissions you should see a menu item in the top menu with the label <kbd>YouTube Subscriptions to Playlist</kbd>.

As this is not an Add-on (yet) you have to then click the menu item, go to <kbd>Advanced</kbd> and select <kbd>Run Complete Installation</kbd>.

Follow the instructions to copy your playlist ID and then current videos from all your subscribed channels will be imported automatically. From this moment on a timer will trigger the script every hour. The script will check for new videos and add them to your playlist and the spreadsheet automatically.

# Usage
After installation, this script runs automatically. You can use YouTube and the selected playlist as before. Just from time to time videos get added to the selected playlist and you can watch and remove them to your liking.
