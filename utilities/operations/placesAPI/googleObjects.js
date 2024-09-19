const axios = require('axios');
const _ = require('lodash');
const image = require('utilities/images/image');
const { PlacesApiAccessModel } = require('models');
const { createHashFromBase64 } = require('../../helpers/imagesHelper');

const ACCESS_TYPE = {
  OBJECTS: 'objects',
  IMAGE: 'image',
};

const googleSearchNearbyRequest = async ({
  apiKey, includedTypes, location,
}) => {
  try {
    const response = await axios.post(
      'https://places.googleapis.com/v1/places:searchNearby',
      {
        ...(!_.isEmpty(includedTypes) && { includedTypes }),
        ...location,
      },
      {
        // search for locale
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          // pick fields
          'X-Goog-FieldMask': '*',
        },
      },
    );

    return { result: response?.data?.places ?? [] };
  } catch (error) {
    return {
      error,
    };
  }
};

const placesPhotoRequest = async ({ apiKey, maxWidthPx, placesUrl }) => {
  try {
    const response = await fetch(
      `https://places.googleapis.com/v1/${placesUrl}/media?maxWidthPx=${maxWidthPx}&key=${apiKey}`,
    );

    const result = await response.arrayBuffer(); // Use arrayBuffer() to get binary data
    const base64String = Buffer.from(result).toString('base64'); // Convert to base64

    return { base64String };
  } catch (error) {
    return { error };
  }
};

const googleSearchNearby = async ({
  latitude, longitude, includedTypes, userName,
}) => {
  const location = {
    locationRestriction: {
      circle: {
        center: {
          latitude,
          longitude,
        },
        radius: 100,
      },
    },
  };

  const { result, error } = await googleSearchNearbyRequest({
    location,
    includedTypes,
    apiKey: process.env.PLACES_API_KEY,
  });

  if (error) return { error };
  await PlacesApiAccessModel.incrAccessCount(userName, ACCESS_TYPE.OBJECTS);

  return { result };
};

const uploadGoogleImage = async ({ placesUrl, userName }) => {
  const { base64String, error } = await placesPhotoRequest({
    placesUrl,
    maxWidthPx: 2000,
    apiKey: process.env.PLACES_API_KEY,
  });
  if (error) return { error };
  await PlacesApiAccessModel.incrAccessCount(userName, ACCESS_TYPE.IMAGE);

  const fileName = createHashFromBase64(base64String);

  const { imageUrl, error: uploadError } = await image.uploadInS3(base64String, fileName);
  if (uploadError) return { error: uploadError };

  return { result: imageUrl };
};

module.exports = {
  googleSearchNearby,
  uploadGoogleImage,
};
