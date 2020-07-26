const socket = io();

// Elements
const messageForm = document.querySelector('#message-form');
const messageFormInput = document.querySelector('#input-message');
const messageFormButton = document.querySelector('#send-message');
const locationButton = document.querySelector('#share-location');
const messages = document.querySelector('#messages');

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML;
const locationTemplate = document.querySelector('#location-message-template')
    .innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});

const autoscroll = () => {
    // New message
    const newMessage = messages.lastElementChild;

    // Height of the new message
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin;

    // Visible height
    const visibleHeight = messages.offsetHeight;

    // Height of messages container
    const containerHeight = messages.scrollHeight;

    // How far have I scrolled
    const scrollOffset = messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight;
    }
};

socket.on('message', (messageObject) => {
    const html = Mustache.render(messageTemplate, {
        username: messageObject.username,
        message: messageObject.text,
        createdAt: moment(messageObject.createdAt).format('hh:mm:ss a'),
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('locationMessage', (urlObject) => {
    const html = Mustache.render(locationTemplate, {
        username: urlObject.username,
        url: urlObject.url,
        createdAt: moment(urlObject.createdAt).format('hh:mm:ss a'),
    });
    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users,
    });
    document.querySelector('#sidebar').innerHTML = html;
});

messageForm.addEventListener('submit', (event) => {
    event.preventDefault();
    messageFormButton.setAttribute('disabled', 'disabled');
    socket.emit('sendMessage', messageFormInput.value, (error) => {
        messageFormButton.removeAttribute('disabled');
        messageFormInput.value = '';
        messageFormInput.focus();
        if (error) {
            return alert(error);
        }
    });
});

locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser.');
    }
    locationButton.setAttribute('disabled', 'disabled');
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit(
            'sendLocation',
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
            () => {
                locationButton.removeAttribute('disabled');
            }
        );
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = '/';
    }
});
