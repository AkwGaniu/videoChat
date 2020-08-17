let Peer = require('simple-peer')
let socket = io()
const video = document.querySelector('video')

let client = {}
const constraintObj = {video: true, audio: true}

if (navigator.mediaDevices === undefined) {
  navigator.mediaDevices = {}
  navigator.mediaDevices.getUserMedia = function(constraintObj) {
    let getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia
    if (!getUserMedia) {
      return Promise.reject(new Error("getUserMedia is not supported in this browser"))
    }
    return new Promise(function(resolve, reject) {
      getUserMedia.call(navigator, constraintObj, resolve, reject)
    })
  }
} else {
  navigator.mediaDevices.enumerateDevices()
  .then(devices => {
    devices.forEach(device=> {
      console.log(device.kind.toUpperCase(), device.label)
    })
  })
  .catch(err => {
    console.log(err.name, err.message)
  })
}

//GET VIDEO STREAM
navigator.mediaDevices.getUserMedia(constraintObj)
.then( function (stream){
  socket.emit('newClient')
  if ('srcObject' in video) {
    video.srcObject = stream
  } else {
    video.src = window.URL.createObjectURL(stream)
  }
  video.play()

  // INITIALIZE A PEER
  function initPeer(type) {
    let peer = new Peer({initiator: (type == 'init') ? true : false, stream: stream, trickle: false})
    peer.on('stream', function (stream) {
      alert("hi inside onStreamPeer")
      createVideo(stream)
    })
    alert(JSON.stringify(peer))

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
      socket.emit('answer', data)
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
    alert("hi inside createVideo")
    alert(video)

    video.srcObject = stream
    if ('srcObject' in video) {
      video.srcObject = stream
    } else {
      video.src = window.URL.createObjectURL(stream)
    }
    video.play()
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
.catch(err => document.write(err))