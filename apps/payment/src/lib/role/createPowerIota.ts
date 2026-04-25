export default function createPowerIota() {
  let value = BigInt(1);

  return (): number => {
    const result = Number(value);
    value = value << BigInt(1); // Shift left to generate the next power of 2
    return result;
  };
}
