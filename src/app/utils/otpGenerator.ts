
export const generateOtp = (): number => {
  return Math.floor(1111 + Math.random() * 9999);
};
