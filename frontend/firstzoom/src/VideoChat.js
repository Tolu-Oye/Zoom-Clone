import React, { useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const VideoChat = () => {
    const [stream, setStream] = useState(null);
    const [peer, setPeer] = useState(null);

    const socket = io('http://localhost:8080');

    const webcamRef = useRef();

    useEffect(() => {
        const getMedia = async () => {
            const userMedia = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            setStream(userMedia);

            socket.emit('join', {});

            socket.on('offer', (offer) => {
                const peer = new Peer({ initiator: false, trickle: false });
                peer.signal(offer);
                setPeer(peer);
            });

            socket.on('answer', (answer) => {
                peer.signal(answer);
            });

            peer.on('stream', (stream) => {
                const peerVideo = document.getElementById('peer-video');
                if (peerVideo) {
                    peerVideo.srcObject = stream;
                }
            });
        };

        getMedia();
    }, [socket, peer]);

    const startCall = () => {
        const peer = new Peer({ initiator: true, trickle: false });

        peer.on('signal', (data) => {
            socket.emit('offer', data);
        });

        peer.on('stream', (stream) => {
            const peerVideo = document.getElementById('peer-video');
            if (peerVideo) {
                peerVideo.srcObject = stream;
            }
        });

        setPeer(peer);
    };

    return (
        <div>
            <h1>Your Video Chat</h1>
            <div>
                {stream && <Webcam ref={webcamRef} muted style={{ width: '300px' }} />}
                <button onClick={startCall}>Start Call</button>
                <video id="peer-video" autoPlay playsInline style={{ width: '300px' }} />
            </div>
        </div>
    );
};

export default VideoChat;