# Youtube Subscriptions to Playlist
This Google Apps Script allows you to automatically add all new uploads from all YouTube channels you are subscribed to to a playlist of your choice.

The script maintains its data (which videos were already added to the playlist) in a Google Spreadsheet. This way you can easily review and maintain the video list if you need to.

The main purpose for me was to get rid of RSS subscriptions to YouTube channels only to then open up all new videos and manually adding them to "Watch Later". This script adds all videos from your subscribed channels to a playlist of your choice - e.g. "Watch Later".

# Setup
For the moment:
- Create a spreadsheet
- Select Tools -> Script Editor
- Paste the code from `Code.gs` and save
- Refresh the Spreadsheet (F5)
- Accept API permissions

After accepting all API permissions you should see a menu item on top with the label "YouTube Subscriptions to Playlist".

As this is not an Add-on (yet) you have to then click the menu, go to "Advanced" and select "Run Complete Installation".

Follow the instructions to copy your playlist ID and then the current videos from all your subscribed channels will be imported. From this moment every hour the script will check for new videos and add them to your playlist automatically.

# Usage
After installation, this script runs automatically. You can use YouTube and the selected playlist as before. Just from time to time videos get added to the selected playlist and you can watch and remove them to your liking.
