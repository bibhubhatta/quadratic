import { Rectangle } from 'pixi.js';
import { Coordinate } from '../../gridGL/types/size';
import { Pos } from '../../quadratic-core/quadratic_core';
import {
  CellAlign,
  CellFormatSummary,
  // CodeCellValue,
  FormattingSummary,
  JsRenderCell,
  JsRenderCodeCell,
  JsRenderFill,
} from '../../quadratic-core/types';
import { grid } from '../controller/Grid';
import { GridBorders } from './GridBorders';
import { GridOffsets } from './GridOffsets';
import { GridSparse } from './GridSparse';
import { SheetCursor } from './SheetCursor';

export class Sheet {
  id: string;

  // @deprecated (soon)
  gridOffsets: GridOffsets;

  // @deprecated
  grid: GridSparse;

  borders: GridBorders;
  cursor: SheetCursor;

  constructor(index: number) {
    // deprecated
    this.grid = new GridSparse(this);

    const sheetId = grid.sheetIndexToId(index);
    if (!sheetId) throw new Error('Expected sheetId to be defined in Sheet');
    this.id = sheetId;

    this.gridOffsets = new GridOffsets();
    this.borders = new GridBorders(this.gridOffsets);

    this.cursor = new SheetCursor(this);
  }

  //#region set sheet actions
  // -----------------------------------

  setCellValue(x: number, y: number, value: string): void {
    grid.setCellValue({ sheetId: this.id, x, y, value });
  }

  deleteCells(rectangle: Rectangle): void {
    grid.deleteCellValues(this.id, rectangle);
  }

  set name(name: string) {
    grid.setSheetName(this.id, name);
  }

  set color(color: string | undefined) {
    grid.setSheetColor(this.id, color);
  }

  //#endregion

  //#region get grid information

  get name(): string {
    const name = grid.getSheetName(this.id);
    if (name === undefined) throw new Error('Expected name to be defined in Sheet');
    return name;
  }

  get color(): string | undefined {
    return grid.getSheetColor(this.id);
  }

  get order(): string {
    return grid.getSheetOrder(this.id);
  }

  getCellValueStrings(rectangle: Rectangle): string[] {
    return grid.getCellValueStrings(this.id, rectangle);
  }

  getRenderCells(rectangle: Rectangle): JsRenderCell[] {
    return grid.getRenderCells(this.id, rectangle);
  }

  getRenderCell(x: number, y: number): JsRenderCell | undefined {
    return grid.getRenderCells(this.id, new Rectangle(x, y, 0, 0))?.[0];
  }

  getEditCell(x: number, y: number): string {
    return grid.getEditCell(this.id, new Pos(x, y));
  }

  getRenderFills(rectangle: Rectangle): JsRenderFill[] {
    return grid.getRenderFills(this.id, rectangle);
  }

  getAllRenderFills(): JsRenderFill[] {
    return grid.getAllRenderFills(this.id);
  }

  getRenderCodeCells(): JsRenderCodeCell[] {
    return grid.getRenderCodeCells(this.id);
  }

  // todo: fix types

  getCodeValue(x: number, y: number): any /*CodeCellValue*/ | undefined {
    return grid.getCodeValue(this.id, x, y);
  }

  getFormattingSummary(rectangle: Rectangle): FormattingSummary {
    return grid.getFormattingSummary(this.id, rectangle);
  }

  getCellFormatSummary(x: number, y: number): CellFormatSummary {
    return grid.getCellFormatSummary(this.id, x, y);
  }

  getGridBounds(onlyData: boolean): Rectangle | undefined {
    return grid.getGridBounds(this.id, onlyData);
  }

  getMinMax(onlyData: boolean): Coordinate[] | undefined {
    const bounds = this.getGridBounds(onlyData);
    if (!bounds) return;
    return [
      { x: bounds.left, y: bounds.top },
      { x: bounds.right, y: bounds.bottom },
    ];
  }

  getGridRowMinMax(row: number, onlyData: boolean): Coordinate[] | undefined {
    const gridRowMinMax = this.grid.getRowMinMax(row, onlyData);
    if (onlyData) {
      if (!gridRowMinMax) return;
      return [
        { x: gridRowMinMax.min, y: row },
        { x: gridRowMinMax.max, y: row },
      ];
    }
    const bordersRowMinMax = this.borders.getRowMinMax(row);
    if (!gridRowMinMax && !bordersRowMinMax) return;
    if (!gridRowMinMax) {
      return [
        { x: bordersRowMinMax.min, y: row },
        { x: bordersRowMinMax.max, y: row },
      ];
    }
    if (!bordersRowMinMax) {
      return [
        { x: gridRowMinMax.min, y: row },
        { x: gridRowMinMax.max, y: row },
      ];
    }
    return [
      { x: Math.min(gridRowMinMax.min, bordersRowMinMax.min), y: row },
      { x: Math.max(gridRowMinMax.max, bordersRowMinMax.max), y: row },
    ];
  }

  getGridColumnMinMax(column: number, onlyData: boolean): Coordinate[] | undefined {
    const gridColumnMinMax = this.grid.getColumnMinMax(column, onlyData);
    if (onlyData) {
      if (!gridColumnMinMax) return;
      return [
        { x: column, y: gridColumnMinMax.min },
        { x: column, y: gridColumnMinMax.max },
      ];
    }
    const bordersColumnMinMax = this.borders.getColumnMinMax(column);
    if (!gridColumnMinMax && !bordersColumnMinMax) return;
    if (!gridColumnMinMax) {
      return [
        { x: column, y: bordersColumnMinMax!.min },
        { x: column, y: bordersColumnMinMax!.max },
      ];
    }
    if (!bordersColumnMinMax) {
      return [
        { x: column, y: gridColumnMinMax.min },
        { x: column, y: gridColumnMinMax.max },
      ];
    }
    return [
      { x: column, y: Math.min(gridColumnMinMax.min, bordersColumnMinMax.min) },
      { x: column, y: Math.max(gridColumnMinMax.max, bordersColumnMinMax.max) },
    ];
  }

  //#endregion

  //#region set grid information

  setCellFillColor(rectangle: Rectangle, fillColor?: string): void {
    return grid.setCellFillColor(this.id, rectangle, fillColor);
  }

  setCellBold(rectangle: Rectangle, bold: boolean): void {
    grid.setCellBold(this.id, rectangle, bold);
  }

  setCellItalic(rectangle: Rectangle, italic: boolean): void {
    grid.setCellItalic(this.id, rectangle, italic);
  }

  setCellTextColor(rectangle: Rectangle, color?: string): void {
    grid.setCellTextColor(this.id, rectangle, color);
  }

  setCellAlign(rectangle: Rectangle, align?: CellAlign): void {
    grid.setCellAlign(this.id, rectangle, align);
  }

  setCurrency(rectangle: Rectangle, symbol: string = '$') {
    grid.setCellCurrency(this.id, rectangle, symbol);
  }

  setPercentage(rectangle: Rectangle) {
    grid.setCellPercentage(this.id, rectangle);
  }

  removeCellNumericFormat(rectangle: Rectangle) {
    grid.removeCellNumericFormat(this.id, rectangle);
  }

  changeDecimals(delta: number): void {
    grid.changeDecimalPlaces(
      this.id,
      new Pos(this.cursor.originPosition.x, this.cursor.originPosition.y),
      this.cursor.getRectangle(),
      delta
    );
  }

  clearFormatting(): void {
    grid.clearFormatting(this.id, this.cursor.getRectangle());
  }

  getFormatPrimaryCell(): CellFormatSummary {
    return grid.getCellFormatSummary(this.id, this.cursor.originPosition.x, this.cursor.originPosition.y);
  }

  //#endregion
}
