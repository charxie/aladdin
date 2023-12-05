/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { Checkbox, Input, InputNumber } from 'antd';
import {
  useLabel,
  useLabelColor,
  useLabelFontSize,
  useLabelHeight,
  useLabelShow,
  useLabelSize,
  useLabelText,
} from './elementMenu/menuHooks';
import type { MenuProps } from 'antd';
import { ElementModel } from 'src/models/ElementModel';
import { useLanguage } from 'src/views/hooks';
import { MenuItem } from './menuItems';
import i18n from 'src/i18n/i18n';

interface LabelSubmenuItemProps {
  element: ElementModel;
}

const LabelAddonBefore = (props: any) => {
  return <div style={{ width: '90px' }}>{props.children}</div>;
};

const ShowLabelCheckbox = ({ element }: LabelSubmenuItemProps) => {
  const showLabel = useLabelShow(element);
  const lang = useLanguage();

  return (
    <MenuItem stayAfterClick>
      <Checkbox checked={!!element?.showLabel} onChange={showLabel}>
        {i18n.t('labelSubMenu.KeepShowingLabel', lang)}
      </Checkbox>
    </MenuItem>
  );
};

const LabelTextInput = ({ element }: LabelSubmenuItemProps) => {
  const { labelText, setLabelText } = useLabel(element);
  const updateLabelText = useLabelText(element, labelText);

  const lang = useLanguage();
  return (
    <MenuItem stayAfterClick>
      <Input
        addonBefore={<LabelAddonBefore>{i18n.t('labelSubMenu.LabelText', lang) + ':'}</LabelAddonBefore>}
        value={labelText}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLabelText(e.target.value)}
        onPressEnter={updateLabelText}
        onBlur={updateLabelText}
      />
    </MenuItem>
  );
};

const LabelHeightInput = ({ element }: LabelSubmenuItemProps) => {
  const setLabelHeight = useLabelHeight(element);
  const lang = useLanguage();

  return (
    <MenuItem stayAfterClick>
      <InputNumber
        addonBefore={<LabelAddonBefore>{i18n.t('labelSubMenu.LabelHeight', lang) + ':'}</LabelAddonBefore>}
        min={element.lz / 2 + 0.2}
        max={100}
        step={1}
        precision={1}
        value={element.labelHeight ?? element.lz / 2 + 0.2}
        onChange={(value) => setLabelHeight(value!)}
      />
    </MenuItem>
  );
};

const LabelFontSizeInput = ({ element }: LabelSubmenuItemProps) => {
  const setLabelFontSize = useLabelFontSize(element);
  const lang = useLanguage();

  return (
    <MenuItem stayAfterClick>
      <InputNumber
        addonBefore={<LabelAddonBefore>{i18n.t('labelSubMenu.LabelFontSize', lang) + ':'}</LabelAddonBefore>}
        min={10}
        max={100}
        step={1}
        precision={0}
        value={element.labelFontSize ?? 20}
        onChange={(value) => setLabelFontSize(value!)}
      />
    </MenuItem>
  );
};

const LabelSizeInput = ({ element }: LabelSubmenuItemProps) => {
  const setLabelSize = useLabelSize(element);
  const lang = useLanguage();

  return (
    <MenuItem stayAfterClick>
      <InputNumber
        addonBefore={<LabelAddonBefore>{i18n.t('labelSubMenu.LabelSize', lang) + ':'}</LabelAddonBefore>}
        min={0.2}
        max={5}
        step={0.1}
        precision={1}
        value={element.labelSize ?? 0.2}
        onChange={(value) => setLabelSize(value!)}
      />
    </MenuItem>
  );
};

const LabelColorInput = ({ element }: LabelSubmenuItemProps) => {
  const setLabelColor = useLabelColor(element);
  const lang = useLanguage();

  return (
    <MenuItem stayAfterClick>
      <Input
        addonBefore={<LabelAddonBefore>{i18n.t('labelSubMenu.LabelColor', lang) + ':'}</LabelAddonBefore>}
        value={element.labelColor ?? '#ffffff'}
        onChange={(e) => setLabelColor(e.target.value)}
      />
    </MenuItem>
  );
};

export const createLabelSubmenu = (element: ElementModel) => {
  const items: MenuProps['items'] = [
    {
      key: `${element.type}-show-label`,
      label: <ShowLabelCheckbox element={element} />,
    },
    {
      key: `${element.type}-label-text`,
      label: <LabelTextInput element={element} />,
    },
    {
      key: `${element.type}-label-height`,
      label: <LabelHeightInput element={element} />,
    },
    {
      key: `${element.type}-label-font-size`,
      label: <LabelFontSizeInput element={element} />,
    },
    {
      key: `${element.type}-label-size`,
      label: <LabelSizeInput element={element} />,
    },
    {
      key: `${element.type}-label-color`,
      label: <LabelColorInput element={element} />,
    },
  ];

  return items;
};
