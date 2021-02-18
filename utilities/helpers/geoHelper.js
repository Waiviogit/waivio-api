const _ = require('lodash');

exports.getCenterAndZoomOnSeveralBox = (mapCoordinates = []) => {
  if (_.isEmpty(mapCoordinates)) return { center: [0, 0] };
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

  return {
    center: zoom === 3
      ? [26.61185227911829, 8.192942803592587]
      : center,
    zoom,
  };
};

const distanceInMBetweenEarthCoordinates = ([lon1, lat1], [lon2, lat2]) => {
  const earthRadiusM = 6371000;

  const dLat = degreesToRadians(lat2 - lat1);
  const dLon = degreesToRadians(lon2 - lon1);

  const lat1Rad = degreesToRadians(lat1);
  const lat2Rad = degreesToRadians(lat2);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
    + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1Rad) * Math.cos(lat2Rad);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(earthRadiusM * c);
};

const degreesToRadians = (degrees) => (degrees * Math.PI) / 180;

const mediumPoint = (point1, point2) => (point1 + point2) / 2;

const getMapZoomByDistance = (distance) => {
  let zoom = 1;
  const zoomDistances = [[18, 1268], [17, 2537], [16, 5074], [15, 10147], [14, 20294], [13, 40589], [12, 81176], [11, 162352], [10, 324700], [9, 649357], [8, 1298407], [7, 2594265], [6, 5168868], [5, 10171255], [4, 13396150], [3, 40075000]];

  for (let i = 0; i < zoomDistances.length; i++) {
    if (distance < zoomDistances[i][1]) {
      [zoom] = zoomDistances[i];
      break;
    }
  }
  return zoom;
};
