var TableMirror = require('../TableMirror.js');
var tableMirror = new TableMirror({
    el: '#table',
    mergeRows: '一,二,三,四'
});
tableMirror.mergeRows();
