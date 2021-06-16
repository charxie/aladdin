/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import React, {useEffect} from "react";
import {calculateDiffuseAndReflectedRadiation, calculatePeakRadiation, getSunDirection} from "./sunTools";
import {Object3D, Raycaster, Vector3} from "three";
import {useThree} from "@react-three/fiber";
import {useStore} from "../stores/common";
import {DatumEntry, ObjectType} from "../types";
import {Util} from "../util";
import {AirMass} from "./analysisConstants";
import {MONTHS} from "../constants";
import {SensorModel} from "../models/sensorModel";

export interface SimulationProps {

    city: string | null;
    dailyLightSensorDataFlag: boolean;
    yearlyLightSensorDataFlag: boolean;

}

const Simulation = ({
                        city,
                        dailyLightSensorDataFlag,
                        yearlyLightSensorDataFlag,
                    }: SimulationProps) => {

    const getWorld = useStore(state => state.getWorld);
    const getWeather = useStore(state => state.getWeather);
    const now = new Date(useStore(state => state.date));
    const latitude = useStore(state => state.latitude);
    const timesPerHour = useStore(state => state.timesPerHour);
    const setDailyLightSensorData = useStore(state => state.setDailyLightSensorData);
    const setYearlyLightSensorData = useStore(state => state.setYearlyLightSensorData);
    const {scene} = useThree();
    const ray = new Raycaster();
    const weather = getWeather(city ?? 'Boston MA, USA');
    const ground = getWorld('default').ground;
    const elements = getWorld('default').elements;
    const elevation = city ? getWeather(city).elevation : 0;
    const interval = 60 / timesPerHour;

    useEffect(() => {
        if (elements && elements.length > 0) {
            collectAllDailyLightSensorData();
        }
    }, [dailyLightSensorDataFlag]);

    useEffect(() => {
        if (elements && elements.length > 0) {
            collectAllYearlyLightSensorData();
        }
    }, [yearlyLightSensorDataFlag]);

    const inShadow = (time: Date, position: Vector3, sunDirection: Vector3) => {
        // convert the position and direction from physics model to the coordinate system of three.js
        ray.set(
            new Vector3(position.x, position.z, -position.y),
            new Vector3(sunDirection.x, sunDirection.z, -sunDirection.y)
        );
        const content = scene.children.filter(c => c.name === 'Content');
        if (content.length > 0) {
            const components = content[0].children;
            const objects: Object3D[] = [];
            for (const c of components) {
                objects.push(...c.children.filter(x => x.castShadow));
            }
            const intersects = ray.intersectObjects(objects);
            //console.log(time, intersects)
            return intersects.length > 0;
        }
        return false;
    };

    const collectAllDailyLightSensorData = () => {
        for (const e of elements) {
            if (e.type === ObjectType.Sensor) {
                collectDailyLightSensorData(e as SensorModel);
            }
        }
    }

    const collectDailyLightSensorData = (sensor: SensorModel) => {
        const normal = new Vector3(0, 0, 1);
        const position = new Vector3(sensor.cx, sensor.cy, sensor.cz);
        const result = new Array(24).fill(0);
        const year = now.getFullYear();
        const month = now.getMonth();
        const date = now.getDate();
        const dayOfYear = Util.dayOfYear(now);
        let count = 0;
        for (let i = 0; i < 24; i++) {
            for (let j = 0; j < timesPerHour; j++) {
                const cur = new Date(year, month, date, i, j * interval);
                const sunDirection = getSunDirection(cur, latitude);
                if (sunDirection.z > 0) {
                    // when the sun is out
                    count++;
                    const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
                    const dot = normal.dot(sunDirection);
                    if (dot > 0) {
                        if (!inShadow(cur, position, sunDirection)) {
                            // direct radiation
                            result[i] += dot * peakRadiation;
                        }
                    }
                    // indirect radiation
                    result[i] += calculateDiffuseAndReflectedRadiation(ground, month, normal, peakRadiation);
                }
            }
        }
        const daylight = count * interval / 60;
        const clearness = weather.sunshineHours[month] / (30 * daylight);
        // apply clearness and convert the unit of time step from minute to hour so that we get kWh
        const data = [];
        for (let i = 0; i < 24; i++) {
            data.push({
                Hour: i,
                Radiation: result[i] * clearness / timesPerHour
            } as DatumEntry);
        }
        setDailyLightSensorData(data);
    };

    const collectAllYearlyLightSensorData = () => {
        for (const e of elements) {
            if (e.type === ObjectType.Sensor) {
                collectYearlyLightSensorData(e as SensorModel)
            }
        }
    }

    const collectYearlyLightSensorData = (sensor: SensorModel) => {
        const data = [];
        const position = new Vector3(sensor.cx, sensor.cy, sensor.cz);
        const normal = new Vector3(0, 0, 1);
        const year = now.getFullYear();
        const date = 15;
        for (let month = 0; month < 12; month++) {
            const midMonth = new Date(year, month, date);
            const dayOfYear = Util.dayOfYear(midMonth);
            let total = 0;
            let count = 0;
            for (let hour = 0; hour < 24; hour++) {
                for (let step = 0; step < timesPerHour; step++) {
                    const cur = new Date(year, month, date, hour, step * interval);
                    const sunDirection = getSunDirection(cur, latitude);
                    if (sunDirection.z > 0) {
                        // when the sun is out
                        count++;
                        const peakRadiation = calculatePeakRadiation(sunDirection, dayOfYear, elevation, AirMass.SPHERE_MODEL);
                        const dot = normal.dot(sunDirection);
                        if (dot > 0) {
                            if (!inShadow(cur, position, sunDirection)) {
                                // direct radiation
                                total += dot * peakRadiation;
                            }
                        }
                        // indirect radiation
                        total += calculateDiffuseAndReflectedRadiation(ground, month, normal, peakRadiation);
                    }
                }
            }
            const daylight = count * interval / 60;
            const clearness = weather.sunshineHours[midMonth.getMonth()] / (30 * daylight);
            total *= clearness; // apply clearness
            total /= timesPerHour; // convert the unit of timeStep from minute to hour so that we get kWh
            data.push({
                Month: MONTHS[month],
                Daylight: daylight,
                Clearness: clearness * 100,
                Radiation: total
            } as DatumEntry);
        }
        setYearlyLightSensorData(data);
    };

    return <></>;

};

export default Simulation;
