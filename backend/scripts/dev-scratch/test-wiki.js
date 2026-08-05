async function test() {
  const query = encodeURIComponent('شوكولاتة مورو');
  const url = `https://ar.wikipedia.org/w/api.php?action=query&format=json&prop=extracts&exchars=300&exintro=1&explaintext=1&generator=search&gsrsearch=${query}&gsrlimit=1`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(data.query?.pages);
  } catch (err) {
    console.error(err);
  }
}

test();
