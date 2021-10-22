const { id, name } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

document.getElementById("session").innerText = window.location.host + "/sessions?id=" + id
document.getElementById("name").innerText = name

var EditorClient = ot.EditorClient;
var SocketIOAdapter = ot.SocketIOAdapter;
var CodeMirrorAdapter = ot.CodeMirrorAdapter;

var socket = io.connect('http://localhost:3000');
var codeEditor = CodeMirror.fromTextArea(document.getElementById('codeeditor'), {
    lineNumbers: true,
    matchBrackets: true,
    mode: "python"
});


var sourceCode = document.getElementById("codeeditor").innerText;
var cmClient;


function init(str, revision, clients, serverAdapter) {
    if (!sourceCode) {
        codeEditor.setValue(str);
    }
    cmClient = window.cmClient = new EditorClient(
        revision, clients, serverAdapter, new CodeMirrorAdapter(codeEditor)
    );
};

var userMessage = function (name, text) {
    return ('<li class="media"><div class="media-body"><div class="media">' +
        '<div class="media-body">' +
        '<b>' + name + '</b> : ' + text +
        '<hr/> </div></div></div></li>'
    );
};

var sendMessage = function () {
    var userMessage = document.getElementById("user-send").value;
    socket.emit('chatMessage', { message: userMessage, username: name });
    document.getElementById("user-send").value = "";
};

socket.on('doc', function (obj) {
    init(obj.str, obj.revision, obj.clients, new SocketIOAdapter(socket));
});

socket.on('chatMessage', function (obj) {
    console.log(obj)
    document.getElementById("user-messages").innerHTML += userMessage(obj.username, obj.message)
})

socket.emit('joinSession', { session: id, username: name });