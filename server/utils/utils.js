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

const extractDoubles = (list) => {
  list.sort((a, b) => {
    if (a.name.toLowerCase() < b.name.toLowerCase()) return -1;
  });
  const doubles = list.filter((cur, i, arr) => {
    return (
      (cur.name.toLowerCase() === arr[i + 1]?.name.toLowerCase() &&
        cur.artist.toLowerCase() === arr[i + 1]?.artist.toLowerCase()) ||
      (cur.name.toLowerCase() === arr[i - 1]?.name.toLowerCase() &&
        cur.artist.toLowerCase() === arr[i - 1]?.artist.toLowerCase())
    );
  });
  return doubles;
};

module.exports = { generateRandomString, extractTracks, extractDoubles };
