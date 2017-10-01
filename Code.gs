// This Google Apps Script allows you to automatically add all
// new uploads from all YouTube channels you are subscribed to
// to a playlist of your choice.
//
// The script maintains its data which videos were already
// added in a Google Spreadsheet. This way you can easily
// review and maintain the video list if you need to.

// ---- CONSTANTS ---------------------------------------------
var SHEET_NAME = 'Videos';
var HOURS_BETWEEN_RUNS = 1;

// ---- USER INTERFACE ----------------------------------------
function changePlaylistId() {
  Logger.log('Changing playlist ID');
  
  var ui = SpreadsheetApp.getUi();
  
  // Ask user to copy playlist ID
  var response = ui.prompt(
    'YouTube Playlist ID',
    'Please copy the YouTube playlist ID where new videos should be added.\n\
Open your YouTube playlist and from the address bar copy the part after "list=".\n\n\
Example\n\
- URL: https://www.youtube.com/playlist?list=mA973cH9mwhJwxIUgT9pa9B08hesI07hOP\n\
- Playlist ID: mA973cH9mwhJwxIUgT9pa9B08hesI07hOP',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() != ui.Button.OK) {
    // The user did not press OK
    return false;
  }
  
  // The user pressed OK, store playlist ID
  var playlistId = response.getResponseText();
  PropertiesService.getDocumentProperties()
  .setProperty('PLAYLIST_ID', playlistId);
  
  return true;
}

function createMenu() {
  Logger.log('Creating custom menu');
  
  var ui = SpreadsheetApp.getUi();
  
  // Create menu displayed above the spreadsheet
  ui.createMenu('YouTube Subscriptions to Playlist')
  .addItem('Change playlist ID', 'changePlaylistId')
  .addItem('Manually trigger add new videos', 'addNewVideos')
  .addSeparator()
  .addSubMenu(
    ui.createMenu('Advanced')
    .addItem('Run Complete installation', 'install')
    .addSeparator()
    .addItem('1. Create videos sheet', 'createVideosSheet')
    .addItem('2. Import latest videos as watched', 'initializeOldVideos')
    .addItem('3. Create time trigger', 'createTimeTrigger')
    .addItem('4. Clear time trigger', 'clearAllTriggers')
  )
  .addToUi();
}

function toast(message) {
  Logger.log('Displaying toast "%s"', message);
  
  SpreadsheetApp.getActiveSpreadsheet().toast(message, 'YouTube Subscriptions to Playlist');
}

// ---- YOUTUBE ----------------------------------------------- 
function getLatestVideos() {
  Logger.log('Acquiring latest videos');
  
  // Acquire the latest 25 videos for every subscribed channel's upload playlist
  var videos = [];
  var pageToken = undefined;
  
  do {
    // Request own subscriptions
    var subscriptions = YouTube.Subscriptions.list('snippet', {
      'mine': 'true',
      'maxResults': 50, // 50 subscriptions per page is maximum
      'pageToken': pageToken
    });
    for (var s = 0; s < subscriptions.items.length; s++) {
      var subscription = subscriptions.items[s];
      
      // Request subscription channels
      var channels = YouTube.Channels.list('contentDetails', {
        'id': subscription.snippet.resourceId.channelId
      });
      for (var c = 0; c < channels.items.length; c++) {
        var channel = channels.items[c];
        
        // Request video uploads
        var playlistResponse = YouTube.PlaylistItems.list('snippet', {
          playlistId: channel.contentDetails.relatedPlaylists.uploads,
          maxResults: 25 // Acquire the latest 25 videos per channel
        });
        for (var v = 0; v < playlistResponse.items.length; v++) {
          var video = playlistResponse.items[v];
          
          // Finally add video to list
          videos.push([
            video.snippet.resourceId.videoId,
            video.snippet.title,
            subscription.snippet.title
          ]);
        }
      }
    }
    pageToken = subscriptions.nextPageToken;
  } while (pageToken !== undefined);
  
  return videos;
}

function addVideoToPlaylist(playlistId, videoId) {
  Logger.log('Saving video "%s" to playlist %s', videoId, playlistId);
  
  // Simple wrapper for adding a video to a YouTube playlist
  YouTube.PlaylistItems.insert({
    snippet: {
      playlistId: playlistId,
      resourceId: {
        videoId: videoId,
        kind: 'youtube#video'
      }
    }
  }, 'snippet');
}

// ---- SPREADSHEET -------------------------------------------
function createVideosSheet() {
  Logger.log('Creating videos sheet');
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Check if sheet with name already exists
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (sheet) {
    toast('Sheet with name "' + SHEET_NAME + '" already exists, renaming...');
    
    // Sheet with name already exists, add old-suffix
    ss.setActiveSheet(sheet);
    ss.renameActiveSheet(sheet.getName() + ' (old)');
  }
  
  // Create and set up new videos sheet
  sheet = ss.insertSheet(SHEET_NAME);
  sheet.appendRow(['Video ID', 'Video Title', 'Channel Title']);
  sheet.deleteColumns(4, sheet.getMaxColumns() - 3)
  sheet.deleteRows(2, sheet.getMaxRows() - 2)
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 150);
  sheet.setColumnWidth(2, 500);
  sheet.setColumnWidth(3, 200);
}

function addVideosToSheet(videos) {
  Logger.log('Adding videos to sheet');
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  
  // Append videos at the end of the seet
  var lastRow = sheet.getLastRow();
  sheet.insertRowsAfter(lastRow, videos.length);
  sheet.getRange(lastRow + 1, 1, videos.length, 3).setValues(videos);
}

function getOldVideos() {
  Logger.log('Acquiring old videos');
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  
  // Check if already added videos exist in spreadsheet
  if (sheet.getLastRow() <= 1) {
    return []
  }
  
  // Acquire already added videos from spreadsheet
  var range = sheet.getRange(2, 1, sheet.getLastRow() - 1);
  return [].concat.apply([], range.getValues());
}

// ---- HIGH LEVEL --------------------------------------------
function initializeOldVideos() {
  Logger.log('Initializing old videos');
  
  // Acquire all videos and simply add them to the list of added videos
  // This prevents tons of already watched videos being added to the playlist
  addVideosToSheet(getLatestVideos());
}

function addVideosToPlaylist(videos) {
  Logger.log('Adding videos to playlist');
  
  // Iterate over all videos and add them to the stored YouTube playlist
  var playlistId = PropertiesService.getDocumentProperties().getProperty('PLAYLIST_ID');
  for (var i = 0; i < videos.length; i++) {
    addVideoToPlaylist(playlistId, videos[i][0]);
  }
}

function getNewVideos() {
  Logger.log('Acquiring new videos');
  
  // Acquire latest videos from subscriptions
  var latestVideos = getLatestVideos();
  
  // Acquire videos already added to playlist
  var oldVideos = getOldVideos();
  
  // Return list of videos not yet adedd to playlist
  return latestVideos.filter(function(video) {
    // Look for video ID in list of already added videos
    return oldVideos.indexOf(video[0]) < 0;
  });
}

function addNewVideos() {
  Logger.log('Adding new videos');
  
  // Acquire new videos, add to playlist and remember not to add them again next time
  var newVideos = getNewVideos();
  if (newVideos.length > 0) {
    addVideosToPlaylist(newVideos);
    addVideosToSheet(newVideos);
    toast(newVideos.length + ' new video' + (newVideos.length > 1 ? 's have' : ' has') + ' been added to your playlist');
  } else {
    toast('No new videos were found');
  }
}

function createTimeTrigger() {
  Logger.log('Creating time trigger');
  
  // Clean up previous time triggers
  clearAllTriggers();
  
  // Add trigger to automatically run function adding new videos
  ScriptApp.newTrigger('addNewVideos')
  .timeBased()
  .everyHours(HOURS_BETWEEN_RUNS)
  .create();
}

function clearAllTriggers() {
  Logger.log('Clearing all triggers');
  
  // Clean up all time triggers
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
}

function install() {
  Logger.log('Installing');
  
  // Acquire playlist ID from user
  if (!changePlaylistId()) {
    // Playlist ID request cancelled
    return;
  }
  
  // Create a new videos spreadsheet
  createVideosSheet();
  
  // Import all videos from subscriptions
  initializeOldVideos();
  
  // Create trigger automatically adding new videos to playlist
  createTimeTrigger();
  
  toast('Installation finished');
}

// ---- TRIGGERS ----------------------------------------------
function onOpen(e) {
  createMenu();
}

function onInstall(e) {
  createMenu();
  install();
}
