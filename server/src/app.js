const { once } = require('events'); 
const { spawn } = require('child_process');
const admin = require('firebase-admin');
const serviceAccount = require('./ServiceAccountKey.json');
var url = require('url');
var http = require('http');

const NGINX_SERVER_PORT = '8080';
const NGINX_SERVER_URL = `http://147.182.220.74:${NGINX_SERVER_PORT}/`;

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const VIDEOS_DIR = "/usr/share/nginx/html/videos/";
const VIDEO_EXTENSION = ".mp4";

const RESOLUTION_1080P = "1920x1080";
const RESOLUTION_720P = "1280x720"; 
const RESOLUTION_480P = "852x480";
const RESOLUTION_360P = "480x360";
const RESOLUTION_240P = "426x240";

function storeVideo(inputVideo, username, userIcon, geocoordinate, timestamp, callback)
{
	//store the inputVideo
	//processVideo(username, userIcon, geocoordinate, timestamp, callback)
}

function postToDB(username, userIcon, geocoordinate, videoName)
{
	var lat = parseInt(geocoordinate[0]);
	var lon = parseInt(geocoordinate[1]);
	var ref = db.collection(`Videos/${lat}/${lon}`).doc(`${geocoordinate[0]},${geocoordinate[1]}`).set({
			"badges_earned":[],
			"points_earned":0,
			"url":`${NGINX_SERVER_URL}/videos/${username}/${videoName}_h264.mpd`,
			"username":username,
			"user_profile_image":userIcon  
		  });
	return ref;

}

function processMPD(videoDir, videoName, transcodeProcessResolutions)
{

	return new Promise((resolve, reject)=>{
	
		var options = [];
        
		if(transcodeProcessResolutions.includes(RESOLUTION_1080P))
		{
			options.push(`in=${videoDir}${videoName}_h264_high_1080p_6000${VIDEO_EXTENSION},stream=video,output=h264_1080p${VIDEO_EXTENSION}`);

		}

		if(transcodeProcessResolutions.includes(RESOLUTION_720P))
        	{
                	options.push(`in=${videoDir}${videoName}_h264_main_720p_3000${VIDEO_EXTENSION},stream=video,output=h264_720p${VIDEO_EXTENSION}`);

        	}	

		if(transcodeProcessResolutions.includes(RESOLUTION_480P))
        	{
                	options.push(`in=${videoDir}${videoName}_h264_main_480p_1000${VIDEO_EXTENSION},stream=video,output=h264_480p${VIDEO_EXTENSION}`);

        	}

		if(transcodeProcessResolutions.includes(RESOLUTION_360P))
        	{
			options.push(`in=${videoDir}${videoName}_h264_baseline_360p_600${VIDEO_EXTENSION},stream=audio,output=audio${VIDEO_EXTENSION}`);
                	options.push(`in=${videoDir}${videoName}_h264_baseline_360p_600${VIDEO_EXTENSION},stream=video,output=h264_360p${VIDEO_EXTENSION}`);

        	}

		options.push("--mpd_output");
		options.push(`${videoDir}${videoName}_h264.mpd`);

		const packager = spawn('./packager-linux-x64', options);

		packager.stdout.on('data', (data) => {
  		//	console.log(`stdout: ${data}`);
		});

		packager.stderr.on('data', (data) => {
  		//	console.error(`stderr: ${data}`);
		});

		packager.on('close', (code) =>{
			if(parseInt(code.toString())!==0)
			{
				reject("Processing the MPD file failed");
			}
			else
			{
				resolve("Processing the MPD file was successful");
			}
		});
	});
}

async function transcode1080P(videoDir, videoName, callback)
{
     return new Promise((resolve, reject) => {
	     var s_time = Date.now();
	     const ffmpeg = spawn('ffmpeg', [
     		'-i',`${videoDir}${videoName}${VIDEO_EXTENSION}`,
     		'-c:a','copy',
     		'-vf', "scale=-2:1080",
     		'-c:v', 'libx264', 
     		'-profile:v', 'high',
		'-level:v', '4.2',
		'-x264-params', 'scenecut=0:open_gop=0:min-keyint=72:keyint=72',
		'-minrate', '6000k', 
		'-maxrate', '6000k',
		'-bufsize', '6000k',
		'-b:v', '6000k',
		'-y', `${videoDir}${videoName}_h264_high_1080p_6000${VIDEO_EXTENSION}`,    
     	    ]);

	      console.log("started 1080p transcoding process", ffmpeg.pid);


		ffmpeg.stdout.on('data', function(data) {
        //		console.log(data.toString());
      		});

		ffmpeg.stderr.on('data', function(err) {
      	//		console.log(err.toString());
		});
	
		ffmpeg.on('close', (code) =>{
			console.log("finished transcoding 1080p", ffmpeg.pid, Date.now()-s_time);
			if(parseInt(code.toString())!==0)
				reject('Something went wrong with the 1080P transcoding process');
			else
				resolve();
      		});     
     });
}
async function transcode720P(videoDir, videoName, callback)
{
    return new Promise((resolve, reject) => {
	    var d;
	    var s_time = Date.now();
	    const ffmpeg = spawn('ffmpeg', [
        '-i',`${videoDir}${videoName}${VIDEO_EXTENSION}`,
        '-c:a','copy',
        '-vf', "scale=-2:720",
        '-c:v', 'libx264',
        '-profile:v', 'main',
        '-level:v', '4.0',
        '-x264-params', 'scenecut=0:open_gop=0:min-keyint=72:keyint=72',
        '-minrate', '3000k', 
        '-maxrate', '3000k',
        '-bufsize', '3000k',
        '-b:v', '3000k',
        '-y', `${videoDir}${videoName}_h264_main_720p_3000${VIDEO_EXTENSION}`,
     	]);

	     console.log("started 720p transcoding process", ffmpeg.pid);

     
     	ffmpeg.stdout.on('data', (data) => {
            // console.log(`${data}`);
		d = data.toString();
     	});

     	ffmpeg.stderr.on('data', (data) => {
            // console.log(`${data}`);
		d = data.toString();
     	});
	
	ffmpeg.on('close', (code)=> {
                console.log("exiting 720 transcoding process", ffmpeg.pid, Date.now()-s_time);
		if(parseInt(code.toString())!==0)
			reject("Something went wrong with 720P transcoding process");
		else
			resolve();
        });    
    });
	
}

async function transcode480P(videoDir, videoName)
{
      return new Promise((resolve, reject) => {
	      var d;
	      var s_time = Date.now();
	      const ffmpeg = spawn('ffmpeg', [
        '-i',`${videoDir}${videoName}${VIDEO_EXTENSION}`,
        '-c:a','copy',
        '-vf', "scale=-2:480",
        '-c:v', 'libx264',
        '-profile:v', 'main',
        '-level:v', '3.1',
        '-x264-params', 'scenecut=0:open_gop=0:min-keyint=72:keyint=72',
        '-minrate', '1000k',
        '-maxrate', '1000k',
        '-bufsize', '1000k',
        '-b:v', '1000k',
        '-y', `${videoDir}${videoName}_h264_main_480p_1000${VIDEO_EXTENSION}`,
     	]);

	       console.log("started 480p transcoding process", ffmpeg.pid);

     
     		ffmpeg.stdout.on('data', (data) => {
     //        		console.log(`${data}`);
			d = data.toString();
     		});

     		ffmpeg.stderr.on('data', (data) => {
    //         		console.log(`${data}`);
     			d = data.toString();
		});
	
		ffmpeg.on('close', (code)=> {
			console.log("exiting 480 transcoding process", ffmpeg.pid, Date.now()-s_time);
			console.log(code, d);
			if(parseInt(code.toString())!==0)
				reject("Something went wrong with 480P transcoding process");
			else
                		resolve();
        	});
	      
      });

}

async function transcode360P(videoDir, videoName)
{
     return new Promise((resolve, reject) => {
	     var d;
	     var s_time = Date.now();
	     const ffmpeg = spawn('ffmpeg', [
        '-i',`${videoDir}${videoName}${VIDEO_EXTENSION}`,
        '-c:a','copy',
        '-vf', "scale=-2:360",
        '-c:v', 'libx264',
        '-profile:v', 'baseline',
        '-level:v', '3.0',
        '-x264-params', 'scenecut=0:open_gop=0:min-keyint=72:keyint=72',
        '-minrate', '600k',
        '-maxrate', '600k',
        '-bufsize', '600k',
        '-b:v', '600k',
        '-y', `${videoDir}${videoName}_h264_baseline_360p_600${VIDEO_EXTENSION}`,
     	]);
	
	console.log("started 360p transcoding process", ffmpeg.pid);     

     	ffmpeg.stdout.on('data', (data) => {
            // console.log(`${data}`);
		d = data.toString();
     	});

     	ffmpeg.stderr.on('data', (data) => {
     	   //  console.log(`${data}`);
		d = data.toString();
     	});
	
	ffmpeg.on('close', (code) =>{
  		console.log("exiting 360 transcoding process", ffmpeg.pid, Date.now()-s_time);
		console.log(d, code);
		if(parseInt(code.toString())!==0)
			reject("Something went wrong transcoding to 360P");
		else
                	resolve();
        });
     
     });

}

function transcode240P(videoDir, videoName)
{
}

async function getVideoResolution(video)
{
     return new Promise((resolve, reject)=>{	
     var resolution;
     const ffprobe = spawn('ffprobe', [
     '-v','error',
     '-select_streams','v:0',
     '-show_entries', 'stream=width,height', 
     '-of', 'csv=s=x:p=0', `${video}`,	     
     ]);

     ffprobe.stdout.on('data', (data) => {
	     //replace white spaces with ''
	     resolution = `${data}`.replace(/\s+/g, '');
	     resolve(resolution);
     });

     ffprobe.stderr.on('data', (data) => {
	     resolution =  -1;
	     reject(resolution);
     });     	

     });
}

function processVideo(username, userIcon, geocoordinate, timestamp, callback)
{
     const videoDir = `${VIDEOS_DIR}${username}/`;
     const videoName = `${timestamp}`; 	
   
	return  getVideoResolution(`${videoDir}${videoName}${VIDEO_EXTENSION}`).then((resolution)=>{

		beginTranscodingVideo(username, userIcon, geocoordinate,videoName,videoDir, timestamp, callback, resolution);

	});	

}

async function beginTranscodingVideo(username, userIcon, geocoordinate,videoName,videoDir, timestamp, callback, videoResolution)
{
     var transcodeProcesses = [];
     var transcodeProcessesResolutions = new Map();
     switch(videoResolution)
     {
             case RESOLUTION_1080P:
                       transcodeProcesses.push(transcode1080P(videoDir, videoName, callback));
                       transcodeProcesses.push(transcode720P(videoDir, videoName));
                       transcodeProcesses.push(transcode480P(videoDir, videoName));
                       transcodeProcesses.push(transcode360P(videoDir, videoName));
                    // transcodeProcesses.push(transcode240P(videoDir, videoName));
                       transcodeProcessesResolutions.set(timestamp, [RESOLUTION_1080P, RESOLUTION_720P, RESOLUTION_480P, RESOLUTION_360P]);
                     break;
             case RESOLUTION_720P:
                     //  transcodeProcesses.push(transcode720P(videoDir, videoName));
		     //   transcodeProcesses.push(transcode480P(videoDir, videoName));
                       transcodeProcesses.push(transcode360P(videoDir, videoName));

//		     transcodeProcesses.push(transcode360P(videoDir, videoName));

//		     transcodeProcesses.push(transcode360P(videoDir, videoName));

		     // transcodeProcesses.push(transcode240P(videoDir, videoName));
                       transcodeProcessesResolutions.set(timestamp, [RESOLUTION_720P, RESOLUTION_480P, RESOLUTION_360P]);
	
		     break;
             case RESOLUTION_480P:
                     transcodeProcesses.push(transcode480P(videoDir, videoName));
                     transcodeProcesses.push(transcode360P(videoDir, videoName));
                    // transcodeProcesses.push(transcode240P(videoDir, videoName));
                     transcodeProcessesResolutions.set(timestamp, [RESOLUTION_480P, RESOLUTION_360P]);
                     break;
             case RESOLUTION_360P:
                     transcodeProcesses.push(transcode360P(videoDir, videoName));
                    // transcodeProcesses.push(transcode240P(videoDir, videoName));
                     transcodeProcessesResolutions.set(timestamp, [RESOLUTION_360P]);

                     break;
             case RESOLUTION_240P:
                    // transcodeProcesses.push(transcode240P(videoDir, videoName));
                    // transcodeProcessesResolutions.set(timestamp, [RESOLUTION_240P]);
                     break;
             default:
                     console.log("An error occurred while getting video resolution");
                     break;
     }

     await Promise.all(transcodeProcesses).then(()=>{
                return processMPD(videoDir, videoName, transcodeProcessesResolutions.get(timestamp));
             })
             .then(()=>{return postToDB(username, userIcon, geocoordinate,videoName);})
             .then(callback)
             .catch(callback);


}

for(let i=0; i<1; i++)
{
	const startTime = Date.now();
	console.log('started process#', i, startTime);
	processVideo("john_doe","https://icon.john_doe", [45.34,34.23],"K62uF3g99BQ", (result)=>{
		console.log('finshed process#', i);
		console.log(`result: ${result}`);
		console.log(`Total time: ${Date.now()-startTime}`);
	});
}
//processVideo("danny_frank", "12059");
async function getVideos(lat, lon)
{
	var videos = [];
	lat = parseInt(lat);
	lon = parseInt(lon);
	
	var querySnapshot = await db.collection(`Videos/${lat}/${lon}`)
		.get()
		.catch((error) => {
                        console.log("Error getting documents: ", error);
                });

		
	querySnapshot.forEach((doc) => {
		videos.push(doc.data());
	});

	return JSON.stringify(videos);
}

const GET = 'GET';
const POST = 'POST';

var server = http.createServer(async function(req, res){
	
	res.writeHead(200, {'Content-Type':'text/plain'});
	
	var queryType = url.parse(req.url, true).query['query'];

	if(queryType === GET)
	{

		var geoCoordinates = url.parse(req.url, true).query['location'].split(' ');
		var result = await getVideos(geoCoordinates[0], geoCoordinates[1]);
		res.end(result);
	}

	if(queryType === POST)
	{
		storeVideo(params, (result) => {
			res.end(result);
		});
	}

});

server.listen(3000, '127.0.0.1');

console.log('I am on 127.0.0.1:3000');
