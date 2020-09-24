const Peer = require('simple-peer')
const socket = io('/chat')
const video = document.querySelector('video')
let client = {}
const constraintObj = {video: true, audio: true}
 
// if (navigator.mediaDevices === undefined) {
//   navigator.mediaDevices = {}
//   navigator.mediaDevices.getUserMedia = function(constraintObj) {
//     let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia
//     if (!getUserMedia) {
//       return Promise.reject(new Error("getUserMedia is not supported in this browser"))
//     }
//     return new Promise(function(resolve, reject) {
//       getUserMedia.call(navigator, constraintObj, resolve, reject)
//     })
//   }
// } else {
//   navigator.mediaDevices.enumerateDevices()
//   .then(devices => {
//     devices.forEach(device=> {
//       console.log(device.kind.toUpperCase(), device.label)
//     })
//   })
//   .catch(err => {
//     console.log(err.name, err.message)
//   })
// }


//GET VIDEO STREAM
navigator.mediaDevices.getUserMedia(constraintObj)
.then(stream => {
  socket.emit('newClient')
  if ('srcObject' in video) {
    video.srcObject = stream
  } else {
    video.src = window.URL.createObjectURL(stream)
  }
  video.play()
 
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
    peer.on('close', function() {
      document.getElementById('peerVideo').remove()
      peer.destroy()
    })
    return peer
  }

  function removeVideo () {
    document.getElementById('peerVideo').remove()
  }

  // MAKE PEER OF TYPE INIT
  function makePeer() {
    client.gotAnswer = false
    let peer =  initPeer('init')
    peer.on('signal', (data) => {
      if (!client.gotAnswer) {
        socket.emit('offer', data)
      }
    })
    client.peer = peer
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
    client.gotAnswer = true
    let peer = client.peer
    peer.signal(answer)
  }

  function createVideo (stream) {
    let video = document.createElement('video')
    video.id = 'peerVideo'
    if ('srcObject' in video) {
      video.srcObject = stream
    } else {
      video.src = window.URL.createObjectURL(stream)
    }
    video.class = 'embed-responsive-item'
    document.querySelector('#peerDiv').appendChild(video)
    console.log(video.srcObject, video)
    video.play()
  }

  function sessionActive () { 
    document.write('Session Active, Please come back later')
  }

  socket.on('backOffer', frontAnswer)
  socket.on('backAnswer', signalAnswer)
  socket.on('sessionActive', sessionActive)
  socket.on('createPeer', makePeer)
  socket.on('removeVideo', removeVideo)   
})
.catch(err => {
  console.log(err)
})