let peer = require('simple-peer')
const Peer = require('simple-peer')
let socket = io()
const video = document.querySelector('video')
let client = {}

console.log(video)

//GET VIDEO STREEM
navigator.mediaDevices.getUserMedia({video: true, audio: true})
  .then((stream) => {
    socket.emit('newClient')
    console.log(video)
    video.srcObject = stream
    video.play()
    
    // INITIALIZE A PEER
    function initPeer(type) {
      let peer = new Peer({initiator:(type === 'init')? true : false, stream: stream, trickle: false})
      peer.on('stream', function (stream) {
        createVideo(stream)
      })

      peer.on('close', function() {
        document.getElementById('peerVideo').remove()
        peer.destroy()
      })
      return peer
    }

    function removeVideo () {
      document.getElementById('peerVideo').remove()
    }

    // PEER OF TYPE INIT
    function makePeer() {
      client.gotAnswer = false
      let peer = initPeer('init')
      peer.on('signal', function(data) {
        if (!client.gotAnswer) {
          socket.emit('offer', data)
        }
      })
      client.peer = peer
    }

    // PEER OF TYPE NotInit 
    function frontAnswer (offer) {
      let peer = initPeer('notInit')
      peer.on('signal', (data) => {
        socket.emit('Answer', data)
      })
      peer.signal(offer)
    }

    function signalAnswer (answer) {
      client.gotAnswer = true
      let peer = client.peer
      peer.signal(answwer)
    }

    function createVideo (stream) {
      let video = document.createElement('video')
      video.id = 'peerVideo'
      video.srcObject = stream
      video.class = 'embed-responsive-item'
      document.querySelector('#peerDiv').appendChild(video)
      video.play()
    }

    function sessionActive () {
      document.write('Session Active, Please come back later')
    }

    socket.on('backOffer ', frontAnswer)
    socket.on('backAnswer', signalAnswer)
    socket.on('sessionActive', sessionActive)
    socket.on('createPeer', makePeer)
    socket.on('removeVideo', removeVideo)    
  })
  .catch(err => console.log(err))