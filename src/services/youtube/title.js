const getTitle = (rawTitle) => {
  const [rawArtist, _] = rawTitle.includes(" - ")
    ? title.split(" - ")
    : [null, title];

  return { artist, title };
};
