/*
 * @Copyright 2021-2022. Institute for Future Intelligence, Inc.
 */

import React, { useState } from 'react';
import { Menu } from 'antd';
import { useStore } from 'src/stores/common';
import * as Selector from 'src/stores/selector';
import { Lock } from '../menuItems';
import i18n from 'src/i18n/i18n';
import { RoofTexture } from 'src/types';
import RoofTextureSelection from './roofTextureSelection';
import RoofColorSelection from './roofColorSelection';
import { RoofModel } from 'src/models/RoofModel';
import RoofOverhangInput from './roofOverhangInput';

export const RoofMenu = () => {
  const roof = useStore(Selector.selectedElement) as RoofModel;
  const language = useStore(Selector.language);
  const setApplyCount = useStore(Selector.setApplyCount);

  const [overhangDialogVisible, setOverhangDialogVisible] = useState(false);
  const [textureDialogVisible, setTextureDialogVisible] = useState(false);
  const [colorDialogVisible, setColorDialogVisible] = useState(false);

  const lang = { lng: language };
  const paddingLeft = '36px';

  return (
    roof && (
      <>
        <Lock keyName={'roof-lock'} />

        {overhangDialogVisible && <RoofOverhangInput setDialogVisible={setOverhangDialogVisible} />}
        <Menu.Item
          key={'roof-overhang'}
          style={{ paddingLeft: paddingLeft }}
          onClick={() => {
            setApplyCount(0);
            setOverhangDialogVisible(true);
          }}
        >
          {i18n.t('roofMenu.OverhangLength', lang)} ...
        </Menu.Item>

        {textureDialogVisible && <RoofTextureSelection setDialogVisible={setTextureDialogVisible} />}
        <Menu.Item
          key={'roof-texture'}
          style={{ paddingLeft: paddingLeft }}
          onClick={() => {
            setApplyCount(0);
            setTextureDialogVisible(true);
          }}
        >
          {i18n.t('word.Texture', lang)} ...
        </Menu.Item>

        {colorDialogVisible && <RoofColorSelection setDialogVisible={setColorDialogVisible} />}
        {(roof.textureType === RoofTexture.NoTexture || roof.textureType === RoofTexture.Default) && (
          <Menu.Item
            key={'roof-color'}
            style={{ paddingLeft: paddingLeft }}
            onClick={() => {
              setApplyCount(0);
              setColorDialogVisible(true);
            }}
          >
            {i18n.t('word.Color', lang)} ...
          </Menu.Item>
        )}
      </>
    )
  );
};
