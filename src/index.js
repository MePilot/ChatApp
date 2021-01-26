const path = require('path')
const publicDirPath = path.join(__dirname,'../public')
const http = require('http')
const express = require('express')
const app = express()
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage, generateLocationMessage} = require('./utils/messages')
const {addUser, removeUser, getUser, getUsersinRoom} = require('./utils/users')
const server = http.createServer(app)
const io = socketio(server)
const PORT = process.env.PORT || 3000

app.use(express.static(publicDirPath))

io.on('connection', (socket)=> {
    
    socket.on('join',({username, room}, callback)=> {
        const {error, user} = addUser({id:socket.id, username, room})

        if(error) {
            return callback(error)
        }

        socket.join(user.room)
        socket.emit('message', generateMessage(`Welcome, ${user.username}`))

        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined`))

        io.to(user.room).emit('roomDataEvent', {
            room:user.room,
            users: getUsersinRoom(user.room)
        })

        callback()
       
    })
    
    socket.on('sendMessage',(msg, callback)=> {
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(msg)) {
            return callback('Dont use profane words, you assh0le!')
        }
        io.to(user.room).emit('message', generateMessage(user.username, msg))
        callback()
    })


    socket.on('disconnect',()=> {
        const user = removeUser(socket.id)

        if(user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left!`))
            io.to(user.room).emit('roomDataEvent', {
                room:user.room,
                users: getUsersinRoom(user.room)
            })
        }
        
    })

    socket.on('sendLocation', (location)=> {
        const user = getUser(socket.id)

        io.to(user.room).emit('showLocation', generateLocationMessage(user.username, `https://google.com/maps?q=${location.lat},${location.lan}`))
    })

})

server.listen(PORT, ()=> {
    console.log('Server is up!')
})
