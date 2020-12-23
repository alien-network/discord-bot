import fetch from 'node-fetch';

const getData = async (query, variables) => {
  const data = await fetch('https://graphql.anilist.co/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  }).then((r) => r.json());

  return data;
};

export default getData;
