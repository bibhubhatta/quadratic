import { v4 as uuid } from 'uuid';
import z from 'zod';
import { generateKeyBetween } from '../utils/fractionalIndexing';
import { GridFileV1_3 } from './GridFileV1_3';

// Shared schemas
const ArrayOutputSchema = z.array(z.union([z.string(), z.number(), z.boolean()]));
const BorderDirectionSchema = z.object({
  color: z.string().optional(),
  type: z.enum(['line1', 'line2', 'line3', 'dotted', 'dashed', 'double']).optional(),
});
const HeadingSchema = z.object({
  id: z.number(),
  size: z.number().optional(),
});

// File schema
export const GridFileSchemaV1_4 = z.object({
  sheets: z
    .object({
      id: z.string(),
      name: z.string(),
      color: z.string().optional(),
      order: z.string(),
      borders: z
        .object({
          x: z.number(),
          y: z.number(),
          horizontal: BorderDirectionSchema.optional(),
          vertical: BorderDirectionSchema.optional(),
        })
        .array(),
      cells: z
        .object({
          x: z.number(),
          y: z.number(),
          type: z.enum(['TEXT', 'FORMULA', 'JAVASCRIPT', 'PYTHON', 'SQL', 'COMPUTED', 'AI']),
          value: z.string(),
          array_cells: z.tuple([z.number(), z.number()]).array().optional(), // list of output array cells created by this cell
          dependent_cells: z.tuple([z.number(), z.number()]).array().optional(),
          evaluation_result: z
            .object({
              success: z.boolean(),
              std_out: z.string().optional(),
              std_err: z.string().optional(),
              output_value: z.string().or(z.null()).or(z.undefined()),
              cells_accessed: z.tuple([z.number(), z.number()]).array(),
              array_output: z.union([ArrayOutputSchema, z.array(ArrayOutputSchema)]).optional(), // 1 or 2d array
              formatted_code: z.string(),
              error_span: z.tuple([z.number(), z.number()]).or(z.null()),
            })
            .optional(),
          formula_code: z.string().optional(),
          last_modified: z.string().optional(),
          ai_prompt: z.string().optional(),
          python_code: z.string().optional(),
        })
        .array(),
      cell_dependency: z.string(),
      columns: HeadingSchema.array(),

      formats: z
        .object({
          x: z.number(),
          y: z.number(),
          alignment: z.enum(['left', 'right', 'center']).optional(),
          bold: z.boolean().optional(),
          fillColor: z.string().optional(),
          italic: z.boolean().optional(),
          textColor: z.string().optional(),
          textFormat: z
            .union([
              z.object({
                type: z.literal('NUMBER'),
                decimalPlaces: z.number().optional(),
              }),
              z.object({
                display: z.literal('CURRENCY'),
                type: z.literal('CURRENCY'),
                symbol: z.string().optional(),
                decimalPlaces: z.number().optional(),
              }),
              z.object({
                type: z.literal('PERCENTAGE'),
                decimalPlaces: z.number().optional(),
              }),
              z.object({
                type: z.literal('EXPONENTIAL'),
                decimalPlaces: z.number().optional(),
              }),
            ])
            .optional(),
          wrapping: z.enum(['wrap', 'clip']).optional(), // default is overflow
        })
        .array(),

      rows: HeadingSchema.array(),
    })
    .array(),
  version: z.literal('1.4'),
});
export type GridFileV1_4 = z.infer<typeof GridFileSchemaV1_4>;

export function upgradeV1_3toV1_4(file: GridFileV1_3): GridFileV1_4 {
  // file.render_dependency is removed
  // sheets and id added
  return {
    sheets: [
      {
        name: 'Sheet 1',
        id: uuid(),
        order: generateKeyBetween(null, null),
        borders: file.borders,
        cells: file.cells,
        cell_dependency: file.cell_dependency,
        columns: file.columns,
        rows: file.rows,
        formats: file.formats,
      },
    ],
    version: '1.4',
  } as GridFileV1_4;
}
