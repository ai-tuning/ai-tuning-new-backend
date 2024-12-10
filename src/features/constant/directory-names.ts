const DIRECTORY_NAMES = Object.freeze({
  IMAGES: 'images',
  FILES: 'files',
});

type DIRECTORY_NAMES_TYPE = (typeof DIRECTORY_NAMES)[keyof typeof DIRECTORY_NAMES];

export { DIRECTORY_NAMES, DIRECTORY_NAMES_TYPE };
