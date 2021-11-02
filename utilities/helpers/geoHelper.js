const { ZOOM_DISTANCE, EARTH_RADIUS_M, DEFAULT_MAP_VIEW } = require('constants/mapConstants');
const _ = require('lodash');
const { getNamespace } = require('cls-hooked');
const { DEVICE } = require('constants/common');

exports.getCenterAndZoomOnSeveralBox = (mapCoordinates = []) => {
  if (_.isEmpty(mapCoordinates)) return DEFAULT_MAP_VIEW;

  const { longitude, latitude } = _.reduce(mapCoordinates, (acc, el) => {
    acc.longitude.push(el.topPoint[0], el.bottomPoint[0]);
    acc.latitude.push(el.topPoint[1], el.bottomPoint[1]);
    return acc;
  }, { longitude: [], latitude: [] });

  longitude.sort((a, b) => b - a);
  latitude.sort((a, b) => b - a);

  const center = [
    mediumPoint(latitude[0], latitude[longitude.length - 1]),
    mediumPoint(longitude[0], longitude[longitude.length - 1]),
  ];

  const distance = distanceInMBetweenEarthCoordinates(
    [longitude[longitude.length - 1], latitude[0]],
    [longitude[0], latitude[longitude.length - 1]],
  );
  const zoom = getMapZoomByDistance(distance);

  return { center, zoom };
};

exports.setFilterByDistance = ({ mapMarkers, wobjects = [], box }) => {
  if (!mapMarkers || _.isEmpty(box) || _.isEmpty(wobjects)) return wobjects;
  const divideBy = getNamespace('request-session').get('device') === DEVICE.MOBILE
    ? 50
    : 300;

  const displayDiagonalDistance = distanceInMBetweenEarthCoordinates(box.bottomPoint, box.topPoint);
  if (displayDiagonalDistance < 1000) return wobjects;

  const minDistanceBetweenObjects = Math.round(displayDiagonalDistance / divideBy);

  for (let i = 0; i < wobjects.length; i++) {
    for (let j = 0; j < wobjects.length; j++) {
      if (i !== j) {
        const distance = distanceInMBetweenEarthCoordinates(
          wobjects[i].map.coordinates,
          wobjects[j].map.coordinates,
        );
        const cond1 = distance < minDistanceBetweenObjects;
        const cond2 = wobjects[i].weight >= wobjects[j].weight;
        const cond3 = !_.has(wobjects[j], 'campaigns');
        const cond4 = _.has(wobjects[i], 'campaigns') && _.has(wobjects[j], 'campaigns');
        if (cond1 && cond2 && cond3) wobjects[j].invisible = true;
        if (cond1 && cond2 && cond4) wobjects[j].invisible = true;
      }
    }
  }

  return _.filter(wobjects, (el) => !el.invisible);
};

const distanceInMBetweenEarthCoordinates = ([lon1, lat1], [lon2, lat2]) => {
  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const lat1Rad = degreesToRadians(lat1);
  const lat2Rad = degreesToRadians(lat2);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_M * c);
};

const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;

const mediumPoint = (point1, point2) => (point1 + point2) / 2;

const getMapZoomByDistance = (distance) => {
  let zoom = 3;

  for (let i = 0; i < ZOOM_DISTANCE.length; i++) {
    if (distance < ZOOM_DISTANCE[i][1]) {
      [zoom] = ZOOM_DISTANCE[i];
      break;
    }
  }

  return zoom;
};
