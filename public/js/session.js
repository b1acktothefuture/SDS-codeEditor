const { session, username } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
})

const socket = io()
socket.emit('joinSession', { username, session })

socket.on("changedcode", newCode => {
    before = editor.selection.toJSON();
    editor.setValue(newCode)
    editor.selection.fromJSON(before)
})

socket.on('sessionusers', ({ users }) => {
    // outputUsers(users)
})

var editor = ace.edit("editor");
ace.config.set('basePath', 'https://pagecdn.io/lib/ace/1.4.12/ace.js')
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/javascript");

editor.on('change', function () {
    if (editor.curOp && editor.curOp.command.name) {
        var val = editor.getSession().getValue();
        socket.emit('codeChanged', val);
    }
});