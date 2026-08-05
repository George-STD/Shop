const google = require('googlethis');

async function test() {
  try {
    const response = await google.search('شوكولاتة مورو', {
      page: 0, 
      safe: false,
    });
    console.log(response.results.slice(0, 2));
  } catch (err) {
    console.error(err);
  }
}

test();
