/*
 * @Copyright 2021. Institute for Future Intelligence, Inc.
 */

import create from 'zustand';
import {devtools, persist} from 'zustand/middleware';
import produce, {enableMapSet} from 'immer';
import {WorldModel} from "../models/WorldModel";
import {ElementModel} from "../models/ElementModel";
import {WeatherModel} from "../models/WeatherModel";
import weather from '../resources/weather.csv';
import Papa from "papaparse";
import {Util} from "../Util";
import {DatumEntry, MoveHandleType, ObjectType, ResizeHandleType, User} from "../types";
import {DefaultWorldModel} from "./DefaultWorldModel";
import {Box3, Vector2, Vector3} from "three";
import {ElementModelCloner} from "../models/ElementModelCloner";
import {DefaultViewState} from "./DefaultViewState";
import {ViewState} from "../views/ViewState";
import short from "short-uuid";
import {ElementModelFactory} from "../models/ElementModelFactory";
import {GroundModel} from "../models/GroundModel";

enableMapSet();

export interface CommonStoreState {
    set: (fn: (state: CommonStoreState) => void) => void;

    // only the following four properties are persisted (see the whitelist at the end)
    world: WorldModel;
    elements: ElementModel[];
    viewState: ViewState;
    notes: string[];
    user: User;

    exportContent: () => {};
    clearContent: () => void;

    weatherData: { [key: string]: WeatherModel };
    getWeather: (location: string) => WeatherModel;
    loadWeatherData: () => void;
    getClosestCity: (lat: number, lng: number) => string | null;

    grid: boolean; // this should only show up when editing
    aabb: Box3; // axis-aligned bounding box of elements
    enableOrbitController: boolean;
    clickObjectType: ObjectType | null;
    moveHandleType: MoveHandleType | null;
    resizeHandleType: ResizeHandleType | null;
    resizeAnchor: Vector2;
    showCloudFilePanel: boolean;
    showAccountSettingsPanel: boolean;
    getSelectedElement: () => ElementModel | null;
    getElementById: (id: string) => ElementModel | null;
    selectNone: () => void;
    updateElementById: (id: string, element: Partial<ElementModel>) => void;
    setElementPosition: (id: string, x: number, y: number, z?: number) => void;
    setElementRotation: (id: string, x: number, y: number, z: number) => void;
    setElementNormal: (id: string, x: number, y: number, z: number) => void;
    setElementSize: (id: string, lx: number, ly: number, lz?: number) => void;

    objectTypeToAdd: ObjectType;
    addElement: (parent: ElementModel | GroundModel, position: Vector3, normal?: Vector3) => void;

    pastePoint: Vector3;
    pasteNormal: Vector3;
    elementToPaste: ElementModel[];
    copyElementById: (id: string) => void;
    cutElementById: (id: string) => void;
    pasteElement: () => void;
    deleteElementById: (id: string) => void;
    countElementsByType: (type: ObjectType) => number;
    removeElementsByType: (type: ObjectType) => void;
    countAllChildElementsByType: (parentId: string, type: ObjectType) => number;
    removeAllChildElementsByType: (parentId: string, type: ObjectType) => void;

    dailyLightSensorData: DatumEntry[];
    setDailyLightSensorData: (data: DatumEntry[]) => void;
    yearlyLightSensorData: DatumEntry[];
    setYearlyLightSensorData: (data: DatumEntry[]) => void;
    sensorLabels: string[];
    setSensorLabels: (labels: string[]) => void;

}

export const useStore = create<CommonStoreState>(devtools(persist((
    set,
    get,
) => {

    const immerSet: CommonStoreState['set'] = fn => set(produce(fn));
    const defaultWorldModel = new DefaultWorldModel();
    const defaultElements = defaultWorldModel.getElements();
    const defaultViewState = new DefaultViewState();

    return {

        set: immerSet,
        world: defaultWorldModel,
        elements: defaultElements,
        viewState: defaultViewState,
        notes: [],
        user: {} as User,
        exportContent() {
            const state = get();
            return {
                docid: short.generate(),
                timestamp: new Date().getTime(),
                owner: state.user.displayName,
                email: state.user.email,
                world: state.world,
                elements: state.elements,
                view: state.viewState,
                notes: state.notes
            };
        },
        clearContent() {
            immerSet((state: CommonStoreState) => {
                state.elements = [];
            });
        },

        weatherData: {},

        yearlyLightSensorData: [],
        setYearlyLightSensorData(data) {
            immerSet((state: CommonStoreState) => {
                state.yearlyLightSensorData = [...data];
            });
        },
        dailyLightSensorData: [],
        setDailyLightSensorData(data) {
            immerSet((state: CommonStoreState) => {
                state.dailyLightSensorData = [...data];
            });
        },
        sensorLabels: [],
        setSensorLabels(labels) {
            immerSet((state: CommonStoreState) => {
                state.sensorLabels = [...labels];
            });
        },

        grid: false,
        aabb: new Box3(),
        enableOrbitController: true,
        clickObjectType: null,
        moveHandleType: null,
        resizeHandleType: null,
        resizeAnchor: new Vector2(),
        showCloudFilePanel: false,
        showAccountSettingsPanel: false,

        getSelectedElement() {
            const elements = get().elements;
            for (const e of elements) {
                if (e.selected) {
                    return e;
                }
            }
            return null;
        },
        getElementById(id: string) {
            const elements = get().elements;
            for (const e of elements) {
                if (e.id === id) {
                    return e;
                }
            }
            return null;
        },
        selectNone() {
            immerSet((state: CommonStoreState) => {
                for (const e of state.elements) {
                    e.selected = false;
                }
            });
        },
        updateElementById(id, newProps) {
            immerSet((state: CommonStoreState) => {
                for (let [i, e] of state.elements.entries()) {
                    if (e.id === id) {
                        state.elements[i] = {...e, ...newProps};
                        break;
                    }
                }
            });
        },
        setElementPosition(id, x, y, z?) {
            immerSet((state: CommonStoreState) => {
                for (let [i, e] of state.elements.entries()) {
                    if (e.id === id) {
                        state.elements[i].cx = x;
                        state.elements[i].cy = y;
                        if (z) {
                            state.elements[i].cz = z;
                        }
                        break;
                    }
                }
            });
        },
        setElementRotation(id, x, y, z) {
            immerSet((state: CommonStoreState) => {
                for (let [i, e] of state.elements.entries()) {
                    if (e.id === id || (e.parent && e.parent.id === id)) {
                        const elem = state.elements[i];
                        elem.rotation[0] = x;
                        elem.rotation[1] = y;
                        elem.rotation[2] = z;
                    }
                }
            });
        },
        setElementNormal(id, x, y, z) {
            immerSet((state: CommonStoreState) => {
                for (let [i, e] of state.elements.entries()) {
                    if (e.id === id || (e.parent && e.parent.id === id)) {
                        const elem = state.elements[i];
                        elem.normal[0] = x;
                        elem.normal[1] = y;
                        elem.normal[2] = z;
                    }
                }
            });
        },
        setElementSize(id, lx, ly, lz?) {
            immerSet((state: CommonStoreState) => {
                for (let [i, e] of state.elements.entries()) {
                    if (e.id === id) {
                        state.elements[i].lx = lx;
                        state.elements[i].ly = ly;
                        if (lz) {
                            state.elements[i].lz = lz;
                        }
                        break;
                    }
                }
            });
        },

        objectTypeToAdd: ObjectType.None,
        addElement(parent: ElementModel | GroundModel, position, normal) {
            // position is in three.js coordinate system (y and z are swapped)
            immerSet((state: CommonStoreState) => {
                const m = Util.viewToModel(position);
                switch (state.objectTypeToAdd) {
                    case ObjectType.Human:
                        state.elements.push(ElementModelFactory.makeHuman(state.world.ground, m.x, m.y, m.z));
                        break;
                    case ObjectType.Tree:
                        state.elements.push(ElementModelFactory.makeTree(state.world.ground, m.x, m.y, m.z));
                        break;
                    case ObjectType.Sensor:
                        const parentModel = parent as ElementModel;
                        const relativeCoordinates = Util.relativeCoordinates(m.x, m.y, m.z, parentModel);
                        state.elements.push(ElementModelFactory.makeSensor(
                            parentModel,
                            relativeCoordinates.x,
                            relativeCoordinates.y,
                            relativeCoordinates.z,
                            normal ? Util.viewToModel(normal) : undefined,
                            parent.rotation
                        ));
                        break;
                    case ObjectType.Foundation:
                        state.elements.push(ElementModelFactory.makeFoundation(state.world.ground, m.x, m.y));
                        break;
                    case ObjectType.Cuboid:
                        state.elements.push(ElementModelFactory.makeCuboid(state.world.ground, m.x, m.y));
                        break;
                }
            });
        },

        elementToPaste: [],
        pastePoint: new Vector3(),
        pasteNormal: new Vector3(0, 0, 1),
        copyElementById(id) {
            immerSet((state: CommonStoreState) => {
                for (const e of state.elements) {
                    if (e.id === id) {
                        state.elementToPaste = [e];
                        break;
                    }
                }
            });
        },
        cutElementById(id) {
            immerSet((state: CommonStoreState) => {
                for (const e of state.elements) {
                    if (e.id === id) {
                        state.elementToPaste = [e];
                        break;
                    }
                }
                for (const e of state.elements) {
                    if (e.parent && e.parent.id === id) {
                        state.elementToPaste.push(e);
                    }
                }
                state.elements = state.elements.filter
                ((e) => !(e.id === id || (e.parent && e.parent.id === id)));
            });
        },
        deleteElementById(id) {
            immerSet((state: CommonStoreState) => {
                state.elements = state.elements.filter
                ((e) => !(e.id === id || (e.parent && e.parent.id === id)));
            });
        },

        removeElementsByType(type: ObjectType) {
            immerSet((state: CommonStoreState) => {
                state.elements = state.elements.filter((x) => x.type !== type);
            });
        },
        countElementsByType(type: ObjectType) {
            let count = 0;
            immerSet((state: CommonStoreState) => {
                for (const e of state.elements) {
                    if (e.type === type) {
                        count++;
                    }
                }
            });
            return count;
        },

        removeAllChildElementsByType(parentId: string, type: ObjectType) {
            immerSet((state: CommonStoreState) => {
                state.elements = state.elements.filter((x) => (x.type !== type || x.parent.id !== parentId));
            });
        },
        countAllChildElementsByType(parentId: string, type: ObjectType) {
            let count = 0;
            immerSet((state: CommonStoreState) => {
                for (const e of state.elements) {
                    if (e.type === type && e.parent.id === parentId) {
                        count++;
                    }
                }
            });
            return count;
        },

        pasteElement() {
            immerSet((state: CommonStoreState) => {
                if (state.elementToPaste.length > 0) {
                    let m = Util.viewToModel(state.pastePoint);
                    const newParent = state.getSelectedElement();
                    const oldParent = state.elementToPaste[0].parent;
                    if (newParent && oldParent && !('albedo' in oldParent)) { // Warning: we use albedo to check type
                        state.elementToPaste[0].parent = newParent;
                        m = Util.relativeCoordinates(m.x, m.y, m.z, newParent);
                    }
                    const e = ElementModelCloner.clone(state.elementToPaste[0], m.x, m.y, m.z);
                    if (e) {
                        e.normal = Util.vector3ToArray(Util.viewToModel(state.pasteNormal));
                        state.elements.push(e);
                    }
                    if (state.elementToPaste.length > 1) {
                        // paste children, too
                        for (let i = 1; i < state.elementToPaste.length; i++) {
                            // TODO
                        }
                    }
                }
            });
        },

        loadWeatherData() {
            const data: WeatherModel[] = [];
            Papa.parse(weather, {
                download: true,
                complete: function (results) {
                    for (const row of results.data) {
                        if (Array.isArray(row) && row.length > 1) {
                            const lows: number[] = [];
                            const highs: number[] = [];
                            const sun: number[] = [];
                            for (let i = 5; i < 29; i++) {
                                if ((i - 5) % 2 === 0) {
                                    lows.push(parseFloat(row[i].trim()));
                                } else {
                                    highs.push(parseFloat(row[i].trim()));
                                }
                            }
                            for (let i = 29; i < 41; i++) {
                                sun.push(parseFloat(row[i].trim()));
                            }
                            const wm = {
                                city: row[0].trim(),
                                country: row[1].trim(),
                                longitude: parseFloat(row[2].trim()),
                                latitude: parseFloat(row[3].trim()),
                                elevation: parseFloat(row[4].trim()),
                                lowestTemperatures: lows,
                                highestTemperatures: highs,
                                sunshineHours: sun
                            } as WeatherModel;
                            data.push(wm);
                        }
                    }
                    immerSet((state: CommonStoreState) => {
                        for (const row of data) {
                            state.weatherData[row.city + ', ' + row.country] = row;
                        }
                    });
                }
            });
        },
        getWeather(location: string) {
            return get().weatherData[location];
        },
        getClosestCity(lat: number, lng: number) {
            let min: number = Number.MAX_VALUE;
            let city = null;
            let distance: number;
            const wd = get().weatherData;
            for (const name in wd) {
                if (wd.hasOwnProperty(name)) {
                    distance = Util.getDistance(lng, lat, wd[name].longitude, wd[name].latitude);
                    if (distance < min) {
                        min = distance;
                        city = name;
                    }
                }
            }
            return city;
        }
    };
}, {
    name: 'aladdin-storage',
    whitelist: [
        'world',
        'elements',
        'viewState',
        'notes',
        'user',
        'weatherData',
        'sensorLabels',
        'dailyLightSensorData',
        'yearlyLightSensorData'
    ]
})));

