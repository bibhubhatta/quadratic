import { BorderSelection, CellBorderLine } from '@/quadratic-core/quadratic_core';
import {
  BorderAllIcon,
  BorderBottomIcon,
  BorderColorIcon,
  BorderHorizontalIcon,
  BorderInnerIcon,
  BorderLeftIcon,
  BorderNoneIcon,
  BorderOuterIcon,
  BorderRightIcon,
  BorderStyleIcon,
  BorderTopIcon,
  BorderVerticalIcon,
} from '@/ui/icons';
import { Tooltip } from '@mui/material';
import { ClickEvent, MenuItem, SubMenu } from '@szhsin/react-menu';
import { useCallback, useEffect, useState } from 'react';
import { ColorResult } from 'react-color';
import { sheets } from '../../../../../grid/controller/Sheets';
import { convertReactColorToString, convertTintToString } from '../../../../../helpers/convertColor';
import { colors } from '../../../../../theme/colors';
import { QColorPicker } from '../../../../components/qColorPicker';
import { ChangeBorder, useBorders } from '../useBorders';
import './useGetBorderMenu.css';

export function useGetBorderMenu(): JSX.Element {
  const sheet = sheets.sheet;

  const [lineStyle, setLineStyle] = useState<CellBorderLine | undefined>();
  const [borderSelection, setBorderSelection] = useState<BorderSelection | undefined>();
  const defaultColor = convertTintToString(colors.defaultBorderColor);
  const [color, setColor] = useState<string>(defaultColor);

  const { changeBorders } = useBorders();

  const [multiCursor, setMultiCursor] = useState(!!sheet.cursor.multiCursor);
  const clearSelection = useCallback(() => {
    setBorderSelection(0);
    setMultiCursor(!!sheet.cursor.multiCursor);
  }, [sheet.cursor.multiCursor]);
  // clear border type when changing selection
  useEffect(() => {
    window.addEventListener('cursor-position', clearSelection);
    return () => window.removeEventListener('cursor-position', clearSelection);
  }, [clearSelection]);

  const handleChangeBorders = useCallback(
    (borderSelection: BorderSelection | undefined, color: string, lineStyle?: CellBorderLine): void => {
      if (borderSelection === undefined) return;
      const borders: ChangeBorder = { selection: borderSelection, type: lineStyle };
      if (color !== defaultColor) borders.color = color;
      changeBorders(borders);
    },
    [changeBorders, defaultColor]
  );

  const handleChangeBorderColor = useCallback(
    (change: ColorResult) => {
      const converted = convertReactColorToString(change);
      if (converted !== color) {
        setColor(converted);
      }
      handleChangeBorders(borderSelection, converted, lineStyle);
    },
    [color, setColor, borderSelection, handleChangeBorders, lineStyle]
  );

  const handleChangeBorderType = useCallback(
    (e: ClickEvent, change?: CellBorderLine): void => {
      e.keepOpen = true;
      if (change !== lineStyle) {
        setLineStyle(change);
      }
      handleChangeBorders(borderSelection, color, change);
    },
    [lineStyle, setLineStyle, borderSelection, color, handleChangeBorders]
  );

  const BorderSelectionButton = (props: {
    type: BorderSelection;
    label: JSX.Element;
    disabled?: boolean;
    title: string;
  }): JSX.Element => {
    return (
      <div
        className={`borderMenuType ${props.disabled ? 'borderDisabled' : ''}`}
        onClick={() => {
          if (!props.disabled) {
            setBorderSelection(props.type);
            handleChangeBorders(props.type, color);
          }
        }}
      >
        <Tooltip title={props.title} arrow disableInteractive>
          {props.label}
        </Tooltip>
      </div>
    );
  };

  return (
    <div className="borderMenu">
      <div className="borderMenuLines">
        <div className="borderMenuLine">
          <BorderSelectionButton
            type={BorderSelection.All}
            title="All borders"
            label={<BorderAllIcon className="h-5 w-5" />}
          />
          <BorderSelectionButton
            type={BorderSelection.Inner}
            title="Inner borders"
            label={<BorderInnerIcon className="h-5 w-5" />}
            disabled={!multiCursor}
          />
          <BorderSelectionButton
            type={BorderSelection.Outer}
            title="Outer borders"
            label={<BorderOuterIcon className="h-5 w-5" />}
          />
          <BorderSelectionButton
            type={BorderSelection.Horizontal}
            title="Horizontal borders"
            label={<BorderHorizontalIcon className="h-5 w-5" />}
            disabled={!multiCursor}
          />
          <BorderSelectionButton
            type={BorderSelection.Vertical}
            title="Vertical borders"
            label={<BorderVerticalIcon className="h-5 w-5" />}
            disabled={!multiCursor}
          />
        </div>
        <div className="borderMenuLine">
          <BorderSelectionButton
            type={BorderSelection.Left}
            title="Left border"
            label={<BorderLeftIcon className="h-5 w-5" />}
          />
          <BorderSelectionButton
            type={BorderSelection.Top}
            title="Top border"
            label={<BorderTopIcon className="h-5 w-5" />}
          />
          <BorderSelectionButton
            type={BorderSelection.Right}
            title="Right border"
            label={<BorderRightIcon className="h-5 w-5" />}
          />
          <BorderSelectionButton
            type={BorderSelection.Bottom}
            title="Bottom border"
            label={<BorderBottomIcon className="h-5 w-5" />}
          />
          <BorderSelectionButton
            type={BorderSelection.Clear}
            title="Clear borders"
            label={<BorderNoneIcon className="h-5 w-5" />}
          />
        </div>
      </div>
      <div className="borderMenuFormatting">
        <SubMenu
          className="borderSubmenu color-picker-submenu"
          id="FillBorderColorMenuID"
          label={<BorderColorIcon className="mr-1 h-5 w-5"></BorderColorIcon>}
        >
          <QColorPicker onChangeComplete={handleChangeBorderColor} />
        </SubMenu>
        <SubMenu
          id="BorderLineStyleMenuID"
          className="borderSubmenu"
          label={<BorderStyleIcon className="mr-1 h-5 w-5" />}
        >
          <MenuItem onClick={(e) => handleChangeBorderType(e)}>
            <div className="lineStyleBorder normalBorder"></div>
          </MenuItem>
          <MenuItem onClick={(e) => handleChangeBorderType(e, CellBorderLine.Line2)}>
            <div className="lineStyleBorder doubleBorder"></div>
          </MenuItem>
          <MenuItem onClick={(e) => handleChangeBorderType(e, CellBorderLine.Line3)}>
            <div className="lineStyleBorder tripleBorder"></div>
          </MenuItem>
          <MenuItem onClick={(e) => handleChangeBorderType(e, CellBorderLine.Dashed)}>
            <div className="lineStyleBorder dashedBorder"></div>
          </MenuItem>
          <MenuItem onClick={(e) => handleChangeBorderType(e, CellBorderLine.Dotted)}>
            <div className="lineStyleBorder dottedBorder"></div>
          </MenuItem>
          <MenuItem onClick={(e) => handleChangeBorderType(e, CellBorderLine.Double)}>
            <div className="lineStyleBorder twoLineBorder"></div>
          </MenuItem>
        </SubMenu>
      </div>
    </div>
  );
}
