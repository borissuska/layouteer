import Layouteer from './layouteer';

/**
 * Layouteer editor class
 */
export default class LayouteerEditor {

    constructor(element, layouteer) {
        if (!element) {
            throw 'Editor element is not defined, unable create editor';
        }
        const dim = Layouteer.contentDimensions(layouteer.content);
        if (!dim) {
            throw 'Invalid content dimensions, unable create editor.';
        }
        this.element = element;
        this.layouteer = layouteer;
        // allocate index
        this.index = new Array(dim.height);
        for (let i = 0; i < dim.height; i++) {
            this.index[i] = new Array(dim.width);
        }
        this.cursor = undefined;
        this.selection = undefined;
        this.bindToElement();
    }

    /**
     * Bind key and mouse events to editor
     */
    bindEventHandlers() {
        const editor = this;
        this.element.addEventListener('click', function (e) {
            editor.setCursor(e.target._index);
        });
        this.element.addEventListener('keydown', function (e) {
            switch (e.code) {
                case 'ArrowDown': {
                    let next = editor.cursor.bottom;
                    while ((e.metaKey || e.ctrlKey) && next && !next.isHorizontalLine()) {
                        next = next.bottom;
                    }
                    
                    if (next) {
                        editor.setCursor(next);
                    }
                    break;
                }
                case 'ArrowUp': {
                    let top = editor.cursor.top;
                    while ((e.metaKey || e.ctrlKey) && top && !top.isHorizontalLine()) {
                        top = top.top;
                    }
                    
                    if (top) {
                        editor.setCursor(top);
                    }
                    break;
                }
                case 'ArrowLeft': {
                    let previous = editor.cursor.left;
                    if (e.metaKey || e.ctrlKey || editor.cursor.isHorizontalLine()) {
                        previous = editor.index[editor.cursor.row][editor.previousColumnIndex()];
                    }
                    if (previous) {
                        editor.setCursor(previous);
                    }
                    break;
                }
                case 'ArrowRight': {
                    let right = editor.cursor.right;
                    if (e.metaKey || e.ctrlKey || editor.cursor.isHorizontalLine()) {
                        right = editor.index[editor.cursor.row][editor.nextColumnIndex()];
                    }
                    if (right) {
                        editor.setCursor(right);
                    }
                    break;
                }
                case 'Backspace': {
                    if (editor.cursor.isCorner()) {
                        // unable delete boundaries
                        break;
                    }
                    if (editor.cursor.isHorizontalLine()) {
                        // delete column line
                        let bottom = editor.cursor.bottom;
                        while (bottom && bottom.isVerticalLine()) {
                            bottom.setValue('&nbsp;');
                            if (bottom.right && bottom.right.isHorizontalLine()) {
                                // continue horizontal line 
                                let left = bottom;
                                do {
                                    left.setValue('-');
                                    left = left.left;
                                } while (left && !left.isVerticalLine());
                            }
                            if (bottom.left && bottom.left.isHorizontalLine()) {
                                // continue horizontal line
                                let right = bottom;
                                do {
                                    right.setValue('-');
                                    right = right.right;
                                } while (right && !right.isVerticalLine());
                            }
                            bottom = bottom.bottom;
                        }
                    }
                    else if (editor.cursor.isVerticalLine()) {
                        // delete row line
                        let right = editor.cursor.right;
                        while (right && right.isHorizontalLine()) {
                            right.setValue('&nbsp;');
                            if (right.bottom && right.bottom.isVerticalLine()) {
                                // continue vertical line 
                                let top = right;
                                do {
                                    top.setValue('|');
                                    top = top.top;
                                } while (top && !top.isHorizontalLine());
                            }
                            if (right.top && right.top.isVerticalLine()) {
                                // continue vertical line
                                let bottom = right;
                                do {
                                    bottom.setValue('|');
                                    bottom = bottom.bottom;
                                } while (bottom && !bottom.isHorizontalLine());
                            }
                            right = right.right;
                        }
                    }
                    break;
                }
                case 'Enter': {
                    break;
                }
                default: {
                    switch (e.key) {
                        case '|': {
                            editor.makeColumn();
                            break;
                        }
                        case '-': {
                            editor.makeRow();
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                    break;
                }
            }
            e.preventDefault();
        });
    }

    /**
     * Bind editor to given HTML element, create content and bind handlers
     */
    bindToElement() {
        this.element.classList.add('layouteer-editor');
        this.element.tabIndex = 1;
        // event handlers
        this.bindEventHandlers();
        // draw ruler
        const ruler = document.createElement('div');
        ruler.classList.add('ruler');
        ruler.innerHTML = Layouteer.generateRuler(this.layouteer.columnsCount, this.layouteer.columnSize).split(' ').join('&nbsp;');
        this.element.appendChild(ruler);
        // draw centent
        for (let i = 0; i < this.index.length; i++) {
            const idxRow = this.index[i];
            const row = document.createElement('div');
            this.element.appendChild(row);
            for (let j = 0; j < idxRow.length; j++) {
                const ch = this.layouteer.content[i * idxRow.length + i + j];
                const cell = document.createElement('span');
                cell.innerHTML = ch != ' ' ? ch : '&nbsp;';
                row.appendChild(cell);
                const leftIdxItem = j > 0 ? this.index[i][j - 1] : undefined;
                const topIdxItem = i > 0 ? this.index[i - 1][j] : undefined;
                const currentIdxItem = this.index[i][j] = new LayouteerEditorCell({
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
                if (leftIdxItem) {
                    leftIdxItem.right = currentIdxItem;
                }
                if (topIdxItem) {
                    topIdxItem.bottom = currentIdxItem;
                }
            }
        }
        this.__buildLineIndex__();
        // set cursor
        this.setCursor(this.index[0][0]);
    }

    /**
     * Index lines
     */
    __buildLineIndex__() {
        this.getHLineInfo(this.index[0][0]);
    }

    /**
     * Index horizontal line
     * 
     * @param {LayouteerEditorCell} cell where the horizontal line starts
     * @returns {object} line index value 
     */
    getHLineInfo(cell) {
        const lineIndex = { horizontal: true },
              hLineCells = {},
              startingLines = [],
              from = cell;
        let to = cell;
        if (cell) {
            let iCell = cell;
            // right
            while (iCell && iCell.isHorizontalLine()) {
                iCell.line = lineIndex;
                hLineCells[iCell.column] = iCell;
                to = iCell; // right-most cell
                if (iCell.bottom && iCell.bottom.isVerticalLine()) {
                    startingLines.push(this.getVlineInfo(iCell.bottom));
                }
                iCell = iCell.right;
            }
        }
        lineIndex['cells'] = hLineCells;
        lineIndex['from'] = from;
        lineIndex['to'] = to;
        lineIndex['startingLines'] = startingLines;
        return lineIndex;
    }

    /**
     * Index vertical line
     * 
     * @param {LayouteerEditorCell} cell where the vertical line starts
     * @returns {object} line index value 
     */
    getVlineInfo(cell) {
        const lineIndex = { vertical: true },
              vLineCells = {},
              startingLines = [],
              from = cell;
        let to = cell;
        if (cell) {
            let iCell = cell;
            // down
            while (iCell && iCell.isVerticalLine()) {
                iCell.line = lineIndex;
                vLineCells[iCell.row] = iCell;
                to = iCell; // bottom-most cell
                if (iCell.right && iCell.right.isHorizontalLine()) {
                    startingLines.push(this.getHLineInfo(iCell.right));
                }
                iCell = iCell.bottom;
            }
        }
        lineIndex['cells'] = vLineCells;
        lineIndex['from'] = from;
        lineIndex['to'] = to;
        lineIndex['startingLines'] = startingLines;
        return lineIndex;
    }

    /**
     * Set the cursor position to given cell
     * 
     * @param {LayouteerEditorCell} cellIndex cell where to set the cursor
     */
    setCursor(cellIndex) {
        // remove class from previous cursor
        if (this.cursor) {
            this.cursor.el.classList.remove('cursor');
        }
        // set new cursor
        this.cursor = cellIndex;
        // new cursor could be undefined
        if (this.cursor) {
            this.cursor.el.classList.add('cursor');
        }
    }

    /**
     * Position of the next (right) column.
     * 
     * @param {LayouteerEditorCell} from From which cell search for closest right column. If undefined current cursor position is used.
     */
    nextColumnIndex(from) {
        if (from == undefined) {
            from = this.cursor;
        }
        const currentColumn = parseInt(from.column / (this.layouteer.columnSize + 1));
        return (currentColumn + 1) * (this.layouteer.columnSize + 1);
    }

    /**
     * Position of the previous (left) column.
     * 
     * @param {LayouteerEditorCell} from From which cell search for closest left column. If undefined current cursor position is used.
     */
    previousColumnIndex(from) {
        if (from == undefined) {
            from = this.cursor;
        }
        const currentColumn = parseInt((from.column - 1) / (this.layouteer.columnSize + 1));
        return (currentColumn) * (this.layouteer.columnSize + 1);
    }

    /**
     * Create new vertical line at closest column position.
     */
    makeColumn() {
        if (this.cursor) {
            if (this.cursor.isHorizontalLine()) {
                // move cursor to closest column position
                const column = Math.round(this.cursor.column / (this.layouteer.columnSize + 1)) * (this.layouteer.columnSize + 1);
                this.setCursor(this.index[this.cursor.row][column]);
                // find region boundry
                let regionCell = this.cursor;
                while (regionCell.left && regionCell.isHorizontalLine()) {
                    regionCell = regionCell.left;
                }
                let cell = this.cursor, extend = false;
                do {
                    cell = cell.bottom;
                    regionCell = regionCell.bottom;
                    extend = false;
                    //let cell = this.cursor.bottom;
                    while (cell && !cell.isHorizontalLine()) {
                        if (cell.isVerticalLine()) {
                            extend = true;
                        }
                        cell.setValue('|');
                        cell = cell.bottom;
                        regionCell = regionCell.bottom;
                    }
                    extend = extend && regionCell.isVerticalLine() && !regionCell.isCorner();
                    if (extend) {
                        cell.setValue('|');
                    }
                } while (cell && extend);
                this.__buildLineIndex__();
            }
        }
    }
    /**
     * Create new horizontal line at current cursor position.
     */
    makeRow() {
        if (this.cursor) {
            if (this.cursor.isVerticalLine()) {
                // find region boundry
                let regionCell = this.cursor;
                while (regionCell.top && regionCell.isVerticalLine()) {
                    regionCell = regionCell.top;
                }
                // draw horizontal line
                let cell = this.cursor, extend = false;
                do {
                    cell = cell.right;
                    regionCell = regionCell.right;
                    extend = false;
                    while (cell && !cell.isVerticalLine()) {
                        if (cell.getValue() == '-') {
                            extend = true;
                        }
                        cell.setValue('-');
                        cell = cell.right;
                        regionCell = regionCell.right;
                    }
                    // check if not out of region boundaries
                    extend = extend && regionCell.isHorizontalLine() && !regionCell.isCorner();
                    if (extend) {
                        cell.setValue('-');
                    }
                } while (cell && extend);
                this.__buildLineIndex__();
            }
        }
    }
}

/**
 * Editor cell. Contains cell value and meta information about near cells.
 */
class LayouteerEditorCell
{
    constructor(options)
    {
        /** @type {HTMLElement} element */
        this.el = options.el;

        /** @type {HTMLElement} row element */
        this.rowEl = options.rowEl;
        
        /**
         *  @deprecated Without row and column we can add new lines to document efectivelly
         *  @type {number} row index
         */
        this.row = options.row;

        /**
         *  @deprecated Without row and column we can add new lines to document efectivelly
         *  @type {number} column index
         */
        this.column = options.column;

        /** @type {LayouteerEditorCell} cell on the left */
        this.left = options.left

        /** @type {LayouteerEditorCell} above cell */
        this.top = options.top;

        /** @type {LayouteerEditorCell} cell on the right */
        this.right = options.right;
        
        /** @type {LayouteerEditorCell} cell below */
        this.bottom = options.bottom;
        /** Line index if cell is part of the line */
        this.line = options.line;
    }

    /**
     * @returns {boolean} true if cell contains corner sign
     */
    isCorner()
    {
        return this.getValue() == '+';
    }

    /**
     * @returns {boolean} true if cell contains horizontal line or corner sign
     */
    isHorizontalLine()
    {
        return this.getValue() == '-' || this.isCorner();
    }

    /**
     * @returns {boolean} true if cell contains vertical line or corner sign
     */
    isVerticalLine()
    {
        return this.getValue() == '|' || this.isCorner();
    }

    /**
     * @param {string} value Value to be set
     */
    setValue(value)
    {
        this.el.innerHTML = value;
    }

    /**
     * @returns {string} The cell value
     */
    getValue()
    {
        return this.el.innerHTML;
    }
}
