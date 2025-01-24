/*
 * @Copyright 2022-2023. Institute for Future Intelligence, Inc.
 */

export interface HvacSystem {
  /*
   If an ID is defined, the HVAC systems on different foundations can be grouped into a single one
   for heat transfer calculation.
  */
  id?: string;

  thermostatSetpoint: number;

  /*
   If the lowest temperature of the day is this degree below the thermostat setpoint,
   then we assume no heating is needed as the heat absorbed during the day can be slowly released
   such that the inside temperature of a house will never fall below the setpoint.
   The same logic can be applied to the case of cooling as well.
   */
  temperatureThreshold: number;

  type?: 'Simple' | 'Programmable';
  thermostatSetpoints?: number[][]; // [time, temp][]
}
