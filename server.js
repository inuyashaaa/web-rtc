const http = require('http')
const express = require('express')
const serveStatic = require('serve-static')
const socketIo = require('socket.io')
const easyrtc = require('easyrtc')

// Set process name
process.title = 'node-easyrtc'

const app = express()
app.use(serveStatic('static', {'index': ['index.html']}))

// Start Express http server on port 8080
const webServer = http.createServer(app)

// Start Socket.io so it attaches itself to Express server
const socketServer = socketIo.listen(webServer, {'log level': 1})

easyrtc.setOption('logLevel', 'debug')

// Overriding the default easyrtcAuth listener, only so we can directly access its callback
easyrtc.events.on('easyrtcAuth', function (socket, easyrtcid, msg, socketCallback, callback) {
  easyrtc.events.defaultListeners.easyrtcAuth(socket, easyrtcid, msg, socketCallback, function (err, connectionObj) {
    if (err || !msg.msgData || !msg.msgData.credential || !connectionObj) {
      callback(err, connectionObj)
      return
    }

    connectionObj.setField('credential', msg.msgData.credential, {'isShared': false})

    console.log('[' + easyrtcid + '] Credential saved!', connectionObj.getFieldValueSync('credential'))

    callback(err, connectionObj)
  })
})

// To test, lets print the credential to the console for every room join!
easyrtc.events.on('roomJoin', function (connectionObj, roomName, roomParameter, callback) {
  console.log('[' + connectionObj.getEasyrtcid() + '] Credential retrieved!', connectionObj.getFieldValueSync('credential'))
  easyrtc.events.defaultListeners.roomJoin(connectionObj, roomName, roomParameter, callback)
})

// Start EasyRTC server
easyrtc.listen(app, socketServer, null, function (err, rtcRef) {
  if (err) {
  }
  rtcRef.events.on('roomCreate', function (appObj, creatorConnectionObj, roomName, roomOptions, callback) {
    console.log('roomCreate fired! Trying to create: ' + roomName)

    appObj.events.defaultListeners.roomCreate(appObj, creatorConnectionObj, roomName, roomOptions, callback)
  })
})

// listen on port 8080
webServer.listen(8080)
