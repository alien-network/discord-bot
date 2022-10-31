/**
 * Get data from AniList API
 *
 * @param query {string}
 * @param variables {object}
 * @returns {Promise<object>}
 */
const getData = async (query, variables) => {
  return await fetch('https://graphql.anilist.co/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  }).then((r) => r.json());
};

export default { getData };
