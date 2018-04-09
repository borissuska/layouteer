;(function(window, undefined) {
    // Base class
    var Layouteer = function(options)
    {
        this.columnsCount = options.columnsCount || 12;
        this.columnSize = options.columnSize || 11;
        this.content = options.content || Layouteer.generateLayout(this.columnsCount, this.columnSize);

        this.editor = new Layouteer.Editor(options.editor, this);
    };

    Layouteer.init = function(options) 
    {
        return new Layouteer(options);
    }

    Layouteer.contentDimensions = function(content)
    {
        var eol = 0,
            prevEol = 0,
            chWidth = 0,
            chHeight = 0;

        // check if every line has the same length
        var lines = content.split('\n');
        chHeight = lines.length;
        for (var i = 0; i < lines.length; i++)
        {
            var lineLength = lines[i].length;
            if (lineLength == 0)
            {
                chHeight--;
            }
            else if (chWidth == 0) 
            {
                chWidth = lineLength;
            }
            else if (chWidth != lineLength)
            {
                return false;
            }
        }
        
        // return width, height object
        return {
            width: chWidth,
            height: chHeight
        }
    }

    Layouteer.generateRuler = function(columnsCount, columnSize)
    {
        var ruler = '|';
        var column = '';
        for (var i = 0; i < columnSize; i++) 
        {
            column += ' ';
        }
        column += '|';

        for (var i = 0; i < columnsCount; i++)
        {
            ruler += column;
        }

        return ruler;
    }

    Layouteer.generateLayout = function(columnsCount, columnSize)
    {
        var width = columnsCount * columnSize + columnsCount + 1;
        var height = Math.round(width * 9.6 / 16 * 9 / 18);
        var boundryRow = '+';
        var contentRow = '|';

        for (var i = 0; i < width - 2; i++)
        {
            boundryRow += '-';
            contentRow += ' ';
        }

        boundryRow += '+';
        contentRow += '|';

        var content = boundryRow + '\n';

        for (var i = 0; i < height - 2; i++)
        {
            content += contentRow + '\n';
        }
        return content + boundryRow;
    }

    // Editor class
    Layouteer.Editor = function(element, layouteer) {
        if (!element)
        {
            throw 'Editor element is not defined, unable create editor';
        }

        var dim = Layouteer.contentDimensions(layouteer.content);
        if (!dim)
        {
            throw 'Invalid content dimensions, unable create editor.'
        }

        this.element = element;
        this.layouteer = layouteer;
        // allocate index
        this.index = new Array(dim.height);
        for (var i = 0; i < dim.height; i++)
        {
            this.index[i] = new Array(dim.width);
        }
        this.cursor = undefined;
        this.selection = undefined;

        this.bindToElement();
    };

    Layouteer.Editor.prototype.bindEventHandlers = function() {
        var editor = this;

        this.element.addEventListener('click', function(e) {
            editor.setCursor(e.target._index);
        });
        this.element.addEventListener('keydown', function(e) {
            switch (e.code) {
                case 'ArrowDown':
                    var next = editor.cursor.bottom;
                    while ((e.metaKey || e.ctrlKey) && next && !next.isHorizontalLine())
                    {
                        next = next.bottom;
                    };
                    
                    if (next)
                    {
                        editor.setCursor(next);
                    }
                    break;
                case 'ArrowUp':
                    var next = editor.cursor.top;
                    while ((e.metaKey || e.ctrlKey) && next && !next.isHorizontalLine())
                    {
                        next = next.top;
                    };
                    
                    if (next)
                    {
                        editor.setCursor(next);
                    }
                    break;
                case 'ArrowLeft':
                    var previous = editor.cursor.left;
                    if (e.metaKey || e.ctrlKey || editor.cursor.isHorizontalLine())
                    {
                        previous = editor.index[editor.cursor.row][editor.previousColumnIndex()];
                    }

                    if (previous)
                    {
                        editor.setCursor(previous);
                    }
                    break;
                case 'ArrowRight':
                    var next = editor.cursor.right;
                    if (e.metaKey || e.ctrlKey || editor.cursor.isHorizontalLine())
                    {
                        next = editor.index[editor.cursor.row][editor.nextColumnIndex()];
                    }

                    if (next)
                    {
                        editor.setCursor(next);
                    }
                    break;
                case 'Backspace':
                    if (editor.cursor.isCorner())
                    {
                        // unable delete boundaries
                        break;
                    }

                    if (editor.cursor.isHorizontalLine())
                    {
                        // delete column line
                        var bottom = editor.cursor.bottom;
                        while(bottom && bottom.isVerticalLine())
                        {
                            bottom.setValue('&nbsp;');
                            if (bottom.right && bottom.right.isHorizontalLine())
                            {
                                // continue horizontal line 
                                var left = bottom;
                                do
                                {
                                    left.setValue('-');
                                    left = left.left;
                                } while (left && !left.isVerticalLine());
                            }
                            if (bottom.left && bottom.left.isHorizontalLine())
                            {
                                // continue horizontal line
                                var right = bottom;
                                do
                                {
                                    right.setValue('-');
                                    right = right.right;
                                } while (right && !right.isVerticalLine());
                            }

                            bottom = bottom.bottom;
                        }
                    }
                    else if (editor.cursor.isVerticalLine())
                    {
                        // delete row line
                        var right = editor.cursor.right;
                        while(right && right.isHorizontalLine())
                        {
                            right.setValue('&nbsp;');
                            if (right.bottom && right.bottom.isVerticalLine())
                            {
                                // continue vertical line 
                                var top = right;
                                do
                                {
                                    top.setValue('|');
                                    top = top.top;
                                } while (top && !top.isHorizontalLine());
                            }
                            if (right.top && right.top.isVerticalLine())
                            {
                                // continue vertical line
                                var bottom = right;
                                do
                                {
                                    bottom.setValue('|');
                                    bottom = bottom.bottom;
                                } while (bottom && !bottom.isHorizontalLine());
                            }

                            right = right.right;
                        }
                    }
                    break;
                case 'Enter':
                    if (editor.cursor)
                    {
                        var containsHorizontal = false;
                        var right = editor.cursor.right,
                            left = editor.cursor,
                            first = left;

                        while (right && !containsHorizontal)
                        {
                            containsHorizontal = right.isHorizontalLine();
                            right = right.right;
                        }
                        while (left && !containsHorizontal)
                        {
                            containsHorizontal = left.isHorizontalLine();
                            first = left;
                            left = left.left;
                        }
                        if (containsHorizontal)
                        {
                            // unable when horizontal line is in row
                            break;
                        }

                        /*
                        // allocate new index row
                        var indexRow = new Array(this.index[0].length);
                        var row = document.createElement('div');
                        editor.cursor.rowEl.parentNode.insertBefore(row, editor.cursor.rowEl.nextSibling);

                        // update index array
                        this.index.splice(editor.cursor.row, 0, indexRow);
                        */
                    }
                    break;
                default:
                    switch (e.key) {
                        case '+':
                            editor.makeNewBlock();
                            break;
                        case '|':
                            editor.makeColumn();
                            break;
                        case '-':
                            editor.makeRow();
                            break;
                        default:
                            console.log('keydown', e);
                            break;
                    }
                    break;
            }

            e.preventDefault();
        });
    }

    Layouteer.Editor.prototype.bindToElement = function() {
        this.element.classList.add('layouteer-editor');
        this.element.tabIndex = 1;

        // event handlers
        this.bindEventHandlers();

        // draw ruler
        var ruler = document.createElement('div');
        ruler.classList.add('ruler');
        ruler.innerHTML = Layouteer.generateRuler(this.layouteer.columnsCount, this.layouteer.columnSize).split(' ').join('&nbsp;');
        this.element.appendChild(ruler);

        // draw centent
        for (var i = 0; i < this.index.length; i++)
        {
            var idxRow = this.index[i];
            var row = document.createElement('div');
            this.element.appendChild(row);

            for (var j = 0; j < idxRow.length; j++) {
                var ch = this.layouteer.content[i * idxRow.length + i + j];
                
                var cell = document.createElement('span');
                cell.innerHTML = ch != ' ' ? ch : '&nbsp;';
                row.appendChild(cell);

                var leftIdxItem = j > 0 ? this.index[i][j - 1] : undefined;
                var topIdxItem = i > 0 ? this.index[i - 1][j] : undefined;
                var currentIdxItem = this.index[i][j] = new Layouteer.Editor.Cell({
                    el: cell,
                    rowEl: row,
                    row: i,
                    column: j,
                    left: leftIdxItem,
                    top: topIdxItem,
                    right: undefined,
                    bottom: undefined,
                    line: undefined
                });
                cell._index = currentIdxItem;
                if (leftIdxItem)
                {
                    leftIdxItem.right = currentIdxItem;
                }
                if (topIdxItem)
                {
                    topIdxItem.bottom = currentIdxItem;
                }
            }
        }
        this.__buildLineIndex__();

        // set cursor
        this.setCursor(this.index[0][0]);
    }

    Layouteer.Editor.prototype.__buildLineIndex__ = function()
    {
        this.getHLineInfo(this.index[0][0]);
        /*
        var cell = this.index[0][0];
        if (cell.isHorizontalLine())
        {
            var lineIndex = {
                cells: this.getHorizontalLineCells(cell),

            }
        }
        */
    }

    Layouteer.Editor.prototype.getHLineInfo = function(cell)
    {
        var lineIndex = { horizontal: true },
            hLineCells = {},
            startingLines = [],
            from = cell,
            to = cell;
        if (cell)
        {
            console.log('HLineIdx', cell.row, cell.column, cell.el);
            var iCell = cell;
            // right
            while (iCell && iCell.isHorizontalLine())
            {
                iCell.line = lineIndex;
                hLineCells[iCell.column] = iCell;
                to = iCell; // right-most cell

                if (iCell.bottom && iCell.bottom.isVerticalLine())
                {
                    startingLines.push(this.getVlineInfo(iCell.bottom));
                }

                iCell = iCell.right;
            }
            /*
            // left
            iCell = cell.left;
            while (iCell && iCell.isHorizontalLine())
            {
                iCell.line = lineIndex;
                hLineCells[iCell.column] = iCell;
                from = iCell; // left-most cell
                if (iCell.bottom && iCell.bottom.isVerticalLine())
                {
                    startingLines.push(this.getVlineInfo(iCell.bottom));
                }

                iCell = iCell.left;
            }
            */
        }
        lineIndex['cells'] = hLineCells;
        lineIndex['from'] = from;
        lineIndex['to'] = to;
        lineIndex['startingLines'] = startingLines;
        
        return lineIndex;
    }

    Layouteer.Editor.prototype.getVlineInfo = function(cell)
    {
        var lineIndex = { vertical: true },
            vLineCells = {},
            startingLines = [],
            from = cell,
            to = cell;
        if (cell)
        {
            console.log('VLineIdx', cell.row, cell.column, cell.el);
            var iCell = cell;
            // down
            while (iCell && iCell.isVerticalLine())
            {
                iCell.line = lineIndex;
                vLineCells[iCell.row] = iCell;
                to = iCell; // bottom-most cell

                if (iCell.right && iCell.right.isHorizontalLine())
                {
                    startingLines.push(this.getHLineInfo(iCell.right));
                }

                iCell = iCell.bottom;
            }

            /*
            // up
            iCell = cell.top;
            while (iCell && iCell.isVerticalLine())
            {
                iCell.line = lineIndex;
                vLineCells[iCell.row] = iCell;
                from = iCell; // top-most cell
                if (iCell.right && iCell.right.isHorizontalLine())
                {
                    startingLines.push(this.getHLineInfo(iCell.right));
                }

                iCell = iCell.top;
            }
            */
        }
        lineIndex['cells'] = vLineCells;
        lineIndex['from'] = from;
        lineIndex['to'] = to;
        lineIndex['startingLines'] = startingLines;
        
        return lineIndex;
    }

    Layouteer.Editor.prototype.setCursor = function(cellIndex)
    {
        // remove class from previous cursor
        if (this.cursor)
        {
            this.cursor.el.classList.remove('cursor');
        }

        // set new cursor
        this.cursor = cellIndex;

        // new cursor could be undefined
        if (this.cursor)
        {
            this.cursor.el.classList.add('cursor');
        }
    }

    Layouteer.Editor.prototype.nextColumnIndex = function(from)
    {
        if (from == undefined)
        {
            from = this.cursor;
        }

        var currentColumn = parseInt(from.column / (this.layouteer.columnSize + 1));
        return (currentColumn + 1) * (this.layouteer.columnSize + 1);
    }

    Layouteer.Editor.prototype.previousColumnIndex = function(from)
    {
        if (from == undefined)
        {
            from = this.cursor;
        }

        var currentColumn = parseInt((from.column - 1) / (this.layouteer.columnSize + 1));
        return (currentColumn) * (this.layouteer.columnSize + 1);
    }

    Layouteer.Editor.prototype.makeColumn = function()
    {
        if (this.cursor)
        {
            if (this.cursor.isHorizontalLine())
            {
                // move cursor to closest column position
                var column = Math.round(this.cursor.column / (this.layouteer.columnSize + 1)) * (this.layouteer.columnSize + 1);
                this.setCursor(this.index[this.cursor.row][column]);

                // find region boundry
                var regionCell = this.cursor;
                while (regionCell.left && regionCell.isHorizontalLine())
                {
                    regionCell = regionCell.left;
                }

                var cell = this.cursor,
                    extend = false;
                do
                {
                    cell = cell.bottom;
                    regionCell = regionCell.bottom;
                    extend = false;

                    //var cell = this.cursor.bottom;
                    while (cell && !cell.isHorizontalLine())
                    {
                        if (cell.isVerticalLine())
                        {
                            extend = true;
                        }
                        cell.setValue('|');
                        cell = cell.bottom;
                        regionCell = regionCell.bottom;
                    }
                    extend = extend && regionCell.isVerticalLine() && !regionCell.isCorner();
                    if (extend)
                    {
                        cell.setValue('|');
                    }
                } while (cell && extend);

                this.__buildLineIndex__();
            }
        }
    }

    Layouteer.Editor.prototype.makeRow = function()
    {
        if (this.cursor)
        {
            if (this.cursor.isVerticalLine())
            {
                // find region boundry
                var regionCell = this.cursor;
                while (regionCell.top && regionCell.isVerticalLine())
                {
                    regionCell = regionCell.top;
                }
                
                // draw horizontal line
                var cell = this.cursor,
                    extend = false;
                do
                {
                    cell = cell.right;
                    regionCell = regionCell.right;
                    extend = false;
                    while (cell && !cell.isVerticalLine())
                    {
                        if (cell.getValue() == '-')
                        {
                            extend = true;
                        }
                        cell.setValue('-');
                        cell = cell.right;
                        regionCell = regionCell.right;
                    }

                    // check if not out of region boundaries
                    extend = extend && regionCell.isHorizontalLine() && !regionCell.isCorner();
                    if (extend)
                    {
                        cell.setValue('-');
                    }
                } while (cell && extend);

                this.__buildLineIndex__();
            }
        }
    }

    Layouteer.Editor.prototype.makeNewBlock = function()
    {
        if (this.cursor)
        {
            
        }
    }

    Layouteer.Editor.Cell = function(options)
    {
        this.el = options.el;
        this.rowEl = options.rowEl;
        // @deprecated
        this.row = options.row;
        // @deprecated
        this.column = options.column;
        this.left = options.left
        this.top = options.top;
        this.right = options.right;
        this.bottom = options.bottom;
        this.line = options.line;
    }

    Layouteer.Editor.Cell.prototype.isCorner = function()
    {
        return this.getValue() == '+';
    }

    Layouteer.Editor.Cell.prototype.isHorizontalLine = function()
    {
        return this.getValue() == '-' || this.isCorner();
    }

    Layouteer.Editor.Cell.prototype.isVerticalLine = function()
    {
        return this.getValue() == '|' || this.isCorner();
    }

    Layouteer.Editor.Cell.prototype.setValue = function(value)
    {
        this.el.innerHTML = value;
    }

    Layouteer.Editor.Cell.prototype.getValue = function(vaue)
    {
        return this.el.innerHTML;
    }

    // Expose layouteer 
    window.layouteer = Layouteer;
})(window, void 0);