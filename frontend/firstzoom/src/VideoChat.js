import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const VideoChat = () => {
	const [stream, setStream] = useState(null);
	const [peers, setPeers] = useState([]);
	const socket = useRef(null);
  
	const webcamRef = useRef();
  
	useEffect(() => {
	  // Connect to the WebSocket server
	  socket.current = io('http://localhost:8080');
  
	  // Get user media and set up WebRTC
	  const getMedia = async () => {
		const userMedia = await navigator.mediaDevices.getUserMedia({
		  video: true,
		  audio: true,
		});
  
		setStream(userMedia);
  
		// Display the local video stream
		if (webcamRef.current) {
		  webcamRef.current.srcObject = userMedia;
		}
  
		// Emit a 'join' message to notify the server about the new user
		socket.current.emit('join', {});
  
		// Listen for incoming WebRTC signaling messages
		socket.current.on('offer', (offer) => handleOffer(offer));
		socket.current.on('answer', (answer) => handleAnswer(answer));
		socket.current.on('ice-candidate', (candidate) => handleICECandidate(candidate));
	  };
  
	  getMedia();
	}, []);
  
	const handleOffer = (offer) => {
	  const peer = new Peer({ initiator: false, trickle: false, stream });
  
	  peer.signal(offer);
	  setPeers((prevPeers) => [...prevPeers, peer]);
  
	  peer.on('stream', (stream) => {
		// Handle the incoming stream for the remote peer
		const remoteVideo = document.getElementById(`remote-video-${peer._id}`);
		if (remoteVideo) {
		  remoteVideo.srcObject = stream;
		}
	  });
  
	  peer.on('ice-candidate', (candidate) => {
		// Send the ICE candidate to the server
		socket.current.emit('ice-candidate', candidate);
	  });
	};
  
	const handleAnswer = (answer) => {
	  const peer = peers[0]; // For simplicity, assuming there's only one peer
	  peer.signal(answer);
	};
  
	const handleICECandidate = (candidate) => {
	  const peer = peers[0]; // For simplicity, assuming there's only one peer
	  peer.addIceCandidate(candidate);
	};
  
	const startCall = () => {
	  const peer = new Peer({ initiator: true, trickle: false, stream });
  
	  peer.on('signal', (data) => {
		// Send the offer to the server
		socket.current.emit('offer', data);
	  });
  
	  peer.on('stream', (stream) => {
		// Handle the incoming stream for the remote peer
		const remoteVideo = document.getElementById(`remote-video-${peer._id}`);
		if (remoteVideo) {
		  remoteVideo.srcObject = stream;
		}
	  });
  
	  peer.on('ice-candidate', (candidate) => {
		// Send the ICE candidate to the server
		socket.current.emit('ice-candidate', candidate);
	  });
  
	  setPeers((prevPeers) => [...prevPeers, peer]);
	};
  
	return (
	  <div>
		<h1>Your Video Chat</h1>
		<div>
		  {stream && <video ref={webcamRef} autoPlay playsInline style={{ width: '300px' }} />}
		  <button onClick={startCall}>Start Call</button>
		  {peers.map((peer, index) => (
			<video
			  key={index}
			  id={`remote-video-${peer._id}`}
			  autoPlay
			  playsInline
			  style={{ width: '300px' }}
			/>
		  ))}
		</div>
	  </div>
	);
  };
  
  export default VideoChat;
  

// const VideoChat = () => {
// 	const [stream, setStream] = useState(null);
// 	const [peer, setPeer] = useState(null);
// 	const socket = useRef(null);
// 	const isInitiator = useRef(false);

// 	const webcamRef = useRef();

// 	useEffect(() => {
// 		// Initialize the WebSocket connection
// 		socket.current = io('http://localhost:8080');

// 		// Get user media and set up WebRTC
// 		const getMedia = async () => {
// 			const userMedia = await navigator.mediaDevices.getUserMedia({
// 				video: true,
// 				audio: true,
// 			});

// 			setStream(userMedia);

// 			// Emit a 'join' message to notify the server about the new user
// 			socket.current.emit('join', {});

// 			// Listen for incoming WebRTC signaling messages
// 			socket.current.on('offer', (offer) => {
// 				const peer = new Peer({ initiator: false, trickle: false });
// 				peer.signal(offer);
// 				setPeer(peer);
// 			});

// 			socket.current.on('answer', (answer) => {
// 				peer.signal(answer);
// 			});

// 			socket.current.on('ice-candidate', (iceCandidate) => {
// 				peer.signal(iceCandidate);
// 			});
// 		};

// 		getMedia();
// 	}, []);

// 	const startCall = () => {
// 		const peer = new Peer({ initiator: true, trickle: false });

// 		// Send a 'join' message to notify the server about the new user
// 		socket.current.emit('join', {});

// 		// Emit an 'offer' message when the peer has created an offer
// 		peer.on('signal', (data) => {
// 			if (!isInitiator.current) {
// 				socket.current.emit('offer', data);
// 			}
// 		});

// 		peer.on('stream', (stream) => {
// 			const peerVideo = document.getElementById('peer-video');
// 			if (peerVideo) {
// 				peerVideo.srcObject = stream;
// 			}
// 		});

// 		// Set the peer object to be used for future signaling
// 		setPeer(peer);
// 	};

// 	return (
// 		<div>
// 			<h1>Your Video Chat</h1>
// 			<div>
// 				{stream && <video ref={webcamRef} autoPlay playsInline style={{ width: '300px' }} />}
// 				<button onClick={startCall}>Start Call</button>
// 				<video id="peer-video" autoPlay playsInline style={{ width: '300px' }} />
// 			</div>
// 		</div>
// 	);
// };

// export default VideoChat;


