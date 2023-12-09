/*
 * @Copyright 2021-2023. Institute for Future Intelligence, Inc.
 */

import { useStore } from '../../../../stores/common';
import { ObjectType } from '../../../../types';
import { MenuItem, Paste } from '../../menuItems';
import i18n from '../../../../i18n/i18n';
import { ElementCounter } from '../../../../stores/ElementCounter';
import type { MenuProps } from 'antd';
import {
  AlbedoInput,
  GroundColorPicker,
  GroundImageCheckbox,
  IrradianceLossInput,
  LeafOutDayInput,
  LeafShedDayInput,
  LockElementsItem,
  RemoveGroundElementsItem,
  WaterSurfaceCheckbox,
} from './groundMenuItems';
import { MONTHS_ABBV } from 'src/constants';

type GroundCounterItem = { key: keyof ElementCounter; type: ObjectType; itemLabel: string; modalTitle: string };

const counterItems: GroundCounterItem[] = [
  {
    key: 'humanCount',
    type: ObjectType.Human,
    itemLabel: 'groundMenu.RemoveAllUnlockedPeople',
    modalTitle: 'groundMenu.DoYouReallyWantToRemoveAllPeople',
  },
  {
    key: 'treeCount',
    type: ObjectType.Tree,
    itemLabel: 'groundMenu.RemoveAllUnlockedTrees',
    modalTitle: 'groundMenu.DoYouReallyWantToRemoveAllTrees',
  },
  {
    key: 'flowerCount',
    type: ObjectType.Flower,
    itemLabel: 'groundMenu.RemoveAllUnlockedFlowers',
    modalTitle: 'groundMenu.DoYouReallyWantToRemoveAllFlowers',
  },
  {
    key: 'solarPanelCount',
    type: ObjectType.SolarPanel,
    itemLabel: 'groundMenu.RemoveAllUnlockedSolarPanels',
    modalTitle: 'groundMenu.DoYouReallyWantToRemoveAllSolarPanels',
  },
  {
    key: 'foundationCount',
    type: ObjectType.Foundation,
    itemLabel: 'groundMenu.RemoveAllUnlockedFoundations',
    modalTitle: 'groundMenu.DoYouReallyWantToRemoveAllFoundations',
  },
  {
    key: 'cuboidCount',
    type: ObjectType.Cuboid,
    itemLabel: 'groundMenu.RemoveAllUnlockedCuboids',
    modalTitle: 'groundMenu.DoYouReallyWantToRemoveAllCuboids',
  },
];

const legalToPaste = () => {
  const elementsToPaste = useStore.getState().elementsToPaste;

  if (!elementsToPaste || elementsToPaste.length === 0) return false;

  const e = elementsToPaste[0];
  return (
    e.type === ObjectType.Human ||
    e.type === ObjectType.Tree ||
    e.type === ObjectType.Flower ||
    e.type === ObjectType.Cuboid ||
    e.type === ObjectType.Foundation
  );
};

const createMonthlyIrradianceLossSubmenu = () => {
  return MONTHS_ABBV.slice().reduce((acc, curr, idx, arr) => {
    if (acc && idx % 2 !== 0) {
      acc.push({
        key: `${arr[idx - 1]}-${arr[idx]}`,
        label: (
          <MenuItem stayAfterClick noPadding>
            <IrradianceLossInput monthIndex={idx - 1} />
            <IrradianceLossInput monthIndex={idx} />
          </MenuItem>
        ),
      });
    }
    return acc;
  }, [] as MenuProps['items']);
};

export const createGroundMenu = (updateMenu: () => void) => {
  const lang = { lng: useStore.getState().language };

  const elementCounter: ElementCounter = useStore.getState().countAllElementsByType(true);

  const items: MenuProps['items'] = [];

  // image-on-ground
  items.push({
    key: 'image-on-ground',
    label: <GroundImageCheckbox />,
  });

  // water-surface
  items.push({
    key: 'water-surface',
    label: <WaterSurfaceCheckbox updateMenu={updateMenu} />,
  });

  // paste
  if (legalToPaste()) {
    items.push({
      key: 'ground-paste',
      label: <Paste />,
    });
  }

  // elements counter
  counterItems.forEach(({ key, type, itemLabel, modalTitle }) => {
    const count = elementCounter[key];
    if (typeof count === 'number' && count > 0) {
      items.push({
        key: `ground-remove-all-${type}s`,
        label: (
          <RemoveGroundElementsItem
            objectType={type}
            itemLabel={`${i18n.t(itemLabel, lang)} (${count})`}
            modalTitle={`${i18n.t(modalTitle, lang)} (${count})?`}
          />
        ),
      });
    }
  });

  // lock-all-elements
  if (elementCounter.unlockedCount > 0) {
    items.push({
      key: 'lock-all-elements',
      label: (
        <LockElementsItem
          lock={true}
          count={elementCounter.unlockedCount}
          label={i18n.t('groundMenu.LockAllUnlockedElements', lang)}
          updateMenu={updateMenu}
        />
      ),
    });
  }

  // unlock-all-elements
  if (elementCounter.lockedCount > 0 && useStore.getState().elements.length > 0) {
    items.push({
      key: 'unlock-all-elements',
      label: (
        <LockElementsItem
          lock={false}
          count={elementCounter.lockedCount}
          label={i18n.t('groundMenu.UnlockAllLockedElements', lang)}
          updateMenu={updateMenu}
        />
      ),
    });
  }

  // ground-color-submenu
  if (!useStore.getState().viewState.waterSurface) {
    items.push({
      key: 'ground-color-submenu',
      label: <MenuItem>{i18n.t('word.Color', lang)}</MenuItem>,
      children: [
        {
          key: 'groung-color-picker',
          label: <GroundColorPicker />,
          style: { backgroundColor: 'white' },
        },
      ],
    });
  }

  // vegetation-submenu
  items.push({
    key: 'vegetation-submenu',
    label: <MenuItem>{i18n.t('groundMenu.Vegetation', lang)}</MenuItem>,
    children: [
      {
        key: 'leaf-out-day',
        label: <LeafOutDayInput />,
      },
      {
        key: 'leaf-shed-day',
        label: <LeafShedDayInput />,
      },
    ],
  });

  // monthly-irradiance-loss-submenu
  items.push({
    key: 'monthly-irradiance-loss-submenu',
    label: <MenuItem>{i18n.t('groundMenu.MonthlyIrradianceLoss', lang)}</MenuItem>,
    children: createMonthlyIrradianceLossSubmenu(),
  });

  // ground-albedo
  items.push({
    key: 'ground-albedo',
    label: <AlbedoInput />,
  });

  const onClick: MenuProps['onClick'] = ({ key }) => {
    // console.log('clicked on item', key);
  };

  return { items, onClick } as MenuProps;
};
