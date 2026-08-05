const google = require('googlethis');

async function test() {
  const options = {
    page: 0, 
    safe: false, 
    additional_params: { 
      hl: 'en',
      tbs: 'ic:trans' // transparent background
    }
  };
  
  try {
    const images = await google.image('Moro chocolate', options);
    console.log(images.slice(0, 3));
  } catch (err) {
    console.error(err);
  }
}

test();
