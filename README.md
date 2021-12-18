# globeEngage
The problem that this project aims to solve is to motivate users to engage with nature through a point system.

Currently there is a lack of an app specifically for the purpose of capturing the beauty of nature, natural haitats, etc through videography, geospatial data in addition to a point system that can deliver an interactive, realtime and unedited experience as well as an encouraging factor for users to explore nature.

### Frameworks: Android and Reactjs (Possibly React Native)

### Front-End
- Leaderboard
- Mapbox Custom Map
- Fetching MPEG-DASH content from back end
- Exoplayer, MPEG-DASH Playback with Adaptive Birate Streaming on Map Click
- Visual Indicator of uploaded content on Map, popular destinations, key spots and etc
- User Profile
- User Profile Summary Using Reactjs and QR Code
- Rating System on Videos
- Uploading captured video of user to back end
- Usage of sensors on phone to record using the back camera only to ensure video content is unedited
- Video contents are "Short-lived" and expire after 24 hours from the time it is uploaded

### Back-End
- Conversion of uploaded content to MPEG-DASH format
- Delivery of MPEG-DASH content to front end
- Storage of uploaded content, user data, etc
- Handling of leaderboard data, other data
- Possible use of Nginx with Firebase 
