require! {
	'zepto-browserify'.$
	baconjs
	io:\socket.io-client
	'../options.json'
}

$.fn import baconjs.$

socket = io.connect 'http://' + options.self.host
socket.on \mouse ({id,left,top})->
	$i = $ '#' + id
	if $i.length
		$i.offset {left,top}
	else
		$ 'body' .append do
			$ '<img>'
			.attr {src: '/res/cursor.png', id}
			.offset {left,top}

socket.on \disconnect -> $ '#' + it .remove!

$ 'body' .as-event-stream \mousemove
.map (.{left:client-x, top:client-y})
.throttle 20
.on-value -> socket.emit \mouse it