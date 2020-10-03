const Peer = require('simple-peer')
const socket = io('/chat')
const video = document.querySelector('video')
let clients = []
const constraintObj = {video: true, audio: true}
const meeting = JSON.parse(localStorage.getItem('meeting'))
const meeting_detail = {
  meeting_id: meeting.meeting._id,
  current_user: meeting.recipient._id
}

//GET VIDEO STREAM
navigator.mediaDevices.getUserMedia(constraintObj)
.then(stream => {
  video.load()
  socket.emit('newClient', meeting_detail)
  if ('srcObject' in video) {
    video.srcObject = stream 
  } else {
    video.src = window.URL.createObjectURL(stream)
  }
  playPromise =   video.play()
  if (playPromise !== undefined) {
    playPromise.then(_ => {
      console.log({first_media: video.srcObject}, 'PLAYING')
      // Automatic playback started!
      // Show playing UI.
    })
    .catch(error => {  
      console.log(error)
    });
  }
   
  // INITIALIZE A PEER
  function initPeer(type) {
    let init = false
    if(type === 'init') { 
      init = true
    }
    let peer = new Peer({initiator: init, stream: stream, trickle: false})
    peer.on('stream', function (stream) {
      createVideo(stream)
    })
    return peer
  }

  function removeVideo () {
    document.getElementById('peerVideo').remove()
  }

  // MAKE PEER OF TYPE INIT
  function makePeer() {
    let client = {}
    client.gotAnswer = false
    let peer =  initPeer('init')
    peer.on('signal', (data) => {
      if (!client.gotAnswer) {
        socket.emit('offer', data)
      }
    })
    client.peer = peer
    clients.push(client)
  }

  // MAKE PEER OF TYPE NotInit 
  function frontAnswer (offer) {
    let peer = initPeer('notInit')
    peer.on('signal', (data) => {
      socket.emit('answer', data)
    })
    peer.signal(offer)
  }

  function signalAnswer (answer) {
    clients[0].gotAnswer = true
    let peer = clients[0].peer
    peer.signal(answer)
  }

  function createVideo (stream) {
    let video = document.createElement('video')
    video.load()
    video.id = 'peerVideo'
    if ('srcObject' in video) {
      video.srcObject = stream
    } else { 
      video.src = window.URL.createObjectURL(stream)
    }
    video.class = 'embed-responsive-item'
    document.querySelector('#peerDiv').appendChild(video)
    playPromise =   video.play()
    if (playPromise !== undefined) {
      playPromise.then(_ => {
        console.log({second_media: video.srcObject}, 'PLAYING 2')
        // Automatic playback started!
        // Show playing UI.
      }) 
      .catch(error => { 
        console.log(error) 
      });
    }
  }

  socket.on('backOffer', frontAnswer)
  socket.on('backAnswer', signalAnswer)
  socket.on('createPeer', makePeer)
  socket.on('removeVideo', removeVideo)   
})
.catch(err => {
  console.log(err)
})