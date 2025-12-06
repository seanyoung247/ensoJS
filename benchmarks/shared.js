

const pending = [];
// eslint-disable-next-line no-undef
global.requestAnimationFrame = (cb) => pending.push(cb);
export const flushRAF = () => {
    pending.forEach(cb => cb());
    pending.length = 0;
};
