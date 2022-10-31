/**
 * Get configuration data from TMDB API
 *
 * @returns {Promise<object>}
 */
const getConfiguration = async () => {
  return await fetch(`https://api.themoviedb.org/3/configuration`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Accept: 'application/json',
      'Authorization': `Bearer ${process.env.TMDB_TOKEN}`
    },
  }).then((r) => r.json());
};

/**
 * Get tv show data from TMDB API
 *
 * @param tvId {number}
 * @returns {Promise<object>}
 */
const getTvShow = async (tvId) => {
  return await fetch(`https://api.themoviedb.org/3/tv/${tvId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Accept: 'application/json',
      'Authorization': `Bearer ${process.env.TMDB_TOKEN}`
    },
  }).then((r) => r.json());
};

/**
 * Get season data from TMDB API
 *
 * @param tvId {number}
 * @param seasonNumber {number}
 * @returns {Promise<object>}
 */
const getSeason = async (tvId, seasonNumber) => {
  return await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Accept: 'application/json',
      'Authorization': `Bearer ${process.env.TMDB_TOKEN}`
    },
  }).then((r) => r.json());
};

/**
 * Get episode data from TMDB API
 *
 * @param tvId {number}
 * @param seasonNumber {number}
 * @param episodeNumber {number}
 * @returns {Promise<object>}
 */
const getEpisode = async (tvId, seasonNumber, episodeNumber) => {
  return await fetch(`https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json;charset=utf-8',
      Accept: 'application/json',
      'Authorization': `Bearer ${process.env.TMDB_TOKEN}`
    },
  }).then((r) => r.json());
};

export default { getConfiguration, getTvShow, getSeason, getEpisode };
