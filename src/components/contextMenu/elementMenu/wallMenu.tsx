/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Menu } from 'antd';
import { useStore } from '../../../stores/common';
import * as Selector from '../../../stores/selector';
import { Copy, Cut, Lock } from '../menuItems';
import i18n from '../../../i18n/i18n';
import WallTextureSelection from './wallTextureSelection';
import WallHeightInput from './wallHeightInput';
import WallThicknessInput from './wallThicknessInput';
import WallColorSelection from './wallColorSelection';

export const WallMenu = () => {
  const language = useStore(Selector.language);

  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [colorDialogVisible, setColorDialogVisible] = useState(false);
  const [heightDialogVisible, setHeightDialogVisible] = useState(false);
  const [thicknessDialogVisible, setThicknessDialogVisible] = useState(false);

  const lang = { lng: language };
  const paddingLeft = '36px';

  return (
    <>
      <Copy />
      <Cut />
      <Lock />

      <WallTextureSelection
        textureDialogVisible={textureDialogVisible}
        setTextureDialogVisible={setTextureDialogVisible}
      />
      <Menu.Item
        key={'wall-texture'}
        style={{ paddingLeft: paddingLeft }}
        onClick={() => {
          setTextureDialogVisible(true);
        }}
      >
        {i18n.t('word.Texture', lang)} ...
      </Menu.Item>

      <WallColorSelection colorDialogVisible={colorDialogVisible} setColorDialogVisible={setColorDialogVisible} />
      <Menu.Item
        key={'wall-color'}
        style={{ paddingLeft: paddingLeft }}
        onClick={() => {
          setColorDialogVisible(true);
        }}
      >
        {i18n.t('word.Color', lang)} ...
      </Menu.Item>

      <WallHeightInput heightDialogVisible={heightDialogVisible} setHeightDialogVisible={setHeightDialogVisible} />
      <Menu.Item
        key={'wall-height'}
        style={{ paddingLeft: paddingLeft }}
        onClick={() => {
          setHeightDialogVisible(true);
        }}
      >
        {i18n.t('word.Height', lang)} ...
      </Menu.Item>

      <WallThicknessInput
        thicknessDialogVisible={thicknessDialogVisible}
        setThicknessDialogVisible={setThicknessDialogVisible}
      />
      <Menu.Item
        key={'wall-thickness'}
        style={{ paddingLeft: paddingLeft }}
        onClick={() => {
          setThicknessDialogVisible(true);
        }}
      >
        {i18n.t('word.Thickness', lang)} ...
      </Menu.Item>
    </>
  );
};
