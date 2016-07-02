var _ = require('lodash');

var defaults = {
    sort: false,
    mergeRows: []
};

var win = window, global = win;
var doc = win.document;

{
    if (!doc.querySelector) {
        console.error('your browser is not support Document.querySelector() function!');
    }
}

function TableMirror(options) {
    this.options = _.extend({}, defaults, options);
    this.el = this.options.el;

    this.init();
}

TableMirror.prototype.log = function (key) {
    var self = this;
    key = key? key: '';
    if (typeof self.logCount === 'undefined') {
        self.logCount = 0;
    }
    self.logCount++;
    if (self.logCount > 2000) {
        throw new Error('可能出现死循环, ' + key);
        return ;
    }
    console.log(key);
};

TableMirror.prototype.init = function () {
    console.log('init')
    var self = this;
    if (typeof self.el === 'string') {
        self.el = doc.querySelector(self.el);
    }

    self.mirror = {
        thead: [],
        tbody: []
    };

    self._cacheTableNodes();

    if (self.options.sort) {
        self.sort();
    }

    if (typeof self.options.mergeRows === 'string') {
        self.options.mergeRows = self.options.mergeRows.split(',');
    }

    console.log('initd')
};

TableMirror.prototype.sort = function () {
    // TODO 支持排序
};

TableMirror.prototype._cacheTableNodes = function () {
    console.log('_cacheTableNodes');
    var self = this;
    var children = self.el.childNodes;
    var child, mirror = self.mirror;

    self.table = self.el;

    for (var i = 0; i < children.length; i++) {
        child = children.item(i);

        if (child.nodeName === 'TBODY') {
            self.tbody = child;
        }
        if (child.nodeName === 'THEAD') {
            self.thead = child;
        }
    }

    // table > thead > tr > th(s)
    var ths = self.thead.children[0].children;
    for (var i = 0; i < ths.length; i++) {
        mirror.thead[i] = {
            text: ths.item(i).textContent,
            node: ths.item(i)
        }
    }
    self.logCount = 0;

    var tbody_TRs = self.tbody.children, tBody_tr_tds;
    for (var y = 0; y < tbody_TRs.length; y++) {
        tBody_tr_tds = tbody_TRs.item(y).children;
        for (var x = 0; x < tBody_tr_tds.length; x++) {
            self.addCell({
                x: x,
                y: y,
                text: _.trim(tBody_tr_tds.item(x).textContent),
                node: tBody_tr_tds.item(x)
            });

        }
    }
    self.mirror.cols = x;
    self.mirror.rows = y;
};

TableMirror.prototype.cell = function (x, y) {
    var self = this;
    var mBody = self.mirror.tbody;

    if (self.mirror.cols < x + 1
        || self.mirror.rows < y + 1
        || x < 0
        || y < 0
    ) {
        return null;
    }

    return mBody[x][y];
};

TableMirror.prototype.col = function (x) {
    var self = this;
    var mBody = self.mirror.tbody;
    var col = [];

    if (self.mirror.cols < x + 1) {
        return [];
    }

    col = mBody[x];

    return col;
};

TableMirror.prototype.row = function (y) {
    var self = this;
    var mBody = self.mirror.tbody;
    var row = [];

    if (self.mirror.rows < y + 1) {
        return [];
    }

    for (var i = 0; i < mBody.length; i++) {
        row.push(mBody[i][y]);
    }

    return row;
};

/**
 * 存放表格镜像数据
 * @param cell { x: x, y: y, spans: spans}
 */
TableMirror.prototype.updateCell = function (cell) {
};

TableMirror.prototype.addCell = function (cell) {
    var self = this;
    var x = cell.x;
    var y = cell.y;
    var mBody = self.mirror.tbody;

    if (!mBody[x]) {
        mBody[x] = [];
    }
    mBody[x][y] = cell;
};


TableMirror.prototype.mergeRows_index = function (title) {
    var self = this;
    var ths = self.mirror.thead;

    for (var i = 0; i < ths.length; i++) {
        if (ths[i].text === title) {
            return i;
        }
    }
};

TableMirror.prototype.mergeRows = function () {
    var self = this;
    var ths = self.options.mergeRows;

    self.mergeRows_removedCell_cache = [];
    var needRemoveItems = [];
    var needRemoveNodes = [];

    var status = {};
    var queue = [];
    var maxMap = {};

    function reset() {
        queue = [];
    }

    var x = 0, col, cell, preCell, title, key, queueItem, parentMaxRows;
    for (var i = 0; i < ths.length; i++) {
        reset();
        title = ths[i];
        x = self.mergeRows_index(title);

        col = self.col(x);
        for (var y = 0; y < col.length; y++) {
            cell = self.cell(x, y);
            preCell = self.cell(x, y-1);
            parentMaxRows = maxMap[[x-1, y].join(',')];

            if (!queue.length || !preCell) {
                queue.push(cell);

                // refresh maxMap
                for (var j = 0; j < queue.length; j++) {
                    queueItem = queue[j];
                    key = [queueItem.x, queueItem.y].join(',');
                    maxMap[key] = queue.length;
                }
                continue;
            }

            if (preCell.text === cell.text && (parentMaxRows > queue.length || !parentMaxRows)) {
                queue.push(cell);

                // refresh maxMap
                for (var j = 0; j < queue.length; j++) {
                    queueItem = queue[j];
                    key = [queueItem.x, queueItem.y].join(',');
                    maxMap[key] = queue.length;
                }

                if (col.length === y + 1) {
                    needRemoveItems.push(queue);
                    reset();
                }
            } else {
                if (queue.length > 1) {
                    needRemoveItems.push(queue);
                }

                reset();
                queue.push(cell);
            }
        }
    }

    requestAnimationFrame(function () {
        var queue;
        for (var i = 0; i < needRemoveItems.length; i++) {
            queue = needRemoveItems[i];

            queue[0].node.setAttribute('rowspan', queue.length);
            for (var j = 1 ; j < queue.length; j++) {
                queue[j].node.remove();
            }
        }
    });
};

module.exports = TableMirror;
