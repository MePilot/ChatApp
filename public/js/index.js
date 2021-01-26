
const elements = {
    messageForm: document.querySelector('#form'),
    messageFormInput: document.querySelector('#messageInput'),
    messageFormButton: document.querySelector('#btnSend'),
    messages: document.querySelector('#messages'),
    messageTemplate: document.querySelector('#message-template').innerHTML,
    locationTemplate: document.querySelector('#location-template').innerHTML,
    sidebarTemplate: document.querySelector('#sidebar-template').innerHTML
}

const socket = io()

const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = ()=> {
    //new message element
    const newMessage = elements.messages.lastElementChild
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    //get height of new message
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin
    
    //visible height
    const visibleHeight = elements.messages.offsetHeight

    //height of messages container
    const containerHeight = elements.messages.scrollHeight

    //how far did i scroll

    const scrollOffset = elements.messages.scrollTop + visibleHeight
    
    //at the bottom before last message added
    if (containerHeight - newMessageHeight <= scrollOffset) {
        elements.messages.scrollTop =  elements.messages.scrollHeight
    }
}

socket.on('message', (msg) => {
    const html = Mustache.render(elements.messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm A')
    })

    elements.messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('showLocation', (location) => {
    const html = Mustache.render(elements.locationTemplate, {
        username: location.username,
        url: location.url,
        createdAt: moment(location.createdAt).format('h:mm A')
    })
    elements.messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomDataEvent', ({ room, users }) => {

    const html = Mustache.render(elements.sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html

})

elements.messageForm.addEventListener('submit', (e) => {

    e.preventDefault()

    elements.messageFormButton.setAttribute('disabled', 'disabled')

    socket.emit('sendMessage', elements.messageFormInput.value, (error) => {
        elements.messageFormButton.removeAttribute('disabled')
        elements.messageFormInput.focus()
        elements.messageFormInput.value = ''
        if (error) {
            return alert(error)
        }
    })
})

document.querySelector('#location').addEventListener('click', (e) => {

    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position) => {

        socket.emit('sendLocation', { lat: position.coords.latitude, lan: position.coords.longitude })
    })

})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})