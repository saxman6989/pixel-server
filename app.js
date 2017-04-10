'use strict'

const express = require('express');
const path = require('path');

const port = 5678
const app = express();
const io = require('socket.io').listen(app.listen(port, () => {
  console.log(`Running on the port ${port}`)
}));

const isHex = value => /^#[0-9A-F]{6}$/i.test(value)

let pos = []

io.on('connection', socket => {
  console.log('Connected!')

  if(pos.length > 0) io.emit('init', pos)

  socket.on('dataToServer', data => {
    let exists = pos.findIndex(obj => {
      return obj.dx === data.dx && obj.dy === data.dy
    })
    
    if(exists) pos.splice(exists - 1, exists)
    if(!isHex(data.color)) data.color = '#FFFFFF'
    
    pos.push(data)
    io.emit('dataToClient', data)
  })
  
  socket.on('clearToServer', data => {
    if(data) pos = []
    io.emit('clearToClient', true)
  })
})