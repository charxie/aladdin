/*
 * @Copyright 2023. Institute for Future Intelligence, Inc.
 */

import sites from '../sites/sites.json';
import BuildingIcon from '../assets/map-building.png';
import SolarPanelIcon from '../assets/map-solar-panel.png';
import ParabolicDishIcon from '../assets/map-parabolic-dish.png';
import ParabolicTroughIcon from '../assets/map-parabolic-trough.png';
import FresnelReflectorIcon from '../assets/map-fresnel-reflector.png';
import PowerTowerIcon from '../assets/map-power-tower.png';

import React, { useCallback, useRef, useState } from 'react';
import { GoogleMap, Marker, GoogleMapProps, InfoWindow } from '@react-google-maps/api';
import { useStore } from '../stores/common';
import * as Selector from '../stores/selector';
import { UndoableChange } from '../undo/UndoableChange';
import { UndoableChangeLocation } from '../undo/UndoableChangeLocation';
import { DEFAULT_MODEL_MAP_ZOOM } from '../constants';
import { showError } from '../helpers';
import i18n from '../i18n/i18n';

export interface ModelMapProps {
  closeMap: () => void;
  openModel: (userid: string, title: string) => void;
}

export interface ModelSite {
  latitude: number;
  longitude: number;
  type: string;
  module_number?: number;
  label?: string;
  town?: string;
  state?: string;
  country?: string;
  userid: string;
  title: string;
}

const ModelMap = ({ closeMap, openModel }: ModelMapProps) => {
  const language = useStore(Selector.language);
  const setCommonStore = useStore(Selector.set);
  const addUndoable = useStore(Selector.addUndoable);
  const modelMapLatitude = useStore(Selector.modelMapLatitude);
  const latitude = modelMapLatitude !== undefined ? modelMapLatitude : 42.2844063;
  const modelMapLongitude = useStore(Selector.modelMapLongitude);
  const longitude = modelMapLongitude !== undefined ? modelMapLongitude : -71.3488548;
  const mapZoom = useStore(Selector.modelMapZoom) ?? DEFAULT_MODEL_MAP_ZOOM;
  const mapTilt = useStore(Selector.modelMapTilt) ?? 0;
  const mapType = useStore(Selector.modelMapType) ?? 'roadmap';
  const weatherData = useStore(Selector.weatherData);
  const mapWeatherStations = useStore(Selector.modelMapWeatherStations);

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedSite, setSelectedSite] = useState<ModelSite | null>(null);
  const previousSiteRef = useRef<ModelSite | null>(null);
  const cities = useRef<google.maps.LatLng[]>([]);

  const lang = { lng: language };

  const loadCities = () => {
    cities.current.length = 0;
    for (const x in weatherData) {
      if (weatherData.hasOwnProperty(x)) {
        const w = weatherData[x];
        const pos = new google.maps.LatLng(w.latitude, w.longitude);
        cities.current.push(pos);
      }
    }
  };

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    loadCities();
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const onCenterChanged = () => {
    if (map) {
      const center = map.getCenter();
      const lat = center.lat();
      const lng = center.lng();
      if (lat !== latitude || lng !== longitude) {
        const undoableChangeLocation = {
          name: 'Set Model Map Location',
          timestamp: Date.now(),
          oldLatitude: latitude,
          newLatitude: lat,
          oldLongitude: longitude,
          newLongitude: lng,
          undo: () => {
            setCommonStore((state) => {
              state.modelMapLatitude = undoableChangeLocation.oldLatitude;
              state.modelMapLongitude = undoableChangeLocation.oldLongitude;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.modelMapLatitude = undoableChangeLocation.newLatitude;
              state.modelMapLongitude = undoableChangeLocation.newLongitude;
            });
          },
        } as UndoableChangeLocation;
        addUndoable(undoableChangeLocation);
        setCommonStore((state) => {
          state.modelMapLatitude = lat;
          state.modelMapLongitude = lng;
        });
      }
    }
  };

  const onZoomChanged = () => {
    if (map) {
      const z = map.getZoom();
      if (z !== mapZoom) {
        const undoableChange = {
          name: 'Zoom Model Map',
          timestamp: Date.now(),
          oldValue: mapZoom,
          newValue: z,
          undo: () => {
            setCommonStore((state) => {
              state.modelMapZoom = undoableChange.oldValue as number;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.modelMapZoom = undoableChange.newValue as number;
            });
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setCommonStore((state) => {
          state.modelMapZoom = z;
        });
      }
    }
  };

  const onTiltChanged = () => {
    if (map) {
      const t = map.getTilt();
      if (t !== mapTilt) {
        const undoableChange = {
          name: 'Tilt Model Map',
          timestamp: Date.now(),
          oldValue: mapTilt,
          newValue: t,
          undo: () => {
            setCommonStore((state) => {
              state.modelMapTilt = undoableChange.oldValue as number;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.modelMapTilt = undoableChange.newValue as number;
            });
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setCommonStore((state) => {
          state.modelMapTilt = t;
        });
      }
    }
  };

  const onMapTypeIdChanged = () => {
    if (map) {
      const typeId = map.getMapTypeId();
      if (typeId !== mapType) {
        const undoableChange = {
          name: 'Change Model Map Type',
          timestamp: Date.now(),
          oldValue: mapType,
          newValue: typeId,
          undo: () => {
            setCommonStore((state) => {
              state.modelMapType = undoableChange.oldValue as string;
            });
          },
          redo: () => {
            setCommonStore((state) => {
              state.modelMapType = undoableChange.newValue as string;
            });
          },
        } as UndoableChange;
        addUndoable(undoableChange);
        setCommonStore((state) => {
          state.modelMapType = typeId;
        });
      }
    }
  };

  const options = {
    styles: [
      {
        featureType: 'poi',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
      {
        featureType: 'transit',
        elementType: 'labels',
        stylers: [{ visibility: 'off' }],
      },
    ],
  } as GoogleMapProps;

  const openSite = (site: ModelSite) => {
    if (site.userid && site.title) {
      openModel(site.userid, site.title);
      closeMap();
    } else {
      showError(i18n.t('message.ModelNotFound', lang));
    }
  };

  return (
    <GoogleMap
      mapContainerStyle={{
        border: '1px solid',
        width: '100%',
        height: '100%',
      }}
      options={options}
      mapTypeId={mapType}
      center={{ lat: latitude, lng: longitude }}
      zoom={mapZoom}
      tilt={mapTilt}
      onLoad={onLoad}
      onUnmount={onUnmount}
      onCenterChanged={onCenterChanged}
      onZoomChanged={onZoomChanged}
      onTiltChanged={onTiltChanged}
      onMapTypeIdChanged={onMapTypeIdChanged}
    >
      {/* Child components, such as markers, info windows, etc. */}
      <>
        {mapWeatherStations &&
          cities.current.map((c, index) => {
            const scale = 0.2 * mapZoom;
            return (
              <Marker
                key={index}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  strokeColor: 'red',
                  strokeWeight: scale + 2,
                  scale: scale,
                }}
                position={c}
              />
            );
          })}
        {selectedSite && (
          <InfoWindow position={{ lat: selectedSite.latitude, lng: selectedSite.longitude }}>
            <div>
              <label style={{ cursor: 'pointer' }} onClick={() => openSite(selectedSite)}>
                {selectedSite.label}
              </label>
              <hr />
              {selectedSite.town + ', ' + selectedSite.state + ', ' + selectedSite.country}
            </div>
          </InfoWindow>
        )}
        {sites.map((site: ModelSite, index: number) => {
          let iconUrl = BuildingIcon;
          switch (site.type) {
            case 'PV':
              iconUrl = SolarPanelIcon;
              break;
            case 'Parabolic Dish':
              iconUrl = ParabolicDishIcon;
              break;
            case 'Parabolic Trough':
              iconUrl = ParabolicTroughIcon;
              break;
            case 'Fresnel Reflector':
              iconUrl = FresnelReflectorIcon;
              break;
            case 'Power Tower':
              iconUrl = PowerTowerIcon;
              break;
          }
          const scaledSize = Math.min(32, 4 * mapZoom);
          return (
            <Marker
              key={index}
              icon={{
                url: iconUrl,
                scaledSize: new google.maps.Size(scaledSize, scaledSize),
              }}
              position={{ lat: site.latitude, lng: site.longitude }}
              onClick={() => openSite(site)}
              onMouseOver={(e) => {
                previousSiteRef.current = selectedSite;
                setSelectedSite(site);
              }}
              onMouseOut={(e) => {
                if (selectedSite === previousSiteRef.current) setSelectedSite(null);
              }}
            />
          );
        })}
      </>
    </GoogleMap>
  );
};

export default React.memo(ModelMap);
