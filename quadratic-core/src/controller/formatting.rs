use crate::{
    grid::{
        Bold, CellAlign, CellFmtAttr, CellWrap, FillColor, Italic, NumericFormat, RegionRef,
        SheetId, TextColor,
    },
    Rect, RunLengthEncoding,
};
use serde::{Deserialize, Serialize};

use super::{
    transactions::{Operation, Transaction, TransactionSummary},
    GridController,
};

impl GridController {
    pub fn set_cell_formats_for_type<A: CellFmtAttr>(
        &mut self,
        region: &RegionRef,
        values: RunLengthEncoding<Option<A::Value>>,
    ) -> RunLengthEncoding<Option<A::Value>> {
        let sheet = self.grid.sheet_mut_from_id(region.sheet);
        // TODO: optimize this for contiguous runs of the same value
        let mut old_values = RunLengthEncoding::new();
        for (cell_ref, value) in region.iter().zip(values.iter_values()) {
            let old_value = sheet
                .cell_ref_to_pos(cell_ref)
                .and_then(|pos| sheet.set_formatting_value::<A>(pos, value.clone()));
            old_values.push(old_value);
        }
        old_values
    }
}

macro_rules! impl_set_cell_fmt_method {
    ($method_name:ident<$cell_fmt_attr_type:ty>($cell_fmt_array_constructor:expr)) => {
        impl GridController {
            pub fn $method_name(
                &mut self,
                sheet_id: SheetId,
                rect: Rect,
                value: Option<<$cell_fmt_attr_type as CellFmtAttr>::Value>,
                cursor: Option<String>,
            ) -> TransactionSummary {
                let region = self.region(sheet_id, rect);
                let attr =
                    $cell_fmt_array_constructor(RunLengthEncoding::repeat(value, region.len()));
                let ops = vec![Operation::SetCellFormats { region, attr }];
                self.transact_forward(Transaction { ops, cursor })
            }
        }
    };
}

impl_set_cell_fmt_method!(set_cell_align<CellAlign>(CellFmtArray::Align));
impl_set_cell_fmt_method!(set_cell_wrap<CellWrap>(CellFmtArray::Wrap));
impl_set_cell_fmt_method!(set_cell_numeric_format<NumericFormat>(CellFmtArray::NumericFormat));
impl_set_cell_fmt_method!(set_cell_bold<Bold>(CellFmtArray::Bold));
impl_set_cell_fmt_method!(set_cell_italic<Italic>(CellFmtArray::Italic));
impl_set_cell_fmt_method!(set_cell_text_color<TextColor>(CellFmtArray::TextColor));
impl_set_cell_fmt_method!(set_cell_fill_color<FillColor>(CellFmtArray::FillColor));

/// Array of a single cell formatting attribute.
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum CellFmtArray {
    Align(RunLengthEncoding<Option<CellAlign>>),
    Wrap(RunLengthEncoding<Option<CellWrap>>),
    NumericFormat(RunLengthEncoding<Option<NumericFormat>>),
    Bold(RunLengthEncoding<Option<bool>>),
    Italic(RunLengthEncoding<Option<bool>>),
    TextColor(RunLengthEncoding<Option<String>>),
    FillColor(RunLengthEncoding<Option<String>>),
}

#[test]
fn test_set_cell_text_color_undo_redo() {
    let mut gc = GridController::new();
    let sheet_id = gc.grid.sheets()[0].id;
    let pos1 = crate::Pos { x: 3, y: 6 };
    let pos2 = crate::Pos { x: 5, y: 8 };
    let pos3 = crate::Pos { x: 9, y: 6 };
    let rect1 = Rect::new_span(pos1, pos2);
    let rect2 = Rect::new_span(pos2, pos3);

    let get = |g: &GridController, pos: crate::Pos| {
        g.sheet(sheet_id)
            .get_formatting_value::<TextColor>(pos)
            .unwrap_or_default()
    };

    let expected_summary = |rect| TransactionSummary {
        cell_regions_modified: vec![(sheet_id, rect)],
        ..Default::default()
    };

    assert_eq!(get(&gc, pos1), "");
    assert_eq!(get(&gc, pos2), "");
    assert_eq!(get(&gc, pos3), "");
    assert_eq!(
        gc.set_cell_text_color(sheet_id, rect1, Some("blue".to_string()), None),
        expected_summary(rect1),
    );
    println!("{:#?}", gc);
    assert_eq!(get(&gc, pos1), "blue");
    assert_eq!(get(&gc, pos2), "blue");
    assert_eq!(get(&gc, pos3), "");
    assert_eq!(
        gc.set_cell_text_color(sheet_id, rect2, Some("red".to_string()), None),
        expected_summary(rect2),
    );
    assert_eq!(get(&gc, pos1), "blue");
    assert_eq!(get(&gc, pos2), "red");
    assert_eq!(get(&gc, pos3), "red");
    assert_eq!(gc.undo(None), Some(expected_summary(rect2)));
    assert_eq!(get(&gc, pos1), "blue");
    assert_eq!(get(&gc, pos2), "blue");
    assert_eq!(get(&gc, pos3), "");
    assert_eq!(gc.undo(None), Some(expected_summary(rect1)));
    assert_eq!(get(&gc, pos1), "");
    assert_eq!(get(&gc, pos2), "");
    assert_eq!(get(&gc, pos3), "");
    assert_eq!(gc.redo(None), Some(expected_summary(rect1)));
    assert_eq!(get(&gc, pos1), "blue");
    assert_eq!(get(&gc, pos2), "blue");
    assert_eq!(get(&gc, pos3), "");
    assert_eq!(gc.redo(None), Some(expected_summary(rect2)));
    assert_eq!(get(&gc, pos1), "blue");
    assert_eq!(get(&gc, pos2), "red");
    assert_eq!(get(&gc, pos3), "red");
}

#[test]
fn test_render_fill() {
    let mut gc = GridController::new();
    let sheet_id = gc.sheet_ids()[0];
    gc.set_cell_fill_color(
        sheet_id,
        Rect {
            min: crate::Pos { x: 1, y: 1 },
            max: crate::Pos { x: 10, y: 10 },
        },
        Some("blue".to_string()),
        None,
    );
    gc.set_cell_fill_color(
        sheet_id,
        Rect {
            min: crate::Pos { x: 1, y: 15 },
            max: crate::Pos { x: 10, y: 20 },
        },
        Some("blue".to_string()),
        None,
    );
    gc.set_cell_fill_color(
        sheet_id,
        Rect {
            min: crate::Pos { x: 1, y: 10 },
            max: crate::Pos { x: 10, y: 15 },
        },
        Some("blue".to_string()),
        None,
    );
    let render_fills = gc.sheet(sheet_id).get_render_fills(Rect {
        min: crate::Pos { x: -100, y: -100 },
        max: crate::Pos { x: 100, y: 100 },
    });
    assert_eq!(10, render_fills.len())
}
