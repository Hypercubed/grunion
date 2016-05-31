console.log('b');

setTimeout(() => {
  console.log('boo');
}, 1000);

console.log('Arguments are', process.argv.slice(2));
