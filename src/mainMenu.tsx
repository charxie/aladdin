/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React from 'react';
import {useStore} from "./stores/common";
import styled from 'styled-components';
import {Menu, Dropdown, Checkbox} from 'antd';
import {ReactComponent as MenuSVG} from './assets/menu.svg';
import 'antd/dist/antd.css';

const {SubMenu} = Menu;

const StyledMenuSVG = styled(MenuSVG)`
  position: absolute;
  top: 10px;
  left: 10px;
  height: 40px;
  width: 40px;
  transition: 0.5s;
  fill: brown;

  &:hover {
    fill: white;
  }
`;

export interface MainMenuProps {

    collectDailyLightSensorData: () => void;
    collectYearlyLightSensorData: () => void;
    openAboutUs: (on: boolean) => void;
    requestUpdate: () => void;

    [key: string]: any;

}

const MainMenu = ({
                      collectDailyLightSensorData,
                      collectYearlyLightSensorData,
                      openAboutUs,
                      requestUpdate,
                      ...rest
                  }: MainMenuProps) => {

    const setCommonStore = useStore(state => state.set);
    const viewState = useStore(state => state.viewState);

    const menu = (
        <Menu>
            <Menu.Item key={'ground-panel-check-box'}>
                <Checkbox checked={viewState.showGroundPanel} onChange={(e) => {
                    setCommonStore((state) => {
                        state.viewState.showGroundPanel = e.target.checked;
                    });
                    requestUpdate();
                }}>
                    Ground Settings
                </Checkbox>
            </Menu.Item>
            <Menu.Item key={'weather-panel-check-box'}>
                <Checkbox checked={viewState.showWeatherPanel} onChange={(e) => {
                    setCommonStore((state) => {
                        state.viewState.showWeatherPanel = e.target.checked;
                    });
                    requestUpdate();
                }}>
                    Weather Data
                </Checkbox>
            </Menu.Item>
            <Menu.Item key={'shadow-check-box'}>
                <Checkbox checked={viewState.shadowEnabled} onChange={(e) => {
                    setCommonStore((state) => {
                        state.viewState.shadowEnabled = e.target.checked;
                    });
                    requestUpdate();
                }}>
                    Enable Shadow
                </Checkbox>
            </Menu.Item>
            <SubMenu key={'sensors'} title={'Sensors'}>
                <Menu.Item key={'sensor-collect-daily-data'} onClick={collectDailyLightSensorData}>
                    Collect Daily Data
                </Menu.Item>
                <Menu.Item key={'sensor-collect-yearly-data'} onClick={collectYearlyLightSensorData}>
                    Collect Yearly Data
                </Menu.Item>
            </SubMenu>
            <Menu.Item key={'about-us'} onClick={() => {
                openAboutUs(true);
            }}>
                About Us
            </Menu.Item>
        </Menu>
    );

    return (
        <Dropdown overlay={menu} trigger={['click']}>
            <StyledMenuSVG/>
        </Dropdown>
    );
};

export default MainMenu;
