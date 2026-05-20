export default function createPowerIota() {
  let value = 1n;

  return (): bigint => {
    const result = value;
    value <<= 1n;
    return result;
  };
}
