require! {
	'zepto-browserify'.$
	baconjs
	io:\socket.io-client
}

$.fn import baconjs.$

socket = io.connect 'http://localhost'
socket.on \mouse -> $ 'img' .offset it

$ 'body' .as-event-stream \mousemove
.map (.{left:client-x, top:client-y})
.throttle 20
.on-value -> socket.emit \mouse it