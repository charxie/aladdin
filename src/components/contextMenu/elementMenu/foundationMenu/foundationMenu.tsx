/*
 * @Copyright 2021-2024. Institute for Future Intelligence, Inc.
 */

import { useStore } from 'src/stores/common';
import type { MenuProps } from 'antd';
import { BuildingCompletionStatus, FoundationTexture, ObjectType, SolarStructure } from 'src/types';
import { Copy, Cut, DialogItem, GroupMasterCheckbox, Lock, MenuItem, Paste } from '../../menuItems';
import { FoundationModel } from 'src/models/FoundationModel';
import { ElementModel } from 'src/models/ElementModel';
import {
  AddPolygonItem,
  BuildingCheckbox,
  HvacSystemIdInput,
  SolarStructureRadioGroup,
  ThermostatTemperatureInput,
  ToleranceThresholdInput,
} from './foundationMenuItems';
import i18n from 'src/i18n/i18n';
import FoundationTextureSelection from './foundationTextureSelection';
import FoundationColorSelection from './foundationColorSelection';
import FoundationLengthInput from './foundationLengthInput';
import FoundationWidthInput from './foundationWidthInput';
import FoundationHeightInput from './foundationHeightInput';
import FoundationAzimuthInput from './foundationAzimuthInput';
import { Util } from 'src/Util';
import GroundFloorRValueInput from './groundFloorRValueInput';
import SolarAbsorberPipeHeightInput from '../solarStructureMenus/solarAbsorberPipeHeightInput';
import SolarAbsorberPipeApertureWidthInput from '../solarStructureMenus/solarAbsorberPipeApertureWidthInput';
import SolarAbsorberPipePoleNumberInput from '../solarStructureMenus/solarAbsorberPipePoleNumberInput';
import SolarAbsorberPipeAbsorptanceInput from '../solarStructureMenus/solarAbsorberPipeAbsorptanceInput';
import SolarAbsorberPipeOpticalEfficiencyInput from '../solarStructureMenus/solarAbsorberPipeOpticalEfficiencyInput';
import SolarAbsorberPipeThermalEfficiencyInput from '../solarStructureMenus/solarAbsorberPipeThermalEfficiencyInput';
import SolarPowerTowerHeightInput from '../solarStructureMenus/solarPowerTowerHeightInput';
import SolarPowerTowerRadiusInput from '../solarStructureMenus/solarPowerTowerRadiusInput';
import SolarPowerTowerReceiverAbsorptanceInput from '../solarStructureMenus/solarPowerTowerReceiverAbsorptanceInput';
import SolarPowerTowerReceiverThermalEfficiencyInput from '../solarStructureMenus/solarPowerTowerReceiverThermalEfficiencyInput';
import SolarPowerTowerReceiverOpticalEfficiencyInput from '../solarStructureMenus/solarPowerTowerReceiverOpticalEfficiencyInput';
import SolarUpdraftTowerChimneyHeightInput from '../solarStructureMenus/solarUpdraftTowerChimneyHeightInput';
import SolarUpdraftTowerChimneyRadiusInput from '../solarStructureMenus/solarUpdraftTowerChimneyRadiusInput';
import SolarUpdraftTowerCollectorHeightInput from '../solarStructureMenus/solarUpdraftTowerCollectorHeightInput';
import SolarUpdraftTowerCollectorRadiusInput from '../solarStructureMenus/solarUpdraftTowerCollectorRadiusInput';
import SolarUpdraftTowerCollectorTransmissivityInput from '../solarStructureMenus/solarUpdraftTowerCollectorTransmissivityInput';
import SolarUpdraftTowerCollectorEmissivityInput from '../solarStructureMenus/solarUpdraftTowerCollectorEmissivityInput';
import SolarUpdraftTowerDischargeCoefficientInput from '../solarStructureMenus/solarUpdraftTowerDischargeCoefficientInput';
import SolarUpdraftTowerTurbineEfficiencyInput from '../solarStructureMenus/solarUpdraftTowerTurbineEfficiencyInput';
import SolarPanelTiltAngleGaWizard from '../solarPanelTiltAngleGaWizard';
import SolarPanelTiltAnglePsoWizard from '../solarPanelTiltAnglePsoWizard';
import { createLabelSubmenu } from '../../labelSubmenuItems';
import { createFoundationElementCounterSubmenu } from './foundationElementCounterSubmenu';

const legalToPasteOnFoundation = () => {
  const elementsToPaste = useStore.getState().elementsToPaste;

  if (elementsToPaste && elementsToPaste.length > 0) {
    // when there are multiple elements to paste, the first element is the parent
    // we check the legality of the parent here
    const e = elementsToPaste[0];
    if (
      e.type === ObjectType.Human ||
      e.type === ObjectType.Tree ||
      e.type === ObjectType.Flower ||
      e.type === ObjectType.Polygon ||
      e.type === ObjectType.Sensor ||
      e.type === ObjectType.Light ||
      e.type === ObjectType.SolarPanel ||
      e.type === ObjectType.WaterHeater ||
      e.type === ObjectType.ParabolicDish ||
      e.type === ObjectType.Heliostat ||
      e.type === ObjectType.FresnelReflector ||
      e.type === ObjectType.ParabolicTrough ||
      e.type === ObjectType.WindTurbine ||
      e.type === ObjectType.Wall
    ) {
      return true;
    }
  }
  return false;
};

export const createFoundationMenu = (selectedElement: ElementModel) => {
  const items: MenuProps['items'] = [];

  if (selectedElement.type !== ObjectType.Foundation) return { items };

  const foundation = selectedElement as FoundationModel;

  const lang = { lng: useStore.getState().language };
  const editable = !foundation.locked;

  const isBuilding =
    !foundation.notBuilding &&
    Util.getBuildingCompletionStatus(foundation, useStore.getState().elements) === BuildingCompletionStatus.COMPLETE;

  const counterAll = useStore.getState().countAllOffspringsByTypeAtOnce(foundation.id, true);

  const counterUnlocked = useStore.getState().countAllOffspringsByTypeAtOnce(foundation.id, false);

  if (legalToPasteOnFoundation()) {
    items.push({
      key: 'foundation-paste',
      label: <Paste />,
    });
  }

  items.push({
    key: 'foundation-copy',
    label: <Copy />,
  });

  if (editable) {
    items.push({
      key: 'foundation-cut',
      label: <Cut />,
    });
  }

  items.push({
    key: 'foundation-lock',
    label: <Lock selectedElement={foundation} />,
  });

  if (editable) {
    items.push({
      key: 'foundation-group-master',
      label: <GroupMasterCheckbox groupableElement={foundation} />,
    });
  }

  items.push({
    key: 'building',
    label: <BuildingCheckbox foundation={foundation} />,
  });

  if (counterAll.gotSome()) {
    items.push({
      key: 'lock-unlock-clear-on-foundation',
      label: <MenuItem>{i18n.t('word.Elements', lang)}</MenuItem>,
      children: createFoundationElementCounterSubmenu(foundation, counterAll, counterUnlocked),
    });
  }

  if (editable) {
    if (!foundation.textureType || foundation.textureType === FoundationTexture.NoTexture) {
      items.push({
        key: 'foundation-color',
        label: <DialogItem Dialog={FoundationColorSelection}>{i18n.t('word.Color', lang)} ...</DialogItem>,
      });
    }

    items.push({
      key: 'foundation-texture',
      label: <DialogItem Dialog={FoundationTextureSelection}>{i18n.t('word.Texture', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'foundation-length',
      label: <DialogItem Dialog={FoundationLengthInput}>{i18n.t('word.Length', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'foundation-width',
      label: <DialogItem Dialog={FoundationWidthInput}>{i18n.t('word.Width', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'foundation-height',
      label: <DialogItem Dialog={FoundationHeightInput}>{i18n.t('word.Height', lang)} ...</DialogItem>,
    });

    items.push({
      key: 'foundation-azimuth',
      label: <DialogItem Dialog={FoundationAzimuthInput}>{i18n.t('word.Azimuth', lang)} ...</DialogItem>,
    });

    if (isBuilding) {
      items.push({
        key: 'ground-floor-r-value',
        label: (
          <DialogItem Dialog={GroundFloorRValueInput}>
            {i18n.t('foundationMenu.GroundFloorRValue', lang)} ...
          </DialogItem>
        ),
      });
    }
  }

  items.push({
    key: 'add-polygon-on-foundation',
    label: <AddPolygonItem foundation={foundation} />,
  });

  if (!foundation.notBuilding && counterAll.wallCount > 0) {
    items.push({
      key: 'building-hvac-system',
      label: <MenuItem>{i18n.t('word.BuildingHVACSystem', lang)}</MenuItem>,
      children: [
        {
          key: 'hvac-system-id',
          label: <HvacSystemIdInput foundation={foundation} />,
        },
        {
          key: 'thermostat-temperature',
          label: <ThermostatTemperatureInput foundation={foundation} />,
        },
        {
          key: 'tolerance-threshold',
          label: <ToleranceThresholdInput foundation={foundation} />,
        },
      ],
    });
  }

  if (editable) {
    items.push({
      key: 'select-solar-structure',
      label: <MenuItem>{i18n.t('foundationMenu.SolarStructure', lang)}</MenuItem>,
      children: [
        {
          key: 'select-solar-structure-submenu',
          label: <SolarStructureRadioGroup foundation={foundation} />,
          style: { backgroundColor: 'white' },
        },
      ],
    });

    if (foundation.solarStructure === SolarStructure.FocusPipe) {
      items.push({
        key: 'solar-absorber-pipe-physical-properties',
        label: <MenuItem>{i18n.t('solarAbsorberPipeMenu.AbsorberPipePhysicalProperties', lang)}</MenuItem>,
        children: [
          {
            key: 'solar-absorber-pipe-height',
            label: (
              <DialogItem noPadding Dialog={SolarAbsorberPipeHeightInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberHeight', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-absorber-pipe-aperture-width',
            label: (
              <DialogItem noPadding Dialog={SolarAbsorberPipeApertureWidthInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberApertureWidth', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'foundation-solar-receiver-pipe-pole-number',
            label: (
              <DialogItem noPadding Dialog={SolarAbsorberPipePoleNumberInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberPipePoleNumber', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-absorber-pipe-absorptance',
            label: (
              <DialogItem noPadding Dialog={SolarAbsorberPipeAbsorptanceInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberAbsorptance', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-absorber-optical-efficiency',
            label: (
              <DialogItem noPadding Dialog={SolarAbsorberPipeOpticalEfficiencyInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberOpticalEfficiency', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-absorber-thermal-efficiency',
            label: (
              <DialogItem noPadding Dialog={SolarAbsorberPipeThermalEfficiencyInput}>
                {i18n.t('solarAbsorberPipeMenu.AbsorberThermalEfficiency', lang)} ...
              </DialogItem>
            ),
          },
        ],
      });
    }

    if (foundation.solarStructure === SolarStructure.FocusTower) {
      items.push({
        key: 'solar-power-tower-physical-properties',
        label: <MenuItem>{i18n.t('solarPowerTowerMenu.ReceiverTowerPhysicalProperties', lang)}</MenuItem>,
        children: [
          {
            key: 'solar-power-tower-height',
            label: (
              <DialogItem noPadding Dialog={SolarPowerTowerHeightInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverTowerHeight', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-power-tower-radius',
            label: (
              <DialogItem noPadding Dialog={SolarPowerTowerRadiusInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverTowerRadius', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-power-tower-receiver-absorptance',
            label: (
              <DialogItem noPadding Dialog={SolarPowerTowerReceiverAbsorptanceInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverAbsorptance', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-power-tower-receiver-optical-efficiency',
            label: (
              <DialogItem noPadding Dialog={SolarPowerTowerReceiverOpticalEfficiencyInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverOpticalEfficiency', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-power-tower-receiver-thermal-efficiency',
            label: (
              <DialogItem noPadding Dialog={SolarPowerTowerReceiverThermalEfficiencyInput}>
                {i18n.t('solarPowerTowerMenu.ReceiverThermalEfficiency', lang)} ...
              </DialogItem>
            ),
          },
        ],
      });
    }

    if (foundation.solarStructure === SolarStructure.UpdraftTower) {
      items.push({
        key: 'solar-updraft-tower-physical-properties',
        label: <MenuItem>{i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerPhysicalProperties', lang)}</MenuItem>,
        children: [
          {
            key: 'solar-updraft-tower-chimney-height',
            label: (
              <DialogItem noPadding Dialog={SolarUpdraftTowerChimneyHeightInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerChimneyHeight', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-chimney-radius',
            label: (
              <DialogItem noPadding Dialog={SolarUpdraftTowerChimneyRadiusInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerChimneyRadius', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-collector-height',
            label: (
              <DialogItem noPadding Dialog={SolarUpdraftTowerCollectorHeightInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorHeight', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-collector-radius',
            label: (
              <DialogItem noPadding Dialog={SolarUpdraftTowerCollectorRadiusInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorRadius', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-collector-transmissivity',
            label: (
              <DialogItem noPadding Dialog={SolarUpdraftTowerCollectorTransmissivityInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorTransmissivity', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-collector-emissivity',
            label: (
              <DialogItem noPadding Dialog={SolarUpdraftTowerCollectorEmissivityInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerCollectorEmissivity', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-discharge-coefficient',
            label: (
              <DialogItem noPadding Dialog={SolarUpdraftTowerDischargeCoefficientInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerDischargeCoefficient', lang)} ...
              </DialogItem>
            ),
          },
          {
            key: 'solar-updraft-tower-turbine-efficiency',
            label: (
              <DialogItem noPadding Dialog={SolarUpdraftTowerTurbineEfficiencyInput}>
                {i18n.t('solarUpdraftTowerMenu.SolarUpdraftTowerTurbineEfficiency', lang)} ...
              </DialogItem>
            ),
          },
        ],
      });
    }
  }

  items.push({
    key: 'optimization',
    label: <MenuItem>{i18n.t('optimizationMenu.Optimization', lang)}</MenuItem>,
    children: [
      {
        key: 'genetic-algorithms',
        label: <MenuItem noPadding>{i18n.t('optimizationMenu.GeneticAlgorithm', lang)}</MenuItem>,
        disabled: counterUnlocked.solarPanelCount === 0,
        children: [
          {
            key: 'solar-panel-tilt-angle-ga-optimizer',
            label: (
              <DialogItem noPadding Dialog={SolarPanelTiltAngleGaWizard}>
                {i18n.t('optimizationMenu.SolarPanelTiltAngleOptimization', lang)}...
              </DialogItem>
            ),
          },
        ],
      },
      {
        key: 'particle-swarm-optimization',
        label: <MenuItem noPadding>{i18n.t('optimizationMenu.ParticleSwarmOptimization', lang)}</MenuItem>,
        disabled: counterUnlocked.solarPanelCount === 0,
        children: [
          {
            key: 'solar-panel-tilt-angle-pso-optimizer',
            label: (
              <DialogItem noPadding Dialog={SolarPanelTiltAnglePsoWizard}>
                {i18n.t('optimizationMenu.SolarPanelTiltAngleOptimization', lang)}...
              </DialogItem>
            ),
          },
        ],
      },
    ],
  });

  if (editable) {
    items.push({
      key: 'foundation-label',
      label: <MenuItem>{i18n.t('labelSubMenu.Label', lang)}</MenuItem>,
      children: createLabelSubmenu(foundation),
    });
  }

  return { items } as MenuProps;
};
