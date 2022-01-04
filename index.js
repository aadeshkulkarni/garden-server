const mqtt = require('mqtt')
const options = require('./config')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const cors = require('cors')
const router = require('./router')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(cors())
app.use(router)

app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Allow-Credentials', true)
  next()
})

/* MQTT Setup starts here */

//initialize the MQTT client
const client = mqtt.connect(options)

//setup the callbacks
client.on('connect', function () {
  console.log('Connected to MQTT')
})

client.on('error', function (error) {
  console.log('MQTT Error:', error)
})

// subscribe to topics 'my/test/topic'
client.subscribe('get/status/all')
client.subscribe('status/water/set')
client.subscribe('status/timer/set')
client.subscribe('status/light/set')


// publish message 'Hello' to topic 'my/test/topic'
// client.publish('my/test/topic', 'Hello');

io.on('connect', (socket) => {
  socket.on('join', () => {
    socket.emit('message', 'Connected')
  })
  client.on('message', function (topic, message) {
    //Called each time a message is received
    console.log('Received message:', topic, message.toString())

    if (topic === 'get/status/all') {
      socket.emit('status', message.toString())
    }
  })
  socket.on('status', () => {
    socket.emit('status', { water: 0, temperature: 31.5, humidity: 45 })
  })

  socket.on('set-water', (status) => {
    client.publish('status/water/set', status)
  })
  socket.on('set-timer', (status) => {
    client.publish('status/timer/set', status)
  })
  socket.on('set-light', (status) => {
    console.log("Set-Light called: ",status)
    client.publish('status/light/set', status)
  })
  
  socket.on('disconnect', () => {
    socket.emit('message', 'Disconnected')
  })
})
const PORT = process.env.PORT || 5000
server.listen(PORT, '0.0.0.0', function() {
  console.log('Listening to port:  ' + PORT);
});
