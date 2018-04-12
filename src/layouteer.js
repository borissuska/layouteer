import LayouteerEditor from './editor';

export default class Layouteer {
    constructor(options) {
        this.columnsCount = options.columnsCount || 12;
        this.columnSize = options.columnSize || 11;
        this.content = options.content || Layouteer.generateLayout(this.columnsCount, this.columnSize);
        this.editor = new LayouteerEditor(options.editor, this);
    }
    static init(options) {
        return new Layouteer(options);
    }
    static contentDimensions(content) {
        let chWidth = 0, chHeight = 0;
        // check if every line has the same length
        const lines = content.split('\n');
        chHeight = lines.length;
        for (let i = 0; i < lines.length; i++) {
            const lineLength = lines[i].length;
            if (lineLength == 0) {
                chHeight += 1;
            }
            else if (chWidth == 0) {
                chWidth = lineLength;
            }
            else if (chWidth != lineLength) {
                return false;
            }
        }
        // return width, height object
        return {
            width: chWidth,
            height: chHeight
        };
    }
    static generateRuler(columnsCount, columnSize) {
        let ruler = '|';
        let column = '';
        for (let i = 0; i < columnSize; i++) {
            column += ' ';
        }
        column += '|';
        for (let i = 0; i < columnsCount; i++) {
            ruler += column;
        }
        return ruler;
    }
    static generateLayout(columnsCount, columnSize) {
        const width = columnsCount * columnSize + columnsCount + 1;
        const height = Math.round(width * 9.6 / 16 * 9 / 18);
        let boundryRow = '+';
        let contentRow = '|';
        for (let i = 0; i < width - 2; i++) {
            boundryRow += '-';
            contentRow += ' ';
        }
        boundryRow += '+';
        contentRow += '|';
        let content = `${boundryRow}\n`;
        for (let i = 0; i < height - 2; i++) {
            content += `${contentRow}\n`;
        }
        return content + boundryRow;
    }
}
