export const split = <T>(
  arr: Array<T>,
  include: (el: T) => boolean
): [Array<T>, Array<T>] => {
  const without: T[] = [];
  const including = arr.filter((el) => {
    if (include(el)) return true;
    else {
      without.push(el);
      return false;
    }
  });
  return [including, without];
};
