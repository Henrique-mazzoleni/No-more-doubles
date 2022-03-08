const generateRandomString = (length) => {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

const extractTracks = (list) => {
  const res = [];
  list.forEach((track) => {
    res.push({
      name: track.track.name,
      artist: track.track.artists[0].name,
      album: track.track.album.name,
      added_at: track.added_at,
    });
  });

  return res;
};

module.exports = { generateRandomString, extractTracks };
