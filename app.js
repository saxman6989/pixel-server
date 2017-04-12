'use strict'

const express = require('express');
const path = require('path');

const port = 5678
const app = express();
const io = require('socket.io').listen(app.listen(port, () => {
  console.log(`Running on the port ${port}`)
}));

const isHex = value => /^#[0-9A-F]{6}$/i.test(value)

const updateClient = () => {

}

let rooms = []

io.on('connection', socket => {
  let currentRoom = null

  const getIndex = (arr, str) => {
    let index = arr.findIndex(obj => {
      return obj.name === str
    })

    return index
  }

  const join = room => {
    socket.join(room)
    currentRoom = room

    const index = getIndex(rooms, room)

    const clients = io.sockets.adapter.rooms[room].length
    const roomInRooms = rooms[index]
    roomInRooms.clients = clients

    const data = {
      name: room,
      clients: clients,
      pos: roomInRooms.pos
    }

    socket.emit('res.join', data)
  }

  const leave = room => {
    socket.leave(room)
    currentRoom = null

    const index = getIndex(rooms, room)
    const roomInRooms = rooms[index]
    roomInRooms.clients -= 1

    if(roomInRooms.clients <= 0) rooms.splice(index - 1, index)

    socket.emit('res.leave', rooms)
  }

  io.emit('res.setup', rooms)

  socket.on('req.create', roomInfo => {
    let status = null
    let data = {
      name: roomInfo.room,
      pos: [],
      coverURL: roomInfo.coverURL,
      clients: 0
    }

    let duplicate = rooms.find(obj => {
      return obj.name === roomInfo.room
    })

    if(!duplicate) {
      rooms.push(data)
      join(roomInfo.room)
      io.emit('res.setup', rooms)
    } else {
      socket.emit('res.error', 'Duplicated!')
    }   
  })

  socket.on('req.join', room => {
    join(room)
  })

  socket.on('req.leave', room => {
    leave(room)   
  })

  socket.on('req.data', data => {
    const index = getIndex(rooms, currentRoom)
    const roomInRooms = rooms[index]

    let exists = roomInRooms.pos.findIndex(obj => {
      return obj.dx === data.dx && obj.dy === data.dy
    })
    
    if(exists) roomInRooms.pos.splice(exists - 1, exists)
    if(!isHex(data.color)) data.color = '#FFFFFF'
    
    roomInRooms.pos.push(data)
    io.in(currentRoom).emit('res.data', data)
  })
  
  socket.on('req.clear', () => {
    const index = getIndex(rooms, currentRoom)
    const roomInRooms = rooms[index]

    if(data) roomInRooms.pos = []
    io.in(currentRoom).emit('res.clear')
  })
})