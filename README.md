# layouteer

2D text format for defining layouts.

## Basics

Each text line has to be equal length. `+`, `-` and `|` defines layout lines.

## Syntax

Boundaries

`+` signs are corners connected by vertical lines and horizontal lines.

    +-----------+
    |           |
    |           |
    |           |
    +-----------+

Horizontal lines are defined by `-` sign

    +-----------+
    |           |
    |-----------|
    |           |
    +-----------+

Vertical lines are defined by `|` sign

    +-----------+
    |     |     |
    |     |     |
    |     |     |
    +-----------+

Regions are areas delimited by 

    The root region (whole layout)

    +-----------+
    |#1   |#2   |
    |     |-----|
    |     |#3|#4|
    +-----------+

    Region #1

    +------
    |#1   |
    |     |
    |     |
    +------
    
    Region #2, contains regions #3 and #4

          ------+
          |#2   |
          |-----|
          |#3|#4|
          ------+

    Region #3

          |---
          |#3|
          ----

    Region #4

             ---|
             |#4|
             ---+

The ebove example should be represented by following HTML structure

    <div class="row"> <!-- root region -->
        <div class="col-lg-6">
            #1
        </div>
        <div class="col-lg-6">
            <div>
                #2
            </div>
            <div class="row">
                <div class="col-lg-6">
                    #3
                </div>
                <div class="col-lg-6">
                    #4
                </div>
            </div>
        </div>
    </div>

## Editor features

- Navigate using arrow keys
- Add vertical or horizontal lines by pressing `|` or `-` keys when cursor is on line.
- Delete line by `Backspace` when cursor is above vertical line or left to horizontal line
- Jump to closest vertical line or jump to closest column when holding `Meta` or `ctrl` key while navigating 

## TODOs

Things has to be done in language itself befor production use:

- Convert at least to HTML
- Allow extensions, define and document processing structure, for other languages
- Meaningful validations and error checking
- Support different screen sizes
- Support for RTL layouts 

Things has to be done in editor for higher efectivity:

- Allow extend regions vertically by Enter key and shrink them by Backspace
- Allow attributes for regions
- Allow content for regions
