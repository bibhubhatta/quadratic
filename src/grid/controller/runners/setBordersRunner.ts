import { pixiAppEvents } from '../../../gridGL/pixiApp/PixiAppEvents';
import { Coordinate } from '../../../gridGL/types/size';
import { Border } from '../../../schemas';
import { SheetController } from '../sheetController';
import { Statement } from '../statement';

export const SetBordersRunner = (sheetController: SheetController, statement: Statement): Statement => {
  if (statement.type !== 'SET_BORDERS') throw new Error('Incorrect statement type.');
  // Applies the SET_BORDER statement to the sheet and returns the reverse statement

  const sheet = sheetController.sheet;
  const old_values: (Coordinate | Border)[] = [];
  statement.data.forEach((border) => {
    // create reverse statement
    const oldBorder = sheet.borders.get(border.x, border.y) || { x: border.x, y: border.y };
    old_values.push(oldBorder);

    const clearBorders: Coordinate[] = [];
    const updateBorders: Border[] = [];
    // set border
    if (!(border as Border).horizontal && !(border as Border).vertical) {
      clearBorders.push(border);
    } else {
      updateBorders.push(border);
    }
    if (clearBorders.length) {
      // sheet.grid.clearBorders(clearBorders);
      // sheet.borders.clear(clearBorders);
    }
    if (updateBorders.length) {
      // sheet.grid.updateBorders(updateBorders);
    }
    pixiAppEvents.createBorders();
  });

  // return reverse statement
  return { type: 'SET_BORDERS', data: old_values };
};
